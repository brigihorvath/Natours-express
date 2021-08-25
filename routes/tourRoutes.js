const express = require('express');
const tourController = require('../controllers/tourController');
const authController = require('../controllers/authController');

const router = express.Router();

// router.param('id', tourController.checkID);
router.route('/statistics').get(tourController.getTourStats);
router.route('/plan/:year').get(tourController.getTourPlan);
router
  .route('/top-5-tours')
  .get(tourController.aliasForTours, tourController.getAllTours);
router
  .route('/')
  //before running the getAllTours handler
  //we need to verify that the user is logged in
  .get(authController.protect, tourController.getAllTours)
  .post(tourController.postTour);
router
  .route('/:id')
  .get(tourController.getOneTour)
  .patch(tourController.updateTour)
  .delete(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.deleteOneTour
  );

module.exports = router;
