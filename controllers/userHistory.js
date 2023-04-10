const userHistoryRouter = require("express").Router();
const connection = require("../db/index").connection;

userHistoryRouter.get("/paginate", async (req, res, next) => {
  // filters: "OVERVIEW", "SUBMITTED", "COMMENTS", "BOOKMARKED"
  const filter = req.query.filter;
  const userId = req.query.user;
  const offset = (parseInt(req.query.page) - 1) * 20;

  const getUserHistory = () => {
    return new Promise((resolve, reject) => {
      let query;

      switch (filter) {
        case "OVERVIEW":
          /*
            Overview = { 
              group_name (comment/post)
              created_at (comment/post)
              post_title (comment/post)
              comment content
              post username
              post body
            }
          */
          query = `
            SELECT
            user_groups.group_name AS group_name,
              comments.created_at AS created_at,
              posts.title AS title,
              posts.id AS post_id,
              submitter_id,
              comments.comment_body AS comment_body,
              null AS username,
              null AS post_body
            FROM comments
            JOIN posts ON comments.post_id = posts.id
            JOIN user_groups ON posts.group_id = user_groups.id
            JOIN users ON comments.commenter_id = users.id
            WHERE comments.deleted != 1 AND users.id = ?
          
            UNION
          
            SELECT 
            user_groups.group_name AS group_name,
              posts.created_at AS created_at,
              posts.title AS title,
              posts.id AS post_title,
              submitter_id,
              null AS comment_body,
              users.username AS username,
              posts.post_body AS post_body
            FROM posts
            JOIN user_groups ON posts.group_id = user_groups.id
            JOIN users ON posts.submitter_id = users.id
            WHERE users.id = ?
            ORDER BY created_at DESC

            LIMIT 20 OFFSET ?
          `;
          break;

        case "SUBMITTED":
          query = `
            SELECT 
            user_groups.group_name AS group_name,
              posts.created_at AS created_at,
              posts.id AS post_id,
              title,
              submitter_id,
              post_body,
              username,
              null AS comment_body
            FROM posts
            JOIN user_groups ON user_groups.id = posts.group_id
            JOIN users ON users.id = posts.submitter_id
            WHERE submitter_id = ?
            AND submitter_id = ?
            ORDER BY created_at DESC

            LIMIT 20 OFFSET ?
          `;
          break;

        case "COMMENTS":
          query = `
            SELECT 
              posts.title AS title, 
              posts.id AS post_id,
              user_groups.group_name AS group_name,
              comments.created_at AS created_at,
              comment_body,
              null AS username,
              null AS post_body
            FROM comments
            JOIN posts ON posts.id = comments.post_id
            JOIN user_groups ON posts.group_id = user_groups.id
            WHERE commenter_id = ?
            AND commenter_id = ?
            AND deleted != 1
            ORDER BY created_at DESC

            LIMIT 20 OFFSET ?
          `;
          break;

        case "BOOKMARKED":
          query = `
            SELECT 
              posts.title AS title,
              posts.id AS post_id,
              user_groups.group_name AS group_name,
              bookmarks.created_at AS created_at,
              comment_body,
              null AS username,
              null AS post_body
            FROM bookmarks
            JOIN comments ON bookmarks.comment_id = comments.id
            JOIN posts ON comments.post_id = posts.id
            JOIN user_groups ON posts.group_id = user_groups.id
            WHERE user_id = ?
            AND user_id = ?
            ORDER BY created_at DESC
            
            LIMIT 20 OFFSET ?
          `;
          break;

        default:
          reject(new Error("Invalid user history filter"));
          break;
      }

      connection.query(query, [userId, userId, offset], (err, results) => {
        if (err) {
          reject(new Error("Unable to get user history"));
        } else {
          resolve(results);
        }
      });
    });
  };

  try {
    const userHistory = await getUserHistory();
    res.json(userHistory);
  } catch (exception) {
    next(exception);
  }
});

// Count # of pages for pagination
userHistoryRouter.get("/count", async (req, res, next) => {
  const filter = req.query.filter;
  const userId = req.query.user;

  const countPages = () => {
    return new Promise((resolve, reject) => {
      let query;

      switch (filter) {
        case "OVERVIEW":
          query = `
            SELECT
            (
              SELECT COUNT(*) FROM posts
              JOIN users ON users.id = posts.submitter_id
              WHERE users.id = ?
            ) 
            AS post_count,
            (
              SELECT COUNT(*) FROM comments
              JOIN users ON users.id = comments.commenter_id
              WHERE users.id = ? AND comments.deleted != 1
            ) 
            AS comment_count
          `;
          break;

        case "SUBMITTED":
          query = `
            SELECT COUNT(*) AS total FROM posts WHERE submitter_id = ?
          `;
          break;

        case "COMMENTS":
          query = `
            SELECT COUNT(*) AS total FROM comments WHERE commenter_id = ? AND deleted != 1
          `;
          break;

        case "BOOKMARKED":
          query = `
            SELECT COUNT(*) AS total FROM bookmarks
            WHERE bookmarks.user_id = ?
          `;
          break;

        default:
          reject(new Error("Invalid user history filter (counting pages)"));
          break;
      }

      connection.query(query, [userId, userId], (err, results) => {
        if (err) {
          reject(new Error("Unable to get user history (counting pages)"));
        } else {
          const counts = Object.values(results[0]);
          const totalRows = counts.reduce((count, current) => {
            return count + current;
          }, 0);
          resolve({ pages: Math.ceil(totalRows / 20) });
        }
      });
    });
  };

  try {
    const count = await countPages();
    res.json(count);
  } catch (exception) {
    next(exception);
  }
});

module.exports = userHistoryRouter;
