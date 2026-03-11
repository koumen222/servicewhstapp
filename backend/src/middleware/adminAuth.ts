import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Admin } from '../models/Admin.js';
import { env } from '../config/env.js';

export const adminAuthMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.header('Authorization');
    const token = authHeader?.replace('Bearer ', '');

    console.log('🔐 Admin Auth Check:', {
      hasAuthHeader: !!authHeader,
      hasToken: !!token,
      tokenPreview: token ? token.substring(0, 20) + '...' : 'none'
    });

    if (!token) {
      console.log('❌ No token provided');
      return res.status(401).json({
        success: false,
        error: 'Accès non autorisé - Token manquant'
      });
    }

    const decoded = jwt.verify(token, env.JWT_SECRET) as any;
    
    console.log('🔓 Token decoded:', {
      hasId: !!decoded.id,
      hasIsAdmin: decoded.isAdmin,
      email: decoded.email
    });
    
    if (!decoded.isAdmin) {
      console.log('❌ Not an admin token');
      return res.status(403).json({
        success: false,
        error: 'Accès interdit - Admin requis'
      });
    }

    const admin = await Admin.findById(decoded.id);
    if (!admin || !admin.isActive) {
      console.log('❌ Admin not found or inactive:', { id: decoded.id });
      return res.status(401).json({
        success: false,
        error: 'Token invalide - Admin non trouvé ou inactif'
      });
    }

    console.log('✅ Admin authenticated:', admin.email);

    // Utiliser req.admin pour éviter le conflit avec req.user existant
    (req as any).admin = {
      id: admin._id.toString(),
      email: admin.email,
      name: admin.name,
      role: admin.role
    };

    next();
  } catch (error) {
    console.error('❌ Admin auth middleware error:', error);
    return res.status(401).json({
      success: false,
      error: 'Token invalide'
    });
  }
};
