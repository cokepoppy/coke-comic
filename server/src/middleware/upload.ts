import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Request } from 'express';
import logger from '../config/logger';

// Ensure upload directories exist
const coverDir = path.join(__dirname, '../../public/uploads/covers');
const pagesDir = path.join(__dirname, '../../public/uploads/pages');

[coverDir, pagesDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    logger.info(`📁 Created upload directory: ${dir}`);
  }
});

// Storage configuration
const storage = multer.diskStorage({
  destination: (req: Request, file: Express.Multer.File, cb) => {
    const isCover = file.fieldname === 'cover';
    const targetDir = isCover ? coverDir : pagesDir;
    logger.debug(`📂 Upload destination: ${targetDir} (field: ${file.fieldname})`);
    cb(null, targetDir);
  },
  filename: (req: Request, file: Express.Multer.File, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    const ext = path.extname(file.originalname);
    const filename = `${file.fieldname}-${uniqueSuffix}${ext}`;
    logger.debug(`📝 Generated filename: ${filename}`);
    cb(null, filename);
  }
});

// File filter
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

  logger.debug(`🔍 File filter check:`, {
    fieldname: file.fieldname,
    mimetype: file.mimetype,
    originalname: file.originalname
  });

  if (allowedMimes.includes(file.mimetype)) {
    logger.debug(`✅ File type accepted: ${file.mimetype}`);
    cb(null, true);
  } else {
    logger.warn(`⚠️  Invalid file type: ${file.mimetype}`);
    cb(new Error(`Invalid file type. Only JPEG, PNG, GIF, and WEBP are allowed. Got: ${file.mimetype}`));
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880'), // 5MB default
  },
});
