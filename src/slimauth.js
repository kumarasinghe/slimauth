const fs = require('fs')
const crypto = require('crypto')

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

    constructor(loginPageURL, privateURLArray, authValidDuration) {

        if (loginPageURL) { loginURL = loginPageURL }
        if (authValidDuration) { AUTH_TOKEN_AGE = authValidDuration * 24 * 60 * 60 * 1000 }

        if (privateURLArray) {
            privateURLArray.forEach((publicUrl) => {
                privateURLObject[publicUrl] = true
            })
        }

        this.requestAuthenticator = middleware
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
            res.redirect(loginURL + '?headingto=' + encodeURIComponent(req.baseUrl + req.path))
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
returns md5 hash checksum of given data
*/
function getTextHash(data) {
    return crypto.createHash('sha1').update(data.toString()).digest("hex")
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

module.exports = SlimAuth