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
	port, proxyPort uint
	sdbInstanceAddr string
	sdbAPIKey       string
}

var pa = &ArgFlags{}

func init() {
	flag.StringVar(&pa.interf, "interface", "localhost", "interface to serve on")
	flag.UintVar(&pa.port, "port", 8000, "local port to serve on")
	flag.UintVar(&pa.proxyPort, "proxy-port", 9090, "SlashDB local proxy port")
	flag.StringVar(&pa.sdbInstanceAddr, "sdb-address", "https://beta.slashdb.com", "SlashDB instance address")
	flag.StringVar(
		&pa.sdbAPIKey,
		"sdb-apikey", "apikey:timesheet-api-key", "SlashDB user API key, key and value separated by single ':'",
	)
	flag.Parse()
}

func setupAuthHandlers() {
	http.HandleFunc("/auth/", func(w http.ResponseWriter, r *http.Request) {

	})
}

func setupBasicHandlers() {
	afs := &assetfs.AssetFS{Asset: Asset, AssetDir: AssetDir, AssetInfo: AssetInfo, Prefix: ""}
	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		data, err := afs.Asset("index.html")
		if err != nil {
			log.Fatalln(err)
		}
		w.Write(data)
	})
	fs := http.FileServer(afs)
	http.Handle("/static/", http.StripPrefix("/static/", fs))
}

func startProxy() {
	url, err := url.Parse(pa.sdbInstanceAddr)
	if err != nil {
		log.Fatalln(err)
	}

	proxy := httputil.NewSingleHostReverseProxy(url)
	tr := &http.Transport{
		TLSClientConfig: &tls.Config{InsecureSkipVerify: true},
	}
	proxy.Transport = tr

	tmp := strings.Split(pa.sdbAPIKey, ":")
	if len(tmp) != 2 {
		log.Fatalln(fmt.Errorf("expected key, value pair, got: %s", pa.sdbAPIKey))
	}

	keyName, keyValue := tmp[0], tmp[1]
	proxyHandler := func(w http.ResponseWriter, r *http.Request) {
		q := r.URL.Query()
		q.Set(keyName, keyValue)
		r.URL.RawQuery = q.Encode()
		proxy.ServeHTTP(w, r)
	}

	addr := fmt.Sprintf("%s:%d", pa.interf, pa.proxyPort)
	fmt.Printf("SlashDB proxy running on %s.\n", addr)
	log.Fatal(http.ListenAndServe(addr, http.HandlerFunc(proxyHandler)))
}

func main() {
	go startProxy()
	setupBasicHandlers()
	setupAuthHandlers()
	addr := fmt.Sprintf("%s:%d", pa.interf, pa.port)
	fmt.Printf("Serving on %s.\n", addr)
	log.Fatal(http.ListenAndServe(addr, nil))
}
