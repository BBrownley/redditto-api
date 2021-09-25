const postsRouter = require("express").Router();
const postsDB = require("../db/posts");
const postVotesDB = require("../db/post_votes");
const connection = require("../db/index").connection;

postsRouter.get("/", async (req, res, next) => {
  const query = `
    SELECT 
    CASE
      WHEN ISNULL(SUM(post_votes.vote_value)) THEN 0
      WHEN SUM(post_votes.vote_value) < 1 THEN 0
      ELSE SUM(post_votes.vote_value)
    END AS score,
    title, 
    posts.created_at AS created_at, 
    posts.id AS postID,
    group_name,
    group_id AS groupID,
    username,
    users.id AS user_id,
    post_body,
    (SELECT COUNT(*) FROM post_follows WHERE posts.id = post_follows.post_id) AS follows,
    (SELECT COUNT(*) FROM comments 
      WHERE posts.id = comments.post_id) AS total_comments
    FROM posts
    JOIN users ON users.id = posts.submitter_id
    JOIN groups ON groups.id = posts.group_id
    LEFT JOIN post_votes ON post_votes.post_id = posts.id
    GROUP BY posts.id
    ORDER BY posts.created_at DESC
  `;
  const getPosts = () => {
    return new Promise((resolve, reject) => {
      connection.query(query, (err, results) => {
        if (err) {
          return reject(err);
        }
        resolve(results);
      });
    });
  };

  try {
    const posts = await getPosts();
    res.send(posts);
  } catch (exception) {
    next(exception);
  }
});

postsRouter.post("/", async (req, res, next) => {
  try {
    const data = await postsDB.create(req.body, req.userId);
    res.json({ ...data, toastMessage: "Post created" });
  } catch (exception) {
    next(exception);
  }
});

postsRouter.post("/:id/vote", async (req, res, next) => {
  const vote = (data, postID, userId) => {
    return new Promise((resolve, reject) => {
      // Check to see if user already voted or not
      connection.query(
        `SELECT * FROM post_votes WHERE user_id = ? AND post_id = ?`,
        [userId, postID],
        (err, results) => {
          if (err) {
            reject(new Error("Unable to vote on post"));
          }
          // Add the vote
          connection.query(
            `INSERT INTO post_votes SET ? `,
            {
              user_id: userId,
              post_id: postID,
              vote_value: data.value
            },
            (err, results) => {
              if (err) {
                reject(err);
              } else {
                resolve();
                res.send(200);
              }
            }
          );
        }
      );
    });
  };

  try {
    const postID = req.params.id;
    const newVote = await vote(req.body, postID, req.userId);
    res.send(newVote);
  } catch (exception) {
    next(exception);
  }
});

postsRouter.get("/votes", async (req, res, next) => {
  if (req.userId === undefined) return;

  try {
    const userPostVotes = await postVotesDB.getUserPostVotes(req.userId);
    res.json(userPostVotes);
  } catch (exception) {
    next(exception);
  }
});

