/*
slimauth usage example
Author: naveenk <dndkumarasinghe@gmail.com>
*/

// SETUP EXPRESS
const express = require('express')
const app = express()
app.use(express.static('public'))                   // let guests access public directory
app.use(express.urlencoded({ extended: true }))     // needed for POST form data extraction

// SETUP SLIMAUTH
const SlimAuth = require('slimauth')
let slimauth = new SlimAuth(
    '/login.html',                                  // URL to redirect unauthorized requests
    [                                               // An array of routes that require authorization
        '/memberarea',
        '/close',
        '/changepassword'
    ]
)
app.use(slimauth.requestAuthenticator)              // enables authentication handling


/********************************** GET ************************************/

app.get('/memberarea', (req, res) => {
    res.sendFile(__dirname + '/private/memberarea.html')
})

app.get('/close', (req, res) => {
    res.sendFile(__dirname + '/private/close.html')
})

app.get('/changepassword', (req, res) => {
    res.sendFile(__dirname + '/private/changepassword.html')
})

app.get('/logout', (req, res) => {
    slimauth.deauthenticate(req.userID)
    res.redirect('/')
    console.log('User logged out:', req.userID)
})


/*********************************** POST *************************************/

app.post('/signup', (req, res) => {

    let email = req.body['email']
    let password = req.body['password']

    // create user account
    slimauth.createUser(email, password)
        .then(
            // success
            () => {
                res.redirect('/login.html')
                console.log('User account created for', email)
            },
            // fail
            (err) => { res.end(err.message) }
        )

})


app.post('/login', (req, res) => {

    let email = req.body['email']
    let password = req.body['password']

    // valiate password and log the user in for next 30 days
    slimauth.authenticate(email, password, res)
        .then(
            // success
            () => {
                res.redirect('/memberarea')
                console.log('User logged in:', email)
            },
            // fail
            (err) => { res.send(err.message) }
        )
})


app.post('/changepassword', (req, res) => {

    let currentPassword = req.body.oldPassword
    let newPassword = req.body.newPassword

    // valiate the current password and change it
    slimauth.updatePassword(req.userID, currentPassword, newPassword)
        .then(
            // success
            () => {
                res.redirect('/logout')
                console.log('Password changed for', req.userID)
            },
            // fail
            (err) => { res.end(err.message) }
        )
})


app.post('/close', (req, res) => {

    let password = req.body.password

    // valiate the current password and remove user account
    slimauth.deleteUser(req.userID, password)
        .then(
            // success
            () => {
                res.redirect('/')
                console.log('Account', req.userID, 'was closed')
            },
            // fail
            (err) => { res.end(err.message) }
        )
})


/******************************************************************************/


// start server on port 80
app.listen(80, () => {
    console.log('Visit http://localhost from your web browser...')
})