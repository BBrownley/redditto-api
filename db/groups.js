const connection = require("./index").connection;

const all = () => {
  const q = `
    SELECT 
      group_name,
      created_at AS created_at,
      id AS group_id,
      blurb
    FROM groups
`;
  return new Promise((resolve, reject) => {
    connection.query(q, (err, results) => {
      if (err) {
        return reject(err);
      }
      resolve(results);
    });
  });
};

const getGroupByName = groupName => {
  return new Promise((resolve, reject) => {
    connection.query(
      `
        SELECT 

        id AS group_id,
        owner_id,
        group_name,
        groups.created_at AS group_created_at,
        blurb,

        CASE
          WHEN group_id IS NULL THEN 0
            ELSE COUNT(*)
        END AS subscribers

        FROM group_subscribers
        RIGHT JOIN groups ON group_subscribers.group_id = groups.id
        WHERE group_name = ?
        GROUP BY groups.id
        LIMIT 1
    `,
      [groupName],
      (err, results) => {
        if (err) {
          return reject(new Error("An unexpected error has occured"));
        }
        resolve(results[0]);
      }
    );
  });
};

const create = (data, userId) => {
  return new Promise((resolve, reject) => {
    // Check if group already exists by name
    connection.query(
      `
      SELECT * FROM groups WHERE group_name = ?
    `,
      [data.groupName],
      (err, results) => {
        if (err) {
          reject(new Error("An unexpected error has occured"));
        }
        if (results.length > 0) {
          reject(new Error("Group name already exists"));
        }
      }
    );

    connection.query(
      `
      INSERT INTO groups SET ?
    `,
      {
        group_name: data.groupName,
        blurb: data.blurb,
        owner_id: userId
      },
      (err, results) => {
        if (err) {
          return reject(new Error("An unexpected error has occured"));
        } else {
          connection.query(
            `SELECT * FROM groups WHERE id = ?`,
            [results.insertId],
            (err, results) => {
              if (err) {
                return reject(new Error("An unexpected error has occured"));
              }
              resolve(results[0]);
            }
          );
        }
      }
    );
  });
};

const subscribe = (groupId, userId) => {
  const query = `INSERT INTO group_subscribers SET ?`;

  return new Promise((resolve, reject) => {
    if (userId) {
      connection.query(
        query,
        {
          group_id: groupId,
          user_id: userId
        },
        (err, results) => {
          if (err) {
            console.log(err);
            return reject(new Error("Unable to subscribe to group"));
          } else {
            return resolve(results[0]);
          }
        }
      );
    }
  });
};

const unsubscribe = (groupId, userId) => {
  return new Promise((resolve, reject) => {
    if (userId) {
      connection.query(
        `
        DELETE FROM group_subscribers WHERE group_id = ? AND user_id = ?
        `,
        [groupId, userId],
        (err, results) => {
          if (err) {
            return reject(new Error("An unexpected error has occured"));
          } else {
            return resolve(results[0]);
          }
        }
      );
    }
  });
};

const getSubscriptions = userId => {
  return new Promise((resolve, reject) => {
    if (userId) {
      connection.query(
        `
          SELECT group_name, group_subscribers.created_at, groups.id AS group_id FROM group_subscribers
          LEFT JOIN groups ON groups.id = group_subscribers.group_id
          WHERE group_subscribers.user_id = ?
        `,
        [userId],
        (err, results) => {
          if (err) {
            return reject(new Error("Unable to get user's subscription"));
          } else {
            return resolve(results);
          }
        }
      );
    }
  });
};

module.exports = {
  all,
  getGroupByName,
  create,
  subscribe,
  unsubscribe,
  getSubscriptions
};
