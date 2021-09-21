const fs = require('fs');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Tour = require('../../models/tourModel');
const Review = require('../../models/reviewModel');
const User = require('../../models/userModel');

dotenv.config({ path: './config.env' });

const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);
mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
  })
  .then(() => {
    // console.log('DB connection succesful');
  });

//READ JSON file

const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours.json`, 'utf8'));
const users = JSON.parse(fs.readFileSync(`${__dirname}/users.json`, 'utf-8'));
const reviews = JSON.parse(
  fs.readFileSync(`${__dirname}/reviews.json`, 'utf-8')
);

//IMPORT DATA INTO DATABASE

const importData = async () => {
  try {
    // create the tours collection with the tours array elements as documents
    await Tour.create(tours);
    // during importing the data from a JSON, we should switch off the password encryption!
    // we turn off the user validation, otherwise during the import it will ask for passwordConfirm
    //the pswd in the test users file is always test1234
    await User.create(users, { validateBeforeSave: false });
    await Review.create(reviews);
    // console.log('Data succesfully loaded');
  } catch (error) {
    console.log(error);
  }
  process.exit();
};

//DELETE ALL DATA FROM FeatureCollection
const deleteData = async () => {
  try {
    //delete all the documents from the tours collection
    await Tour.deleteMany();
    await User.deleteMany();
    await Review.deleteMany();
    // console.log('Data succesfully deleted');
  } catch (error) {
    console.log(error);
  }
  process.exit();
};

// these are needed for commanding the app to import or delete dev data
// from the command line
// if we type flags in the terminal after our node command that runs this file, we can command node to import or delete data
// node ./dev-data/data/import-dev-data.js  --delete or --import

if (process.argv[2] === '--import') {
  importData();
} else if (process.argv[2] === '--delete') {
  deleteData();
}
