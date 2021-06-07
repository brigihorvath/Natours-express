const fs = require('fs');
const express = require('express');

const app = express();
app.use(express.json());

//Creating our own middleware
app.use((req, res, next) => {
  console.log('Hello from the middleware');
  //never forget to use next
  next();
});

app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

const tours = JSON.parse(
  fs.readFileSync(`${__dirname}/dev-data/data/tours-simple.json`)
);

const getAllTours = (req, res) => {
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

const getOneTour = (req, res) => {
  //req.params get access to the parameter of the request and gives back it as an Object
  //eg: {id: '5'}
  // optional parameter: /:id?
  // the id contains a String value, so we have to transform it into a number
  const id = req.params.id * 1;
  //User input validation
  if (id > tours.length) {
    return res.status(404).json({
      status: 'fail',
      message: 'Invalid id',
    });
  }
  const tour = tours.find((el) => el.id === id);
  res.status(200).json({
    status: 200,
    data: {
      tour,
    },
  });
};
const postTour = (req, res) => {
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

const deleteOneTour = (req, res) => {
  const id = req.params.id * 1;
  if (id > tours.length) {
    return res.status(404).json({
      status: 'fail',
      message: 'Invalid id',
    });
  }

  res.status(204).json({
    status: 'success',
    data: null,
  });
};
app.route('/api/v1/tours').get(getAllTours).post(postTour);
app.route('/api/v1/tours/:id').get(getOneTour).delete(deleteOneTour);

const port = 3000;
app.listen(port, function () {
  console.log('listening on port 3000');
});
