const express = require('express');
const bookingController = require('../controllers/bookingController');
const authController = require('../controllers/authController');

// mergeParams: true - to get acces to the parameters of other routes
const router = express.Router();

router.use(authController.protect);

// to register a checkout session with Stripe
// the user will send along the tour ID
router.get('/checkout-session/:tourId', bookingController.getCheckoutSession);

router.use(authController.restrictTo('admin', 'lead-guide'));

router
  .route('/')
  .get(bookingController.getAllBookings)
  .post(bookingController.createBooking);

router
  .route('/:id')
  .get(bookingController.getBooking)
  .patch(bookingController.updateBooking)
  .delete(bookingController.deleteBooking);

module.exports = router;
