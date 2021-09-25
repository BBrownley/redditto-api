// randomly-generated groups

const mysql = require("mysql");
const faker = require("faker");

const connection = mysql.createConnection({
  host: "localhost",
  user: "root",
  database: "reddit-clone"
});

const q = "INSERT INTO groups (owner_id, group_name) VALUES ? ";

const createGroups = () => {
  let groups = [];
  const groupsToInsert = 5;

  return new Promise((resolve, reject) => {
    for (let i = 0; i < groupsToInsert; i++) {
      groups.push([
        Math.floor(Math.random() * 20) + 1,
        faker.commerce.department()
      ]);
      console.log(`${i + 1} groups created`);
    }
    resolve(groups);
  });
};

(async () => {
  const groups = await createGroups();
  connection.query(q, [groups], (err, results) => {
    console.log("Query called");
    if (err) {
      console.log(err);
    }
    console.log(results);
  });

  connection.end();
})();
