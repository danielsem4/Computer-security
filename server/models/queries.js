const fs = require('fs');
const config = JSON.parse(fs.readFileSync('config.json'));

//Checking if email exists in users schema
const checkUserMail = (mail, con) => {
  return new Promise(async (resolve, reject) => {
    await con.query(
      `SELECT * FROM users_details WHERE email = ${mail}`,
      (err, result) => {
        if (err) reject(err);
        else if (result.length > 0) {
          console.log('Email found!!');
          resolve(true);
        } else {
          console.log('Email not found');
          resolve(false);
        }
      }
    );
  });
};

//Checking if email exists in clients schema
const checkClientMail = (mail, con) => {
  return new Promise(async (resolve, reject) => {
    await con.query(
      `SELECT * FROM clients WHERE email = ${mail}`,
      (err, result) => {
        if (err) {
          reject(err);
        } else if (result.length > 0) {
          console.log('Email found!!');
          resolve(true);
        } else {
          console.log('Email not found');
          resolve(false);
        }
      }
    );
  });
};

//Checking if the user exists by his email and password
const checkUserExists = async (email, con) => {
  return new Promise(async (resolve, reject) => {
    await con.query(
      `SELECT * FROM users_details WHERE email = ${email}`,
      (err, result) => {
        if (err) {
          console.log(err);
          reject(err);
        } else if (result.length === 0) {
          resolve(false);
        } else resolve(true);
      }
    );
  });
};

//Inserting the client into the database
const insertClient = async (
  email,
  first_name,
  last_name,
  phone_number,
  city,
  con
) => {
  const queryUsers = `INSERT INTO clients (email,first_name,last_name,phone_number,city) VALUES (${email}, ${first_name}, ${last_name}, ${phone_number}, ${city})`;
  const emailExists = await checkClientMail(email, con);

  return new Promise((resolve, reject) => {
    if (emailExists) {
      console.log('The client already exists');
      resolve(false);
    } else {
      con.query(
        queryUsers,
        [email, first_name, last_name, phone_number, city],
        (err) => {
          if (err) {
            console.log(err);
            reject(err);
          } else {
            console.log('Inserted succesfully');
            resolve(true);
          }
        }
      );
    }
  });
};

//Check if client exists
const checkClient = async (first_name, last_name, city, phone_number, con) => {
  return new Promise((resolve, reject) => {
    con.query(
      `SELECT * FROM clients WHERE first_name = ${first_name} and last_name = ${last_name} and city = ${city} and phone_number = ${phone_number}`,
      (error) => {
        if (error) reject(error);
        else resolve(true);
      }
    );
  });
};

//Return all clients
const getAllClients = async (con) => {
  return new Promise((resolve, reject) => {
    con.query('SELECT * FROM clients', (err, res) => {
      if (err) reject(err);
      else resolve(res);
    });
  });
};

//Removing the client from the database
const removeClient = async (email, con) => {
  return new Promise(async (resolve, reject) => {
    const checkMail = await checkClientMail(email, con);
    if (!checkMail) {
      console.log('The client is not found');
      resolve(false);
    } else {
      con.query(
        `DELETE FROM clients WHERE email = ${email}`,
        (error, result) => {
          if (error) reject(error);
          else {
            if (result.affectedRows === 0) {
              console.log('Client is not removed due to something unexpected');
              resolve(false);
            } else {
              console.log('Client removed successfully!');
              resolve(true);
            }
          }
        }
      );
    }
  });
};

//Removing the user from the database
const removeUser = async (
  first_name,
  last_name,
  email,
  phone_number,
  city,
  con
) => {
  return new Promise((resolve, reject) => {
    con.query(
      `DELETE FROM clients WHERE first_name = ${first_name} and last_name = ${last_name} and email = ${email} and phone_number = ${email} and city = ${city}`,
      (error) => {
        if (error) {
          reject(error);
        } else {
          resolve(true);
        }
      }
    );
  });
};

