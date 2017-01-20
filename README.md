# Building a simple timesheet app with SlashDB, Go and Vue

## SlashDB
For the DB back-end I will be using [SlashDB](https://www.slashdb.com/).
It can automatically generates a REST API from relational databases making it easy to access and modify our data.
In general, it will save a lot of work coding my own data API-s.

## Go
[Go](https://golang.org/) (Golang for search engines) is a language by Google, often used as a (micro)service building tools.
It has most batteries included, allowing us to build a simple authentication layer between our data and the frontend.
It's also a compiled language i.e. we can build statically linked binaries for easy distribution.

# Vue
After my experience with Angular 1.x (and a bit of React),
I choose [Vue](https://vuejs.org/) - a small and simple front-end js framework.
It's somewhere between those two frameworks (but a lot closer to React) and
only focuses on the V(iew) part of MVC.
On the Angular side, we have things like template directives (i.e. *ng-for="item in items"* -> *v-for="item in items"*)
so no cumbersome JSX transpiling by default (a plus - at least for me).
On Reacts side, one-way data flow i.e. always parent node -> child node (so harder to achieve the level of craziness like in Angular).
In general ease of use and comprehension of what the app is doing, also the awesome [dev tools](https://github.com/vuejs/vue-devtools) :)

### SlashDB Service
For development purposes, SlashDB is [available for free](https://www.slashdb.com/download/)
and I recommend using the [docker](https://docs.slashdb.com/user-guide/docker.html) image for an easy start.

```
$ mkdir timesheet-docker
$ cd timesheet-docker
$ docker pull slashdb/slashdb
$ wget -c http://downloads.slashdb.com/v0.9/default-slashdb-configs_0.9.15.zip
$ unzip default-slashdb-configs_0.9.15.zip
$ docker run -d -p 8000:80 -v ./slashdb:/etc/slashdb -v ./slashdb:/var/log/slashdb slashdb:0.9.15
```

Now we need to create a database, in this example I'll be using MySQL, but any [DB engine supported by SlashDB](https://www.slashdb.com/pricing/) will do.
Installing/configuring MySQL server is outside of scope of this article, so I'll just skip this part.
For the timesheet app we'll need an database (preferably named *timesheet*), a user with read/write privileges to it and 3 tables.

```sql
DROP TABLE IF EXISTS project;
CREATE TABLE `project` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL,
  `description` varchar(150) DEFAULT NULL,
  `timestamp` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `project_id_uindex` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;


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


DROP TABLE IF EXISTS timesheet;
CREATE TABLE `timesheet` (
  `user_id` int(11) NOT NULL,
  `project_id` int(11) NOT NULL,
  `date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `duration` double NOT NULL,
  `accomplishments` varchar(150) DEFAULT NULL,
  PRIMARY KEY (`user_id`,`project_id`,`date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
```

This is MySQL-s SQL dialect, but it gives a general idea about the table layout
and is easy enough to adjust for other SQL dialects.
