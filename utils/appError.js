//we extend the built-in Error class
//this is for operational errors
// when we send the error to the global error handling middleware
// we have to create a new Error, and on that Error object
// specify a statuscode and the status
// the AppError class will make it easier, we just pass a message and a statusCode to the constructor
// and then everything goes automatically
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
