//we use the promisify function from the built-in util module
const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

//we create the JWT token
//1. payload
//2. secret
//3. expiration
const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

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

  //JWT token
  const token = signToken(newUser._id);
  //console.log(token);

  res.status(201).json({
    status: 'success',
    token,
    data: {
      user: newUser,
    },
  });
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
  const token = signToken(user._id);
  //console.log(token);
  res.status(200).json({ status: 'success', token });
});

exports.protect = catchAsync(async (req, res, next) => {
  // 1) Getting token and checking if it's there
  // We get the token in the HTTP headers
  // It is in the Authorization header usually
  // it starts with Bearer
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }
  console.log(token);

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
  req.user = currentUser;
  next();
});
