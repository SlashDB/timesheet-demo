# Building a simple timesheet app with SlashDB, Go and Vue

## Requirements
* [SlashDB](https://www.slashdb.com/) >= 0.9.15
* [Go](https://golang.org/dl/) >= 1.7.4
* [Vue](https://vuejs.org/v2/guide/installation.html) >= 2.1.10

## The Code
All the code refereed in this article is available at the [bitbucket GIT repository](https://bitbucket.org/slashdb/timesheet/src).

## The basic concept
Is to build a simple poof of concept time tracking app, either for local use or as a network 
available service and basing it on SlashDB.

### The timesheet app layout:
```
RESTful API <---> (small authentication/authorization proxy app <---> frontend GUI)
```
What the developer needs to implement is, the frontend GUI 
and also a way to implement authentication/authorization for the user.
The RESTful part is provided to us for free by SlashDB.

## SlashDB
For the DB back-end I will be using [SlashDB](https://www.slashdb.com/). 
It can automatically generates a REST API from relational databases making it easy to access and modify our data. 
In general, it will save a lot of work coding my own data API-s.

## Go
[Go](https://golang.org/) (Golang for search engines) is a language by Google, often used as a (micro)service building tools. 
It has most batteries included, allowing us to build a simple authentication layer between our data and the frontend. 
It's also a compiled language i.e. we can build statically linked binaries for easy distribution and even embed our assets (CSS, js etc) 
into that binary.

## Vue
After my experience with Angular 1.x (and a bit of React), 
I choose [Vue](https://vuejs.org/) - a small and simple front-end js framework. 
It's somewhere between those two frameworks (but a lot closer to React) and 
only focuses on the V(iew) part of MVC. 
On the Angular side, we have things like template directives (i.e. *ng-for="item in items"* -> *v-for="item in items"*) 
so no cumbersome JSX transpiling by default (a plus - at least for me). 
On Reacts side, one-way data flow i.e. always parent node -> child node (so harder to achieve the level of craziness like in Angular). 
In general ease of use and comprehension of what the app is doing, also the awesome [dev tools](https://github.com/vuejs/vue-devtools) :)

### SlashDB Service

> **Important**: This part requires you to understand the basic of *SQL* and DB server setup 
(if you choose to use something other thant SQLite).

For development purposes, SlashDB is [available for free use](https://www.slashdb.com/download/) 
and I recommend using the [docker](https://docs.slashdb.com/user-guide/docker.html) image for an easy way to get started.

```
$ docker pull slashdb/slashdb
$ mkdir timesheet-docker
$ cd timesheet-docker
$ wget -c http://downloads.slashdb.com/v0.9/default-slashdb-configs_0.9.15.zip
$ unzip default-slashdb-configs_0.9.15.zip
$ docker run -d -p 8000:80 -v $PWD/slashdb:/etc/slashdb -v $PWD/slashdb:/var/log/slashdb slashdb/slashdb
```

Go to [http://localhost:8000/](http://localhost:8000/) and follow the initial developer setup wizard.

Now we need to create a database, in this example I'll be using MySQL, but any [DB engine supported by SlashDB](https://www.slashdb.com/pricing/) will do. 
Installing/configuring MySQL server is outside of scope of this article, so I'll just skip this part. 
For the timesheet app we'll need a database (preferably named *timesheet*), 
a user with read/write privileges to said DB and 3 tables: *project*, *user* and *timesheet*.

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

After we have our DB, tables and user setup we need to make SlashDB aware of it.
Going to [http://localhost:8000/](http://localhost:8000/) and logging-in as the *admin*,
we can [config and add our database endpoint](https://docs.slashdb.com/user-guide/config-databases.html).
For simplicity, I named the endpoint *timesheet*.
In this case, I also enabled the *Auto Discover* feature and provided credentials for my MySQL user.
Save, remembering to make sure the DB was connected without errors (green *Connected* status) and we're set.

It's a good idea to create a new user for remote access to our resources, 
so following the [docs](https://docs.slashdb.com/user-guide/config-users.html),
I'll add a user named - you guessed it - *timesheet*. 
Also as our proxy authorization/authentication app will connect to SlashDB directly it's a good idea 
to set an API key for that user - in this example: *timesheet-api-key*.
Finally, add our newly created data source to this users *Database Mappings* and *Save*. 
Login as the *timesheet* user, and check if we have access to our tables.
Going to the [project endpoint](http://localhost:8000/db/timesheet/project.html), 
we should see an empty table - but (hopefully) no errors.

Thats it - no you have your data provided as an RESTful API, curtesy of SlashDB :)

### GoLang proxy authorization/authentication app

> **Important**: This part requires you to understand some basics of programming in Go, 
its setup (i.e. [$GOPATH/$GOROOT(https://github.com/golang/go/wiki/GOPATH)]) 
and it's basic tooling (i.e. go get/build/install). Form more reference on that visit Go-s 
[wiki page](https://github.com/golang/).

The basic idea is to proxy all the request from the frontend to the SlashDB RESTful API 
and on the fly do some resource authorization. 
Also we need to provide a way to create and authenticate *timesheet* app users.

In my setup, this proxy-like app will have 4 endpoints.
```
/          - the SlashDB proxy
/app/      - the frontend app itself
/app/auth/ - user login/token provider
/app/reg/  - user registration provider
```

In the spirit of keeping it simple, as a method of of providing a kind of stateless session, we'll use [JWT](https://jwt.io/).
The */app/auth/* endpoint will check user credentials and if everything's OK, provide a JWT token.

First, things first lets install everything we'll need:
```
$ go get golang.org/x/crypto/pbkdf2
$ go get github.com/dgrijalva/jwt-go/...
$ go get github.com/jteeuwen/go-bindata/...
$ go get github.com/elazarl/go-bindata-assetfs/...
```

> Tip: you can just run the build.sh script to install all requirements and compile the app.

#### Setting up authorization/authentication proxy

Using GoLangs builtin *httputil.ReverseProxy*, we create a lightweight reverse proxy:

```go
// for the full code, view auth.go source file
func setupProxy() {
	// get address for the SlashDB instance and parse the URL
	url, err := url.Parse(pa.SdbInstanceAddr)
	if err != nil {
		log.Fatalln(err)
	}

	// create a reverse proxy
	proxy := httputil.NewSingleHostReverseProxy(url)
	// make it play nice with https endpoints
	proxy.Transport = &http.Transport{
		TLSClientConfig: &tls.Config{InsecureSkipVerify: true},
	}

	...

	// bind the proxy handler to "/"
	http.HandleFunc("/", authorizationMiddleware(proxyHandler))
}
```

So now, when requesting something from the default *localhost:8000* 
request will get redirected to the root of the selected SlashDB instance 
i.e. requesting 
> http://localhost:8000/db/timesheet/project/project_id/1.json -> http://demo.slashdb.com/db/timesheet/project/project_id/1.json

and the response will be transparently returned to the us.

The *authorizationMiddleware* function applies all the authorization logic to the proxied requests i.e.
it extracts the JWT token and checks if it's valid and depending on the user it allows 
or prohibits resource access.
