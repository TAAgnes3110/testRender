const { emailProvider } = require('../providers/index')
const config = require('../config/config')
const logger = require('../config/logger')

/**
 * Email health check service
 */
class EmailHealthService {
  constructor() {
    this.isHealthy = false
    this.lastCheck = null
    this.checkInterval = 5 * 60 * 1000 // 5 minutes
    this.retryCount = 0
    this.maxRetries = 3
  }

  /**
   * Perform email health check
   * @returns {Promise<boolean>}
   */
  async checkHealth() {
    try {
      logger.debug('Performing email health check...')

      const isConnected = await emailProvider.verifyConnection()

      if (isConnected) {
        this.isHealthy = true
        this.retryCount = 0
        this.lastCheck = new Date()
        logger.info('Email service health check passed')
        return true
      } else {
        this.isHealthy = false
        this.retryCount++
        logger.warn(`Email service health check failed (attempt ${this.retryCount}/${this.maxRetries})`)
        return false
      }
    } catch (error) {
      this.isHealthy = false
      this.retryCount++
      logger.error(`Email health check error (attempt ${this.retryCount}/${this.maxRetries}): ${error.message}`)
      return false
    }
  }

  /**
   * Get email service status
   * @returns {Object}
   */
  getStatus() {
    return {
      isHealthy: this.isHealthy,
      lastCheck: this.lastCheck,
      retryCount: this.retryCount,
      provider: config.email.provider,
      maxRetries: this.maxRetries
    }
  }

  /**
   * Start periodic health checks
   */
  startHealthChecks() {
    logger.info('Starting email health checks...')

    // Initial check
    this.checkHealth()

    // Periodic checks
    setInterval(async () => {
      await this.checkHealth()

      // If unhealthy and retry count exceeded, try to reinitialize
      if (!this.isHealthy && this.retryCount >= this.maxRetries) {
        logger.warn('Email service unhealthy, attempting to reinitialize...')
        try {
          emailProvider.reinitialize()
          this.retryCount = 0
        } catch (error) {
          logger.error(`Failed to reinitialize email service: ${error.message}`)
        }
      }
    }, this.checkInterval)
  }

  /**
   * Test email sending with a simple test email
   * @param {string} testEmail - Email to send test to
   * @returns {Promise<boolean>}
   */
  async testEmailSending(testEmail) {
    try {
      const testSubject = 'Email Service Test - Fliply'
      const testHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #333;">📚 Fliply Email Test</h1>
          <p>This is a test email to verify email service functionality.</p>
          <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
          <p><strong>Provider:</strong> ${config.email.provider}</p>
          <p>If you receive this email, the email service is working correctly.</p>
        </div>
      `

      await emailProvider.send(testEmail, testSubject, testHtml)
      logger.info(`Test email sent successfully to ${testEmail}`)
      return true
    } catch (error) {
      logger.error(`Test email failed to ${testEmail}: ${error.message}`)
      return false
    }
  }
}

// Create singleton instance
const emailHealthService = new EmailHealthService()

module.exports = emailHealthService
