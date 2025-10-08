const sgMail = require('@sendgrid/mail')
const config = require('../config/config')
const logger = require('../config/logger')

/**
 * Initialize SendGrid
 */
function initialize() {
  if (config.email.sendgrid.apiKey) {
    sgMail.setApiKey(config.email.sendgrid.apiKey)
    logger.info('SendGrid provider initialized')
    return true
  } else {
    logger.warn('SendGrid API key not configured')
    return false
  }
}

/**
 * Send email using SendGrid
 * @param {string} email
 * @param {string} subject
 * @param {string} html
 * @returns {Promise<{success: boolean, messageId: string}>}
 */
async function send(email, subject, html) {
  if (!config.email.sendgrid.apiKey) {
    throw new Error('SendGrid not configured')
  }

  const msg = {
    to: email,
    from: config.email.from,
    subject: subject,
    html: html
  }

  try {
    const result = await sgMail.send(msg)
    logger.info(`SendGrid email sent to ${email}: ${result[0].headers['x-message-id']}`)
    return {
      success: true,
      messageId: result[0].headers['x-message-id'] || 'sendgrid-' + Date.now()
    }
  } catch (error) {
    logger.error(`SendGrid failed to send email to ${email}: ${error.stack}`)
    throw error
  }
}

/**
 * Verify SendGrid configuration
 * @returns {Promise<boolean>}
 */
async function verifyConnection() {
  if (!config.email.sendgrid.apiKey) {
    logger.error('SendGrid API key not configured')
    return false
  }

  try {
    // SendGrid doesn't have a direct verify method, so we'll just check if API key is set
    logger.info('SendGrid configuration verified')
    return true
  } catch (error) {
    logger.error(`SendGrid verification failed: ${error.stack}`)
    return false
  }
}

/**
 * Close SendGrid connection (no-op for SendGrid)
 */
async function close() {
  logger.info('SendGrid connection closed (no-op)')
}

/**
 * Reinitialize SendGrid
 */
function reinitialize() {
  return initialize()
}

// Initialize on module load
initialize()

module.exports = {
  send,
  verifyConnection,
  close,
  reinitialize
}
