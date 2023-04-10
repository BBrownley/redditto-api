require("dotenv").config();

let mysqlURL;

if (process.env.NODE_ENV !== "dev") {
  mysqlURL = process.env.MYSQL_URL;
}

const mysql = require("mysql2");

const connection = mysql.createPool(
  mysqlURL || {
    connectionLimit: 1000,
    host: process.env.MYSQLHOST || "localhost",
    password: process.env.MYSQLPASSWORD || "",
    user: process.env.MYSQLUSER || "root",
    database: process.env.MYSQLDATABASE || "reddit-clone"
  }
);

// connection.query(
//   `
//   RENAME TABLE "groups" TO user_groups
// `,
//   (err, results) => {
//     if (err) {
//       console.log(err);
//     } else {
//       console.log(results);
//     }
//   }
// );

module.exports = { connection };
