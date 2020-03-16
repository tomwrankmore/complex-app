const User = require('../models/User')
//require in user so we have acces to User constructor

exports.login = function(req, res) {
 let user = new User(req.body)
 user.login().then(function(result){
   req.session.user = {avatar: user.avatar ,username: user.data.username}
   //we're adding a property onto the session called user
   //leveraged session object, sent cookies to browser
   req.session.save(()=>res.redirect('/'))
 }).catch((err)=>{
   req.flash('errors', err)
   //flash looks in req.session.flash.errors = [err] and adds these properties 
   req.session.save(()=>res.redirect('/'))
 })//login returns a Promise
}

exports.logout = (req,res) => req.session.destroy(()=>res.redirect('/'))
//this is a callback passed into destroy method

//this function runs when post request is made on /register in router.js
exports.register = (req, res) => {
  //req contains info from .post method 
  let user = new User(req.body)
  //new instance of User where req.body is the data passed in.
  //then run register method from User constructor which returns a promise
  user.register().then(() => {
    req.session.user = {username: user.data.username, avatar: user.avatar}
    req.session.save(()=>res.redirect('/'))
  }).catch(function(regErrors){
    regErrors.forEach(error=>req.flash('regErrors', error))
    req.session.save(()=>res.redirect('/'))
  })
  //this runs prototype function in User.js which contains validate function
}

exports.home = function(req, res) {
  if(req.session.user) {
    res.render('home-dashboard', {username: req.session.user.username, avatar: req.session.user.avatar})
  } else {
    res.render('home-guest',{errors: req.flash('errors'), regErrors: req.flash('regErrors')})
    //second/third argument provides a property called errors that pulls in errors login promise for use in HTML template. This renders error messages from login validation function.
  }
}


//using exports. node environment knows to export what comes after this for use anywhere userController is required in.