postsRouter.get("/follows", async (req, res, next) => {
  if (req.userId === undefined) return;

  const getPostFollows = userId => {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT post_id FROM post_follows
        WHERE user_id = ?
      `;
      connection.query(query, [userId], (err, results) => {
        if (err) {
          reject(new Error(err.message));
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
  try {
    const posts = await getPostFollows(req.userId);
    res.json({ posts });
  } catch (exception) {
    next(exception);
  }
});

postsRouter.delete("/unfollow/:postId", async (req, res, next) => {
  const unfollowPost = (postId, userId) => {
    return new Promise((resolve, reject) => {
      const query = `
        DELETE FROM post_follows
        WHERE post_id = ? AND user_id = ?
      `;
      connection.query(query, [postId, userId], (err, results) => {
        if (err) {
          reject(new Error(err.message));
        } else {
          resolve(postId);
        }
      });
    });
  };
  try {
    const unfollow = await unfollowPost(req.params.postId, req.userId);
    res.json(unfollow);
  } catch (exception) {
    next(exception);
  }
});

postsRouter.delete("/:id", async (req, res, next) => {
  try {
    await postsDB.deletePost(req.userId, req.params.id);
    res.send(200);
  } catch (exception) {
    next(exception);
  }
});

postsRouter.get("/users/:userId", async (req, res, next) => {
  try {
    const userPosts = await postsDB.getPostsByUID(req.params.userId);
    res.json(userPosts);
  } catch (exception) {
    next(exception);
  }
});

postsRouter.post("/follow", async (req, res, next) => {
  const followPost = (postId, userId) => {
    return new Promise((resolve, reject) => {
      const query = `
        INSERT INTO post_follows
        SET ?
      `;
      connection.query(
        query,
        {
          user_id: userId,
          post_id: postId
        },
        (err, results) => {
          if (err) {
            reject(new Error(err.message));
          } else {
            resolve(postId);
          }
        }
      );
    });
  };
  try {
    const followedPost = await followPost(req.body.postId, req.userId);
    res.json(followedPost);
  } catch (exception) {
    next(exception);
  }
});

postsRouter.put("/:id", async (req, res, next) => {
  const editPost = (postId, newValue, userId) => {
    return new Promise((resolve, reject) => {
      const query = `
        UPDATE posts
        SET post_body = ?
        WHERE id = ? AND submitter_id = ?
      `;

      connection.query(query, [newValue, postId, userId], (err, results) => {
        if (err) {
          reject(new Error("Unable to edit post"));
        } else {
          resolve({ message: "Post succeessfully updated" });
        }
      });
    });
  };

  try {
    const success = await editPost(
      req.params.id,
      req.body.newValue,
      req.userId
    );
    res.json(success);
  } catch (exception) {
    next(exception);
  }
});

// Posts for the client when visiting the index page
postsRouter.get("/all", async (req, res, next) => {
  const getPosts = () => {
    const user = req.query.user;

    return new Promise((resolve, reject) => {
      let query;

      // Just get the most recent posts
      if (user === "null") {
        query = `
          SELECT 
            CASE
              WHEN ISNULL(SUM(post_votes.vote_value)) THEN 0
              WHEN SUM(post_votes.vote_value) < 1 THEN 0
              ELSE SUM(post_votes.vote_value)
            END AS score,
            title,
            posts.created_at AS created_at,
            posts.id AS post_id,
            group_name AS group_name,
            group_id AS group_id,
            username,
            submitter_id,
            post_body,
            (SELECT COUNT(*) FROM post_follows WHERE posts.id = post_follows.post_id) AS follows,
            (SELECT COUNT(*) FROM comments 
              WHERE posts.id = comments.post_id) AS total_comments
          FROM posts
          JOIN users ON users.id = posts.submitter_id
          JOIN groups ON groups.id = posts.group_id
          LEFT JOIN post_votes ON post_votes.post_id = posts.id
          GROUP BY posts.id
          ORDER BY created_at DESC
          LIMIT 20 OFFSET ${(parseInt(req.query.page) - 1) * 20}
        `;
      } else {
        // Get posts based on user's subscriptions

        query = `
          SELECT 
            CASE
              WHEN ISNULL(SUM(post_votes.vote_value)) THEN 0
              WHEN SUM(post_votes.vote_value) < 1 THEN 0
              ELSE SUM(post_votes.vote_value)
            END AS score,
            title,
            posts.created_at AS created_at,
            posts.id AS post_id,
            group_name AS group_name,
            group_id AS group_id,
            username,
            submitter_id,
            post_body,
            (SELECT COUNT(*) FROM post_follows WHERE posts.id = post_follows.post_id) AS follows,
            (SELECT COUNT(*) FROM comments 
              WHERE posts.id = comments.post_id) AS total_comments
          FROM posts
          JOIN users ON users.id = posts.submitter_id
          JOIN groups ON groups.id = posts.group_id
          LEFT JOIN post_votes ON post_votes.post_id = posts.id
          WHERE group_name IN 
            (SELECT group_name FROM group_subscribers 
            JOIN groups ON group_subscribers.group_id = groups.id 
            WHERE user_id = ?)
          GROUP BY posts.id
          ORDER BY posts.created_at DESC
          LIMIT 20 OFFSET ?
        `;
      }

      connection.query(
        query,
        [user, (parseInt(req.query.page) - 1) * 20],
        (err, results) => {
          if (err) {
            reject(new Error("Unable to get posts"));
          } else {
            resolve(results);
          }
        }
      );
    });
  };

  try {
    const posts = await getPosts();
    res.json(posts);
  } catch (exception) {
    next(exception);
  }
});

// Count the maximum pages for pagination in the index page, no user logged in
postsRouter.get("/all/count", async (req, res, next) => {
  const countPages = () => {
    return new Promise((resolve, reject) => {
      const query = `
          SELECT COUNT(*) AS total FROM posts
        `;

      connection.query(query, [], (err, results) => {
        if (err) {
          reject(new Error("Unable to count pages"));
        } else {
          resolve({ pages: Math.ceil(Object.values(results[0])[0] / 20) });
        }
      });
    });
  };

  try {
    const pages = await countPages();
    res.json(pages);
  } catch (exception) {
    next(exception);
  }
});

// Count the maximum pages for pagination in the index page, user logged in
postsRouter.get("/all/count/user", async (req, res, next) => {
  const countPages = () => {
    return new Promise((resolve, reject) => {
      const query = `
          SELECT COUNT(*) FROM
          (
            SELECT title, post_body, groups.group_name FROM posts
            JOIN groups ON groups.id = posts.group_id
            WHERE group_name IN 
            (
              SELECT group_name FROM group_subscribers 
              JOIN groups ON group_subscribers.group_id = groups.id 
              WHERE user_id = ?
            )
          ) AS total
        `;

      connection.query(query, [req.userId], (err, results) => {
        if (err) {
          reject(new Error("Unable to count pages"));
        } else {
          resolve({ pages: Math.ceil(Object.values(results[0])[0] / 20) });
        }
      });
    });
  };

  try {
    const pages = await countPages();
    res.json(pages);
  } catch (exception) {
    next(exception);
  }
});

// Gets all the posts belonging to a group
postsRouter.get("/group", async (req, res, next) => {
  const getGroupPosts = () => {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT 
          CASE
            WHEN ISNULL(SUM(post_votes.vote_value)) THEN 0
            WHEN SUM(post_votes.vote_value) < 1 THEN 0
            ELSE SUM(post_votes.vote_value)
          END AS score,
          title,
          posts.created_at AS created_at,
          posts.id AS post_id,
          group_name AS group_name,
          group_id AS group_id,
          username,
          submitter_id,
          post_body,
          (SELECT COUNT(*) FROM post_follows WHERE posts.id = post_follows.post_id) AS follows,
          (SELECT COUNT(*) FROM comments 
            WHERE posts.id = comments.post_id) AS total_comments
        FROM posts
        JOIN users ON users.id = posts.submitter_id
        JOIN groups ON groups.id = posts.group_id
        LEFT JOIN post_votes ON post_votes.post_id = posts.id
        WHERE group_name = ?
        GROUP BY posts.id
        ORDER BY posts.created_at DESC
        LIMIT 20 OFFSET ?
      `;

      connection.query(
        query,
        [req.query.groupName, (parseInt(req.query.page) - 1) * 20],
        (err, results) => {
          if (err) {
            console.log(err);
            reject(new Error("Unable to get group posts"));
          } else resolve(results);
        }
      );
    });
  };

  try {
    const posts = await getGroupPosts();
    res.json(posts);
  } catch (exception) {
    next(exception);
  }
});

