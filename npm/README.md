<h1 align="center">SlimAuth - The Simplest NodeJS User Authentication Middleware</h1>

## `slimauth` lifts follwing work for you:

- Creating user accounts in backend
- Logging into accounts
- Authorizing subsequent browser requests
- Updating user passwords
- Removing user accounts
- Logging out from accounts

### **✔ No database required. Fully file based.**
### **✔ Works with Express.**
### **✔ Fast, lightweight & configuration-free.**

## API

| API  | Effect | Returns |
| ---- | --- | --- |
| slimauth.createUser (userID, password) | Creates a new user | A promise with success & failure handlers |
| slimauth.authenticate (userID, password, res) | Validates user login. Upon success, the client is given a token valid for next 30 days.| A promise with success & failure handlers |
| req.userID | Becomes available only when user has logged in. | N/A |
| slimauth.deauthenticate (userID) | Logs out the current user. Clear the token. | A promise with success & failure handlers |
| slimauth.updatePassword (userID, currentPassword, newPassword) | Updates the current password and logs user out. |  A promise with success & failure handlers |
| slimauth.deleteUser (userID, password) | Removes the account, access token and logs user out. | A promise with success & failure handlers |


## QUICK START
Install `slimauth` package:

    npm i slimauth

Add `slimauth` to your express app:
```js
    const express = require('express')
    const app = express()

    const slimAuth = require('slimauth')
    app.use(slimAuth.requestAuthenticator)

    app.use(express.urlencoded())   // allows reading POST request data
```

Validate incoming requests for your protected pages with `req.userID`:
```js
    app.get('/private-page', (req, res) => {

        if (req.userID) {
            // user is logged in! send the requested page
        }
        else {
            // user not logged in. redirect to login page
        }

    })
```

In order to be authorized, a user must be registered and logged in first:
```js
    app.post('/signup', (req, res) => {

        // extract sign up form data
        let email = req.body.email
        let password = req.body.password

        slimAuth.createUser(email, password)
            .then(
                //  success
                () => { 
                    // probably redirect to the login page
                },
                // fail
                (err) => { 
                    // tell user something went wrong
                }
            )
    })
```
Then handle the login:
```js
    app.post('/api/login', (req, res) => {

        // extract html form data
        let email = req.body.email
        let password = req.body.password

        slimAuth.authenticate(email, password, res)
            .then(
                // success
                () => { 
                     // redirect to home page.
                 },
                 // fail
                (err) => {
                    // send error to client.
                 }
            )
    })
```
Upon a successfull login, a token will be issued to the client which will be used to authenticate future requests. This token will be expired after 30 days.

### Don't forget to checkout the demo in git

## FAQ

1. Where does it store user data?
   
   User data are stored under `slimauth` directory inside your project.

2. How secure is this?

    `slimauth ` doesn't store actual passwords, but their hashes. So it's pretty secure.

3. How many users can it handle?

    `slimauth` can handle a good load of users for your web app. Unless you are planning to build the next big Facebook, you are good to go with `slimauth`.