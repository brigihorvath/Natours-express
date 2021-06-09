const express = require('express');
const tourController = require('../controllers/tourController');
const router = express.Router();

router.param('id', tourController.checkID);
router
  .route('/')
  .get(tourController.getAllTours)
  .post(tourController.checkReqBody, tourController.postTour);
router
  .route('/:id')
  .get(tourController.getOneTour)
  .delete(tourController.deleteOneTour);

module.exports = router;
