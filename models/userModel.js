///user model for authentication and authorization

const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

// name, email, password, photo, passwordConfirm

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'A user must have a name'],
  },
  email: {
    type: String,
    required: [true, 'A user must have a name'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'Please provide a valid email address'],
  },
  password: {
    type: String,
    required: [true, 'A user must have a password'],
    minlength: 8,
    //we don't want the pswd show up in any output
    select: false,
  },
  //for the photo we give the path in the filesystem
  //that's why it is String
  photo: String,
  passwordConfirm: {
    type: String,
    required: [true, 'A user must have a passwordConfirm'],
    //custom validator function
    //we check if the current element is the same as the password
    //THIS only works on CREATE and SAVE!!!
    validate: {
      validator: function (el) {
        return el === this.password;
      },
      message: 'Passwords do not match',
    },
  },
});

userSchema.pre('save', async function (next) {
  //only run this if the password was actually changed
  if (!this.isModified('password')) return next();
  //we encrypt our password with bcryptjs
  //the 12 is basically the measure, how CPU intensive we let the encryption be
  this.password = await bcrypt.hash(this.password, 12);
  //we have to delete passwordConfirm
  //it is a required input, but is not required to persist in the database
  this.passwordConfirm = undefined;

  next();
});

//instance methood: a method that is available on all the instances
//we create it to compare the password against the password that the user types in
userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  //we cannot write this.password here, because we set the select in the password field to false
  return await bcrypt.compare(candidatePassword, userPassword);
};

//we create the User model
const User = mongoose.model('User', userSchema);

module.exports = User;