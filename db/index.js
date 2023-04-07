require("dotenv").config();

let mysqlURL;

if (process.env.NODE_ENV !== "dev") {
  mysqlURL = process.env.MYSQL_URL
}

const mysql = require("mysql");
const connection = mysql.createPool(mysqlURL || {
  connectionLimit: 1000,
  host: process.env.MYSQLHOST || "localhost",
  password: process.env.MYSQLPASSWORD || "",
  user: process.env.MYSQLUSER || "root",
  database: process.env.MYSQLDATABASE || "reddit-clone"
});

module.exports = { connection };
