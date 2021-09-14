const nodemailer = require('nodemailer');
const pug = require('pug');
const { htmlToText } = require('html-to-text');

module.exports = class Email {
  constructor(user, url) {
    this.to = user.email;
    this.firstName = user.name.split(' ')[0];
    this.url = url;
    this.from = `Jonas Schmedtmann <${process.env.EMAIL_FROM}>`;
  }

  newTransport() {
    if (process.env.NODE_ENV === 'production') {
      return nodemailer.createTransport({
        // Sendgrid is a predefined service, so we can put it here like this
        // that's why we don't need to specify the server or the port
        service: 'Sendgrid',
        auth: {
          user: process.env.SENDGRID_USERNAME,
          pass: process.env.SENDGRID_PASSWORD,
        },
      });
    }
    // our transporter will be Mailtrap if we are not in production
    // Mailtrap - Capture SMTP traffic from staging and dev environments

    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
    //GMAIL - but it is not a good production idea
    //    return nodemailer.createTransport({
    //     service: 'Gmail',
    //     auth: {
    //       user: process.env.EMAIL_USERNAME,
    //       pass: process.env.EMAIL_PASSWORD,
    //     });
    //Activate in gmail "less secure app" option
  }

  // send the actual email
  async send(template, subject) {
    // 1) Render HTML based on a pug template
    // we are not rendering it, just creating the HTML that we are going to send as an email
    // pug.renderFile will render the HTML from a pug template
    const html = pug.renderFile(`${__dirname}/../views/email/${template}.pug`, {
      firstName: this.firstName,
      url: this.url,
      subject,
    });
    // 2) Define mail options
    const mailOptions = {
      from:
        process.env.NODE_ENV === 'production'
          ? process.env.SENDGRID_EMAIL_FROM
          : this.from,
      to: this.to,
      subject,
      html,
      // we need a text field to better email delivery rates, to avoid spam folders and fo those who prefer plain text emails
      text: htmlToText(html),
    };
    // 3) Create the transport and send email
    await this.newTransport().sendMail(mailOptions);
  }

  async sendWelcome() {
    await this.send('welcome', 'Welcome to the Natours family');
  }

  async sendPasswordReset() {
    await this.send(
      'passwordReset',
      'Your password reset token (valid for only 10 minutes'
    );
  }
};