// Counts # of posts belonging to a group
postsRouter.get("/group/count", async (req, res, next) => {
  const countPages = () => {
    return new Promise((resolve, reject) => {
      const query = `
      SELECT COUNT(*) FROM posts
      JOIN groups ON groups.id = posts.group_id
      WHERE group_name = ?
    `;

      connection.query(query, [req.query.groupName], (err, results) => {
        if (err) {
          reject(new Error("Unable to count group post pages"));
        } else {
          resolve({ pages: Math.ceil(Object.values(results[0])[0] / 20) });
        }
      });
    });
  };

  try {
    const data = await countPages();
    res.json(data);
  } catch (exception) {
    next(exception);
  }
});

// Get post by id
postsRouter.get("/:postId", async (req, res, next) => {
  const getPost = () => {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT
          posts.id AS post_id,
          post_body,
          CASE
            WHEN ISNULL(SUM(post_votes.vote_value)) THEN 0
            WHEN SUM(post_votes.vote_value) < 1 THEN 0
            ELSE SUM(post_votes.vote_value)
          END AS score,
          (
            SELECT COUNT(*) FROM comments 
            WHERE posts.id = comments.post_id
          ) AS total_comments,
          group_name,
          posts.created_at AS created_at,
          title,
          users.username AS username,
          submitter_id,
          (SELECT COUNT(*) FROM post_follows WHERE posts.id = post_follows.post_id) AS follows
        FROM posts
        JOIN users ON users.id = posts.submitter_id
        JOIN groups ON groups.id = posts.group_id
        LEFT JOIN post_votes ON post_votes.post_id = posts.id
        WHERE posts.id = ?
      `;
      connection.query(query, [req.params.postId], (err, results) => {
        if (err) {
          reject(new Error("Unable to get post"));
        } else {
          resolve(results[0]);
        }
      });
    });
  };

  try {
    const post = await getPost();
    res.json(post);
  } catch (exception) {
    next(exception);
  }
});

module.exports = postsRouter;

// postsRouter.get("/all/count", async (req, res, next) => {

//   const myFunc = () => {
//     console.log("func goes here")
//   }

//   try {
//     const data = await myFunc();
//     res.json(data)
//   } catch (exception) {
//     next(exception)
//   }
// })
