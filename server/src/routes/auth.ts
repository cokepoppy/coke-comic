import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import db from '../config/database';
import logger from '../config/logger';
import { AppError } from '../middleware/error';
import { authenticate, AuthRequest } from '../middleware/auth';
import { RowDataPacket } from 'mysql2';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// POST /api/auth/register
router.post(
  '/register',
  [
    body('name').trim().isLength({ min: 1 }).withMessage('Name is required'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  ],
  async (req: any, res: any, next: any) => {
    try {
      logger.info('📝 Registration attempt:', { email: req.body.email });

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        logger.warn('⚠️  Validation failed:', errors.array());
        throw new AppError('Invalid input: ' + errors.array()[0].msg, 400);
      }

      const { name, email, password } = req.body;

      // Check if user exists
      logger.debug('🔍 Checking if user exists...');
      const [existing] = await db.query<RowDataPacket[]>(
        'SELECT id FROM users WHERE email = ?',
        [email]
      );

      if (existing.length > 0) {
        logger.warn('⚠️  Email already registered:', { email });
        throw new AppError('Email already registered', 409);
      }

      // Hash password
      logger.debug('🔒 Hashing password...');
      const passwordHash = await bcrypt.hash(password, 12);

      // Create user
      const userId = uuidv4();
      logger.debug('💾 Creating user in database...', { userId, email });

      await db.query(
        'INSERT INTO users (id, name, email, password_hash, image_url) VALUES (?, ?, ?, ?, ?)',
        [userId, name, email, passwordHash, 'https://lh3.googleusercontent.com/a/default-user=s96-c']
      );

      // Generate JWT
      const token = jwt.sign(
        { id: userId, email },
        process.env.JWT_SECRET || 'default-secret'
      );

      logger.info(`✅ User registered successfully: ${email}`);

      res.status(201).json({
        success: true,
        data: {
          token,
          user: {
            id: userId,
            name,
            email,
            imageUrl: 'https://lh3.googleusercontent.com/a/default-user=s96-c',
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/auth/login
router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  ],
  async (req: any, res: any, next: any) => {
    try {
      logger.info('🔐 Login attempt:', { email: req.body.email });

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        logger.warn('⚠️  Validation failed:', errors.array());
        throw new AppError('Invalid input: ' + errors.array()[0].msg, 400);
      }

      const { email, password } = req.body;

      // Find user
      logger.debug('🔍 Looking up user...');
      const [rows] = await db.query<RowDataPacket[]>(
        'SELECT * FROM users WHERE email = ?',
        [email]
      );

      if (rows.length === 0) {
        logger.warn('⚠️  User not found:', { email });
        throw new AppError('Invalid credentials', 401);
      }

      const user = rows[0];

      // Verify password
      logger.debug('🔑 Verifying password...');
      const isValidPassword = await bcrypt.compare(password, user.password_hash);
      if (!isValidPassword) {
        logger.warn('⚠️  Invalid password:', { email });
        throw new AppError('Invalid credentials', 401);
      }

      // Generate JWT
      const token = jwt.sign(
        { id: user.id, email: user.email },
        process.env.JWT_SECRET || 'default-secret'
      );

      logger.info(`✅ User logged in successfully: ${user.email}`);

      res.json({
        success: true,
        data: {
          token,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            imageUrl: user.image_url,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/auth/me
router.get('/me', authenticate, async (req: AuthRequest, res, next) => {
  try {
    logger.debug('👤 Fetching current user:', { userId: req.user?.id });

    const [rows] = await db.query<RowDataPacket[]>(
      'SELECT id, name, email, image_url FROM users WHERE id = ?',
      [req.user!.id]
    );

    if (rows.length === 0) {
      throw new AppError('User not found', 404);
    }

    const user = rows[0];

    res.json({
      success: true,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        imageUrl: user.image_url,
      },
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/logout
router.post('/logout', authenticate, (req: AuthRequest, res) => {
  logger.info(`👋 User logged out: ${req.user?.email}`);
  res.json({ success: true, message: 'Logged out successfully' });
});

export default router;
