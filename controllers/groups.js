const groupsRouter = require("express").Router();
const connection = require("../db/index").connection;

const groupsDB = require("../db/groups");

// Get groups for display
groupsRouter.get("/", async (req, res, next) => {
  const getGroups = () => {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT *, id AS group_id FROM user_groups
        ORDER BY created_at DESC
        LIMIT 20 OFFSET ?
      `;

      let pageOffset;

      if (req.query.page) {
        pageOffset = parseInt(req.query.page) - 1 * 20;
      } else {
        pageOffset = 0;
      }

      connection.query(query, [pageOffset], (err, results) => {
        if (err) {
          console.log(err);
          reject(new Error("Unable to get groups"));
        } else {
          resolve(results);
        }
      });
    });
  };

  try {
    const groups = await getGroups();
    res.json(groups);
  } catch (exception) {
    next(exception);
  }
});

// Count # of pages needed for pagination of groups
groupsRouter.get("/count", async (req, res, next) => {
  const countPages = () => {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT COUNT(*) AS total FROM user_groups
      `;

      connection.query(query, (err, results) => {
        if (err) {
          console.log(err);
          reject(new Error("Unable to count groups"));
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

groupsRouter.post("/create", async (req, res, next) => {
  try {
    const createdGroup = await groupsDB.create(req.body, req.userId);
    res.json(createdGroup);
  } catch (exception) {
    next(exception);
  }
});

groupsRouter.post("/subscribe", async (req, res, next) => {
  try {
    const subscriptionInfo = await groupsDB.subscribe(req.body.id, req.userId);
    res.json(subscriptionInfo);
  } catch (exception) {
    next(exception);
  }
});

groupsRouter.delete("/subscription", async (req, res, next) => {
  try {
    const unsub = await groupsDB.unsubscribe(req.body.id, req.userId);
    res.json(unsub);
  } catch (exception) {
    next(exception);
  }
});

groupsRouter.get("/subscriptions", async (req, res, next) => {
  try {
    const subscriptions = await groupsDB.getSubscriptions(req.userId);
    res.json(subscriptions);
  } catch (exception) {
    next(exception);
  }
});

groupsRouter.param("groupName", async (req, res, next, groupName) => {
  const group = await groupsDB.getGroupByName(groupName);
  if (group) {
    req.group = group;
  } else {
    return res.json(400, { message: "Cannot find group" });
  }
  next();
});

groupsRouter.get("/verifyName", async (req, res, next) => {
  const verifyGroupByName = () => {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT * FROM user_groups WHERE group_name = ?
      `;
      connection.query(query, [req.query.groupName], (err, results) => {
        if (err || results.length === 0) {
          reject(new Error("Unable to verify group"));
        } else {
          resolve(results[0].id);
        }
      });
    });
  };

  try {
    const verify = await verifyGroupByName();
    res.status(200).json(verify);
  } catch (exception) {
    next(exception);
  }
});

groupsRouter.get("/:groupName", async (req, res, next) => {
  res.json(req.group);
  next();
});

module.exports = groupsRouter;
