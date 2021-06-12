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

const tours = JSON.parse(
  fs.readFileSync(`${__dirname}/tours-simple.json`, 'utf8')
);

//IMPORT DATA INTO DATABASE

const importData = async () => {
  try {
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
    await Tour.deleteMany();
    console.log('Data succesfully deleted');
  } catch (error) {
    console.log(error);
  }
  process.exit();
};

if (process.argv[2] === '--import') {
  importData();
} else if (process.argv[2] === '--delete') {
  deleteData();
}
