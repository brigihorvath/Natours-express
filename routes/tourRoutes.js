const express = require('express');
const tourController = require('../controllers/tourController');

const router = express.Router();

// router.param('id', tourController.checkID);
router.route('/statistics').get(tourController.getTourStats);
router.route('/plan/:year').get(tourController.getTourPlan);
router
  .route('/top-5-tours')
  .get(tourController.aliasForTours, tourController.getAllTours);
router.route('/').get(tourController.getAllTours).post(tourController.postTour);
router
  .route('/:id')
  .get(tourController.getOneTour)
  .patch(tourController.updateTour)
  .delete(tourController.deleteOneTour);

module.exports = router;
