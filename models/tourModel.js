const mongoose = require('mongoose');

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

module.exports = Tour;
