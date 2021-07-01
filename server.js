const mongoose = require('mongoose');
const dotenv = require('dotenv');

//Dotenv is a zero-dependency module
//that loads environment variables from a .env file into process.env

//config will read your .env file, parse the contents, assign it to process.env,
//and return an Object with a parsed key containing the loaded content or an error key if it failed.
dotenv.config({ path: './config.env' });
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

////////////////////////////////
//START SERVER

const port = process.env.PORT || 8000;
app.listen(port, () => {
  console.log('listening on port 8000');
});
