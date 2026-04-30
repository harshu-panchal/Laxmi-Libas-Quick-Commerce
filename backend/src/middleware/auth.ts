import { Request, Response, NextFunction } from 'express';
import { verifyToken, TokenPayload } from '../services/jwtService';
import Seller from '../models/Seller';

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
    const userTypeInToken = req.user.userType;
    const normalizedUserType = String(userTypeInToken || '').toLowerCase();
    const isAllowed = userTypes.some(t => String(t).toLowerCase() === normalizedUserType);

    if (!isAllowed) {
      console.warn(`🚫 Access Denied: User type mismatch.`, {
        expected: userTypes,
        actual: userTypeInToken,
        userId: req.user.userId,
        path: req.path,
      });

      // Special case: If userType is missing but it's a customer-only route, 
      // we might want to check if the ID belongs to a Customer.
      // For now, we'll just return a clearer error message.
      res.status(403).json({
        success: false,
        message: `Access denied. Required user type: ${userTypes.join(' or ')}. Your current type: ${userTypeInToken || 'None'}`,
        details: { 
          actual: userTypeInToken, 
          expected: userTypes,
          suggestion: "Please logout and login again to refresh your session."
        }
      });
      return;
    }

    next();
  };
};

/**
 * Check if the authenticated seller has access to a specific business module
 */
export const checkSellerAccess = (businessType: 'commerce' | 'hotel' | 'bus') => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    if (req.user.userType !== 'Seller') {
      res.status(403).json({ success: false, message: 'Only sellers can access this module' });
      return;
    }

    try {
      const seller = await Seller.findById(req.user.userId);
      if (!seller) {
        res.status(404).json({ success: false, message: 'Seller not found' });
        return;
      }

      // Default to ['commerce'] for backward compatibility
      const businessTypes = seller.businessTypes || ['commerce'];

      if (!businessTypes.includes(businessType)) {
        res.status(403).json({
          success: false,
          message: `Your account does not have access to the ${businessType} module.`
        });
        return;
      }

      next();
    } catch (error: any) {
      console.error('CheckSellerAccess Error:', error);
      res.status(500).json({ success: false, message: 'Internal server error while checking access' });
    }
  };
};

/**
 * Check if the authenticated admin has permission for a specific module
 */
export const checkPermission = (module: 'commerce' | 'orders' | 'users' | 'sellers' | 'hotel' | 'bus' | 'delivery') => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    if (req.user.userType !== 'Admin') {
      res.status(403).json({ success: false, message: 'Only admins can access this module' });
      return;
    }

    // Super Admin has all permissions
    if (req.user.role === 'Super Admin') {
      return next();
    }

    try {
      // Lazy import to avoid circular dependency if Admin model uses middleare (though it shouldn't)
      const Admin = (await import('../models/Admin')).default;
      const admin = await Admin.findById(req.user.userId);
      
      if (!admin) {
        res.status(404).json({ success: false, message: 'Admin not found' });
        return;
      }

      if (!admin.permissions || !admin.permissions.includes(module)) {
        res.status(403).json({
          success: false,
          message: `Access denied. You don't have permission to manage the ${module} module.`
        });
        return;
      }

      next();
    } catch (error: any) {
      console.error('CheckPermission Error:', error);
      res.status(500).json({ success: false, message: 'Internal server error while checking permissions' });
    }
  };
};

