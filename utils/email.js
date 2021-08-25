const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  // 1) Create a transporter

  //GMAIL - but it is not a good production idea
  //   const transporter = nodemailer.createTransport({
  //     service: 'Gmail',
  //     auth: {
  //       user: process.env.EMAIL_USERNAME,
  //       pass: process.env.EMAIL_PASSWORD,
  //     });
  //Activate in gmail "less secure app" option

  //Mailtrap - Capture SMTP traffic from staging and dev environments
  //

  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  // 2) Define options for the email
  const mailOptions = {
    from: 'Brigi Horvath <3@gmail.com>',
    to: options.email,
    subject: options.subject,
    text: options.message,
  };
  // 3) Send the email
  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