const deleteOldPasswordHistory = async (email, con) => {
  return new Promise(async (resolve, reject) => {
    const removeOldPassword = `
    DELETE FROM password_history
    WHERE email = ${email} AND creation_date = (
      SELECT MIN(creation_date)
      FROM (
        SELECT creation_date
        FROM password_history
        WHERE email = ${email}
        ORDER BY creation_date ASC
        LIMIT 1
      ) AS t
    )
    `;

    await con.query(removeOldPassword, (err, res) => {
      if (err) {
        console.log('Error removing oldest password!');
        reject(err);
      } else {
        console.log('Removed oldest password successfully');
        resolve(true);
      }
    });
  });
};

const countPasswordInHistory = async (email, con) => {
  const countPassword = `SELECT COUNT(email) as count_mail FROM password_history where email = ${email}`;
  return new Promise(async (resolve, reject) => {
    await con.query(countPassword, (err, res) => {
      if (err) reject(err);
      else if (res[0]['count_mail'] > config.password_history) resolve(true);
      else resolve(false);
    });
  });
};

//Inserting the password of the user to password history
const insertPasswordHistory = async (email, password, con) => {
  const currentDate = new Date();
  const insertPassword = `insert into password_history (email, password, creation_date) values (${email}, ${password}, ${currentDate})`;

  return new Promise(async (resolve, reject) => {
    await con.query(
      insertPassword,
      [email, password, currentDate],
      async (err) => {
        if (err) reject(err);

        const BiggerThanThreePassword = await countPasswordInHistory(
          email,
          con
        );
        console.log(BiggerThanThreePassword);
        if (BiggerThanThreePassword) {
          const check = await deleteOldPasswordHistory(email, con);
          if (!check) resolve(false);
          else resolve(true);
        }
        resolve(false);
      }
    );
  });
};

//Inserting the user into the database
const insertUser = async (
  email,
  first_name,
  last_name,
  phone_number,
  password,
  city,
  con
) => {
  const pushUser = `INSERT INTO users_details (email,first_name,last_name,phone_number,password,city) VALUES (${email}, ${first_name}, ${last_name}, ${phone_number}, ${password}, ${city})`;
  const emailExists = await checkUserMail(email, con);

  return new Promise(async (resolve, reject) => {
    if (emailExists) {
      console.log('The user already exists');
      resolve(false);
    }
    let flag = 0;

    await con.query(pushUser, async (err) => {
      if (err) reject(err);
      else {
        flag = 1;
        const insertedPassword = await insertPasswordHistory(
          email,
          password,
          con
        );
        if (!insertedPassword && flag === 0) {
          console.log('Something went wrong');
          resolve(false);
        } else {
          console.log('Inserted to password history and to users_details!');
          resolve(true);
        }
      }
    });
  });
};

//Checking if the password is in the password history already
const checkPasswordInHistory = (email, password, con) => {
  return new Promise(async (resolve, reject) => {
    const q = `SELECT * FROM password_history WHERE email = ${email} AND password = ${password}`;

    await con.query(q, (err, res) => {
      if (err) reject(err);
      else if (res.affectedRows > 0) resolve(false);
      else {
        console.log('User did not use this password!');
        resolve(true);
      }
    });
  });
};

//Search for user password by his email
const findUserPassword = async (email, con) => {
  const q = `select password from users_details where email = ${email}`;
  const data = [email];

  return new Promise(async (resolve, reject) => {
    await con.query(q, data, (err, res) => {
      if (err) reject(err);
      else resolve(res[0].password);
    });
  });
};

//Updating the password
const updatePassword = async (email, old_password, new_password, con) => {
  const updatingPassword = `UPDATE users_details SET password = ${new_password} WHERE email = ${email} AND password = ${old_password}`;

  return new Promise(async (resolve, reject) => {
    const userExists = await checkUserExists(email, con);
    if (userExists) {
      const check = await checkPasswordInHistory(email, new_password, con);
      if (!check) {
        console.log('The password is already used!');
        resolve(false);
      } else {
        const pushPassword = await insertPasswordHistory(
          email,
          new_password,
          con
        );
        await con.query(updatingPassword);

        if (updatingPassword && pushPassword) {
          console.log(
            'Password is pushed to the password history and changed the user history'
          );
          resolve(true);
        } else {
          console.log('Error pushing to password history');
          resolve(false);
        }
      }
    } else {
      console.log('The user does not exist!');
      resolve(false);
    }
  });
};

