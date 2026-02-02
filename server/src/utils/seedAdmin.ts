import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import db from '../config/database';
import logger from '../config/logger';
import { RowDataPacket } from 'mysql2';

/**
 * Seed a default admin account when the database has no users.
 *
 * Controlled by env vars:
 * - DEFAULT_ADMIN_EMAIL
 * - DEFAULT_ADMIN_PASSWORD
 * - DEFAULT_ADMIN_NAME
 */
export async function seedAdminIfNeeded() {
  const email = process.env.DEFAULT_ADMIN_EMAIL;
  const password = process.env.DEFAULT_ADMIN_PASSWORD;
  const name = process.env.DEFAULT_ADMIN_NAME || 'Admin';

  if (!email || !password) {
    return; // opt-in only
  }

  try {
    const [countRows] = await db.query<RowDataPacket[]>('SELECT COUNT(*) as c FROM users');
    const count = Number(countRows?.[0]?.c ?? 0);

    if (count > 0) {
      return;
    }

    logger.info('👑 Seeding default admin user (first-run)...', { email });

    const passwordHash = await bcrypt.hash(password, 12);
    const userId = uuidv4();

    await db.query(
      'INSERT INTO users (id, name, email, password_hash, image_url) VALUES (?, ?, ?, ?, ?)',
      [userId, name, email, passwordHash, 'https://lh3.googleusercontent.com/a/default-user=s96-c']
    );

    logger.info('✅ Default admin user created', { email, userId });
  } catch (err) {
    logger.error('❌ Failed to seed default admin user', err as any);
  }
}
