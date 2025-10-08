const nodemailer = require('nodemailer')
const config = require('../config/config')
const logger = require('../config/logger')

let transporter = null

/**
 * Initialize email transporter from config
 */
function initialize() {
  if (config.email.smtp.host && config.email.smtp.auth.user) {
    transporter = nodemailer.createTransport({
      host: config.email.smtp.host,
      port: config.email.smtp.port,
      secure: config.email.smtp.port === 465,
      auth: {
        user: config.email.smtp.auth.user,
        pass: config.email.smtp.auth.pass
      },
      // Disable timeouts temporarily to avoid connection issues
      // connectionTimeout: config.email.smtp.connectionTimeout,
      // greetingTimeout: config.email.smtp.greetingTimeout,
      // socketTimeout: config.email.smtp.socketTimeout,
      // Retry configuration
      pool: true,
      maxConnections: 5,
      maxMessages: 100,
      rateDelta: 20000, // 20 seconds
      rateLimit: 5,     // 5 emails per rateDelta
      // Additional options for better reliability
      tls: {
        rejectUnauthorized: false // For development/testing environments
      },
      // Connection pooling for better performance
      poolConfig: {
        max: 5,
        min: 0,
        // Disable pool timeouts temporarily
        // acquireTimeoutMillis: 30000,
        // createTimeoutMillis: 30000,
        // destroyTimeoutMillis: 5000,
        // idleTimeoutMillis: 30000,
        reapIntervalMillis: 1000,
        createRetryIntervalMillis: 200
      }
    })
    logger.info('Email transporter initialized without timeouts')
  } else {
    logger.warn('Email SMTP configuration missing')
  }
}

/**
 * Send email with retry logic
 * @param {string} email
 * @param {string} subject
 * @param {string} html
 * @param {number} retries - Number of retry attempts (default: 3)
 * @returns {Promise<{success: boolean, messageId: string}>}
 */
async function send(email, subject, html, retries = null) {
  // Use configurable retries or default
  const maxRetries = retries || config.email.smtp.maxRetries
  if (!transporter) {
    logger.error('Email transporter not initialized')
    throw new Error('Email service not configured')
  }

  const mailOptions = {
    from: config.email.from,
    to: email,
    subject,
    html
  }

  let lastError = null

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      logger.debug(`Attempting to send email to ${email} (attempt ${attempt}/${maxRetries})`)

      const result = await transporter.sendMail(mailOptions)
      logger.info(`Email sent to ${email}: ${result.messageId}`)
      return { success: true, messageId: result.messageId }

    } catch (error) {
      lastError = error
      logger.warn(`Email send attempt ${attempt}/${maxRetries} failed for ${email}: ${error.message}`)

      // Don't retry on certain types of errors
      if (error.code === 'EAUTH' || error.code === 'EENVELOPE') {
        logger.error(`Authentication or envelope error for ${email}, not retrying: ${error.message}`)
        break
      }

      // Wait before retrying (exponential backoff)
      if (attempt < maxRetries) {
        const delay = Math.min(config.email.smtp.retryDelay * Math.pow(2, attempt - 1), 10000) // Max 10 seconds
        logger.debug(`Waiting ${delay}ms before retry...`)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }

  logger.error(`Failed to send email to ${email} after ${maxRetries} attempts: ${lastError.stack}`)
  throw lastError
}

/**
 * Kiểm tra kết nối SMTP
 * @returns {Promise<boolean>}
 */
async function verifyConnection() {
  if (!transporter) {
    logger.error('Email transporter not available for verification')
    return false
  }
  try {
    await transporter.verify()
    logger.info('Email SMTP connection verified')
    return true
  } catch (error) {
    logger.error(`Email SMTP connection verification failed: ${error.stack}`)
    return false
  }
}

/**
 * Close email transporter connection pool
 * @returns {Promise<void>}
 */
async function close() {
  if (transporter) {
    try {
      transporter.close()
      logger.info('Email transporter connection pool closed')
    } catch (error) {
      logger.error(`Error closing email transporter: ${error.stack}`)
    }
  }
}

/**
 * Reinitialize email transporter (useful for reconnection)
 */
function reinitialize() {
  close()
  initialize()
}

// Initialize on module load
initialize()

// Graceful shutdown
process.on('SIGINT', close)
process.on('SIGTERM', close)

module.exports = {
  send,
  verifyConnection,
  close,
  reinitialize
}
