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
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Accès non autorisé - Token manquant'
      });
    }

    const decoded = jwt.verify(token, env.JWT_SECRET) as any;
    
    if (!decoded.isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Accès interdit - Admin requis'
      });
    }

    const admin = await Admin.findById(decoded.id);
    if (!admin || !admin.isActive) {
      return res.status(401).json({
        success: false,
        error: 'Token invalide - Admin non trouvé ou inactif'
      });
    }

    // Utiliser req.admin pour éviter le conflit avec req.user existant
    (req as any).admin = {
      id: admin._id.toString(),
      email: admin.email,
      name: admin.name,
      role: admin.role
    };

    next();
  } catch (error) {
    console.error('Admin auth middleware error:', error);
    return res.status(401).json({
      success: false,
      error: 'Token invalide'
    });
  }
};
