// path needs to be installed
const path = require('path');
const express = require('express');
//morgan is a HTTP request logger middleware for node.js
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
// cookie parser parses all the cookies from an incoming request
const cookieParser = require('cookie-parser');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const viewRouter = require('./routes/viewRoutes');

const app = express();

// CSP script for loading mapbox
// app.use((req, res, next) => {
//   res.setHeader(
//     'Content-Security-Policy',
//     "script-src  'self' api.mapbox.com",
//     "script-src-elem 'self' api.mapbox.com"
//   );
//   next();
// });

//we don't need to install pug
// it is internally in express
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

////////////////////////////////
//we are serving the static files from the public folder
app.use(express.static(path.join(__dirname, 'public')));

////////////////////////////////
// GLOBAL MIDDLEWARES

// Set security HTTP headers
// app.use(helmet());

// app.use(
//   helmet({
//     contentSecurityPolicy: {
//       directives: {
//         defaultSrc: ["'self'", 'data:', 'blob:', 'https:', 'ws:'],
//         baseUri: ["'self'"],
//         fontSrc: ["'self'", 'https:', 'data:'],
//         scriptSrc: [
//           "'self'",
//           'https:',
//           'http:',
//           'blob:',
//           'https://*.mapbox.com',
//           'https://js.stripe.com',
//           'https://m.stripe.network',
//           'https://*.cloudflare.com',
//         ],
//         frameSrc: ["'self'", 'https://js.stripe.com'],
//         objectSrc: ["'none'"],
//         styleSrc: ["'self'", 'https:', "'unsafe-inline'"],
//         workerSrc: [
//           "'self'",
//           'data:',
//           'blob:',
//           'https://*.tiles.mapbox.com',
//           'https://api.mapbox.com',
//           'https://events.mapbox.com',
//           'https://m.stripe.network',
//         ],
//         childSrc: ["'self'", 'blob:'],
//         imgSrc: ["'self'", 'data:', 'blob:'],
//         formAction: ["'self'"],
//         connectSrc: [
//           "'self'",
//           "'unsafe-inline'",
//           'data:',
//           'blob:',
//           'https://*.stripe.com',
//           'https://*.mapbox.com',
//           'https://*.cloudflare.com/',
//           'https://bundle.js:*',
//           'ws://127.0.0.1:*/',
//         ],
//         upgradeInsecureRequests: [],
//       },
//     },
//   })
// );

// I have to figure out what options to add to helmet's contentSecurityPolicy,
// bc it is still crushing with the options above
app.use(
  helmet({
    contentSecurityPolicy: false,
  })
);

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
app.use(express.json({ limit: '10kb' }));
// to parse the data coming from the form (HTML forms sends data as urlencoded)
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
// parse cookies
app.use(cookieParser());

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
  // console.log(req.cookies, 'Cookie');
  next();
});

////////////////////////////////
//ROUTES

app.use('/', viewRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);

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
