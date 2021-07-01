const express = require('express');
//morgan is a HTTP request logger middleware for node.js
const morgan = require('morgan');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');

const app = express();

////////////////////////////////
// MIDDLEWARES
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}
//to recognize the incoming Request Object as a JSON Object
app.use(express.json());

///////////////////////////////
//timestamp
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

////////////////////////////////
//we are serving the static files from the public folder
app.use(express.static('public'));

////////////////////////////////
//ROUTES

app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);

//Handling unknown routes
app.all('*', (req, res, next) => {
  // res.status(404).json({
  //   status: 'fail',
  //   message: `Can't find ${req.originalUrl} on this server!`,
  // });

  //instead of handling the error locally we use the central ERROR Handling Middleware
  const err = new Error(`Can't find ${req.originalUrl} on this server!`);
  err.status = 'fail';
  err.statusCode = 404;
  //if we pass anything in the next function, express will know that it is an error
  //express will skip all the other middlewares
  //than it will pass the error to our error handling middleware
  next(err);
});

//by specifying 4 parameters in the callback
//express automatically knows that it is an
//ERROR HANDLING MIDDLEWARE

//we handle all the errors here centrally
app.use((err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';
  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
  });
});

module.exports = app;
