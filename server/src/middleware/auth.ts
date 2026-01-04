import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import logger from '../config/logger';
import db from '../config/database';
import { RowDataPacket } from 'mysql2';
import { AppError } from './error';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
  };
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    logger.debug('🔐 Auth attempt:', {
      path: req.path,
      hasAuthHeader: !!authHeader
    });

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('No token provided', 401);
    }

    const token = authHeader.substring(7);

    logger.debug('🔑 Verifying JWT token...');

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      id: string;
      email: string;
    };

    logger.debug('✅ JWT verified, fetching user:', { userId: decoded.id });

    // Verify user still exists
    const [rows] = await db.query<RowDataPacket[]>(
      'SELECT id, email, name, image_url FROM users WHERE id = ?',
      [decoded.id]
    );

    if (rows.length === 0) {
      logger.warn('⚠️  User not found in database:', { userId: decoded.id });
      throw new AppError('User not found', 401);
    }

    req.user = rows[0] as { id: string; email: string; name: string };
    logger.info(`✅ User authenticated: ${req.user.email}`);
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      logger.warn('⚠️  Invalid JWT token:', { error: error.message });
      res.status(401).json({ success: false, message: 'Invalid token' });
    } else if (error instanceof AppError) {
      res.status(error.statusCode).json({ success: false, message: error.message });
    } else {
      logger.error('❌ Authentication error:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }
};
