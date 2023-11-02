const connection = require("./index").connection;

console.log(connection);
const all = () => {
  return new Promise((resolve, reject) => {
    connection.query(query, (err, results) => {
      if (err) {
        return reject(err);
      }
      resolve(results);
    });
  });
};

const create = (data, userId) => {
  return new Promise((resolve, reject) => {
    // Ensure title and group are filled in, content can be empty

    const title = data.title.trim();
    const group_id = data.group_id;

    if (!title) {
      return reject(new Error("Post must contain a title"));
    }

    if (!group_id) {
      return reject(new Error("Post must be assigned to a group"));
    }

    connection.query(
      `INSERT INTO posts SET ? `,
      {
        submitter_id: userId,
        group_id: data.group_id,
        title: data.title,
        post_body: data.content
      },
      (err, results) => {
        if (err) {
          console.log(err);
          return reject(new Error("An unexpected error has occured"));
        } else {
          // Retrieve created object
          connection.query(
            ` SELECT 
                title, 
                posts.created_at AS created_at, 
                posts.id AS post_id,
                group_name,
                group_id,
                username,
                post_body FROM posts
              JOIN users ON users.id = posts.submitter_id
              JOIN user_groups ON user_groups.id = posts.group_id
              WHERE posts.id = ?`,
            [results.insertId],
            (err, results) => {
              if (err) {
                return reject(new Error("An unexpected error has occured"));
              } else {
                resolve(results[0]);
              }
            }
          );
        }
      }
    );
  });
};

const getPostsByUserId = userId => {
  return new Promise(async (resolve, reject) => {
    const query = `SELECT id FROM posts WHERE submitter_id = ?`;

    connection.query(query, [userId], (err, results) => {
      if (err) {
        return reject(err);
      }
      // Return their IDs
      resolve(
        results.reduce((acc, curr) => {
          return [...acc, curr.id];
        }, [])
      );
    });
  });
};

const deletePost = (userId, postId) => {
  return new Promise(async (resolve, reject) => {
    const query = `DELETE FROM posts WHERE posts.id = ? AND submitter_id = ?`;
    connection.query(query, [postId, userId], (err, results) => {
      if (err) {
        console.log(err);
        return reject(new Error("An unexpected error has occured"));
      }

      resolve({ message: "Post successfully deleted" });
    });
  });
};

const getPostsByUID = userId => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT posts.id AS post_id FROM posts
      WHERE posts.submitter_id = ?
    `;
    connection.query(query, [userId], (error, results) => {
      if (error) {
        console.log(error);
        reject(new Error("Unable to fetch user posts"));
      } else {
        resolve(
          results.reduce((acc, curr) => {
            return [...acc, curr.post_id];
          }, [])
        );
      }
    });
  });
};

const getPostFollowsByUserId = userId => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT * FROM post_follows
      WHERE user_id = ?
    `;

    connection.query(query, [userId], (err, results) => {
      if (err) {
        reject(new Error(err.message));
      } else {
        const postIds = results.reduce((ids, curr) => {
          ids.push(curr.post_id);
          return ids;
        }, []);
        resolve(postIds);
      }
    });
  });
};

module.exports = {
  all,
  getPostsByUserId,
  create,
  deletePost,
  getPostFollowsByUserId,
  getPostsByUID,
  connection
};
