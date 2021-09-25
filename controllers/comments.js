const commentsRouter = require("express").Router();
const connection = require("../db/index").connection;

commentsRouter.get("/post/:postId", async (req, res, next) => {
  const fetchComments = () => {
    return new Promise((resolve, reject) => {
      const query = `
      SELECT
        comments.id AS comment_id,
        commenter_id,
        comments.created_at AS created_at,
        parent_id,
        comment_body,
        post_id,
        users.id AS user_id,
        users.username AS username,
        deleted,
        SUM(vote_value) AS comment_score 
        FROM comments

      LEFT JOIN comment_votes ON comment_votes.comment_id = comments.id
      JOIN users ON comments.commenter_id = users.id
      WHERE post_id = ?
      GROUP BY comments.id
      `;
      connection.query(query, [req.params.postId], (err, results) => {
        if (err) {
          reject(err);
        } else {
          resolve(results);
        }
      });
    });
  };
  try {
    const comments = await fetchComments();
    res.json(comments);
  } catch (exception) {
    next(exception);
  }
});

commentsRouter.get("/users/:userId", async (req, res, next) => {
  const fetchUserComments = uid => {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT comments.*, posts.title AS post_title, groups.group_name AS group_name FROM comments
        JOIN posts ON comments.post_id = posts.id
        JOIN groups ON posts.group_id = groups.id
        WHERE commenter_id = ?
      `;
      connection.query(query, [uid], (err, results) => {
        if (err) {
          reject(new Error("Unable to fetch user comments"));
        } else {
          resolve(results);
        }
      });
    });
  };

  try {
    const userComments = await fetchUserComments(req.params.userId);
    res.json(userComments);
  } catch (exception) {
    next(exception);
  }
});

commentsRouter.get("/:commentId/children", async (req, res, next) => {
  const fetchChildren = () => {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT
          comments.id AS comment_id,
          commenter_id,
          comments.created_at AS created_at,
          parent_id,
          comment_body,
          post_id,
          users.id AS user_id,
          users.username AS username,
          deleted,
          SUM(vote_value) AS comment_score 
          FROM comments

        LEFT JOIN comment_votes ON comment_votes.comment_id = comments.id
        JOIN users ON comments.commenter_id = users.id
        WHERE parent_id = ?
        GROUP BY comments.id
      `;
      connection.query(query, [req.params.commentId], (err, results) => {
        if (err) {
          reject(err);
        } else {
          resolve(results);
        }
      });
    });
  };
  try {
    const comments = await fetchChildren();
    res.json(comments);
  } catch (exception) {
    next(exception);
  }
});

// Add a new comment
commentsRouter.post("/", async (req, res, next) => {
  const postComment = (username, userId) => {
    return new Promise((resolve, reject) => {
      const query = `
        INSERT INTO comments SET ?
      `;

      connection.query(
        query,
        {
          commenter_id: userId,
          parent_id: req.body.parentId,
          comment_body: req.body.comment,
          post_id: req.body.postId,
          deleted: 0
        },
        (err, results) => {
          if (err) {
            reject(new Error(err));
          } else {
            const query = `
              SELECT * FROM comments
              WHERE id = ?
            `;
            connection.query(query, [results.insertId], (err, results) => {
              resolve({
                ...results[0],
                comment_id: results[0].id,
                username
              });
            });
          }
        }
      );
    });
  };
  try {
    if (req.body.comment.trim().length === 0) {
      throw new Error("Comment cannot be empty");
    }

    const newComment = await postComment(req.username, req.userId);
    return res.json(newComment);
  } catch (exception) {
    next(exception);
  }
});

commentsRouter.put(`/:commentId`, async (req, res, next) => {
  const updateComment = (updatedContent, commentId) => {
    return new Promise((resolve, reject) => {
      const query = `
        UPDATE comments
        SET comment_body = ?
        WHERE id = ?
      `;

      connection.query(query, [updatedContent, commentId], (err, results) => {
        if (err) {
          reject(new Error("Unable to update comment"));
        } else {
          resolve({ message: "Comment successfully updated" });
        }
      });
    });
  };

  try {
    if (req.body.updatedContent.trim().length === 0) {
      throw new Error("Updated comment cannot be empty");
    }

    await updateComment(req.body.updatedContent, req.params.commentId);
    res.sendStatus(200);
  } catch (exception) {
    next(exception);
  }
});

commentsRouter.put("/:commentId/remove", async (req, res, next) => {
  const removeComment = (commentId, userId) => {
    return new Promise((resolve, reject) => {
      const query = `
        UPDATE comments
        SET comment_body = "comment removed", deleted = 1
        WHERE id = ? AND commenter_id = ?     
      `;
      connection.query(query, [commentId, userId], (err, results) => {
        if (err) {
          reject(new Error("Unable to remove comment"));
        } else {
          resolve({ message: "Comment successfully removed" });
        }
      });
    });
  };

  try {
    const success = await removeComment(req.params.commentId, req.userId);
    res.send(success);
  } catch (exception) {
    next(exception);
  }
});

// Get comment score
commentsRouter.get("/:commentId/score", async (req, res, next) => {
  const getCommentScore = () => {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT *, 

        CASE
          WHEN SUM(vote_value) IS NULL THEN 0
            ELSE SUM(vote_value)
        END AS score FROM comment_votes
        
        WHERE comment_id = ?
      `;
      connection.query(query, [req.params.commentId], (err, results) => {
        if (err) {
          reject(new Error("Unable to fetch comment score"));
        } else {
          resolve(results[0]);
        }
      });
    });
  };

  try {
    const commentScore = await getCommentScore();
    res.json(commentScore);
  } catch (exception) {
    next(exception);
  }
});

module.exports = commentsRouter;
