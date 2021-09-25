const mysql = require("mysql");
const connection = mysql.createPool({
  connectionLimit: 1000,
  host: "localhost",
  password: "",
  user: "root",
  database: "reddit-clone"
});

module.exports = { connection };
