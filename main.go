package main

import (
	"crypto/tls"
	"flag"
	"fmt"
	"log"
	"net/http"
	"net/http/httputil"
	"net/url"
	"strings"

	assetfs "github.com/elazarl/go-bindata-assetfs"
)

type ArgFlags struct {
	interf          string
	port            uint
	sdbInstanceAddr string
	sdbAPIKey       string
}

var (
	pa   = &ArgFlags{}
	addr string
)

func init() {
	flag.StringVar(&pa.interf, "interface", "localhost", "interface to serve on")
	flag.UintVar(&pa.port, "port", 8000, "local port to serve on")
	flag.StringVar(&pa.sdbInstanceAddr, "sdb-address", "https://demo.slashdb.com", "SlashDB instance address")
	flag.StringVar(
		&pa.sdbAPIKey,
		"sdb-apikey", "apikey:timesheet-api-key", "SlashDB user API key, key and value separated by single ':'",
	)
	flag.Parse()
	addr = fmt.Sprintf("%s:%d", pa.interf, pa.port)
}

func setupAuthHandlers() {
	http.HandleFunc("/app/reg/", regHandler)
	http.HandleFunc("/app/auth/", authHandler)
}

func setupBasicHandlers() {
	afs := &assetfs.AssetFS{Asset: Asset, AssetDir: AssetDir, AssetInfo: AssetInfo, Prefix: ""}
	http.HandleFunc("/app/", func(w http.ResponseWriter, r *http.Request) {
		data, err := afs.Asset("index.html")
		if err != nil {
			log.Fatalln(err)
		}
		w.Write(data)
	})
	fs := http.FileServer(afs)
	http.Handle("/app/static/", http.StripPrefix("/app/static/", fs))
}

func setupProxy() {
	url, err := url.Parse(pa.sdbInstanceAddr)
	if err != nil {
		log.Fatalln(err)
	}

	proxy := httputil.NewSingleHostReverseProxy(url)
	proxy.Transport = &http.Transport{
		TLSClientConfig: &tls.Config{InsecureSkipVerify: true},
	}

	tmp := strings.Split(pa.sdbAPIKey, ":")
	if len(tmp) != 2 {
		log.Fatalln(fmt.Errorf("expected key, value pair, got: %s", pa.sdbAPIKey))
	}

	keyName, keyValue := tmp[0], tmp[1]
	proxyHandler := func(w http.ResponseWriter, r *http.Request) {
		// API key
		q := r.URL.Query()
		q.Set(keyName, keyValue)
		r.URL.RawQuery = q.Encode()
		// CORS
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "POST, GET, OPTIONS, PUT, DELETE")
		w.Header().Set(
			"Access-Control-Allow-Headers",
			"Accept, Origin, Content-Type, Content-Length, X-Requested-With, Accept-Encoding, X-CSRF-Token, Authorization",
		)
		proxy.ServeHTTP(w, r)
	}
	http.HandleFunc("/", proxyHandler)
}

func main() {
	setupProxy()
	setupBasicHandlers()
	setupAuthHandlers()
	fmt.Printf("Serving on http://%s/app/.\n", addr)
	log.Fatal(http.ListenAndServe(addr, nil))
}
