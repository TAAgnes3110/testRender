const dotenv = require('dotenv')
dotenv.config()

module.exports = {
  env: process.env.NODE_ENV,
  app: {
    name: process.env.APP_NAME,
    host: process.env.APP_HOST,
    port: process.env.APP_PORT,
    apiVersion: process.env.API_VERSION,
    prefix: process.env.API_PREFIX
  },
  firebase: {
    projectId: process.env.FIREBASE_PROJECT_ID,
    projectNumber: process.env.FIREBASE_PROJECT_NUMBER,
    databaseURL: process.env.FIREBASE_DATABASE_URL
  },
  email: {
    provider: 'resend',
    resend: {
      apiKey: process.env.RESEND_API_KEY
    },
    from: process.env.EMAIL_FROM
  },
  upload: {
    limit: process.env.UPLOAD_LIMIT || '10mb',
    allowedFormats: process.env.ALLOWED_FORMATS ? process.env.ALLOWED_FORMATS.split(',') : ['jpg', 'jpeg', 'png', 'gif', 'pdf'],
    storagePath: process.env.STORAGE_PATH || 'uploads'
  },
  rateLimit: {
    max: parseInt(process.env.RATE_LIMIT, 10),
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW, 10) * 60 * 1000
  },
  logging: {
    level: process.env.LOG_LEVEL,
    format: process.env.LOG_FORMAT
  },
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    methods: process.env.CORS_METHODS ? process.env.CORS_METHODS.split(',') : ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: process.env.CORS_CREDENTIALS === 'true'
  },
  otp: {
    length: parseInt(process.env.OTP_LENGTH, 10) || 6,
    expiry: parseInt(process.env.OTP_EXPIRY, 10) || 300,
    provider: process.env.OTP_PROVIDER || 'email'
  },
  cache: {
    ttl: parseInt(process.env.CACHE_TTL, 10) || 300,
    checkperiod: parseInt(process.env.CACHE_CHECKPERIOD, 10) || 120
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production',
    expiry: process.env.JWT_EXPIRY || '24h'
  },
}
