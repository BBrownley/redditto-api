const usersRouter = require("express").Router();
const usersDB = require("../db/users");
const postsDB = require("../db/posts");

const connection = require("../db/users").connection;

usersRouter.post("/", async (req, res, next) => {
  try {
    const data = await usersDB.register(req.body.data);
    res.json(data);
  } catch (exception) {
    next(exception);
  }
});

usersRouter.post("/login", async (req, res, next) => {
  try {
    let data = await usersDB.login(req.body);
    data = {
      ...data,
      userPosts: await postsDB.getPostsByUserId(req.userId),
      postFollows: await postsDB.getPostFollowsByUserId(req.userId)
    };
    res.json({ ...data, toastMessage: "Successfully logged in" });
  } catch (exception) {
    next(exception);
  }
});

usersRouter.get("/id/:userId", async (req, res, next) => {
  try {
    let data = await usersDB.getUserById(req.params.userId);
    res.json(data);
  } catch (exception) {
    next(exception);
  }
});

usersRouter.get("/username/:username", async (req, res, next) => {
  const getUser = username => {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT id, username FROM users
        WHERE username = ?
      `;
      connection.query(query, [username], (err, results) => {
        if (err) {
          reject(new Error("Unable to fetch user"));
        } else {
          resolve(results[0]);
        }
      });
    });
  };

  try {
    const user = await getUser(req.params.username);
    res.json(user);
  } catch (exception) {
    next(exception);
  }
});

module.exports = usersRouter;
