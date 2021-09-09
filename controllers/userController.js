const multer = require('multer');
const sharp = require('sharp');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const factory = require('./handlerFactory');

// we create a storage for the uploaded files
// and we define how we want to store our files
// const multerStorage = multer.diskStorage({
//   // 1 param = err, 2. file, 3. callback
//   destination: (req, file, cb) => {
//     cb(null, 'public/img/users');
//   },
//   filename: (req, file, cb) => {
//     // mimetype example: image/jpeg
//     const ext = file.mimetype.split('/')[1];
//     cb(null, `user-${req.user.id}-${Date.now()}.${ext}`);
//   },
// });

// bc we need to format the file first, we should save it in the memory buffer
// the image will be available on req.file.buffer
const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Not an image! Please upload only images.', 400), false);
  }
};

// npm multer is a package that allows the users to upload multipart form-data
// where we would store the uploaded images
// const upload = multer({ dest: 'public/img/users' });

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

exports.uploadUserPhoto = upload.single('photo');

// we expect a square image to be uploaded
// we have to format it, when it is not square
// we use npm sharp package for that
exports.resizeUserPhoto = catchAsync(async (req, res, next) => {
  // if there was no photo uploaded, go to the next middleware
  if (!req.file) return next();

  // we have to set the req.file.filename here, bc later we rely on that
  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;

  // for image processing we should save the image to the memory
  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/users/${req.file.filename}`);

  next();
});

exports.getUser = factory.getOne(User);
exports.getAllUsers = factory.getAll(User);

//DO NOT UPDATE PASSWORDS with THIS!
exports.updateUser = factory.updateOne(User);
exports.deleteUser = factory.deleteOne(User);

// loops through the body object and creates a new one with the allowed fields
const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

// a /me endpoint
// where the user can retrieve data about themselves
// this will be a small middleware before the getOne factory method
// so we set the req.params.id to the user.id

exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  console.log(req.params.id, 'userController29');
  next();
};

exports.updateMe = catchAsync(async (req, res, next) => {
  console.log(req.file);
  // 1) Create error if user POSTs password data
  // this is not the place to update the password
  // just the data about the user
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        'This route is not for password updates. Please use /updatePassword.',
        400
      )
    );
  }

  // 2) Filtered out unwanted fields names that are not allowed to be updated
  // f.ex we don't want to user to update the role
  const filteredBody = filterObj(req.body, 'name', 'email');
  if (req.file) filteredBody.photo = req.file.filename;

  // 3) Update user document
  // here we cannot use the user.save() method, because the passwordConfirm is a required field
  // and for every create OR save it is needed (???)
  //for not so sensible data, we can use findByID
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser,
    },
  });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });

  res.status(204).json({
    status: 'success',
    data: null,
  });
});

exports.createUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not defined! Please use /signup instead',
  });
};

// exports.getAllUsers = catchAsync(async (req, res, next) => {
//   const users = await User.find();

//   res.status(200).json({
//     status: 'success',
//     results: users.length,
//     data: {
//       users,
//     },
//   });
// });

// exports.getUser = (req, res) => {
//   res.status(500).json({
//     status: 'error',
//     message: 'This route is not yet implemented',
//   });
// };
