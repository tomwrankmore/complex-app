const express = require('express')
const app = express()
//require function executes file immediately but also returns whatever the file exports

const router = require('./router')//pulls in and runs router.js  
//previously we had app.get to send back html template, now this happens in router.js using Router which is like a mini application from with Express 

app.use(express.urlencoded({extended:false}))
//tells express to add user submitted data onto request object :)
app.use(express.json())
//tells express to accept and send json

app.use(express.static('public'))
//this sets the public folder as the root to serve up static files.

app.set('views', 'views')
//first param: views express configuration option. 
//second param: folder containing
//this just tells express where to look for template files

app.set('view engine', 'ejs')
//we are using ejs engine. alternatives: handlebars and moustache

app.use('/', router)
//this tells express that for home directory, use router.js which contains get request and html function.

// app.listen(3000)

module.exports = app
//now we just export this as a module that's required in on db.js.
