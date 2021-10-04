/* 

Here are all the CREATE TABLE statements for this project. 
Last updated: 9-28-21

*/
/* 

CREATE TABLE `bookmarks` (
 `user_id` int(11) NOT NULL,
 `comment_id` int(11) NOT NULL,
 `created_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
 PRIMARY KEY (`user_id`,`comment_id`),
 KEY `comment_id` (`comment_id`),
 CONSTRAINT `bookmarks_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
 CONSTRAINT `bookmarks_ibfk_2` FOREIGN KEY (`comment_id`) REFERENCES `comments` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4

CREATE TABLE `comments` (
 `id` int(11) NOT NULL AUTO_INCREMENT,
 `commenter_id` int(11) NOT NULL,
 `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
 `parent_id` int(11) DEFAULT NULL,
 `comment_body` text DEFAULT NULL,
 `post_id` int(11) NOT NULL,
 `deleted` char(1) DEFAULT 'N',
 PRIMARY KEY (`id`),
 KEY `commenter_id` (`commenter_id`),
 KEY `parent_id` (`parent_id`),
 CONSTRAINT `comments_ibfk_1` FOREIGN KEY (`commenter_id`) REFERENCES `users` (`id`),
 CONSTRAINT `comments_ibfk_2` FOREIGN KEY (`parent_id`) REFERENCES `comments` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=366 DEFAULT CHARSET=utf8mb4

CREATE TABLE `comment_votes` (
 `user_id` int(11) NOT NULL,
 `comment_id` int(11) NOT NULL,
 `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
 `vote_value` smallint(6) NOT NULL,
 PRIMARY KEY (`user_id`,`comment_id`),
 KEY `comment_id` (`comment_id`),
 CONSTRAINT `comment_votes_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
 CONSTRAINT `comment_votes_ibfk_2` FOREIGN KEY (`comment_id`) REFERENCES `comments` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4

CREATE TABLE `groups` (
 `id` int(11) NOT NULL AUTO_INCREMENT,
 `owner_id` int(11) NOT NULL,
 `group_name` varchar(120) NOT NULL,
 `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
 `blurb` text DEFAULT NULL,
 PRIMARY KEY (`id`),
 UNIQUE KEY `group_name` (`group_name`),
 KEY `groups_ibfk_1` (`owner_id`),
 CONSTRAINT `groups_ibfk_1` FOREIGN KEY (`owner_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=63 DEFAULT CHARSET=utf8mb4

CREATE TABLE `group_subscribers` (
 `group_id` int(11) NOT NULL,
 `user_id` int(11) NOT NULL,
 `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
 PRIMARY KEY (`group_id`,`user_id`),
 KEY `user_id` (`user_id`),
 CONSTRAINT `group_subscribers_ibfk_1` FOREIGN KEY (`group_id`) REFERENCES `groups` (`id`) ON DELETE CASCADE,
 CONSTRAINT `group_subscribers_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4

CREATE TABLE `messages` (
 `id` int(11) NOT NULL AUTO_INCREMENT,
 `sender_id` int(11) DEFAULT NULL,
 `recipient_id` int(11) NOT NULL,
 `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
 `content` text DEFAULT NULL,
 `has_read` char(1) NOT NULL DEFAULT 'N',
 `subject` varchar(100) DEFAULT NULL,
 PRIMARY KEY (`id`),
 KEY `recipient_id` (`recipient_id`),
 CONSTRAINT `messages_ibfk_1` FOREIGN KEY (`recipient_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=399 DEFAULT CHARSET=utf8mb4

CREATE TABLE `posts` (
 `id` int(11) NOT NULL AUTO_INCREMENT,
 `submitter_id` int(11) NOT NULL,
 `group_id` int(11) NOT NULL,
 `title` varchar(100) NOT NULL,
 `post_body` text DEFAULT NULL,
 `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
 PRIMARY KEY (`id`),
 KEY `submitter_id` (`submitter_id`),
 KEY `posts_ibfk_2` (`group_id`),
 CONSTRAINT `posts_ibfk_1` FOREIGN KEY (`submitter_id`) REFERENCES `users` (`id`),
 CONSTRAINT `posts_ibfk_2` FOREIGN KEY (`group_id`) REFERENCES `groups` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=280 DEFAULT CHARSET=utf8mb4

CREATE TABLE `post_follows` (
 `user_id` int(11) NOT NULL,
 `post_id` int(11) NOT NULL,
 `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
 PRIMARY KEY (`user_id`,`post_id`),
 KEY `post_follows_ibfk_2` (`post_id`),
 CONSTRAINT `post_follows_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
 CONSTRAINT `post_follows_ibfk_2` FOREIGN KEY (`post_id`) REFERENCES `posts` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4

CREATE TABLE `post_votes` (
 `user_id` int(11) NOT NULL,
 `post_id` int(11) NOT NULL,
 `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
 `vote_value` smallint(6) NOT NULL,
 PRIMARY KEY (`user_id`,`post_id`),
 KEY `post_votes_ibfk_2` (`post_id`),
 CONSTRAINT `post_votes_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
 CONSTRAINT `post_votes_ibfk_2` FOREIGN KEY (`post_id`) REFERENCES `posts` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4

CREATE TABLE `users` (
 `id` int(11) NOT NULL AUTO_INCREMENT,
 `username` varchar(20) NOT NULL,
 `hashed_password` varchar(255) NOT NULL,
 `email` varchar(255) NOT NULL,
 `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
 PRIMARY KEY (`id`),
 UNIQUE KEY `username` (`username`),
 UNIQUE KEY `unique_email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=136 DEFAULT CHARSET=utf8mb4

*/