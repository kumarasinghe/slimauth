<h1 align="center">SlimAuth - The Simplest NodeJS User Authentication Middleware</h1>

### `slimauth` lifts follwing work for you:

- Creating user accounts in backend
- Logging into accounts
- Authorizing subsequent browser requests
- Updating user passwords
- Removing user accounts
- Logging out from accounts

### **✔ No database required. Fully file based.**
### **✔ Works with Express.**
### **✔ Fast, lightweight & configuration-free.**


# QUICK START
Add `express` and `slimauth` to your node project:

    npm i express slimauth

Then setup `slimauth`:
```js
    // SETUP EXPRESS
    const express = require('express')
    const app = express()
    app.use(express.urlencoded())   // for POST request processing

    // SETUP SLIMAUTH
    const SlimAuth = require('slimauth')

    const slimauth =  new SlimAuth(
        '/login',           // URL to redirect unauthorized requests
        ['/privatepage']    // routes that require authorization
    )

    app.use(slimauth.requestAuthenticator)

```

`SlimAuth()` constructor can take three **optional** arguments.
1. **A login URL**. When those who haven't logged in request private pages, they will be redirected to this URL.
2. **An array of private routes**. These routes will only be accessible by logged in users. Only the given exact paths are matched.
3. **Authentication Validity**. Number of days the user is kept logged in. Default is 30.

Handle account creation as follows:
```js
    app.post('/signup', (req, res) => {

        // extract sign up form data
        let email = req.body.email
        let password = req.body.password

        slimauth.createUser(email, password)
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
Handle login as follows:
```js
    app.post('/api/login', (req, res) => {

        // extract html form data
        let email = req.body.email
        let password = req.body.password

        slimauth.authenticate(email, password, res)
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
Upon a successfull login, a token cookie will be issued to the browser that will authorize future requests. Unless you specify, the cookie will expire in 30 days, and the user will be prompted to log in again.

 `req.userID` is guaranteed to be available inside private route handlers:
```js
    app.get('/privatepage', (req, res) => {
        console.log('User', req.userID, 'requested /privatepage')
    })
```
It will also be available for public route handlers if the user is logged in.

### Find the full working demo in github

# API

| API  | Effect | Returns |
| ---- | --- | --- |
| slimauth.createUser (userID, password) | Creates a new user | A promise with success & failure handlers |
| slimauth.authenticate (userID, password, res) | Validates user login. Upon success, the client is given a token valid for next 30 days.| A promise with success & failure handlers |
| req.userID | Becomes available only when user has logged in. | N/A |
| slimauth.deauthenticate (userID) | Logs out the current user. Clear the token. | A promise with success & failure handlers |
| slimauth.updatePassword (userID, currentPassword, newPassword) | Updates the current password and logs user out. |  A promise with success & failure handlers |
| slimauth.deleteUser (userID, password) | Removes the account, access token and logs user out. | A promise with success & failure handlers |

# FAQ

1. Where does it store user data?
   
   User data are stored under `slimauth` directory inside your project.

2. How secure is this?

    `slimauth ` doesn't store actual passwords, but their hashes. So it's pretty secure.

3. How many users can it handle?

    `slimauth` can handle a good load of users for your web app. Unless you are planning to build the next big Facebook, you are good to go with `slimauth`.

3. How many browser sessions does it remember?

   `slimauth` will only remember the last logged in browser session. The current session will be forgotten if the user logs in from a different browser.