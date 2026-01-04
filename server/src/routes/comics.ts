import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import db from '../config/database';
import logger from '../config/logger';
import { AppError } from '../middleware/error';
import { authenticate, AuthRequest } from '../middleware/auth';
import { upload } from '../middleware/upload';
import { RowDataPacket } from 'mysql2';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// GET /api/comics
router.get('/', async (req: any, res: any, next: any) => {
  try {
    logger.info('📚 Fetching all comics...');

    const [rows] = await db.query<RowDataPacket[]>(
      'SELECT id, title, description, author, cover_url as coverUrl, pages, created_at as createdAt FROM comics ORDER BY created_at DESC'
    );

    // Parse JSON pages field and convert timestamp
    const comics = rows.map(row => ({
      ...row,
      pages: typeof row.pages === 'string' ? JSON.parse(row.pages) : row.pages,
      createdAt: new Date(row.createdAt).getTime(),
    }));

    logger.info(`✅ Fetched ${comics.length} comics`);

    res.json({
      success: true,
      data: comics,
    });
  } catch (error) {
    logger.error('❌ Error fetching comics:', error);
    next(error);
  }
});

// POST /api/comics
router.post(
  '/',
  authenticate,
  upload.fields([
    { name: 'cover', maxCount: 1 },
    { name: 'pages', maxCount: 20 },
  ]),
  [
    body('title').trim().isLength({ min: 1, max: 255 }).withMessage('Title is required (max 255 chars)'),
    body('author').trim().isLength({ min: 1, max: 255 }).withMessage('Author is required (max 255 chars)'),
    body('description').optional().trim(),
  ],
  async (req: AuthRequest, res: any, next: any) => {
    try {
      logger.info('📤 Comic upload request:', {
        user: req.user?.email,
        title: req.body.title
      });

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        logger.warn('⚠️  Validation failed:', errors.array());
        throw new AppError('Invalid input: ' + errors.array()[0].msg, 400);
      }

      const files = req.files as { [fieldname: string]: Express.Multer.File[] };

      logger.debug('📁 Uploaded files:', {
        hasCover: !!files?.cover,
        hasPages: !!files?.pages,
        coverCount: files?.cover?.length || 0,
        pagesCount: files?.pages?.length || 0,
      });

      if (!files || !files.cover || !files.pages) {
        throw new AppError('Cover and pages are required', 400);
      }

      if (files.cover.length === 0) {
        throw new AppError('Cover image is required', 400);
      }

      if (files.pages.length === 0) {
        throw new AppError('At least one page is required', 400);
      }

      const { title, author, description = '' } = req.body;

      // Generate relative paths
      const coverUrl = `/uploads/covers/${files.cover[0].filename}`;
      const pages = files.pages.map(file => `/uploads/pages/${file.filename}`);

      logger.debug('🖼️  Image paths generated:', {
        coverUrl,
        pagesCount: pages.length,
        pages: pages.slice(0, 3), // Log first 3 pages
      });

      const comicId = uuidv4();

      logger.debug('💾 Inserting comic into database...', { comicId, userId: req.user!.id });

      await db.query(
        'INSERT INTO comics (id, title, description, author, cover_url, pages, user_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [comicId, title, description, author, coverUrl, JSON.stringify(pages), req.user!.id]
      );

      logger.info(`✅ Comic created successfully: "${title}" by ${req.user!.email}`, {
        comicId,
        pagesCount: pages.length,
      });

      res.status(201).json({
        success: true,
        data: {
          id: comicId,
          title,
          description,
          author,
          coverUrl,
          pages,
          createdAt: Date.now(),
        },
      });
    } catch (error) {
      logger.error('❌ Error creating comic:', error);
      next(error);
    }
  }
);

// DELETE /api/comics/:id
router.delete('/:id', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;

    logger.info('🗑️  Delete comic request:', {
      comicId: id,
      user: req.user?.email
    });

    // Check ownership
    logger.debug('🔍 Checking comic ownership...');
    const [rows] = await db.query<RowDataPacket[]>(
      'SELECT user_id, title FROM comics WHERE id = ?',
      [id]
    );

    if (rows.length === 0) {
      logger.warn('⚠️  Comic not found:', { comicId: id });
      throw new AppError('Comic not found', 404);
    }

    if (rows[0].user_id !== req.user!.id) {
      logger.warn('⚠️  Unauthorized delete attempt:', {
        comicId: id,
        owner: rows[0].user_id,
        requester: req.user!.id
      });
      throw new AppError('Unauthorized - you can only delete your own comics', 403);
    }

    logger.debug('🗑️  Deleting comic from database...');
    await db.query('DELETE FROM comics WHERE id = ?', [id]);

    logger.info(`✅ Comic deleted successfully: "${rows[0].title}" by ${req.user!.email}`, {
      comicId: id
    });

    res.json({
      success: true,
      message: 'Comic deleted successfully',
    });
  } catch (error) {
    logger.error('❌ Error deleting comic:', error);
    next(error);
  }
});

export default router;
