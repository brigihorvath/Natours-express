const express = require('express');
//morgan is a HTTP request logger middleware for node.js
const morgan = require('morgan');
const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
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
