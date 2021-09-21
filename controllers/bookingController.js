// stripe gives back a function and into that we give in instantly our secret key
// this way we will get an object
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Tour = require('../models/tourModel');
const Booking = require('../models/bookingModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const factory = require('./handlerFactory');

exports.getCheckoutSession = catchAsync(async (req, res, next) => {
  //console.log('getCheckoutSession bookingController');
  //1) Get the currently booked your
  const tour = await Tour.findById(req.params.tourId);
  // console.log(tour.imageCover);
  // 2) Create checkout session
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    // the URL that will get called as soon as our credit card is charged
    // we have to create a noew booking in the database at this point
    // when the website will be deployed, we will have access to a session object through stripe hooks
    // for the development purposes now, we use a workaround
    // we put the data (for now) that we need in a query string
    // it is not safe, do not use in production
    success_url: `${req.protocol}://${req.get('host')}/?tour=${
      req.params.tourId
    }&user=${req.user.id}&price=${tour.price}`,
    cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
    // it is a protected route, so the user is already in the request
    customer_email: req.user.email,
    // to create a new booking we need the client reference
    client_reference_id: req.params.tourId,
    // details about the product itself
    line_items: [
      {
        // the field names are coming from stripe
        name: `${tour.name} Tour`,
        description: tour.summary,
        //the images should be live images from a deployed website
        images: [`https://www.natours.dev/img/tours/${tour.imageCover}`],
        // the amount should be in cents
        amount: tour.price * 100,
        currency: 'usd',
        quantity: 1,
      },
    ],
  });
  // console.log('bookingContr 39');

  // 3) Create session as response
  res.status(200).json({
    status: 'success',
    session,
  });
});

// we are creating the booking document when the user hits the / route
exports.createBookingCheckout = catchAsync(async (req, res, next) => {
  // This is only TEMPORARY, because it's UNSECURE: everyone can make bookings without paying
  // these are in the query string of the success url
  const { tour, user, price } = req.query;

  if (!tour && !user && !price) return next();
  await Booking.create({ tour, user, price });
  // we redirect the user to the same route but without the query string
  res.redirect(req.originalUrl.split('?')[0]);
});

exports.createBooking = factory.createOne(Booking);
exports.getBooking = factory.getOne(Booking);
exports.getAllBookings = factory.getAll(Booking);
exports.updateBooking = factory.updateOne(Booking);
exports.deleteBooking = factory.deleteOne(Booking);
