const { Resend } = require('resend')
const config = require('../config/config')
const logger = require('../config/logger')

let resend = null

/**
 * Initialize Resend email provider
 */
function initialize() {
  if (config.email.resend.apiKey) {
    resend = new Resend(config.email.resend.apiKey)
    logger.info('Resend email provider initialized')
  } else {
    logger.error('Resend API key not configured')
  }
}

/**
 * Send email using Resend
 * @param {string} email
 * @param {string} subject
 * @param {string} html
 * @returns {Promise<{success: boolean, messageId: string}>}
 */
async function send(email, subject, html) {
  try {
    if (!resend) {
      logger.error('Resend not initialized')
      throw new Error('Email service not configured')
    }

    const result = await resend.emails.send({
      from: config.email.from,
      to: email,
      subject,
      html
    })

    logger.info(`Email sent via Resend to ${email}: ${result.data?.id}`)
    return { success: true, messageId: result.data?.id }
  } catch (error) {
    logger.error(`Failed to send email to ${email}: ${error.stack}`)
    throw error
  }
}

/**
 * Verify Resend connection
 * @returns {Promise<boolean>}
 */
async function verifyConnection() {
  try {
    if (!resend) {
      logger.error('Resend not initialized')
      return false
    }

    // Test Resend connection by getting domains
    await resend.domains.list()
    logger.info('Resend email provider connection verified')
    return true
  } catch (error) {
    logger.error(`Resend connection verification failed: ${error.stack}`)
    return false
  }
}

initialize()

module.exports = {
  send,
  verifyConnection
}
