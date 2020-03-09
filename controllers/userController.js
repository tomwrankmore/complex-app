const User = require('../models/User')
//require in user so we have acces to User constructor

exports.login = function(req, res) {
 let user = new User(req.body)
 user.login(function(result){
  res.send(result)
 })
}

exports.logout = function() {
  
}

//this function runs when post request is made on /register in router.js
exports.register = function(req, res) {
  //req contains info from .post method 
  let user = new User(req.body)
  //new instance of User where req.body is the data passed in.
  user.register()
  //this is a prototype function in User.js
  if(user.errors.length) {//this returns true if there is anything in errors array
    res.send(user.errors)//respond with that array/corresponding errors will be there.
  } else {
    res.send("yyyyyes")
  }
}

exports.home = function(req, res) {
  res.render('home-guest')
}


//using exports. node environment knows to export what comes after this for use anywhere userController is required in.