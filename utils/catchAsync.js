//Catching errors in async functions
//our catchAsync function will get an async function as an argument
//it will run the function
//the async function will return a Promise, so we can attach a .catch() method
//where we tell it to handle the error with the Global error handling middleware
//express knows it automatically because something is passed into the next function
module.exports = (fn) => (req, res, next) =>
  fn(req, res, next).catch((err) => next(err));

///it would be the same if we wrote: catch(next)

//so this all simply means that we wrap our async controller functions
//in another function and chain catch to them
//and inside catch we send it forward to the
//global error handler middleware
