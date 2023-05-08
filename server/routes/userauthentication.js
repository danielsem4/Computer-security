const fs = require('fs');
const express = require('express');
const router = express.Router();
const con = require('../models/connection_create');
const allQueries = require('../models/queries');
const config = require('../config.json');

router.post('/', async function (req, res) {
  const { password, email } = req.body;

  //Checking if the user exists when he is trying to log in
  try {
    const userAuthentication = await allQueries.checkUserExists(email, con);
    if (!userAuthentication)
      return res
        .status(404)
        .send('Password or email are wrong! Please try again');

    //Getting the current time and the last time he tried to log in and checking if his block duration has ended
    const currentTime = new Date();
    const lastTimeLogin = await allQueries.lastTimeLogin(email, con);
    const timeDiff = (currentTime.getTime() - lastTimeLogin.getTime()) / 60000;
    const countLogins = await allQueries.countLogins(email, con);

    //If he is blocked
    if (countLogins && timeDiff < config.block_duration) {
      return res
        .status(400)
        .send('You have attempted too many times. Try again later!');
      //If the block duration has passed we reset the logins back to 0
    }
    if (countLogins && timeDiff > config.block_duration)
      await allQueries.resetLogins(email, con);

    //Checking if the user entered his real passsword
    const realPassword = await allQueries.findUserPassword(email, con);
    if (password !== realPassword) {
      await allQueries.updateLogins(email, con);
      //If his password is not correct we increment the logins to logins + 1
      const countLogins = await allQueries.countLogins(email, con);
      //If count logins is more or equals than 3 we need to update the last time he tried to enter and update time stamp
      if (countLogins) {
        //Updating the time oh his last try to log in
        await allQueries.updateTimeStamp(email, con);
        return res
          .status(400)
          .send('You have attempted too many times. Try again later!');
      }
      return res
        .status(400)
        .send('Password or email are wrong! Please try again');
    } else {
      await allQueries.resetLogins(email, con);
      res.status(200).send('Login succeeded');
    }
  } catch (error) {
    console.error(error);
    res.status(500).send(error);
  }
});

module.exports = router;
