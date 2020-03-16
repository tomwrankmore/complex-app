const bcrypt = require("bcryptjs")
const usersCollection = require ('../db').db().collection("users")//module.exports was db so .collection looks inside it and users is the name of the collection
const validator = require("validator")
const md5 = require('md5')

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
  return new Promise(async (resolve,reject) => {
    if(this.data.username == "") {this.errors.push("You must provide a username")}
    if(this.data.username != "" && !validator.isAlphanumeric(this.data.username)) {this.errors.push("Username can only contain letters and numbers")}
    if(!validator.isEmail(this.data.email)) {this.errors.push("You must provide a valid email address")}
    if(this.data.password == "") {this.errors.push("You must provide a password")}
    if(this.data.password.length > 0 && this.data.password.length < 10) {this.errors.push("Password must be at least 10 characters")}
    if(this.data.password.length > 50) {this.errors.push("Password cannot excede 50 characters")}
    if(this.data.username.length > 0 && this.data.username.length < 3) {this.errors.push("Username must be at least 3 characters")}
    if(this.data.username.length > 30) {this.errors.push("Username cannot excede 30 characters")}
  
    // Only if username is valid then check to see if it's taken
    if (this.data.username.length > 2 && this.data.username.length < 31 && validator.isAlphanumeric(this.data.username)) {
      let usernameExists = await usersCollection.findOne({username: this.data.username})
        if(usernameExists) {this.errors.push("That username is already taken")}
    }
  
      // Only if email is valid then check to see if it's taken
      if (validator.isEmail(this.data.email)) {
        let emailExists = await usersCollection.findOne({email: this.data.email})
          if(emailExists) {this.errors.push("That email is already taken")}
      }
      resolve()
  })
}


User.prototype.login = function() {
  return new Promise((resolve, reject) => {
    this.cleanUp()
    usersCollection.findOne({username: this.data.username}).then((attemptedUser)=>{//if the findOne promise finds username, it passes it when it calls resolve, so we can recieve it by including the parameter within then parenthesis
      if(attemptedUser && bcrypt.compareSync(this.data.password, attemptedUser.password)) {
        //bcrypt compares inputted password with hashed version
        this.getAvatar()
        // this populate a property called avatar on User object
        resolve("Congrats")
      } else {
        reject("Invalid username/password")
      }
    }).catch(function() {
      reject("Please try again later")
    })
  })
}

User.prototype.register = function() {
  return new Promise(async (resolve, reject) => {
    //Step #1 Validate user data
    this.cleanUp()
    await this.validate()//this keyword points to whatever instantiated User
    // Step #2 only if there are no validation errors then save the user data into a database
    if(!this.errors.length) {
      //if errors array is empty ie no errors
      //hash user password
      let salt = bcrypt.genSaltSync(10)
      this.data.password = bcrypt.hashSync(this.data.password, salt)
      await usersCollection.insertOne(this.data)
      this.getAvatar()
      resolve()
    } else {
      //are errors
      reject(this.errors)
    }
    
  })
}

User.prototype.getAvatar = function() {
  this.avatar = `https://s.gravatar.com/avatar/${md5(this.data.email)}?s=128`
}

module.exports = User