/*
MIT License

Copyright (c) 2020 Naveen Kumarasinghe

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

const fs = require('fs')
const crypto = require('crypto')
const bcrypt = require('bcryptjs')

/********************************** CONSTANTS ***********************************/

const AUTH_TOKEN_LENGTH = 40
const AUTH_TOKEN_AGE = 30 * 24 * 60 * 60 * 1000 // 30 days
const DATA_DIR = require('path').dirname(require.main.filename) + '/slimauth'
const ACCOUNT_STORE_FILE = DATA_DIR + '/accounts.json'
const TOKEN_STORE_FILE = DATA_DIR + '/tokens.json'
let accountStore, tokenStore, loginURL
let privateURLObject = {}

/********************************* API CLASS **********************************/

class SlimAuth {

    constructor() {
        this.requestAuthenticator = middleware
    }


    setOptions(options){

        if (options.loginPageURL) { loginURL = options.loginPageURL }
        if (options.authValidDuration) { AUTH_TOKEN_AGE = options.authValidDuration * 24 * 60 * 60 * 1000 }

        if (options.privateURLArray) {
            // convert the array to an object for faster access
            options.privateURLArray.forEach((publicUrl) => {
                privateURLObject[publicUrl] = true
            })
        }

    }


    createUser(userID, password) {

        return new Promise((resolve, reject) => {

            // if account exists
            if (accountStore[userID]) {
                reject(new Error('User account already exists'))
                return
            }
            // account does not exist
            else {

                // store new account in account store
                accountStore[userID] = getTextHash(password)

                // save store to disk
                writeJSON(ACCOUNT_STORE_FILE, accountStore)

                resolve()
            }

        })

    }


    deleteUser(userID, password) {

        return new Promise((resolve, reject) => {

            // if account does not exists
            if (!accountStore[userID]) {
                reject(new Error('User account des not exists'))
            }
            // incorrect password
            else if (accountStore[userID] != getTextHash(password)) {
                reject(new Error('Incorrect password'))
            }
            // account exists
            else {

                // delete account from account store
                delete accountStore[userID]

                // save store to disk
                writeJSON(ACCOUNT_STORE_FILE, accountStore)

                // deauth user
                this.deauthenticate(userID)

                resolve()
            }

        })

    }


    updatePassword(userID, currentPassword, newPassword) {

        return new Promise((resolve, reject) => {

            // if account does not exists
            if (!accountStore[userID]) {
                reject(new Error('User account does not exists'))
            }
            // incorrect password
            else if (accountStore[userID] != getTextHash(currentPassword)) {
                reject(new Error('Incorrect password'))
            }
            // account exists
            else {
                // update password in store
                accountStore[userID] = getTextHash(newPassword)

                // save store to disk
                writeJSON(ACCOUNT_STORE_FILE, accountStore)

                resolve()
            }

        })

    }


    authenticate(userID, password, res) {

        return new Promise((resolve, reject) => {

            let passwordHash = accountStore[userID]

            if (!passwordHash) {
                reject(new Error(`${userID} does not exist`))
            }
            // local password hash does not match with foreign password
            else if (passwordHash != getTextHash(password.toString())) {
                reject(new Error('incorrect password'))
            }
            // passwords match
            else {

                // delete any existing access token of the user
                for (let token in tokenStore) {
                    if (tokenStore[token] == userID) {
                        delete tokenStore[token]
                        break
                    }
                }

                // issue a unique new access token to client
                let accessToken
                do {
                    accessToken = getRandomString(AUTH_TOKEN_LENGTH)
                }
                while (tokenStore[accessToken])

                res.cookie('slimauth', accessToken, { maxAge: AUTH_TOKEN_AGE, sameSite: true })

                // store token in server
                tokenStore[accessToken] = userID
                writeJSON(TOKEN_STORE_FILE, tokenStore)

                resolve()

            }

        })

    }


    deauthenticate(userID) {

        for (let token in tokenStore) {
            if (tokenStore[token] == userID) {
                delete tokenStore[token]
                break
            }
        }

        writeJSON(TOKEN_STORE_FILE, tokenStore)

    }

}

/************************ EXPRESS MIDDLEWARE HANDLER **************************/

function middleware(req, res, next) {

    // find access token in cookies
    let cookies = decodeURIComponent(req.headers.cookie)
    let cookieStart = cookies.indexOf('slimauth=')

    // cookie exists
    if (cookieStart > -1) {

        // extract access token
        let token = cookies.substr(cookieStart + 9, AUTH_TOKEN_LENGTH)

        // inject userID to request
        req.userID = res.userID = tokenStore[token]

    }

    // reject requests for private pages from guests
    if (req.userID == undefined && privateURLObject[req.baseUrl + req.path]) {
        // redirect to login page if available
        if (loginURL) {
            res.redirect(loginURL + '?redirect=' + encodeURIComponent(req.protocol + '://' + req.get('host') + req.originalUrl))
        }
        else {
            res.sendStatus(401)
        }
        return
    }

    next()

}

/****************************** UTILITY FUNCTIONS *******************************/

/*
returns a random string in base64 format
*/
function getRandomString(charCount) {
    return crypto.randomBytes(charCount * 0.75).toString('base64').replace(/\W/g, '_')
}


/*
returns json content in a given file
returns undefined if json file does not exists
*/
function readJSON(filename) {

    if (fs.existsSync(filename) == false) {
        return undefined
    }
    else {
        return JSON.parse(fs.readFileSync(filename), { encoding: 'utf8' })
    }
}


/*
writes a json object to a file
*/
function writeJSON(filename, object) {
    fs.writeFileSync(filename, JSON.stringify(object))
}


/*
returns bcrypt hash checksum of given data
*/
function getTextHash(data) {
    let salt = bcrypt.genSaltSync(10)
    return bcrypt.hashSync(data.toString(), salt)
}

/************************************ MAIN *************************************/

// create DATA_DIR
fs.existsSync(DATA_DIR) || fs.mkdirSync(DATA_DIR)

// create account store
fs.existsSync(ACCOUNT_STORE_FILE) || writeJSON(ACCOUNT_STORE_FILE, {})

// load account data
accountStore = readJSON(ACCOUNT_STORE_FILE)

// create token store
fs.existsSync(TOKEN_STORE_FILE) || writeJSON(TOKEN_STORE_FILE, {})

// load token data
tokenStore = readJSON(TOKEN_STORE_FILE)

module.exports = new SlimAuth()
