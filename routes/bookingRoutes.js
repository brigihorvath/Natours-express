const express = require('express');
const bookingController = require('../controllers/bookingController');
const authController = require('../controllers/authController');

// mergeParams: true - to get acces to the parameters of other routes
const router = express.Router();

module.exports = router;
