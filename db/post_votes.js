const connection = require("./index").connection;

// const q = `
//   SELECT post_id, SUM(vote_value) AS score FROM post_votes
//   WHERE post_id = ?
//   GROUP BY post_id
// `;

// const getPostScore = postID => {
//   return new Promise((resolve, reject) => {
//     connection.query(q, [postID], (err, results) => {
//       if (err) {
//         return reject(err);
//       }
//       resolve(results);
//     });
//   });
// };

const getUserPostVotes = userId => {
  return new Promise((resolve, reject) => {
    connection.query(
      `
      SELECT post_id, vote_value FROM post_votes
      WHERE user_id = ?
    `,
      [userId],
      (err, results) => {
        if (err) {
          return reject(new Error("Cannot load user post votes"));
        } else {
          resolve(results);
        }
      }
    );
  });
};

module.exports = {
  getUserPostVotes
};
