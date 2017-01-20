#!/bin/bash

APP_NAME=timesheet

# install requirements
go get github.com/dgrijalva/jwt-go/...
go get golang.org/x/crypto/pbkdf2
go get github.com/jteeuwen/go-bindata/...
go get github.com/elazarl/go-bindata-assetfs/...

# build assets bindata.go file
go-bindata ./assets/... index.html

# build executable for linux, osx and windows
GOOS=linux GOARCH=amd64 go build -o $APP_NAME-linux64
zip -9 $APP_NAME-linux64.zip $APP_NAME-linux64
GOOS=darwin GOARCH=amd64 go build -o $APP_NAME-osx64
zip -9 $APP_NAME-osx64.zip $APP_NAME-osx64
GOOS=windows GOARCH=amd64 go build -o $APP_NAME-win64.exe
zip -9 $APP_NAME-win64.zip $APP_NAME-win64.exe
