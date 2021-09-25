// randomly-generated posts

const mysql = require("mysql");
const faker = require("faker");

const connection = mysql.createConnection({
  host: "localhost",
  user: "root",
  database: "reddit-clone"
});

const q =
  "INSERT INTO posts (submitter_id, group_id, title, content, created_at) VALUES ? ";

const createPosts = () => {
  let posts = [];
  const postsToInsert = 50;

  return new Promise((resolve, reject) => {
    for (let i = 0; i < postsToInsert; i++) {
      posts.push([
        Math.floor(Math.random() * 20) + 1,
        Math.floor(Math.random() * 5) + 1,
        faker.commerce.product(),
        faker.lorem.paragraphs(),
        faker.date.past(3)
      ]);
      console.log(`${i + 1} posts created`);
    }
    resolve(posts);
  });
};

(async () => {
  const posts = await createPosts();
  connection.query(q, [posts], (err, results) => {
    console.log("Query called");
    if (err) {
      console.log(err);
    }
    console.log(results);
  });

  connection.end();
})();
