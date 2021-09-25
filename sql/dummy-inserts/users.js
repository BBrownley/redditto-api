// 20 randomly-generated users

const mysql = require("mysql");
const faker = require("faker");

const connection = mysql.createConnection({
  host: "localhost",
  user: "root",
  database: "reddit-clone"
});

const q =
  "INSERT INTO users (username, hashed_password, email, created_at) VALUES ? ";

const createUsers = () => {
  let users = [];
  const usersToInsert = 20;

  return new Promise((resolve, reject) => {
    for (let i = 0; i < usersToInsert; i++) {
      users.push([
        faker.internet.userName(),
        faker.internet.password(),
        faker.internet.email(),
        faker.date.past()
      ]);
      console.log(`${i + 1} users created`);
    }
    resolve(users);
  });
};

(async () => {
  const users = await createUsers();
  connection.query(q, [users], (err, results) => {
    console.log("Query called");
    if (err) {
      console.log(err);
    }
    console.log(results);
  });

  connection.end();
})();
