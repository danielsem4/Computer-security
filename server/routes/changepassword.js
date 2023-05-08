const express = require('express');
const router = express.Router();
const allQueries = require('../models/queries');
const con = require('../models/connection_create');
const security = require('../security/securityFunctions');

router.post('/', async function (req, res) {
  const { email, old_password, new_password, verification_password } = req.body;

  //Checking if the new password equals to the verification password
  if (new_password !== verification_password)
    return res
      .status(400)
      .send('The password and the verification password do not match');
  else if (new_password === old_password)
    return res.status(400).send('Please enter a password you never used');

  const updatedPassword = allQueries.updatePassword(
    email,
    old_password,
    new_password,
    con
  );

  if (!updatedPassword) return res.status(400).send('Error changing password!');

  return res.status(200).send('Password changed succesfully!');
});

module.exports = router;
