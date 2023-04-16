const express = require('express');
const router = express.Router();
const allQueries = require('../models/queries');
const con = require('../models/connection_create');

router.delete('/', async function (req, res) {
  console.log(req.body);
  const { city, email, first_name, last_name, phone_number } = req.body;

  try {
    const deletedClient = await allQueries.removeClient(
      first_name,
      last_name,
      email,
      phone_number,
      city,
      con
    );
    if (deletedClient) res.status(200).send('Client removed successfully!');
    else res.status(400).send('Client is not found!');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error removing client!');
  }
});

module.exports = router;
