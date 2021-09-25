CREATE TABLE users(
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(20) UNIQUE NOT NULL,
  hashed_password VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE groups(
  id INT AUTO_INCREMENT PRIMARY KEY,
  owner_id INT NOT NULL,
  group_name VARCHAR(120) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY(owner_id) REFERENCES users(id)
);

CREATE TABLE posts(
  id INT AUTO_INCREMENT PRIMARY KEY,
  submitter_id INT NOT NULL,
  group_id INT NOT NULL,
  title VARCHAR(100) NOT NULL,
  content VARCHAR(65535),
  created_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY(submitter_id) REFERENCES users(id),
  FOREIGN KEY(group_id) REFERENCES groups(id) ON DELETE CASCADE
);

CREATE TABLE comments(
  id INT AUTO_INCREMENT PRIMARY KEY,
  commenter_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY(commenter_id) REFERENCES users(id)
);

CREATE TABLE post_votes(
  user_id INT NOT NULL,
  post_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  vote_value SMALLINT NOT NULL,
  FOREIGN KEY(user_id) REFERENCES users(id),
  FOREIGN KEY(post_id) REFERENCES posts(id),
  PRIMARY KEY(user_id, post_id)
);

CREATE TABLE comment_votes(
  user_id INT NOT NULL,
  comment_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  vote_value SMALLINT NOT NULL,
  FOREIGN KEY(user_id) REFERENCES users(id),
  FOREIGN KEY(comment_id) REFERENCES comments(id),
  PRIMARY KEY(user_id, comment_id)
);

CREATE TABLE post_follows(
  user_id INT NOT NULL,
  post_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY(user_id) REFERENCES users(id),
  FOREIGN KEY(post_id) REFERENCES posts(id) ON DELETE CASCADE,
  PRIMARY KEY(user_id, post_id)
);

CREATE TABLE group_subscribers(
  group_id INT NOT NULL,
  user_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY(group_id) REFERENCES groups(id) ON DELETE CASCADE,
  FOREIGN KEY(user_id) REFERENCES users(id),
  PRIMARY KEY(group_id, user_id)
);