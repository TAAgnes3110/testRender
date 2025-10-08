const config = require('../config/config')

// Choose email provider based on configuration
const emailProvider = config.email.provider === 'sendgrid'
  ? require('./sendgridProvider')
  : require('./emailProvider')

module.exports.emailProvider = emailProvider
module.exports.otpProvider = require('./otpProvider')
module.exports.userProvider = require('./userProvider')
