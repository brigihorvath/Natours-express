const fs = require('fs');

const tours = JSON.parse(
  fs.readFileSync(`${__dirname}/../dev-data/data/tours-simple.json`)
);

exports.checkID = (req, res, next, value) => {
  if (value > tours.length) {
    return res.status(404).json({
      status: 'fail',
      message: 'Invalid id',
    });
  }
  next();
};

exports.getAllTours = (req, res) => {
  console.log(req.requestTime);
  res.status(200).json({
    status: 200,
    requestedAt: req.requestTime,
    results: tours.length,
    data: {
      tours: tours,
    },
  });
};

exports.getOneTour = (req, res) => {
  //req.params get access to the parameter of the request and gives back it as an Object
  //eg: {id: '5'}
  // optional parameter: /:id?
  // the id contains a String value, so we have to transform it into a number
  console.log('getOneTour');
  const id = req.params.id * 1;
  const tour = tours.find((el) => el.id === id);
  res.status(200).json({
    status: 200,
    data: {
      tour,
    },
  });
};

exports.postTour = (req, res) => {
  //we can access req.body because of the middleware
  console.log(req.body);
  //New id for the object
  const newID = tours[tours.length - 1].id + 1;
  //merging the id with the request
  const newTour = Object.assign({ id: newID }, req.body);
  //push the new tour to the tours array
  tours.push(newTour);
  //overwrite the original file
  fs.writeFile(
    `${__dirname}/dev-data/data/tours-simple.json`,
    JSON.stringify(tours),
    //send back the posted tour as a response
    (err) => {
      res.status(201).json({
        status: 'success',
        data: {
          tour: newTour,
        },
      });
    }
  );
};

exports.checkReqBody = (req, res, next) => {
  if (!req.body.name || !req.body.duration) {
    return res.status(400).json({
      status: 'fail',
      message: 'No name in the body',
    });
  }
  next();
};

exports.deleteOneTour = (req, res) => {
  res.status(204).json({
    status: 'success',
    data: null,
  });
};
