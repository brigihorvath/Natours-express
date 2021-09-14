const crypto = require('crypto');
//we use the promisify function from the built-in util module
const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const Email = require('../utils/email');

//we create the JWT token
//1. payload
//2. secret
//3. expiration
const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

/*
// cookie: a piece of text that a server can send to the client
//  when the client receives it, it will automatically send it back
// with all future requests to the same server as it came from
// secure: true - only through https
// httpOnly -  the browser is not allowed to manipulate the cookie
*/

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    // httpOnly means that we cannot manipulate the cookie in any way. (no delete for example)
    httpOnly: true,
  };
  if (process.NODE_ENV === 'production') {
    cookieOptions.secure = true;
  }
  res.cookie('jwt', token, cookieOptions);
  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  //saving the new user in the database
  //we need to 'unpack' the body of the request
  //in order to prevent the user from being able to create
  //an admin user
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    passwordChangedAt: req.body.passwordChangedAt,
  });

  const url = `${req.protocol}://${req.get('host')}/me`;
  console.log(url, 'authCont 65');
  await new Email(newUser, url).sendWelcome();

  //JWT token
  createSendToken(newUser, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // 1) check if email and password exists
  if (!email || !password) {
    //we create an error and the global error handling tool will pick it up
    //we have to return because we want to login function to finish
    return next(new AppError('Please provide email and password', 400));
  }

  // 2) Check if user exists and password is correct
  //the password doesn't appear automatically in the searches
  //so we have to select it additionally
  const user = await User.findOne({ email: email }).select('+password');
  //the user variable is a 'User document' because it is a result of querying the model
  //that's why we can use the instance method on this object
  //user is an instance of the userSchema
  //console.log(user);
  //we can write this this way also: ({ email })

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect email or password', 401));
  }

  // 3) If everything is OK, send token to the client
  createSendToken(user, 200, res);
});

// We send a new cookie to replace the old one
// we cannot just simply delete the old one, because it is httpOnly
exports.logout = (req, res) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });
  res.status(200).json({ status: 'success' });
};

exports.protect = catchAsync(async (req, res, next) => {
  // 1) Getting token and checking if it's there
  // We get the token in the HTTP headers
  // It is in the Authorization header usually
  // it starts with Bearer
  let token;
  console.log('protect middleware');
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    return next(new AppError('You are not logged in', 401));
  }
  // 2) Validate token - Verification

  //util.promisify takes a function and returns a version that returns promises
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  // 3) Check if user still exists
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(new AppError('The user does not exist anymore.', 401));
  }

  // 4) check if user changed password after the JWT token was issued
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError('User recently changed password. Please log in again.', 401)
    );
  }
  //GRANT ACCESS TO PROTECTED ROUTE
  //we put the currentUser to the request object, so the next middleware will have access to it
  req.user = currentUser;
  res.locals.user = currentUser;
  next();
});

//this is how we pass arguments to a middleware
exports.restrictTo =
  (...roles) =>
  (req, res, next) => {
    //the protect middleware runs before the restrictTo middleware
    //so on the req object there will be the currentUser
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to perform this action', 403)
      );
    }
    next();
  };

exports.forgotPassword = catchAsync(async (req, res, next) => {
  // 1) Get user based on POSTed email address
  //we find the user in the DB
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError('There is no user with that email address.', 404));
  }
  // 2) GENERATE the random reset TOKEN
  // we never store a plain token in our database
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });
  // 3) Send it to user's email address
  //WE CREATE THE URL AND THE MSG THAT WE ARE GOING TO SEND TO THE USER
  //const message = `Forgot your password? Submit a PATCH request with your new password and passwordConfirm to: ${resetURL}.\nIf you didn't forget your password, please ignore this email!`;
  //we want to do more than sending an error back, so we use try catch
  //WE SEND THE MAIL
  try {
    const resetURL = `${req.protocol}://${req.get(
      'host'
    )}/api/v1/users/resetPassword/${resetToken}`;
    await new Email(user, resetURL).sendPasswordReset();
    res.status(200).json({ status: 'success', message: 'Token sent to email' });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError('There was an error sending the email. Try again later!'),
      500
    );
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1) Get user based on the token
  //we sent the none encrypted token, but in the DB we can only store the crypted, so we crypt the non crypted
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  //we find the user in the DB that has the hashed token and it is not expired
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  // 2) If token has not expired, and there is user, set the new password
  if (!user) {
    return next(new AppError('Token is invalid or has expired', 400));
  }
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  // 3) Update changedPasswordAt property for the user
  // 4) Log the user in, send JWT
  createSendToken(user, 200, res);
});

// PSWD update is for logged in users, but still we need their password
// as a security measure
exports.updatePassword = catchAsync(async (req, res, next) => {
  // 1) Get user from collection
  // our current user is on the request object, because we save it there
  // via the protect middleware
  const user = await User.findById(req.user.id).select('+password');

  // 2) Check if POSTed current password is correct
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(new AppError('Your current password is wrong.', 401));
  }

  // 3) If so, update password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  // the validation is done automatically by the schema
  await user.save();
  // User.findByIdAndUpdate will NOT work as intended
  // because this.password in the mongoose schema passwordConfirm validation
  // doesn't work, bc mongoose doesn't keep the current object in memory
  // besides the save middleworks would also won't work at all

  // 4) Log user in, send JWT
  createSendToken(user, 200, res);
});

// Only for rendered pages, no errors!
// Basically just to make the Log In and Sign Up buttons disappear
exports.isLoggedIn = async (req, res, next) => {
  if (req.cookies.jwt) {
    // we don't use catchAsync here, bc here it would result in an error at logout
    // instead we try to catch the error locally
    try {
      // 1) verify token
      const decoded = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET
      );

      // 2) Check if user still exists
      const currentUser = await User.findById(decoded.id);
      if (!currentUser) {
        return next();
      }

      // 3) Check if user changed password after the token was issued
      if (currentUser.changedPasswordAfter(decoded.iat)) {
        return next();
      }

      // THERE IS A LOGGED IN USER
      // this is how we make the logged in user accessible for the template
      // each and every pug template have access to res.locals
      res.locals.user = currentUser;
      return next();
    } catch (err) {
      return next();
    }
  }
  next();
};
