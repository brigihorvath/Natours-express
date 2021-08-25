const express = require('express');
//morgan is a HTTP request logger middleware for node.js
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');

const app = express();

////////////////////////////////
// GLOBAL MIDDLEWARES

// Set security HTTP headers
app.use(helmet());

// Development logging
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

/* 
    Rate Limit: to limit the number of the requests that arrives from the same IP.
    This is good against Brute Force attacks.
    express-rate-limit package is
*/
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests from this IP, please try again in an hour!',
});
app.use('/api', limiter);

// to recognize the incoming Request Object as a JSON Object
// Body parser, reading data from body into req.body

app.use(express.json());

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Data sanitization against XSS
app.use(xss());

// Prevent parameter pollution
// removes duplicate parameters, where it would broke the app (e.g. sort)
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsQuantity',
      'ratingsAverage',
      'maxGroupSize',
      'difficulty',
      'price',
    ],
  })
);

///////////////////////////////
//timestamp
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  //console.log(req.headers);
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
  //we use our AppError class
  //which extends the Error class
  //if we pass anything in the next function, express will know that it is an error
  //express will skip all the other middlewares
  //than it will pass the error to our error handling middleware
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

//by specifying 4 parameters in the callback
//express automatically knows that it is an
//ERROR HANDLING MIDDLEWARE

//we handle all the errors here centrally
//the globalErrorHandler function has 4 parameters and the error is the first one
//so express knows that it is an error handling middleware
app.use(globalErrorHandler);

module.exports = app;
