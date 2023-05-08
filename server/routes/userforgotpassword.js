const express = require('express');
require('dotenv').config();
const router = express.Router();
const sha1 = require('sha1');
const con = require('../models/connection_create');
const nodemailer = require('nodemailer');
const allQueries = require('../models/queries');
const security = require('../security/securityFunctions');

//We created an email in order to send a confirmation email to the user
const transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: process.env.EMAIL,
    pass: process.env.EMAIL_PASSWORD,
  },
});

const sendConfirmationEmail = (email, hashedValue) => {
  transporter
    .sendMail({
      from: process.env.EMAIL,
      to: email,
      subject: 'Please confirm your account',
      html: `<h1>Confirmation Code</h1>
              <p>Please type the code in the website</p>
              <p>${hashedValue}</p>
              </div>`,
    })
    .catch((err) => console.log(err));
};

router.post('/', async function (req, res) {
  const code = Math.floor(Math.random() * 1000000);
  const hashedValue = sha1(code);
  const { email } = req.body;

  const userExists = await allQueries.checkUserExists(email, con);

  if (userExists) {
    sendConfirmationEmail(email, hashedValue);
    return res.status(200).send('Sent the code check the email please');
  }
  return res.status(404).send('Error user does not exist!');
});

module.exports = router;
