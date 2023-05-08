const express = require('express');
const router = express.Router();
const allQueries = require('../models/queries');
const con = require('../models/connection_create');
const security = require('../security/securityFunctions');

router.post('/', async function (req, res) {
  // const { city, email, first_name, last_name, phone_number } = req.body;

  if (!security.isValidEmail(email))
    return res.status(400).send('The email is not valid');
  if (!security.checkPhone(phone_number))
    return res.status(400).send('The phone number is not valid');

  //Adding a client to the database
  try {
    const clientInserted = await allQueries.insertClient(
      email,
      first_name,
      last_name,
      phone_number,
      city,
      con
    );
    if (!clientInserted) return res.status(400).send('Client already exists!');
    return res.status(200).send('Client inserted successfully!');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error adding client!');
  }
});

module.exports = router;
