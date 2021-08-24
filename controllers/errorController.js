//this is the global ERROR HANDLING MIDDLEWARE

const AppError = require('../utils/appError');

const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path} : ${err.value}`;
  return new AppError(message, 400);
};

const handleDuplicateNameError = (err) => {
  const value = err.keyValue.name;
  const message = `Duplicate name: ${value}`;
  return new AppError(message, 400);
};

const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
    stack: err.stack,
    error: err,
  });
};

const sendErrorProd = (err, res) => {
  //Operational trusted error: send message to client
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
    //Programming or other unknown error: don't leak error details
  } else {
    // 1) Log error
    console.error('PROGRAMMING ERROR', err);

    // 2) Send generic message
    res.status(500).json({
      status: 'error',
      message: 'Something went VERY wrong',
    });
  }
};

const handleJsonWebTokenError = (err) => new AppError('Invalid JWT token', 401);
const handleJWTExpiredError = (err) =>
  new AppError('Your token has expired. Please sign in again.', 401);

module.exports = (err, req, res, next) => {
  //err.stack shows us where the error happened
  //console.log(err.stack);
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res);
  } else if (process.env.NODE_ENV === 'production') {
    let error = { ...err };
    if (err.name === 'CastError') error = handleCastErrorDB(error);
    if (err.code === 11000) error = handleDuplicateNameError(error);
    if (err.name === 'JsonWebTokenError')
      error = handleJsonWebTokenError(error);
    if (err.name === 'TokenExpiredError') error = handleJWTExpiredError(error);
    sendErrorProd(error, res);
  }
};
