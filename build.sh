#!/bin/bash

go-bindata ./assets/... index.html
go build main.go
