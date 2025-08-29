import dotenv from "dotenv";

// Load environment variables FIRST before any other imports
dotenv.config();

import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { setupSecurityMiddleware, securityErrorHandler, setupHealthCheck } from "./middleware.js";
import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

// Check if we should run the compliance portal instead
if (process.env.RUN_COMPLIANCE_PORTAL === "true") {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const portalPath = path.join(__dirname, "../hand-assessment-compliance-portal");
  
  console.log("Switching to Hand Assessment Compliance Portal...");
  process.chdir(portalPath);
  
  const child = spawn("tsx", ["server/index.ts"], {
    stdio: "inherit",
    shell: true,
    env: { ...process.env, NODE_ENV: "development" }
  });
  
  child.on("error", (error) => {
    console.error("Error starting compliance portal:", error.message);
    process.exit(1);
  });
  
  child.on("close", (code) => {
    process.exit(code || 0);
  });
} else {
  // Run the main application
  const app = express();
  
  // Validate required environment variables for production
  if (process.env.NODE_ENV === 'production') {
    const requiredVars = ['DATABASE_URL', 'JWT_SECRET', 'ENCRYPTION_KEY'];
    const missingVars = requiredVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      console.error('Missing required environment variables:', missingVars);
      process.exit(1);
    }
  }

  // Setup security middleware FIRST
  setupSecurityMiddleware(app);
  
  // Setup health check endpoints
  setupHealthCheck(app);
  
  // Body parsing with size limits
  app.use(express.json({ 
    limit: '10mb', // Increase limit for motion data
    type: ['application/json', 'text/plain']
  }));
  app.use(express.urlencoded({ 
    extended: false, 
    limit: '10mb',
    parameterLimit: 20
  }));

  // Serve attached assets statically with proper MIME types and security
  app.use('/attached_assets', express.static(path.join(path.dirname(fileURLToPath(import.meta.url)), '../attached_assets'), {
    maxAge: '1h', // Cache for 1 hour
    setHeaders: (res, filePath) => {
      // Security headers for static assets
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('X-Frame-Options', 'DENY');
      
      // Set appropriate MIME types
      if (filePath.endsWith('.mov')) {
        res.setHeader('Content-Type', 'video/quicktime');
      } else if (filePath.endsWith('.mp4')) {
        res.setHeader('Content-Type', 'video/mp4');
      } else if (filePath.endsWith('.webm')) {
        res.setHeader('Content-Type', 'video/webm');
      } else if (filePath.endsWith('.png')) {
        res.setHeader('Content-Type', 'image/png');
      } else if (filePath.endsWith('.jpg') || filePath.endsWith('.jpeg')) {
        res.setHeader('Content-Type', 'image/jpeg');
      }
    }
  }));

  // Serve videos from client/public/videos as fallback for legacy video URLs
  app.use('/videos', express.static(path.join(path.dirname(fileURLToPath(import.meta.url)), '../client/public/videos'), {
    maxAge: '1h', // Cache for 1 hour
    setHeaders: (res, filePath) => {
      // Security headers for static assets
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('X-Frame-Options', 'DENY');
      
      // Set appropriate MIME types for video files
      if (filePath.endsWith('.mov')) {
        res.setHeader('Content-Type', 'video/quicktime');
      } else if (filePath.endsWith('.mp4')) {
        res.setHeader('Content-Type', 'video/mp4');
      } else if (filePath.endsWith('.webm')) {
        res.setHeader('Content-Type', 'video/webm');
      }
    }
  }));

  (async () => {
    const server = await registerRoutes(app);

    // Register non-API routes BEFORE static middleware to ensure they take precedence
    const { getUserByCode } = await import("./storage.js");
    const storage = new (await import("./storage.js")).DatabaseStorage();

    // Patient endpoints without /api prefix for frontend compatibility
    app.get("/patients/by-code/:code", async (req, res) => {
      try {
        const code = req.params.code;
        const user = await storage.getUserByCode(code);
        
        if (!user) {
          return res.status(404).json({ message: "Patient not found" });
        }
        
        const daysSinceStart = user.createdAt ? 
          Math.floor((Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24)) + 1 : 1;
        
        res.json({
          id: user.id,
          alias: user.firstName ? `${user.firstName} ${user.lastName?.charAt(0)}.` : `Patient ${user.code}`,
          injuryType: user.injuryType || 'General Recovery',
          daysSinceStart,
          accessCode: user.code
        });
      } catch (error) {
        res.status(500).json({ message: "Failed to fetch patient profile" });
      }
    });

    app.get("/patients/:code/streak", async (req, res) => {
      try {
        const code = req.params.code;
        const user = await storage.getUserByCode(code);
        
        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }

        // Get user's completed assessments
        const userAssessments = await storage.getUserAssessments(user.id);
        const completedAssessments = userAssessments.filter(ua => ua.isCompleted && ua.completedAt);

        // Calculate current streak
        let currentStreak = 0;
        let maxStreak = 0;

        // Sort assessments by completion date (newest first)
        const sortedAssessments = completedAssessments
          .sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime());

        // Group assessments by date (multiple assessments per day count as one day)
        const assessmentsByDate = new Map<string, any[]>();
        sortedAssessments.forEach(assessment => {
          const dateStr = new Date(assessment.completedAt!).toISOString().split('T')[0];
          if (!assessmentsByDate.has(dateStr)) {
            assessmentsByDate.set(dateStr, []);
          }
          assessmentsByDate.get(dateStr)!.push(assessment);
        });

        const uniqueDates = Array.from(assessmentsByDate.keys()).sort().reverse();
        let streakCount = 0;
        const today = new Date().toISOString().split('T')[0];
        
        // Calculate current streak
        for (let i = 0; i < uniqueDates.length; i++) {
          const currentDate = uniqueDates[i];
          
          if (i === 0) {
            const daysDiff = Math.floor((new Date(today).getTime() - new Date(currentDate).getTime()) / (1000 * 60 * 60 * 24));
            if (daysDiff <= 1) {
              streakCount = 1;
            } else {
              break;
            }
          } else {
            const prevDate = uniqueDates[i-1];
            const daysDiff = Math.floor((new Date(prevDate).getTime() - new Date(currentDate).getTime()) / (1000 * 60 * 60 * 24));
            if (daysDiff === 1) {
              streakCount++;
            } else {
              break;
            }
          }
        }

        currentStreak = streakCount;
        maxStreak = Math.max(maxStreak, currentStreak);

        // Calculate max streak
        let tempStreak = 0;
        for (const dateStr of uniqueDates.reverse()) {
          tempStreak++;
          maxStreak = Math.max(maxStreak, tempStreak);
        }

        res.json({
          currentStreak,
          maxStreak,
          totalCompletedDays: uniqueDates.length,
          totalAssessments: completedAssessments.length
        });
      } catch (error) {
        console.error('Error calculating streak:', error);
        res.status(500).json({ message: "Failed to calculate streak" });
      }
    });

    // Use secure error handler
    app.use(securityErrorHandler);

    // importantly only setup vite in development and after
    // setting up all the other routes so the catch-all route
    // doesn't interfere with the other routes
    if (app.get("env") === "development") {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }

    // Use Railway's PORT or default to 5000
    const port = process.env.PORT || 5000;
    server.listen(port, () => {
      log(`🚀 Secure server running on port ${port}`);
      log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      log(`🔒 Security features: JWT auth, rate limiting, CORS, helmet`);
      log(`📋 Health check: http://localhost:${port}/health`);
    });
  })();
}
