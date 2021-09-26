require("dotenv").config();

const mysql = require("mysql");
const connection = mysql.createPool({
  connectionLimit: 1000,
  host: process.env.PRODUCTION_DB_HOST || "localhost",
  password: process.env.PRODUCTION_DB_USER || "",
  user: process.env.PRODUCTION_DB_USER || "root",
  database: process.env.heroku_61b8f24467ac49f || "reddit-clone"
});

module.exports = { connection };
