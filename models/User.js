const usersCollection = require ('../db').collection("users")//module.exports was db so .collection looks inside it and users is the name of the collection
const validator = require("validator")

let User = function(data) {//when we instantiate User data = req.body or the request that was made. ie register, login etc.
  this.data = data
  this.errors = []
}

//before validation happens it clears out username field if it isn't a string so validation error will catch it for being blank
User.prototype.cleanUp = function() {
  if (typeof(this.data.username) != "string") {this.data.username = ""}
  if (typeof(this.data.email) != "string") {this.data.email = ""}
  if (typeof(this.data.password) != "string") {this.data.password = ""}
  
  //get rid of any bogus properties, making sure no hackers embed new properties I guess?
  this.data = {
    username: this.data.username.trim().toLowerCase(),
    email: this.data.email.trim().toLowerCase(),//trim removes whitespace
    password: this.data.password
  }
}

User.prototype.validate = function() {
  if(this.data.username == "") {this.errors.push("You must provide a username")}
  if(this.data.username != "" && !validator.isAlphanumeric(this.data.username)) {this.errors.push("Username can only contain letters and numbers")}
  if(!validator.isEmail(this.data.email)) {this.errors.push("You must provide a valid email address")}
  if(this.data.password == "") {this.errors.push("You must provide a password")}
  if(this.data.password.length > 0 && this.data.password.length < 12) {this.errors.push("Password must be at least 12 characters")}
  if(this.data.password.length > 100) {this.errors.push("Password cannot excede 100 characters")}
  if(this.data.username.length > 0 && this.data.username.length < 3) {this.errors.push("Username must be at least 3 characters")}
  if(this.data.username.length > 30) {this.errors.push("Username cannot excede 30 characters")}
}

User.prototype.login = function(callback) {
  this.cleanUp()
  usersCollection.findOne({username: this.data.username}, (err, attemptedUser) => {
    if(attemptedUser && attemptedUser.password == this.data.password) {
      callback("Congrats")
    } else {
      callback("Invalid")
    }
  })
}

User.prototype.register = function() {
  //Step #1 Validate user data
  this.cleanUp()
  this.validate()//this points to whatever instantiated User
  // Step #2 only if there are no validation errors then save the user data into a database
  if(!this.errors.length) {
    //if errors array is empty ie no errors
    usersCollection.insertOne(this.data)

  }
}

module.exports = User