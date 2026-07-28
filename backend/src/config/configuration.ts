function parseRedisFromUrl(redisUrl: string): {
  host: string;
  port: number;
  password: string;
  username?: string;
  tls: boolean;
} {
  const parsed = new URL(redisUrl);
  return {
    host: parsed.hostname,
    port: parseInt(parsed.port || '6379', 10),
    password: decodeURIComponent(parsed.password || ''),
    username: parsed.username ? decodeURIComponent(parsed.username) : undefined,
    tls: parsed.protocol === 'rediss:',
  };
}

export default () => {
  const redisFromUrl = process.env.REDIS_URL
    ? parseRedisFromUrl(process.env.REDIS_URL)
    : null;

  return {
    nodeEnv: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.BACKEND_PORT || '3001', 10),
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
    database: {
      url: process.env.DATABASE_URL,
    },
    redis: {
      host: redisFromUrl?.host || process.env.REDIS_HOST || 'localhost',
      port:
        redisFromUrl?.port ?? parseInt(process.env.REDIS_PORT || '6379', 10),
      password: redisFromUrl?.password || process.env.REDIS_PASSWORD || '',
      username: redisFromUrl?.username || process.env.REDIS_USERNAME || '',
      tls: redisFromUrl?.tls || process.env.REDIS_TLS === 'true' || false,
    },
    jwt: {
      accessSecret:
        process.env.JWT_ACCESS_SECRET ||
        process.env.JWT_SECRET ||
        'change-me-access-in-production',
      refreshSecret:
        process.env.JWT_REFRESH_SECRET || 'change-me-refresh-in-production',
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
        retryDelayMs: parseInt(
          process.env.MAIL_QUEUE_RETRY_DELAY_MS || '60000',
          10,
        ),
      },
    },
  };
};
