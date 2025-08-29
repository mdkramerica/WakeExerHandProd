import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import type { Request, Response, NextFunction } from 'express';

// HIPAA-compliant security configuration
export const SecurityConfig = {
  // Password hashing rounds (12 is OWASP recommended minimum)
  BCRYPT_ROUNDS: 12,
  
  // JWT configuration
  JWT_EXPIRES_IN: '8h', // 8 hours for session timeout compliance
  JWT_REFRESH_EXPIRES_IN: '7d', // 7 days for refresh tokens
  
  // Session timeouts (HIPAA compliance)
  MAX_SESSION_DURATION: 8 * 60 * 60 * 1000, // 8 hours in milliseconds
  SESSION_WARNING_TIME: 7.5 * 60 * 60 * 1000, // Warning at 7.5 hours
  
  // Rate limiting for HIPAA compliance
  LOGIN_RATE_LIMIT: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 login attempts per windowMs
    skipSuccessfulRequests: true,
  },
  
  API_RATE_LIMIT: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
  },
  
  // Password requirements for HIPAA compliance
  PASSWORD_REQUIREMENTS: {
    minLength: 12,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
    maxAge: 90 * 24 * 60 * 60 * 1000, // 90 days
  },
  
  // Data encryption
  ENCRYPTION_ALGORITHM: 'aes-256-gcm',
  ENCRYPTION_KEY_LENGTH: 32,
  IV_LENGTH: 16,
};

// Secure password hashing
export class PasswordService {
  static async hash(password: string): Promise<string> {
    return bcrypt.hash(password, SecurityConfig.BCRYPT_ROUNDS);
  }
  
