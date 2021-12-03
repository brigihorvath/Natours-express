//Catching errors in async functions

//Wrapper that puts a .catch() method after a Promise

//our catchAsync function will get an async function as an argument
//it will run the function
//the async function will return a Promise, so we can attach a .catch() method
//where we tell it to handle the error with the Global error handling middleware
//express knows it automatically because something is passed into the next function

//we have to return a function, not to call a function!!!!
module.exports = (fn) => (req, res, next) =>
  fn(req, res, next).catch((err) => next(err));
// ===> equals to .catch(next)

///it would be the same if we wrote: catch(next)

//so this all simply means that we wrap our async controller functions
//in another function and chain catch to them
//and inside catch we send it forward to the
//global error handler middleware
