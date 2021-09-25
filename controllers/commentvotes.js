const commentvotesRouter = require("express").Router();
const connection = require("../db/index").connection;

commentvotesRouter.get("/", async (req, res, next) => {
  const getVotes = userId => {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT comment_id, vote_value, post_id FROM comment_votes
        JOIN comments ON comments.id = comment_votes.comment_id
        WHERE user_id = ?
      `;
      connection.query(query, [userId], (err, results) => {
        if (err) {
          reject(new Error("Unable to fetch user comment votes"));
        } else {
          resolve(results);
        }
      });
    });
  };

  try {
    const userCommentVotes = await getVotes(req.userId);
    res.json(userCommentVotes);
  } catch (exception) {
    next(exception);
  }
});

commentvotesRouter.post("/", async (req, res, next) => {
  const addVote = (userId, commentId, value) => {
    return new Promise((resolve, reject) => {
      const query = `
        INSERT INTO comment_votes
        SET ?
      `;
      connection.query(
        query,
        {
          user_id: userId,
          comment_id: commentId,
          vote_value: value
        },
        (err, results) => {
          if (err) {
            reject(new Error("Unable to vote on comment"));
          } else {
            const query = `
              SELECT comment_id, vote_value, post_id FROM comment_votes
              JOIN comments ON comments.id = comment_votes.comment_id
              WHERE user_id = ? AND comment_id = ?
            `;

            connection.query(query, [userId, commentId], (err, results) => {
              if (err) {
                reject(
                  new Error("Unable to fetch recently generated comment vote")
                );
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
    const commentId = req.body.commentId;
    const value = req.body.value;

    const newVote = await addVote(req.userId, commentId, value);
    res.json(newVote);
  } catch (exception) {
    next(exception);
  }
});

commentvotesRouter.put("/", async (req, res, next) => {
  const updateVote = (userId, commentId, newValue) => {
    return new Promise((resolve, reject) => {
      const query = `
        UPDATE comment_votes
        SET vote_value = ?
        WHERE comment_id = ? AND user_id = ?
      `;
      connection.query(query, [newValue, commentId, userId], (err, results) => {
        if (err) {
          reject(new Error("Unable to update comment vote"));
        } else {
          const query = `
            SELECT comment_id, vote_value, post_id FROM comment_votes
            JOIN comments ON comments.id = comment_votes.comment_id
            WHERE comment_id = ? AND user_id = ?
          `;
          connection.query(query, [commentId, userId], (err, results) => {
            if (err) {
              reject(new Error("Unable to fetch recently updated comment"));
            } else {
              resolve(results[0]);
            }
          });
        }
      });
    });
  };

  try {
    const updatedVote = await updateVote(
      req.userId,
      req.body.commentId,
      req.body.newValue
    );
    res.json(updatedVote);
  } catch (exception) {
    next(exception);
  }
});

commentvotesRouter.delete("/", async (req, res, next) => {
  const deleteVote = (userId, commentId) => {
    return new Promise((resolve, reject) => {
      const query = `
        DELETE FROM comment_votes
        WHERE user_id = ? AND comment_id = ?
      `;

      connection.query(query, [userId, commentId], err => {
        if (err) {
          return reject(new Error("Unable to delete comment vote"));
        } else {
          resolve();
        }
      });
    });
  };

  try {
    deleteVote(req.userId, req.body.commentId);
    res.json({ message: "Comment vote deleted" });
  } catch (exception) {
    next(exception);
  }
});

module.exports = commentvotesRouter;
