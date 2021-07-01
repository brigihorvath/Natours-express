//we extend the built-in Error class
//this is for operational errors
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    //this way this constructor won't appear on a stack trace and won't pollute it
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
