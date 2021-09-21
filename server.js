const mongoose = require('mongoose');
const dotenv = require('dotenv');

//Dotenv is a zero-dependency module
//that loads environment variables from a .env file into process.env

//config will read your .env file, parse the contents, assign it to process.env,
//and return an Object with a parsed key containing the loaded content or an error key if it failed.
dotenv.config({ path: './config.env' });

//all errors that occur in our sync code and not handled are called:
//UNCAUGHT EXCEPTIONS
//this has to go on top of the code, before any possible errors
//here we don't need server.close, because uncaught exceptions
//don't happen on the server
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION. PROCESS EXITS');
  console.log(err.name, err.message);
  process.exit(1);
});

//We have to put the app include after the dotenv config, because we use in that the environment variables
const app = require('./app');

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

//.catch((err) => console.error(`Error: ${err}`));

////////////////////////////////
//START SERVER

const port = process.env.PORT || 8000;
const server = app.listen(port, () => {
  console.log('listening on port 8000');
});

//Each time that there is an unhanled rejection (rejected Promise)
//somewhere in our app,
//the process object will emit an object, called:
//UNHANDLED REJECTION

//any promise rejection, that is not handled in the app
//e.g: bad database password
//will be handled here

process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION. PROCESS EXITS');
  // console.log(err);
  //we are shutting down gracefully with server.close
  //this will wait till the currently running requests are done
  server.close(() => process.exit(1));
});
