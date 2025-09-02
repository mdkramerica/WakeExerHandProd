import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { createServer as createViteServer, createLogger } from "vite";
import { type Server } from "http";
import viteConfig from "../vite.config";
import { nanoid } from "nanoid";
import { fileURLToPath } from "url";

const viteLogger = createLogger();

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

export async function setupVite(app: Express, server: Server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      },
    },
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      // In production, this path won't be used since we use serveStatic instead
      let clientTemplate: string;
      const isRailwayEnvironment = process.env.RAILWAY_ENVIRONMENT_NAME || process.env.NODE_ENV === 'production';
      
      if (isRailwayEnvironment) {
        clientTemplate = path.resolve(process.cwd(), "client", "index.html");
      } else {
        try {
          clientTemplate = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "client", "index.html");
        } catch (error) {
          clientTemplate = path.resolve(process.cwd(), "client", "index.html");
        }
      }

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`,
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  // In production/bundled environment, use a different approach
  let distPath: string;
  const isRailwayEnvironment = process.env.RAILWAY_ENVIRONMENT_NAME || process.env.NODE_ENV === 'production';
  
  if (isRailwayEnvironment) {
    // In Railway environments (staging/production), the dist folder should be in the same directory as the running script
    distPath = path.resolve(process.cwd(), "dist", "public");
  } else {
    // In development, use import.meta to resolve the path
    try {
      const __dirname = path.dirname(fileURLToPath(import.meta.url));
      distPath = path.resolve(__dirname, "public");
    } catch (error) {
      // Fallback for bundled environment
      distPath = path.resolve(process.cwd(), "dist", "public");
    }
  }

  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  app.use(express.static(distPath));

  // fall through to index.html if the file doesn't exist, but exclude API routes
  app.use((req, res, next) => {
    // Don't serve index.html for API routes or patient endpoints
    if (req.path.startsWith('/api/') || 
        req.path.startsWith('/patients/') || 
        req.path.startsWith('/users/')) {
      return next();
    }
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
