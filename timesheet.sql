DROP TABLE IF EXISTS project;
CREATE TABLE `project` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL,
  `description` varchar(150) DEFAULT NULL,
  `timestamp` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `project_id_uindex` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

INSERT INTO project (id, name, description)
VALUES
  (1, 'My Home Project', 'small home project'),
  (2, 'Website for John', 'John wants a website for his business'),
  (3, 'Build RESTful API for new app', 'project manager wants a RESTful API for the new app');

DROP TABLE IF EXISTS user;
CREATE TABLE `user` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(35) NOT NULL,
  `email` varchar(50) DEFAULT NULL,
  `passwd` varchar(150) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_id_uindex` (`id`),
  UNIQUE KEY `user_username_uindex` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

# user: slashdb, password: slashdb
INSERT INTO user (id, username, description, email,passwd)
VALUES (1, 'slashdb', 'slashdb@vtenterprise.com', '3514555726a77ab19eb675b499141dc6c407680a56c42b6d3411fc598b3ff97c');

DROP TABLE IF EXISTS timesheet;
CREATE TABLE `timesheet` (
  `user_id` int(11) NOT NULL,
  `project_id` int(11) NOT NULL,
  `date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `duration` double NOT NULL,
  `accomplishments` varchar(150) DEFAULT NULL,
  PRIMARY KEY (`user_id`,`project_id`,`date`),
  FOREIGN KEY (`user_id`) REFERENCES `user` (`id`),
  FOREIGN KEY (`project_id`) REFERENCES `project` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

INSERT INTO timesheet (user_id, project_id, duration, accomplishments)
VALUES
  (1, 1, 5, 'drew blueprints'),
  (1, 2, 3, 'gotten materials'),
  (1, 2, 1.25, 'prepared tools'),
  (1, 2, 72, 'build tree house'),
  (1, 2, 2.25, 'talked with John about the website'),
  (1, 2, 6, 'designed page functionality'),
  (1, 2, 8.11, 'designed website UI'),
  (1, 2, 24, 'implemented page'),
  (1, 2, 2.5, 'meeting with John about the progress'),
  (1, 3, 3, 'gotten credentials for the DB'),
  (1, 3, 1, 'installed SlashDB form docker hub'),
  (1, 3, 0.25, 'new apps DB info to SlashDB'),
  (1, 3, 0.5, 'told PM where the API is located and what is the API key');;
