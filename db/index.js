require("dotenv").config();

let mysqlURL;

if (process.env.NODE_ENV !== "dev") {
  mysqlURL = process.env.MYSQL_URL;
}

const mysql = require("mysql2");

const connection = mysql.createPool(
  mysqlURL || {
    connectionLimit: 1000,
    host: "localhost",
    password: "",
    user: "root",
    database: "reddit-clone"
  }
);

module.exports = { connection };