  static async verify(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
  
  static validatePasswordStrength(password: string): { 
    isValid: boolean; 
    errors: string[] 
  } {
    const errors: string[] = [];
    const { PASSWORD_REQUIREMENTS } = SecurityConfig;
    
    if (password.length < PASSWORD_REQUIREMENTS.minLength) {
      errors.push(`Password must be at least ${PASSWORD_REQUIREMENTS.minLength} characters long`);
    }
    
    if (PASSWORD_REQUIREMENTS.requireUppercase && !/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    
    if (PASSWORD_REQUIREMENTS.requireLowercase && !/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    
    if (PASSWORD_REQUIREMENTS.requireNumbers && !/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    
    if (PASSWORD_REQUIREMENTS.requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

// JWT token management with HIPAA compliance
export class TokenService {
  private static getJWTSecret(): string {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET environment variable is required for production');
    }
    return secret;
  }
  
  static generateAccessToken(payload: { 
    userId: number; 
    username: string; 
    role: string; 
    sessionId: string;
  }): string {
    return jwt.sign(
      {
        ...payload,
        type: 'access',
        iat: Math.floor(Date.now() / 1000),
      },
      this.getJWTSecret(),
      { 
        expiresIn: SecurityConfig.JWT_EXPIRES_IN,
        issuer: 'wakeexer-hipaa',
        audience: 'wakeexer-users',
      }
    );
  }
  
  static generateRefreshToken(payload: { 
    userId: number; 
    sessionId: string;
  }): string {
    return jwt.sign(
      {
        ...payload,
        type: 'refresh',
        iat: Math.floor(Date.now() / 1000),
      },
      this.getJWTSecret(),
      { 
        expiresIn: SecurityConfig.JWT_REFRESH_EXPIRES_IN,
        issuer: 'wakeexer-hipaa',
        audience: 'wakeexer-refresh',
      }
    );
  }
  
  static verifyToken(token: string, expectedType: 'access' | 'refresh' = 'access'): any {
    try {
      const decoded = jwt.verify(token, this.getJWTSecret()) as any;
      
      if (decoded.type !== expectedType) {
        throw new Error('Invalid token type');
      }
      
      return decoded;
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }
  
  static generateSessionId(): string {
    return crypto.randomUUID();
  }
}

// Data encryption for sensitive fields (HIPAA compliance)
export class EncryptionService {
  private static getEncryptionKey(): Buffer {
    const key = process.env.ENCRYPTION_KEY;
    if (!key) {
      throw new Error('ENCRYPTION_KEY environment variable is required for production');
    }
    
    // Ensure key is 32 bytes for AES-256
    if (key.length !== 64) { // 64 hex characters = 32 bytes
      throw new Error('ENCRYPTION_KEY must be 64 hexadecimal characters (32 bytes)');
    }
    
    return Buffer.from(key, 'hex');
  }
  
  static encrypt(text: string): { 
    encrypted: string; 
    iv: string; 
    authTag: string; 
  } {
    const iv = crypto.randomBytes(SecurityConfig.IV_LENGTH);
    const cipher = crypto.createCipherGCM(SecurityConfig.ENCRYPTION_ALGORITHM, this.getEncryptionKey());
    cipher.setAAD(Buffer.from('wakeexer-hipaa'));
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return {
      encrypted,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex'),
    };
  }
  
  static decrypt(encryptedData: { 
    encrypted: string; 
    iv: string; 
    authTag: string; 
  }): string {
    const decipher = crypto.createDecipherGCM(
      SecurityConfig.ENCRYPTION_ALGORITHM, 
      this.getEncryptionKey()
    );
    
    decipher.setAAD(Buffer.from('wakeexer-hipaa'));
    decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));
    
    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }
}

// HIPAA-compliant audit logger
export class AuditLogger {
  static async logAccess(data: {
    userId: number;
    username: string;
    action: string;
    resource: string;
    ipAddress?: string;
    userAgent?: string;
    patientId?: string;
    success: boolean;
    details?: any;
  }): Promise<void> {
    const auditEntry = {
      timestamp: new Date().toISOString(),
      userId: data.userId,
      username: data.username,
      action: data.action,
      resource: data.resource,
      ipAddress: data.ipAddress || 'unknown',
      userAgent: data.userAgent || 'unknown',
      patientId: data.patientId,
      success: data.success,
      details: data.details,
      sessionId: crypto.randomUUID(),
    };
    
    // Log to secure audit system
    console.log(`[AUDIT] ${JSON.stringify(auditEntry)}`);
    
    // In production, send to secure logging service
    // await secureLogService.log(auditEntry);
  }
  
  static async logSecurityEvent(data: {
    event: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    ipAddress?: string;
    userAgent?: string;
    details?: any;
  }): Promise<void> {
    const securityEntry = {
      timestamp: new Date().toISOString(),
      event: data.event,
      severity: data.severity,
      ipAddress: data.ipAddress || 'unknown',
      userAgent: data.userAgent || 'unknown',
      details: data.details,
      alertId: crypto.randomUUID(),
    };
    
    console.log(`[SECURITY] ${JSON.stringify(securityEntry)}`);
    
    // In production, send to security monitoring system
    // await securityMonitoringService.alert(securityEntry);
  }
}

// Input validation middleware
export const validateInput = (schema: any) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedData = schema.parse(req.body);
      req.body = validatedData;
      next();
    } catch (error) {
      AuditLogger.logSecurityEvent({
        event: 'invalid_input_attempt',
        severity: 'medium',
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        details: { error: error, endpoint: req.path }
      });
      
      return res.status(400).json({ 
        message: 'Invalid input data',
        errors: error instanceof Error ? [error.message] : ['Validation failed']
      });
    }
  };
};

// Session management for HIPAA compliance
export class SessionManager {
  private static activeSessions = new Map<string, {
    userId: number;
    username: string;
    role: string;
    loginTime: number;
    lastActivity: number;
    ipAddress: string;
  }>();
  
  static createSession(sessionId: string, sessionData: {
    userId: number;
    username: string;
    role: string;
    ipAddress: string;
  }): void {
    const now = Date.now();
    this.activeSessions.set(sessionId, {
      ...sessionData,
      loginTime: now,
      lastActivity: now,
    });
  }
  
  static updateActivity(sessionId: string): boolean {
    const session = this.activeSessions.get(sessionId);
    if (!session) return false;
    
    const now = Date.now();
    
    // Check if session has expired
    if (now - session.loginTime > SecurityConfig.MAX_SESSION_DURATION) {
      this.destroySession(sessionId);
      return false;
    }
    
    session.lastActivity = now;
    return true;
  }
  
  static destroySession(sessionId: string): void {
    this.activeSessions.delete(sessionId);
  }
  
  static isSessionValid(sessionId: string): boolean {
    const session = this.activeSessions.get(sessionId);
    if (!session) return false;
    
    const now = Date.now();
    return now - session.loginTime <= SecurityConfig.MAX_SESSION_DURATION;
  }
  
  static getActiveSessionsCount(): number {
    return this.activeSessions.size;
  }
  
  static cleanupExpiredSessions(): void {
    const now = Date.now();
    for (const [sessionId, session] of this.activeSessions.entries()) {
      if (now - session.loginTime > SecurityConfig.MAX_SESSION_DURATION) {
        this.destroySession(sessionId);
      }
    }
  }
}

// Cleanup expired sessions every hour
setInterval(() => {
  SessionManager.cleanupExpiredSessions();
}, 60 * 60 * 1000);

