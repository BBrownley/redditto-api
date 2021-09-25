const messageRouter = require("express").Router();
const connection = require("../db/index").connection;

messageRouter.get("/", async (req, res, next) => {
  if (!req.userId) return next();

  const getMessages = () => {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT messages.*, users.username AS sender_username FROM messages
        LEFT JOIN users ON users.id = messages.sender_id
        WHERE recipient_id = ?
        ORDER BY messages.created_at DESC
      `;
      connection.query(query, [req.userId], (err, results) => {
        if (err) {
          reject(new Error("Unable to fetch messages from server"));
        } else {
          resolve(results);
        }
      });
    });
  };
  try {
    const messages = await getMessages();
    res.json(messages);
  } catch (exception) {
    next(exception);
  }
});

messageRouter.post("/", async (req, res, next) => {
  const sendMessage = message => {
    return new Promise((resolve, reject) => {
      const query = `
        INSERT INTO messages SET ?
      `;

      connection.query(
        query,
        {
          sender_id: message.sender_id,
          recipient_id: message.recipient_id,
          content: message.content,
          has_read: 0,
          subject: message.subject
        },
        (err, results) => {
          if (err) {
            console.log(err);
            reject(new Error("Unable to send message"));
          } else {
            resolve("Message sent");
          }
        }
      );
    });
  };

  try {
    const message = await sendMessage(req.body);
    res.json(message);
  } catch (exception) {
    next(exception);
  }
});

messageRouter.post("/followers/:postId", async (req, res, next) => {
  const notifyFollowers = message => {
    return new Promise((resolve, reject) => {
      // Get all followers of the post
      const query = `
        SELECT user_id FROM post_follows
        WHERE post_id = ?
      `;
      connection.query(query, [req.params.postId], (err, results) => {
        if (err) {
          reject(new Error("Unable to send message"));
        } else {
          const userIds = results
            .reduce((acc, curr) => {
              return [...acc, curr.user_id];
            }, [])
            .filter(id => id !== req.userId);
          // Send messages to followers, excluding self

          const query = `
            INSERT INTO messages (sender_id, recipient_id, content, has_read, subject) VALUES ?
          `;

          const messageValues = userIds.map(uid => {
            return {
              sender_id: null,
              recipient_id: uid,
              content: message.content,
              has_read: 0,
              subject: "A user has responded to a followed post"
            };
          });

          connection.query(
            query,
            [
              messageValues.map(msg => [
                msg.sender_id,
                msg.recipient_id,
                msg.content,
                msg.has_read,
                msg.subject
              ])
            ],
            (err, results) => {
              if (err) {
                reject(new Error(err.message));
              } else {
                resolve("done");
              }
            }
          );
        }
      });
    });
  };
  try {
    const message = await notifyFollowers(req.body.message);
    res.json({ message });
  } catch (exception) {
    next(exception);
  }
});

messageRouter.put("/", async (req, res, next) => {
  const setMessageRead = (messageId, userId) => {
    return new Promise((resolve, reject) => {
      const query = `
        UPDATE messages
        SET has_read = 1
        WHERE messages.id = ? AND recipient_id = ?
      `;
      connection.query(query, [messageId, userId], (err, results) => {
        if (err) {
          reject(new Error("Unable to set read status on message"));
        } else {
          resolve({ message: "Message set as read" });
        }
      });
    });
  };

  try {
    const success = setMessageRead(req.body.id, req.userId);
    res.json(success);
  } catch (exception) {
    next(exception);
  }
});

messageRouter.delete("/", async (req, res, next) => {
  const deleteMessage = (messageId, userId) => {
    return new Promise((resolve, reject) => {
      const query = `
        DELETE FROM messages
        WHERE id = ? AND recipient_id = ?
      `;
      connection.query(query, [messageId, userId], (err, results) => {
        if (err) {
          reject(new Error("Unable to delete message"));
        } else {
          resolve({ message: "Message deleted" });
        }
      });
    });
  };

  try {
    const success = deleteMessage(req.body.id, req.userId);
    res.json(success);
  } catch (exception) {
    next(exception);
  }
});

// Pagination for user messages
messageRouter.get("/paginate", async (req, res, next) => {
  const userId = req.userId;

  // "UNREAD", "ALL", "SERVER", "DIRECTS"
  const filter = req.query.filter;
  const currentPage = req.query.page;
  const offset = parseInt(currentPage - 1) * 20;

  const getMessages = () => {
    return new Promise((resolve, reject) => {
      let query;

      switch (filter) {
        case "UNREAD":
          query = `
            SELECT messages.*, username AS sender_username FROM messages
            LEFT JOIN users ON users.id = messages.sender_id 
            WHERE recipient_id = ? AND has_read = 0
            ORDER BY created_at DESC
            LIMIT 20 OFFSET ?
          `;
          break;
        case "ALL":
          query = `
            SELECT messages.*, username AS sender_username FROM messages
            LEFT JOIN users ON users.id = messages.sender_id
            WHERE recipient_id = ?
            ORDER BY created_at DESC
            LIMIT 20 OFFSET ?
          `;
          break;
        case "SERVER":
          query = `
            SELECT * FROM messages 
            WHERE recipient_id = ? AND sender_id IS NULL
            ORDER BY created_at DESC
            LIMIT 20 OFFSET ?
          `;
          break;
        case "DIRECTS":
          query = `
            SELECT messages.*, username AS sender_username FROM messages
            JOIN users ON users.id = messages.sender_id 
            WHERE recipient_id = ? AND sender_id IS NOT NULL
            ORDER BY created_at DESC
            LIMIT 20 OFFSET ?
          `;
          break;
        default:
          reject(new Error("Invalid filter for messages"));
      }

      connection.query(query, [userId, offset], (err, results) => {
        if (err) {
          reject(new Error("Unable to get messages"));
        } else {
          resolve(results);
        }
      });
    });
  };

  try {
    const messages = await getMessages();
    res.json(messages);
  } catch (exception) {
    next(exception);
  }
});

// Count max # of pages for message pagination
messageRouter.get("/count", async (req, res, next) => {
  const userId = req.userId;

  // "UNREAD", "ALL", "SERVER", "DIRECTS"
  const filter = req.query.filter;

  const countPages = () => {
    return new Promise((resolve, reject) => {
      let query;

      switch (filter) {
        case "UNREAD":
          query = `
            SELECT COUNT(*) AS total FROM messages 
            WHERE recipient_id = ? AND has_read = 0
          `;
          break;
        case "ALL":
          query = `
            SELECT COUNT(*) AS total FROM messages 
            WHERE recipient_id = ?
          `;
          break;
        case "SERVER":
          query = `
            SELECT COUNT(*) AS total FROM messages 
            WHERE recipient_id = ? AND sender_id IS NULL
          `;
          break;
        case "DIRECTS":
          query = `
            SELECT COUNT(*) AS total FROM messages 
            WHERE recipient_id = ? AND sender_id IS NOT NULL
          `;
          break;
        default:
          reject(new Error("Invalid filter for messages"));
      }

      connection.query(query, [userId], (err, results) => {
        if (err) {
          reject(
            new Error("Unable to count required pages for message pagination")
          );
        } else {
          resolve({ pages: Math.ceil(Object.values(results[0])[0] / 20) });
        }
      });
    });
  };

  try {
    const data = await countPages();
    console.log(data);
    res.json(data);
  } catch (exception) {
    next(exception);
  }
});

module.exports = messageRouter;
