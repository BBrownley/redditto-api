const tokenExtractor = require("express").Router();
const jwt = require("jsonwebtoken");

tokenExtractor.use(async (req, res, next) => {
  if (!!req.headers.authorization) {
    try {
      const token = req.headers.authorization.split(" ")[1];
      const decodedToken = await jwt.verify(token, process.env.SECRET);

      req.username = decodedToken.username;
      req.userId = decodedToken.id;
    } catch (exception) {
      res.status(401).json({
        error: new Error("Invalid request")
      });
    }
  }

  next();
});

module.exports = tokenExtractor;
