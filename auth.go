package main

import (
	"bytes"
	"crypto/sha512"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"time"

	jwt "github.com/dgrijalva/jwt-go"

	"golang.org/x/crypto/pbkdf2"
)

func logAndWrite(err error, logMsg string, w http.ResponseWriter) {
	log.Println(logMsg+",", err)
	http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
}

var defaultSalt = []byte("timesheet app salt")

func genPassword(p string, salt []byte) string {
	if salt == nil {
		salt = defaultSalt
	}
	dk := pbkdf2.Key([]byte(p), salt, 4096, 32, sha512.New)
	return hex.EncodeToString(dk)
}

func basicValidation(name, val string, minLen, maxLen int) []string {
	errs := []string{}
	if len(val) < minLen {
		errs = append(errs, fmt.Sprintf("%q needs to be at least %d characters long", name, minLen))
	}
	if len(val) > maxLen {
		errs = append(errs, fmt.Sprintf("%q needs to be less than %d characters long", name, maxLen))
	}
	return errs
}

func writeValidationErrors(w http.ResponseWriter, vData map[string][]string) error {
	data, err := json.Marshal(vData)
	if err != nil {
		log.Printf("data: %v, error: %v\n", vData, err)
		http.Error(w, http.StatusText(http.StatusBadRequest), http.StatusBadRequest)
		return err
	}
	w.WriteHeader(http.StatusBadRequest)
	w.Write(data)
	return nil
}

func regHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method == "POST" {
		err := r.ParseForm()
		w.Header().Set("Content-Type", "application/json")
		if err != nil {
			logAndWrite(err, "", w)
			return
		}
		defer r.Body.Close()

		un := r.FormValue("username")
		unErrors := basicValidation("username", un, 3, 35)

		uresp, err := http.Get("http://" + addr + "/db/" + pa.SdbDBName + "/user/username/" + un + ".json")
		if err != nil {
			logAndWrite(err, fmt.Sprintf("couldn't find user %q, or service %q unavailable", un, addr), w)
			return
		}
		defer uresp.Body.Close()

		body, err := ioutil.ReadAll(uresp.Body)
		if err != nil {
			logAndWrite(err, "error reading user response body", w)
			return
		}
		if len(body) > 2 {
			unErrors = append(unErrors, fmt.Sprintf("user %q exists, please select a diffrent user name", un))
		}

		email := r.FormValue("email")
		emailErrors := basicValidation("email", email, 5, 50)

		passwd := r.FormValue("password")
		passwdErrors := basicValidation("password", passwd, 6, 150)

		validationData := map[string][]string{}
		if len(unErrors) > 0 {
			validationData["username"] = unErrors
		}

		if len(emailErrors) > 0 {
			validationData["email"] = emailErrors
		}

		if len(passwdErrors) > 0 {
			validationData["password"] = passwdErrors
		}

		if len(validationData) > 0 {
			writeValidationErrors(w, validationData)
			return
		}

		encodedPass := genPassword(un+passwd, nil)
		payload := map[string]string{
			"username": un,
			"passwd":   encodedPass,
			"email":    email,
		}
		data, err := json.Marshal(payload)
		if err != nil {
			log.Printf("data: %v, error: %v", payload, err)
			http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
			return
		}

		ureq, err := http.Post("http://"+addr+"/db/"+pa.SdbDBName+"/user.json", "application/json", bytes.NewReader(data))
		if err != nil {
			logAndWrite(err, fmt.Sprintf("couldn't create user %q, or service %q unavailable", un, addr), w)
			return
		}
		defer ureq.Body.Close()

		if ureq.StatusCode != http.StatusCreated {
			body, err := ioutil.ReadAll(ureq.Body)
			if err != nil {
				logAndWrite(err, "error reading user creation response body", w)
				return
			}

			w.WriteHeader(ureq.StatusCode)
			w.Header().Set("Content-Type", ureq.Header.Get("Content-Type"))
			w.Write(body)
			return
		}
		w.WriteHeader(http.StatusCreated)
		w.Write([]byte(fmt.Sprintf("User %q was created successfully!", un)))
	}
}

var defaultSecret = "timesheet app secret"

func genJWTToken(username string, id int, secret string) (string, error) {
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"username": username,
		"id":       id,
		"exp":      time.Now().Add(time.Hour * 24).Unix(),
	})
	if secret == "" {
		secret = defaultSecret
	}
	return token.SignedString(defaultSalt)
}

func authHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method == "POST" {
		err := r.ParseForm()
		w.Header().Set("Content-Type", "application/json")
		if err != nil {
			logAndWrite(err, "", w)
			return
		}
		defer r.Body.Close()

		un := r.FormValue("username")
		unErrors := basicValidation("username", un, 3, 35)

		var body []byte
		if len(unErrors) == 0 {
			uresp, err := http.Get("http://" + addr + "/db/" + pa.SdbDBName + "/user/username/" + un + ".json")
			if err != nil {
				logAndWrite(err, fmt.Sprintf("couldn't find user %q, or service %q unavailable", un, addr), w)
				return
			}
			defer uresp.Body.Close()

			body, err = ioutil.ReadAll(uresp.Body)
			if err != nil {
				logAndWrite(err, "error reading user response body", w)
				return
			}

			if len(body) == 2 {
				unErrors = append(unErrors, "no such user")
			}
		}

		passwd := r.FormValue("password")
		passErrors := basicValidation("password", passwd, 6, 150)

		validationData := map[string][]string{}
		if len(unErrors) > 0 {
			validationData["username"] = unErrors
		}

		if len(passErrors) > 0 {
			validationData["password"] = passErrors
		}

		if len(validationData) > 0 {
			writeValidationErrors(w, validationData)
			return
		}

		var data []map[string]interface{}
		err = json.Unmarshal(body, &data)
		if err != nil {
			logAndWrite(err, fmt.Sprintf("error marshalling %v", body), w)
			return
		}

		dataUn := data[0]["username"].(string)
		dataPasswd := data[0]["passwd"].(string)
		encodedPass := genPassword(un+passwd, nil)
		if dataUn != un || dataPasswd != encodedPass {
			errMsg := "wrong username or password"
			log.Printf("%s, expected: u: %q, p: %q, got: u: %q, p: %q\n", errMsg, dataUn, dataPasswd, un, encodedPass)
			w.WriteHeader(http.StatusUnauthorized)
			w.Write([]byte("{\"form\": \"" + errMsg + "\"}"))
			return
		}

		st, err := genJWTToken(un, int(data[0]["id"].(float64)), "")
		if err != nil {
			logAndWrite(err, "error generating JWT token", w)
			return
		}
		tc := struct {
			Token string `json:"accessToken"`
		}{st}
		td, err := json.Marshal(tc)
		if err != nil {
			log.Printf("data: %v, error: %v", tc, err)
			http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
			return
		}
		w.Write(td)
	}
}

func setupAuthHandlers() {
	http.HandleFunc("/app/reg/", regHandler)
	http.HandleFunc("/app/auth/", authHandler)
}

func authorizationMiddleware(fn func(http.ResponseWriter, *http.Request)) func(w http.ResponseWriter, r *http.Request) {
	return func(w http.ResponseWriter, r *http.Request) {
		fn(w, r)
	}
}
