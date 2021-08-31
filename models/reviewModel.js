// review / rating / createdAt / ref to tour / ref to user
const mongoose = require('mongoose');
const Tour = require('./tourModel');

const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, 'Review can not be empty!'],
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: [true, 'Review must belong to a tour.'],
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Review must belong to a user'],
    },
  },
  //we want the virtuals to appear
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// 1 user can write only one review per tour
// each combination should be unique
reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

// statics are what we don't call on the instances
// but on all of the database records (I guess)
// we have to call this function in a middleware later
reviewSchema.statics.calcAverageRatings = async function (tourId) {
  //in static methods the this keyword points to the whole model
  const stats = await this.aggregate([
    // we select all the tours with the given tourId
    {
      $match: { tour: tourId },
    },
    // then we calculate the average
    // we group the reviews by tours
    {
      $group: {
        _id: '$tour',
        nRating: { $sum: 1 },
        // every review has a rating field
        avgRating: { $avg: '$rating' },
      },
    },
  ]);
  console.log(stats);
  // we update the tour's rating
  if (stats.length > 0) {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: stats[0].nRating,
      ratingsAverage: stats[0].avgRating,
    });
  } else {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: 0,
      ratingsAverage: 4.5,
    });
  }
};
// saving the averageRating at creation
// post saving, because before saving, the current review isn't in the collection yet
reviewSchema.post('save', function () {
  // this points to current review
  // this.constructor is the model who created the document
  // we have to call it this way, because calcAverageRatings is a static method
  // (we cannot call it on the instance)
  this.constructor.calcAverageRatings(this.tour);
});

//Avg Ratings at updates or deletes:
// (document - the elements of a collection)
// For these we don't have document middleware just query middleware:
// findByIdAndUpdate
// findByIdAndDelete
// (the 2 above are just a shorthand for findOneAnd... with the current ID)
// we can go around this with the findOne method
// during the pre, we already have access to the query

reviewSchema.pre(/^findOneAnd/, async function (next) {
  // Give back that review that we want to update
  // and save it to pass over to the next post middleware
  this.r = await this.findOne();
  console.log(this.r);
  next();
});

// we pass the data from the pre middleware to here
// we have no longer access to the query, but we saved the query result to the review
reviewSchema.post(/^findOneAnd/, async function () {
  // await this.findOne(); does NOT work here, query has already executed
  await this.r.constructor.calcAverageRatings(this.r.tour);
});

// the guides are referenced as a child so we populate (fill up the fields) them
// only in the query, not in the actual database
reviewSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'user',
    select: 'name photo',
  });

  next();
});

const Review = mongoose.model('Review', reviewSchema);
module.exports = Review;
