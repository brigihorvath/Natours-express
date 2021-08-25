const fs = require('fs');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Tour = require('../../models/tourModel');

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
    console.log('DB connection succesful');
  });

//READ JSON file

const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours.json`, 'utf8'));

//IMPORT DATA INTO DATABASE

const importData = async () => {
  try {
    //create the tours collection with the tours array elements as documents
    await Tour.create(tours);
    console.log('Data succesfully loaded');
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
    console.log('Data succesfully deleted');
  } catch (error) {
    console.log(error);
  }
  process.exit();
};

//if we type flags in the terminal after our node command that runs this file, we can command node to import or delete data
if (process.argv[2] === '--import') {
  importData();
} else if (process.argv[2] === '--delete') {
  deleteData();
}
