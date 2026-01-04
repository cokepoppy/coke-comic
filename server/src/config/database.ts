import mysql from 'mysql2/promise';
import logger from './logger';

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '123456',
  database: process.env.DB_NAME || 'comics',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

logger.debug('🔍 Database configuration:', {
  host: dbConfig.host,
  port: dbConfig.port,
  user: dbConfig.user,
  database: dbConfig.database,
  passwordProvided: !!dbConfig.password
});

const pool = mysql.createPool(dbConfig);

// Test connection and log status
pool.getConnection()
  .then((connection) => {
    logger.info('✅ Database connected successfully', {
      host: process.env.DB_HOST || 'localhost',
      database: process.env.DB_NAME || 'comics',
    });
    connection.release();
  })
  .catch((error) => {
    logger.error('❌ Database connection failed:', error);
    process.exit(1);
  });

// Log each query in debug mode
if (process.env.NODE_ENV !== 'production') {
  const originalQuery = pool.query.bind(pool);
  (pool as any).query = function(sql: any, params?: any) {
    logger.debug('📊 DB Query:', { sql, params });
    return originalQuery(sql, params);
  };
}

export default pool;
