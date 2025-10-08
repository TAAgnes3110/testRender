const express = require('express')
const cors = require('cors')
const passport = require('passport')
const rateLimit = require('express-rate-limit')
const compression = require('compression')
const helmet = require('helmet')
const httpStatus = require('http-status')

const config = require('./config/config')
const logger = require('./config/logger')
const { authRoute, userRoute, categoriesRoute, bookRoute, epubRoute } = require('./routes/index')
const { firebaseStrategy } = require('./config/passport')
const { emailHealthService } = require('./services/index')

const app = express()

// SECURITY MIDDLEWARE
app.use(helmet())
app.use(compression())

// CORS CONFIGURATION
app.use(cors(config.cors))
app.options('*', cors())

// BODY PARSING
app.use(
  express.json({
    limit: config.upload.limit,
    verify: (req, res, buf) => {
      req.rawBody = buf
    }
  })
)
app.use(
  express.urlencoded({
    extended: true,
    limit: config.upload.limit
  })
)

// RATE LIMITING
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false
})
app.use(limiter)

// AUTHENTICATION
app.use(passport.initialize())
passport.use('firebase', firebaseStrategy)

// HEALTH CHECK
app.get('/health', (req, res) => {
  const emailStatus = emailHealthService.getStatus()

  res.status(200).json({
    success: true,
    message: 'Server is running normally',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    services: {
      email: emailStatus
    }
  })
})

// EMAIL HEALTH CHECK
app.get('/health/email', async (req, res) => {
  try {
    const isHealthy = await emailHealthService.checkHealth()
    const status = emailHealthService.getStatus()

    res.status(isHealthy ? 200 : 503).json({
      success: isHealthy,
      message: isHealthy ? 'Email service is healthy' : 'Email service is unhealthy',
      status: status
    })
  } catch (error) {
    logger.error('Email health check endpoint error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to check email service health',
      error: error.message
    })
  }
})

// API ROUTES
app.use('/api/auth', authRoute)
app.use('/api/users', userRoute)
app.use('/api/categories', categoriesRoute)
app.use('/api/books', bookRoute)
app.use('/api/epub', epubRoute)


// ERROR HANDLER
app.use((error, req, res, next) => {
  logger.error('Unhandled error:', error)

  let statusCode = error.status || error.statusCode || httpStatus.status.INTERNAL_SERVER_ERROR
  if (!statusCode || typeof statusCode !== 'number') {
    statusCode = 500
  }

  res.status(statusCode).json({
    success: false,
    message: error.message || 'Internal server error'
  })
})

module.exports = app
