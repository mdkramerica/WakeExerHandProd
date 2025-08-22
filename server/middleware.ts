import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import slowDown from 'express-slow-down';
import { Request, Response, NextFunction, Express } from 'express';
import { TokenService, SessionManager, AuditLogger, SecurityConfig } from './security.js';

// HIPAA-compliant security middleware configuration
export function setupSecurityMiddleware(app: Express): void {
  // Trust proxy for Railway deployment
  app.set('trust proxy', 1);

  // Helmet for security headers
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https:"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://cdn.jsdelivr.net"],
        connectSrc: ["'self'", "wss:", "https:"],
        mediaSrc: ["'self'", "blob:"],
        workerSrc: ["'self'", "blob:"],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
    noSniff: true,
    frameguard: { action: 'deny' },
    xssFilter: true,
  }));

  // CORS configuration for production
  const corsOptions = {
    origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
      // Allow requests with no origin (mobile apps, etc.)
      if (!origin) return callback(null, true);
      
      // In production, use environment variable for allowed origins
      const allowedOrigins = process.env.CORS_ORIGINS?.split(',') || [
        'http://localhost:3000',
        'http://localhost:5000',
        'https://your-app.railway.app' // Replace with actual Railway domain
      ];
      
      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        AuditLogger.logSecurityEvent({
          event: 'cors_violation',
          severity: 'medium',
          details: { origin, allowedOrigins }
        });
        callback(new Error('Not allowed by CORS'), false);
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['X-Session-Warning'],
  };

  app.use(cors(corsOptions));

  // Rate limiting for login endpoints (HIPAA compliance)
  const loginLimiter = rateLimit({
    windowMs: SecurityConfig.LOGIN_RATE_LIMIT.windowMs,
    max: SecurityConfig.LOGIN_RATE_LIMIT.max,
    message: {
      error: 'Too many login attempts, please try again later.',
      retryAfter: SecurityConfig.LOGIN_RATE_LIMIT.windowMs / 1000
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req: Request, res: Response) => {
      AuditLogger.logSecurityEvent({
        event: 'rate_limit_exceeded_login',
        severity: 'high',
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        details: { endpoint: req.path }
      });
      
      res.status(429).json({
        error: 'Too many login attempts',
        message: 'Account temporarily locked due to multiple failed login attempts'
      });
    }
  });

  // General API rate limiting
  const apiLimiter = rateLimit({
    windowMs: SecurityConfig.API_RATE_LIMIT.windowMs,
    max: SecurityConfig.API_RATE_LIMIT.max,
    message: {
      error: 'Too many requests, please try again later.',
      retryAfter: SecurityConfig.API_RATE_LIMIT.windowMs / 1000
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req: Request) => {
      // Skip rate limiting for health checks
      return req.path === '/health' || req.path === '/api/health';
    }
  });

  // Slow down for suspicious behavior
  const speedLimiter = slowDown({
    windowMs: 15 * 60 * 1000, // 15 minutes
    delayAfter: 10, // allow 10 requests per windowMs without delay
    delayMs: 500, // add 500ms delay per request after delayAfter
    maxDelayMs: 5000, // maximum delay of 5 seconds
  });

  // Apply rate limiting
  app.use('/api/auth/login', loginLimiter);
  app.use('/api/admin/login', loginLimiter);
  app.use('/api', apiLimiter);
  app.use('/api', speedLimiter);

  // Request logging middleware with HIPAA compliance
  app.use((req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();
    
    // Log request (without sensitive data)
    const logData = {
      method: req.method,
      url: req.path,
      ip: req.ip,
      userAgent: req.get('User-Agent') || 'unknown',
      timestamp: new Date().toISOString(),
    };

    res.on('finish', () => {
      const duration = Date.now() - start;
      const responseLog = {
        ...logData,
        statusCode: res.statusCode,
        duration: `${duration}ms`,
      };

      // Log API requests (excluding health checks)
      if (req.path.startsWith('/api') && !req.path.includes('/health')) {
        console.log(`[API] ${JSON.stringify(responseLog)}`);
      }

      // Log failed requests for security monitoring
      if (res.statusCode >= 400) {
        AuditLogger.logSecurityEvent({
          event: 'failed_request',
          severity: res.statusCode >= 500 ? 'high' : 'low',
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          details: {
            method: req.method,
            path: req.path,
            statusCode: res.statusCode,
            duration
          }
        });
      }
    });

    next();
  });

  // Session validation middleware
  app.use('/api', (req: Request, res: Response, next: NextFunction) => {
    // Skip session validation for public endpoints
    // Note: req.path does NOT include /api prefix since middleware is mounted on /api
    const publicEndpoints = [
      '/health',
      '/auth/login',
      '/admin/login',
      '/users/by-code', // Patient access by code
      '/users/verify-code', // Patient code verification
      '/users/', // Allow all user endpoints for now
      '/assessments', // Assessment data for patients
      '/patients/by-code', // Patient data access by code
      '/patients/', // Patient endpoints
    ];

    console.log(`🔍 Middleware check: ${req.method} ${req.path}`);
    const isPublic = publicEndpoints.some(endpoint => req.path.startsWith(endpoint));
    console.log(`🔍 Is public: ${isPublic}, matched endpoints:`, publicEndpoints.filter(ep => req.path.startsWith(ep)));

    if (isPublic) {
      return next();
    }

    // Check for Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: 'Authentication required',
        code: 'MISSING_TOKEN'
      });
    }

    try {
      const token = authHeader.substring(7);
      const decoded = TokenService.verifyToken(token, 'access');
      
      // Validate session is still active
      if (!SessionManager.isSessionValid(decoded.sessionId)) {
        return res.status(401).json({ 
          error: 'Session expired',
          code: 'SESSION_EXPIRED'
        });
      }

      // Update session activity
      SessionManager.updateActivity(decoded.sessionId);

      // Add user data to request
      req.user = {
        id: decoded.userId,
        username: decoded.username,
        role: decoded.role,
        sessionId: decoded.sessionId
      };

      // Check for session warning (near expiration)
      const sessionWarning = checkSessionWarning(decoded);
      if (sessionWarning) {
        res.set('X-Session-Warning', sessionWarning.toString());
      }

      next();
    } catch (error) {
      AuditLogger.logSecurityEvent({
        event: 'invalid_token_attempt',
        severity: 'medium',
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      });

      return res.status(401).json({ 
        error: 'Invalid or expired token',
        code: 'INVALID_TOKEN'
      });
    }
  });
}