//Sort client table by specific column
const sortBy = async (column_name, con) => {
  return new Promise(async (resolve, reject) => {
    await con.query(
      `SELECT * FROM clients ORDER BY ${column_name} ASC`,
      (error) => {
        if (error) reject(false);
        else {
          console.log('Successfully sorted!');
          resolve(true);
        }
      }
    );
  });
};

//Search the client by one of his properties
const searchClient = async (search_string, con) => {
  const search = `SELECT * FROM clients WHERE email LIKE ${search_string} OR first_name LIKE ${search_string} OR last_name LIKE ${search_string} OR phone_number LIKE ${search_string} OR city LIKE ${search_string}`;
  return new Promise((resolve, reject) => {
    con.query(
      search,

      (err, result) => {
        if (err) {
          console.log('Something went wrong', err);
          return resolve(false);
        } else return resolve(result);
      }
    );
  });
};

//Incrementing the logins to logins + 1
const updateLogins = async (email, con) => {
  const q = `UPDATE users_details
  SET logins = logins + 1
  WHERE email = ${email};
  `;
  return new Promise(async (resolve, reject) => {
    await con.query(q, (err) => {
      if (err) reject(false);
      else {
        console.log('Updated the logins!');
        resolve(true);
      }
    });
  });
};

//Reseting the logins to 0 after his block is done or he entered the correct password
const resetLogins = async (email, con) => {
  const q = `update users_details set logins = 0 where email = ${email}`;

  return new Promise(async (resolve, reject) => {
    await con.query(q, (err) => {
      if (err) reject(err);
      else resolve(true);
    });
  });
};

//Counting the logins in order to check if his logins count is more than allowed
const countLogins = async (email, con) => {
  const q = `select logins as l from users_details where email = ${email}`;

  return new Promise(async (resolve, reject) => {
    await con.query(q, (err, res) => {
      if (err) reject(err);
      else if (res[0]['l'] >= config.login_attempts) resolve(true);
      else resolve(false);
    });
  });
};

//Everytime the user tries to log in and the password is not correct we update the time stamp to the current time
const updateTimeStamp = async (email, con) => {
  const q = `UPDATE users_details
  SET created_at = NOW()
  WHERE email = ${email}`;

  return new Promise(async (resolve, reject) => {
    await con.query(q, (err) => {
      if (err) reject(err);
      else resolve(true);
    });
  });
};

//Getting the last time login of the user in order to check if he is still blocked or not
const lastTimeLogin = async (email, con) => {
  const q = `SELECT created_at from users_details where email = ${email}`;
  return new Promise(async (resolve, reject) => {
    await con.query(q, (err, res) => {
      if (err) reject(err);
      else resolve(res[0]['created_at']);
    });
  });
};

//Exporting all the queries in order to use them in another file
module.exports = {
  insertUser,
  removeUser,
  removeClient,
  getAllClients,
  checkClient,
  insertClient,
  checkUserExists,
  checkUserMail,
  updatePassword,
  sortBy,
  checkClientMail,
  insertPasswordHistory,
  searchClient,
  findUserPassword,
  updateLogins,
  countLogins,
  updateTimeStamp,
  resetLogins,
  lastTimeLogin,
};

//Delete the data from tables! Dont use!!!!
// const remove = async () => {
//   const q = 'DELETE FROM users_details';

//   return new Promise((resolve, reject) => {
//     con.query(q, (err, res) => {
//       if (err) reject(err);
//       else {
//         resolve(true);
//       }
//     });
//   });
// };

// remove()
//   .then(() => {
//     console.log('Data deleted successfully');
//   })
//   .catch((err) => {
//     console.error(err);
//   });

// const q = `ALTER TABLE users_details ADD is_banned BOOLEAN DEFAULT FALSE;`;
// con.query(q);
