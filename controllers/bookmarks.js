const bookmarksRouter = require("express").Router();
const connection = require("../db").connection;

bookmarksRouter.get("/", async (req, res, next) => {
  if (!req.userId) return next();

  const getUserBookmarks = userId => {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT bookmarks.*, 
          posts.title AS post_title, 
          posts.id AS post_id, 
          comments.content AS content, 
          user_groups.group_name AS group_name 
        FROM bookmarks
        JOIN comments ON bookmarks.comment_id = comments.id
        JOIN posts ON comments.post_id = posts.id
        JOIN user_groups ON posts.group_id = user_groups.id
        WHERE user_id = ?
      `;

      connection.query(query, [userId], (err, results) => {
        if (err) {
          reject(new Error("Unable to get user bookmarks"));
        } else {
          resolve(results);
        }
      });
    });
  };
  try {
    const userBookmarks = await getUserBookmarks(req.userId);
    res.json(userBookmarks);
  } catch (exception) {
    next(exception);
  }
});

bookmarksRouter.get("/post/:postId", async (req, res, next) => {
  const getBookmarksByPostId = (userId, postId) => {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT bookmarks.*, comments.post_id FROM bookmarks
        JOIN comments ON bookmarks.comment_id = comments.id
        WHERE user_id = ? AND post_id = ?
      `;
      connection.query(query, [userId, postId], (err, results) => {
        if (err) {
          reject(new Error("Unable to get user bookmarks (by post id)"));
        } else {
          resolve(results);
        }
      });
    });
  };

  try {
    const userPostBookmarks = await getBookmarksByPostId(req.userId, req.params.postId);
    res.json(userPostBookmarks);
  } catch (exception) {
    next(exception);
  }
});

bookmarksRouter.post("/", async (req, res, next) => {
  const newBookmark = (userId, commentId) => {
    return new Promise((resolve, reject) => {
      const query = `
        INSERT INTO bookmarks SET ?
      `;

      connection.query(
        query,
        {
          user_id: userId,
          comment_id: commentId
        },
        (err, results) => {
          if (err) {
            reject(new Error("Unable to create new bookmark"));
          } else {
            const query = `
            SELECT * FROM bookmarks
            WHERE user_id = ? AND comment_id = ?
          `;
            connection.query(query, [userId, commentId], (err, results) => {
              if (err) {
                reject(new Error("Unable to get recently created bookmark"));
              } else {
                resolve(results[0]);
              }
            });
          }
        }
      );
    });
  };

  try {
    const bookmark = await newBookmark(req.userId, req.body.commentId);
    res.json(bookmark);
  } catch (exception) {
    next(exception);
  }
});

bookmarksRouter.delete("/", async (req, res, next) => {
  const deleteBookmark = (userId, commentId) => {
    return new Promise((resolve, reject) => {
      const query = `
        DELETE FROM bookmarks
        WHERE user_id = ? AND comment_id = ?
      `;

      connection.query(query, [userId, commentId], (err, results) => {
        if (err) {
          reject(new Error("Unable to delete comment"));
        } else {
          resolve();
        }
      });
    });
  };

  try {
    await deleteBookmark(req.userId, req.body.commentId);
    res.sendStatus(200);
  } catch (exception) {
    next(exception);
  }
});

module.exports = bookmarksRouter;
