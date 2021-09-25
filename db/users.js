const connection = require("./index").connection;
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const register = userInfo => {
  return new Promise(async (resolve, reject) => {
    const username = userInfo.username;
    const email = userInfo.email;
    const password = userInfo.password;
    const confirmPassword = userInfo.confirmPassword;

    // Check to make sure all fields were filled in

    if (!username || !email || !password || !confirmPassword) {
      return reject(new Error("All fields must be filled in"));
    }
    // Validate confirm password
    if (password !== confirmPassword) {
      return reject(new Error("Passwords do not match"));
    }

    // Alphanumeric usernames only
    const alphanumeric = /^[a-z0-9]+$/i;
    if (!alphanumeric.test(username)) {
      return reject(
        new Error("Username must contain alphanumeric characters only")
      );
    }

    // Username must be 20 chars or less
    if (username.trim().length > 20) {
      return reject(
        new Error("Username must be 20 characters or less")
      );
    }

    // Check to make sure username or email isn't in use
    connection.query(
      `SELECT username FROM users WHERE username = ?`,
      [username],
      async (error, results) => {
        if (error) {
          reject(new Error(error.message));
        }
        if (results.length > 0) {
          return reject(new Error("Username already in use"));
        }
      }
    );

    connection.query(
      `SELECT email FROM users WHERE email = ?`,
      [email],
      async (error, results) => {
        if (error) {
          reject(new Error(error.message));
        }
        if (results.length > 0) {
          return reject(new Error("Email already in use"));
        }
      }
    );
    // User validation succeeds, hash password and store results in DB
    const hashed_password = await bcrypt.hash(password, 8);

    connection.query(
      `INSERT INTO users SET ? `,
      { username, hashed_password, email },
      (error, results) => {
        if (error) {
          reject(new Error(error.message));
        } else {
          const userInfo = { username, id: results.insertId };
          const token = `bearer ${jwt.sign(userInfo, process.env.SECRET)}`;

          resolve({ userId: results.insertId, token }); // Pass id, token to client for localStorage
        }
      }
    );
  });
};

const login = userInfo => {
  return new Promise((resolve, reject) => {
    const username = userInfo.username;
    const password = userInfo.password;

    // Check to make sure all fields were filled in

    if (!username || !password) {
      return reject(new Error("All fields must be filled in"));
    }

    // Compare hashed password with given password to see if it matches
    connection.query(
      "SELECT * FROM users WHERE username = ?",
      [username],
      async (error, results) => {
        try {
          const comparePW = await bcrypt.compare(
            password,
            results[0].hashed_password
          );

          if (comparePW) {
            const userInfo = { username, id: results[0].id };
            const token = `bearer ${jwt.sign(userInfo, process.env.SECRET)}`;

            resolve({ username, token, userId: userInfo.id });
          } else {
            return reject(new Error("Invalid username or password"));
          }
        } catch (exception) {
          return reject(new Error("Invalid username or password"));
        }
      }
    );
  });
};

const getUserById = userId => {
  return new Promise((resolve, reject) => {
    connection.query(
      `SELECT id, username, created_at FROM users WHERE id = ?`,
      [userId],
      (error, results) => {
        if (error) {
          reject(new Error("Unable to find user"));
        } else {
          resolve(results[0]);
        }
      }
    );
  });
};

module.exports = {
  register,
  login,
  getUserById,
  connection
};
