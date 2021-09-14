const multer = require('multer');
const sharp = require('sharp');
const Tour = require('../models/tourModel');
const APIfeatures = require('../utils/apiFeatures');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const factory = require('./handlerFactory');

// UPLOAD multiple images for tours - imageCover and 3 images for the details page
// see comments for multer in the userController file
// we store the images in the memoryand allow only image mimetype
const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Not an image! Please upload only images.', 400), false);
  }
};

// we create a multer upload using the memory storage and the filter
const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

// when we upload multiple images with a different 'name', then we use upload.fields => req.files
// when multiple files, but just one name => upload.array => req.files
// one file => upload.single => req.file
// req.files will have a buffer property which is a reference to the memory
exports.uploadTourImages = upload.fields([
  { name: 'imageCover', maxCount: 1 },
  { name: 'images', maxCount: 3 },
]);

exports.resizeTourImages = catchAsync(async (req, res, next) => {
  console.log(req.files);
  if (!req.files.imageCover || !req.files.images) return next();

  // 1) Cover image
  // we have to save it to the req.body, bc the updateOne handler will use that one
  req.body.imageCover = `tour-${req.params.id}-${Date.now()}-cover.jpeg`;
  await sharp(req.files.imageCover[0].buffer)
    .resize(2000, 1333)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/tours/${req.body.imageCover}`);

  // 2) Images
  // we have to save it to the req.body, bc the updateOne handler will use that one

  req.body.images = [];
  // the loop returns 3 promises. We have to await all 3, before next()
  // otherwise req.body will not contain all the proper sized images
  // we have to use map bc it returns a new array (szerintem)
  await Promise.all(
    req.files.images.map(async (file, i) => {
      const filename = `tour-${req.params.id}-${Date.now()}-${i + 1}.jpeg`;

      await sharp(file.buffer)
        .resize(2000, 1333)
        .toFormat('jpeg')
        .jpeg({ quality: 90 })
        .toFile(`public/img/tours/${filename}`);

      req.body.images.push(filename);
    })
  );

  next();
});

exports.aliasForTours = (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = '-averageRating,price';
  req.query.fields = 'name,price,duration,description';

  next();
};

exports.getAllTours = factory.getAll(Tour);
exports.getOneTour = factory.getOne(Tour, { path: 'reviews' });
exports.postTour = factory.createOne(Tour);
exports.deleteOneTour = factory.deleteOne(Tour);
exports.updateTour = factory.updateOne(Tour);

// exports.getAllTours = catchAsync(async (req, res, next) => {
//   const features = new APIfeatures(Tour.find(), req.query)
//     .filter()
//     .sort()
//     .limit()
//     .pagination();
//   const tours = await features.query;

//   //SEND RESPONSE
//   res.status(200).json({
//     status: 200,
//     results: tours.length,
//     data: {
//       tours: tours,
//     },
//   });
// });

// exports.getOneTour = catchAsync(async (req, res, next) => {
//   const tour = await Tour.findById(req.params.id).populate('reviews');
//   if (!tour) {
//     return next(new AppError('No tour found', 404));
//   }
//   res.status(200).json({
//     status: 200,
//     data: {
//       tour,
//     },
//   });
// });

// exports.postTour = catchAsync(async (req, res, next) => {
//   const newTour = await Tour.create(req.body);
//   res.status(201).json({
//     status: 'success',
//     data: {
//       tour: newTour,
//     },
//   });
// });

// exports.deleteOneTour = catchAsync(async (req, res, next) => {
//   const tour = await Tour.findByIdAndDelete(req.params.id);
//   if (!tour) {
//     return next(new AppError('No tour found', 404));
//   }
//   res.status(204).json({
//     status: 'success',
//     data: null,
//   });
// });

// exports.updateTour = catchAsync(async (req, res, next) => {
//   //console.log(req.body);
//   const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
//     new: true,
//     runValidators: true,
//   });
//   if (!tour) {
//     return next(new AppError('No tour found', 404));
//   }
//   res.status(200).json({
//     status: 'success',
//     data: {
//       tour,
//     },
//   });
// });

exports.getTourStats = catchAsync(async (req, res, next) => {
  const stats = await Tour.aggregate([
    { $match: { ratingsAverage: { $gte: 4.5 } } },
    {
      $group: {
        _id: { $toUpper: '$difficulty' },
        numTours: { $sum: 1 },
        numRatings: { $sum: '$ratingsQuantity' },
        avgRating: { $avg: '$ratingsAverage' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' },
      },
    },
    { $sort: { avgPrice: 1 } },
    //{ $match: { _id: { $ne: 'EASY' } } },
  ]);
  res.status(200).json({
    status: 'success',
    data: {
      stats,
    },
  });
});

exports.getTourPlan = catchAsync(async (req, res, next) => {
  const year = req.params.year * 1;

  const plan = await Tour.aggregate([
    {
      $unwind: '$startDates',
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`),
        },
      },
    },
    {
      $group: {
        _id: { $month: '$startDates' },
        numOfTours: { $sum: 1 },
        tours: { $push: '$name' },
      },
    },
    {
      $addFields: { month: '$_id' },
    },
    {
      $project: { _id: 0 },
    },
    {
      $sort: {
        numOfTours: -1,
      },
    },
  ]);
  res.status(200).json({
    status: 'success',
    data: {
      plan,
    },
  });
});

// This is how the data for the following looks like
// /tours-within/:distance/center/:latlng/unit/:unit
// /tours-within/233/center/34.111745,-118.113491/unit/mi
exports.getToursWithin = catchAsync(async (req, res, next) => {
  const { distance, latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');

  const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;

  if (!lat || !lng) {
    next(
      new AppError(
        'Please provide latitutr and longitude in the format lat,lng.',
        400
      )
    );
  }

  const tours = await Tour.find({
    // geoWithin and centerSphere are built-in geospatial operators
    // here first is longitude!!!
    // for geospatial queries we need to have index on the queried field (here startLocation)
    startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } },
  });

  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: {
      data: tours,
    },
  });
});

exports.getDistances = catchAsync(async (req, res, next) => {
  const { latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');

  const multiplier = unit === 'mi' ? 0.000621371 : 0.001;

  if (!lat || !lng) {
    next(
      new AppError(
        'Please provide latitutde and longitude in the format lat,lng.',
        400
      )
    );
  }
  // in order to do calculations we always use the aggregation pipeline
  const distances = await Tour.aggregate([
    {
      //geoNear should be always the first stage
      //geoNear requires that at least one of our fields contains a geoSpatial index
      // if there is only one field with geoSpatial index, then it will automatically use that one for the calculations
      $geoNear: {
        //we will calculate the distace between this near and our latlng
        near: {
          type: 'Point',
          //GeoJSON - first is longitude
          coordinates: [lng * 1, lat * 1],
        },
        //built-in properties (??)
        //this field will be created and where all the calculated values will be stored
        distanceField: 'distance',
        //this will be contain the multiplier
        distanceMultiplier: multiplier,
      },
    },
    //what data want to we show => project
    {
      $project: {
        distance: 1,
        name: 1,
      },
    },
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      data: distances,
    },
  });
});
