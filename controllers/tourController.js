const Tour = require('../models/tourModel');

exports.getAllTours = async (req, res) => {
  try {
    //BUILD THE QUERY
    //we create a copy of the req.query
    const queryObj = { ...req.query };
    const excludedFields = ['page', 'sort', 'limit', 'fields'];
    //we delete all the properties from the query object
    //that are not related to filtering
    excludedFields.forEach((el) => delete queryObj[el]);

    //Tour.find() returns a query object
    //if we await it, it comes back with all the data that match our query
    //we cannot implement sorting, or pagination on the matches
    //we can do it only on the Query object
    //that's why we save the query object for later
    const query = Tour.find(queryObj);

    //EXECUTE QUERY
    const tours = await query;

    //filtering with MongoDB filter options
    // const tours = await Tour.find({
    //   duration: 5,
    //   difficulty: 'easy',
    // });

    //FILTERING WITH EXPRESS METHODS
    // const tours = await Tour.find()
    //   .where('duration')
    //   .equals(5)
    //   .where('difficulty')
    //   .equals('easy');
    //SEND RESPONSE
    res.status(200).json({
      status: 200,
      results: tours.length,
      data: {
        tours: tours,
      },
    });
  } catch (error) {
    res.status(404).json({
      status: 'fail',
      message: error.message,
    });
  }
};

exports.getOneTour = async (req, res) => {
  try {
    const tour = await Tour.findById(req.params.id);
    res.status(200).json({
      status: 200,
      data: {
        tour,
      },
    });
  } catch (error) {
    res.status(404).json({
      status: 'fail',
      message: error.message,
    });
  }
};

exports.postTour = async (req, res) => {
  try {
    const newTour = await Tour.create(req.body);
    res.status(201).json({
      status: 'success',
      data: {
        tour: newTour,
      },
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: 'Invalid data sent',
    });
  }
};

exports.deleteOneTour = async (req, res) => {
  try {
    await Tour.findByIdAndDelete(req.params.id);
    res.status(204).json({
      status: 'success',
      data: null,
    });
  } catch (error) {
    res.status(400).json({
      status: 'fail',
      message: 'Invalid data sent',
    });
  }
};

exports.updateTour = async (req, res) => {
  try {
    console.log(req.body);
    const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    res.status(200).json({
      status: 'success',
      data: {
        tour,
      },
    });
  } catch (error) {
    res.status(404).json({
      status: 'fail',
      message: error.message,
    });
  }
};
