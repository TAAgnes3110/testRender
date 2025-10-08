const userService = require('./userService')
const otpService = require('./otpService')
const tokenService = require('./tokenService')
const firebaseService = require('./firebaseService')
const emailService = require('./emailService')
const emailHealthService = require('./emailHealthService')
const authService = require('./authService')
const bookService = require('./bookService')
const categoriesService = require('./categoriesService')
const epubService = require('./epubService')

module.exports = {
  userService,
  otpService,
  tokenService,
  firebaseService,
  emailService,
  emailHealthService,
  authService,
  bookService,
  categoriesService,
  epubService
}
