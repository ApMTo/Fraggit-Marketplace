export default () => ({
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.BACKEND_PORT || '3001', 10),
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  database: {
    url: process.env.DATABASE_URL,
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || '',
  },
  jwt: {
    accessSecret:
      process.env.JWT_ACCESS_SECRET ||
      process.env.JWT_SECRET ||
      'change-me-access-in-production',
    refreshSecret:
      process.env.JWT_REFRESH_SECRET ||
      'change-me-refresh-in-production',
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '20m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '14d',
  },
  smtp: {
    host: process.env.SMTP_HOST || '',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    user: process.env.SMTP_USER || '',
    password: process.env.SMTP_PASSWORD || '',
    from:
      process.env.SMTP_FROM ||
      (process.env.SMTP_USER
        ? `Fraggit <${process.env.SMTP_USER}>`
        : 'Fraggit <no-reply@fraggit.local>'),
  },
  mail: {
    queue: {
      attempts: parseInt(process.env.MAIL_QUEUE_ATTEMPTS || '5', 10),
      retryDelayMs: parseInt(process.env.MAIL_QUEUE_RETRY_DELAY_MS || '60000', 10),
    },
  },
});
