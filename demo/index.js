/*
Author: naveenk <dndkumarasinghe@gmail.com>
This code is simplified for easy comprehension 
and is not upto production standards.
*/

const express = require('express')
const slimAuth = require('./slimauth')

const app = express()
app.use(express.static('public'))       // let guests access files in public_html
app.use(express.urlencoded())           // needed for POST form data extraction
app.use(slimAuth.requestAuthenticator)  // enables authentication handling


// handler: landing page
app.get('/', (req, res) => {

    // user is logged in
    if (req.userID) {
        res.sendFile(__dirname + '/private/members_area.html')
    }
    // user not logged in
    else {
        res.sendFile(__dirname + '/public/members_area.html')
    }

})


// API : signup
app.post('/api/signup', (req, res) => {

    let email = req.body['email']
    let password = req.body['password']

    // create user account
    slimAuth.createUser(email, password)
        .then(
            // success
            () => { res.redirect('/login.html') },
            // fail
            (err) => { res.end(err.message) }
        )

})


// API: login
app.post('/api/login', (req, res) => {

    let email = req.body['email']
    let password = req.body['password']

    // validate credentials
    slimAuth.authenticate(email, password, res)
        .then(
            // success
            () => { res.redirect('/') },
            // fail
            (err) => { res.send(err.message) }
        )
})


// API: logout
app.get('/api/logout', (req, res) => {

    slimAuth.deauthenticate(req.userID)
    res.redirect('/')

})


// API: change password
app.post('/api/change-password', (req, res) => {

    let currentPassword = req.body.oldPassword
    let newPassword = req.body.newPassword

    slimAuth.updatePassword(req.userID, currentPassword, newPassword)
        .then(
            // success
            () => { res.redirect('/api/logout') },
            // fail
            (err) => { res.end(err.message) }
        )
})


// API: close account
app.get('/api/close', (req, res) => {

    let password = req.query.password

    slimAuth.deleteUser(req.userID, password)
        .then(
            // success
            () => { res.redirect('/') },
            // fail
            (err) => { res.end(err.message) }
        )
})


// start server on port 80
app.listen(80, () => {
    console.log('Visit http://localhost from your web browser...')
})