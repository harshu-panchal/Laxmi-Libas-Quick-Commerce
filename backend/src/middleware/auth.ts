import { Request, Response, NextFunction } from 'express';
import { verifyToken, TokenPayload } from '../services/jwtService';

export type AuthUserType = 'Admin' | 'Seller' | 'Customer' | 'Delivery';

// Extend Express Request to include user info
declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

/**
 * Authenticate user by verifying JWT token
 */
export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.warn('🔓 Auth Warning: No token provided or invalid format', { 
        path: req.path, 
        hasAuthHeader: !!authHeader,
        origin: req.headers.origin 
      });
      res.status(401).json({
        success: false,
        message: 'No token provided. Authorization header must be in format: Bearer <token>',
      });
      return;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    try {
      const decoded = verifyToken(token);
      if (!decoded || !decoded.userId) {
        console.error('❌ Auth Error: Invalid token payload', { path: req.path });
        res.status(401).json({
          success: false,
          message: 'Invalid token payload: userId missing',
        });
        return;
      }
      req.user = decoded;
      next();
    } catch (error: any) {
      console.error('❌ Auth Error: Token verification failed', { 
        path: req.path, 
        errorMessage: error.message 
      });
      res.status(401).json({
        success: false,
        message: error.message || 'Invalid or expired token',
      });
      return;
    }
  } catch (error: any) {
    console.error('🔥 Auth Fatal Error:', error);
    res.status(500).json({
      success: false,
      message: 'Authentication error',
      error: error.message,
    });
    return;
  }
};

/**
 * Authorize user by checking role (for Admin users)
 */
export const authorize = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
      return;
    }

    if (!req.user.role || !roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: 'Insufficient permissions. Required role: ' + roles.join(' or '),
      });
      return;
    }

    next();
  };
};

/**
 * Require specific user type(s)
 */
export const requireUserType = (...userTypes: AuthUserType[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
      return;
    }

    // Case-insensitive check for better resilience
    const normalizedUserType = String(req.user.userType || '').toLowerCase();
    const isAllowed = userTypes.some(t => String(t).toLowerCase() === normalizedUserType);

    if (!isAllowed) {
      console.warn(`🚫 Access Denied: User type mismatch.`, {
        expected: userTypes,
        actual: req.user.userType,
        userId: req.user.userId,
        path: req.path,
        fullUser: req.user
      });
      res.status(403).json({
        success: false,
        message: 'Access denied. Required user type: ' + userTypes.join(' or '),
        details: process.env.NODE_ENV === 'development' ? { actual: req.user.userType } : undefined
      });
      return;
    }

    next();
  };
};