// Check if session is near expiration
function checkSessionWarning(decoded: any): number | null {
  const now = Math.floor(Date.now() / 1000);
  const timeUntilExpiry = decoded.exp - now;
  const warningThreshold = 30 * 60; // 30 minutes

  if (timeUntilExpiry <= warningThreshold) {
    return timeUntilExpiry;
  }

  return null;
}

// Role-based access control middleware
export const requireRole = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;
    
    if (!user) {
      return res.status(401).json({ 
        error: 'Authentication required',
        code: 'NO_USER'
      });
    }

    if (!allowedRoles.includes(user.role)) {
      AuditLogger.logAccess({
        userId: user.id,
        username: user.username,
        action: 'access_denied',
        resource: req.path,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        success: false,
        details: { 
          requiredRoles: allowedRoles, 
          userRole: user.role 
        }
      });

      return res.status(403).json({ 
        error: 'Insufficient permissions',
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }

    // Log successful access
    AuditLogger.logAccess({
      userId: user.id,
      username: user.username,
      action: 'access_granted',
      resource: req.path,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      success: true
    });

    next();
  };
};

// Error handling middleware with security considerations
export const securityErrorHandler = (
  err: any, 
  req: Request, 
  res: Response, 
  next: NextFunction
) => {
  // Log security-relevant errors
  AuditLogger.logSecurityEvent({
    event: 'application_error',
    severity: 'high',
    ipAddress: req.ip,
    userAgent: req.get('User-Agent'),
    details: {
      error: err.message,
      stack: err.stack,
      path: req.path,
      method: req.method
    }
  });

  // Don't leak error details in production
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  const status = err.status || err.statusCode || 500;
  const message = isDevelopment ? err.message : 'Internal Server Error';
  
  res.status(status).json({ 
    error: message,
    code: 'INTERNAL_ERROR',
    ...(isDevelopment && { stack: err.stack })
  });
};

// Health check endpoint
export const setupHealthCheck = (app: Express) => {
  app.get('/health', (req: Request, res: Response) => {
    res.status(200).json({ 
      status: 'healthy', 
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      activeSessions: SessionManager.getActiveSessionsCount()
    });
  });

  app.get('/api/health', (req: Request, res: Response) => {
    res.status(200).json({ 
      status: 'healthy', 
      timestamp: new Date().toISOString() 
    });
  });
};
