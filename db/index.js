require("dotenv").config();

const mysql = require("mysql");
const connection = mysql.createPool({
  connectionLimit: 1000,
  host: process.env.PRODUCTION_DB_HOST || "localhost",
  password: process.env.PRODUCTION_DB_PASSWORD || "",
  user: process.env.PRODUCTION_DB_USER || "root",
  database: process.env.PRODUCTION_DB_NAME || "reddit-clone"
});

// const connection = mysql.createPool({
//   connectionLimit: 1000,
//   host: "localhost",
//   password: "",
//   user: "root",
//   database: "reddit-clone"
// });

module.exports = { connection };
