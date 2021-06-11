const mongoose = require('mongoose');
const dotenv = require('dotenv');
const app = require('./app');

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
  .then((con) => {
    console.log('DB connection succesful');
  });

//mongoose Schema
//mongoose works with native JS data types
const tourSchema = new mongoose.Schema({
  //if we don't want options we can simply write: name:String
  name: {
    type: String,
    //validatot
    required: [true, 'A tour must have a name'],
    unique: true,
  },
  rating: {
    type: Number,
    default: 4.5,
  },
  price: {
    type: Number,
    required: [true, 'A tour must have a price'],
  },
});

//name of the model, what Schema will we use in our model
//model is like a class in JS
const Tour = mongoose.model('Tour', tourSchema);

//we create a document to our tours collection
const testTour = new Tour({
  name: 'The Forest Hiker',
  rating: 4.7,
  price: 297,
});

//now we can have a lot of methods on our Tour instance (document)
testTour
  .save()
  .then((doc) => console.log(doc))
  .catch((err) => {
    console.log('Error:', err);
  });

////////////////////////////////
//START SERVER

const port = process.env.PORT || 8000;
app.listen(port, function () {
  console.log('listening on port 8000');
});
