const express = require('express');
const router = express.Router();
const allQueries = require('../models/queries');
const con = require('../models/connection_create');
const security = require('../security/securityFunctions');

router.post('/', async function (req, res) {
  try {
    const { email, currentPassword, newPassword, confirmNewPassword } =
      req.body;
    const old_password = currentPassword;
    const new_password = newPassword;
    const verification_password = confirmNewPassword;
    console.log({ currentPassword });

    //Checking if the new password equals to the verification password
    if (new_password !== verification_password)
      return res
        .status(400)
        .send('The password and the verification password do not match');
    if (new_password === old_password)
      return res.status(400).send('Please enter a password you never used');

    const { success, message } = await allQueries.updatePassword(
      email,
      new_password,
      con
    );

    if (!success) return res.status(400).send(message);

    return res.status(200).send('Password changed succesfully!');
  } catch (error) {
    console.log(error);
    return res.status(500).send('Error in back end');
  }
});

module.exports = router;
