const express = require('express');
const tourController = require('../controllers/tourController');
const authController = require('../controllers/authController');
const reviewRouter = require('./reviewRoutes');

const router = express.Router();

// router
//   .route('/:tourId/reviews')
//   .post(
//     authController.protect,
//     authController.restrictTo('user'),
//     reviewController.createReview
//   );

// Instead of creating a route for reviews here in the tourRoutes
// we redirect it to the reviewRouter (it will match the / route)
router.use('/:tourId/reviews', reviewRouter);

// router.param('id', tourController.checkID);
router.route('/statistics').get(tourController.getTourStats);
router
  .route('/plan/:year')
  .get(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide', 'guide'),
    tourController.getTourPlan
  );
router
  .route('/top-5-tours')
  .get(tourController.aliasForTours, tourController.getAllTours);

router
  .route('/tours-within/:distance/center/:latlng/unit/:unit')
  .get(tourController.getToursWithin);
// /tours-within?distance=233&center=-40,45&unit=mi
// /tours-within/233/center/-40,45/unit/mi

// calculate the distance from the tour
router.route('/distances/:latlng/unit/:unit').get(tourController.getDistances);

router
  .route('/')
  //before running the getAllTours handler
  //we need to verify that the user is logged in
  //.get(authController.protect, tourController.getAllTours)
  //but if we want to expose this part of the API to everyone
  .get(tourController.getAllTours)
  //but the post route still should be protected
  .post(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.postTour
  );
router
  .route('/:id')
  .get(tourController.getOneTour)
  .patch(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.uploadTourImages,
    tourController.resizeTourImages,
    tourController.updateTour
  )
  .delete(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.deleteOneTour
  );

module.exports = router;
