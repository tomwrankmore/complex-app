const express = require('express')
const session = require('express-session')
const MongoStore = require('connect-mongo')(session)
const flash = require('connect-flash')
const markdown = require('marked')
const sanitizeHTML = require('sanitize-html')
const app = express()
 
let sessionOptions = session({
  secret: "Javascript is cool",
  store: new MongoStore({client: require('./db')}),
  resave: false,
  saveUninitialized: false,
  cookie:{maxAge: 1000 * 60 * 60 *24, httpOnly:true}
})

app.use(sessionOptions)
app.use(flash())

// We are telling Express to run this function for every request
// We now have acces to user property from within any ejs template 
//ie. user.avatar instead of adding properties 
app.use(function(req, res, next) {
  //Make out markdown function available from within EJS templates
  res.locals.filterUserHTML = function(content) {
    return sanitizeHTML(markdown(content), {allowedTags: ['p', 'br', 'ul', 'ol', 'li', 'bold', 'strong', 'i', 'em', 'h1','h2','h3','h4','h5','h6'], allowedAttributes: {}})
  }

  //make all error and success flash messages available from all templates
  res.locals.errors = req.flash("errors")
  res.locals.success = req.flash("success")

  //make current user id available on the req object
  // console.log(req.session)
  if(req.session.user) {req.visitorId = req.session.user._id} else {req.visitorId = 0}

  // make user session data available from within view templates
  //WHERE DOES USER OBJECT COME FROM?
  // It comes from userController.login()
  res.locals.user = req.session.user
  next()
})


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

const server = require('http').createServer(app)
// http package is included in Node.js by default
// this creates a server that uses our express app as it's handler.

const io = require('socket.io')(server)
// this adds socket functionality to our server

io.use(function(socket, next) {
  sessionOptions(socket.request, socket.request.res, next)
})
// This is making our express session data available from within the context of socket io.

//event that we are listening for is connection
//function is what we wanna do in response.
// socket parameter represents the connection between browser and server, kind of like req?

io.on('connection', function(socket) {
  if(socket.request.session.user) {
    //only is user is logged in.
    //user object is on the req sessions from login function i think.
    let user = socket.request.session.user

    socket.emit('welcome', {username: user.username, avatar: user.avatar})

    socket.on('chatMessageFromBrowser', function(data) {

      socket.broadcast.emit('chatMessageFromServer', {message: sanitizeHTML(data.message, {allowedTags: [], allowedAttributes: {}}), username: user.username, avatar: user.avatar})
    })
  }
})

module.exports = server
//now we just export this as a module that's required in on db.js.
