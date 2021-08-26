const mongoose = require('mongoose');
const slugify = require('slugify');
//validator.js npm package
const validator = require('validator');
//the User object only needed if we are embedding the users
//const User = require('./userModel');

//mongoose Schema
//mongoose works with native JS data types
const tourSchema = new mongoose.Schema(
  {
    //if we don't want options we can simply write: name:String
    name: {
      type: String,
      //validatot
      required: [true, 'A tour must have a name'],
      unique: true,
      trim: true,
      minlength: [5, 'A tour name must have at least 5 characters'],
      maxlength: [50, 'A tour name must have max 50 characters'],
      //validate: validator.isAlpha,
    },
    slug: String,
    ratingsAverage: {
      type: Number,
      default: 4.5,
      max: [5, 'A tour rating must be less than or equal to 5'],
      min: [1, 'A tour rating must be more than or equal to 1'],
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    duration: {
      type: Number,
      required: [true, 'A tour must have a duration'],
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a group size'],
    },
    difficulty: {
      type: String,
      required: [true, 'A tour must have a difficulty'],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'Not valid difficulty',
      },
    },
    price: {
      type: Number,
      required: [true, 'A tour must have a price'],
    },
    //the following validator only works on new documents
    //doesn't work on updates
    priceDiscount: {
      type: Number,
      //custom validator
      //should return either true or false
      validate: {
        validator: function (value) {
          //this only points to current document on NEW doc creation
          //doesn't work on updates
          return value < this.price;
        },
        message: 'Not valid priceDiscount: {VALUE}',
      },
    },
    summary: {
      type: String,
      trim: true,
      required: [true, 'A tour must have a summary'],
    },
    description: {
      type: String,
      trim: true,
    },
    imageCover: {
      type: String,
      required: [true, 'A tour must have a cover image'],
    },
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false,
    },
    startDates: [Date],
    secretTour: {
      type: Boolean,
      default: false,
    },
    // We keep the startLocation and the location(s) in the tours
    // because it is a few-few connection
    startLocation: {
      //   // MongoDB uses GeoJSON
      //   // MongoDB supports Geospatial data out of the box
      //   // Geospatial - longitude, latitude (this is the order - not like in Google Maps)
      //   // for Geospatial data we always need to have a type and a coordinate property
      //   // and the type should tell the type :)
      type: {
        type: String,
        default: 'Point',
        enum: ['Point'],
      },
      coordinates: [Number],
      address: String,
      description: String,
    },
    // // there can be more locations so we need an array
    locations: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point'],
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number,
      },
    ],
    // modelling Tour Guides with embedding:
    // we also use a pre.save middleware to retrieve the guides
    // guides: Array,
    //instead of this, we referencing the child
    guides: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
      },
    ],
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

//When a tourSchema document gets a request, than calculate the durationWeeks
//virtual variable
//virtuals cannot be part of a Query - bc they are not part of the database
tourSchema.virtual('durationWeek').get(function () {
  return this.duration / 7;
});

// VIRTUAL POPULATE
// in the Review model there is a parent reference to tours
// we can get the reviews that belong to the tour
// without child referencing the reviews
// (child referencing would be dangerous because the review array can grow huge)
tourSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'tour',
  localField: '_id',
});

///////////////////////////////////
//DOCUMENT MIDDLEWARES
//save = hook (runs before or after save() or create())
//the this keyword points to the document

tourSchema.pre('save', function (next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

// We reference all the guides for our tour here
// middleware to retrieve the EMBEDDED tour guides
// tourSchema.pre('save', async function (next) {
//   const guidesPromises = this.guides.map(async (id) => await User.findById(id));
//   this.guides = await Promise.all(guidesPromises);
//   next();
// });

tourSchema.post('save', (doc, next) => {
  console.log(doc);
  next();
});

///////////////////////////////////
//QUERY MIDDLEWARES
//the this keyword points to the QUERY

tourSchema.pre(/^find/, function (next) {
  this.find({ secretTour: { $ne: true } });
  this.start = Date.now();
  next();
});

// the guides are referenced as a child so we populate (fill up the fields) them
// only in the query, not in the actual database
tourSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'guides',
    select: '-__v -passwordChangedAt',
  });

  next();
});

tourSchema.post(/^find/, function (docs, next) {
  //console.log(docs);
  console.log(Date.now() - this.start);
  next();
});

///////////////////////////////////
//AGGREGATION MIDDLEWARES
//the this keyword points to the AGGREGATION
//pipeline() gives back the array that we create in the aggregation function

tourSchema.pre('aggregate', function (next) {
  this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
  next();
});

//name of the model, what Schema will we use in our model
//model is like a class in JS
const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
