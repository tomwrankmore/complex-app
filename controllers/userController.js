const User = require('../models/User')
//require in user so we have acces to User constructor
const Post = require('../models/Post')
const Follow = require('../models/Follow')
const jwt = require('jsonwebtoken')

exports.apiGetPostsByUsername = async function(req, res) {
  try{
    let authorDoc = await User.findByUserName(req.params.username)
    let posts = await Post.findByAuthorId(authorDoc._id)
    res.json(posts)
  } catch (e) {
    res.json("Invalid user requested")
  }
}

exports.apiMustBeLoggedIn = function(req, res, next) {
  try{
    req.apiUser = jwt.verify(req.body.token, process.env.JWTSECRET)
    next()
  } catch (e) {
    res.json("Sorry, you must provide a valid token")
  }
}

exports.doesUsernameExist = function(req, res) {
  User.findByUserName(req.body.username).then(()=> {
    res.json(true)
  }).catch(()=>{
    res.json(false)
  })
}

exports.doesEmailExist = async function(req, res) {
  let emailBool = await User.doesEmailExist(req.body.email)
  res.json(emailBool) 
}

exports.sharedProfileData = async function(req, res, next) {
  let isVisitorsProfile = false
  let isFollowing = false
  if(req.session.user) {
    isVisitorsProfile = req.profileUser._id.equals(req.session.user._id)
    //above is comparing the _id object coming from ifUserExists & findByUserName function with req.session.user._id which comes from login? returns true or false
    isFollowing = await Follow.isVisitorFollowing(req.profileUser._id, req.visitorId)
    //profileUser property gets added to the req object in ifUserExists function in this file
    // console.log(req.profileUser) incase you forget what this contains
  }
  req.isVisitorsProfile = isVisitorsProfile
  //above adds onto req object with local variable which is true or false 
  req.isFollowing = isFollowing
  
  //retrieve post follower and following counts
  //profileUser is the current page profile username that's been fed through ifUserExists, findByUsername, so we can get it's id etc.
  let postCountPromise = Post.countPostsByAuthor(req.profileUser._id)
  let followerCountPromise = Follow.countFollowersByID(req.profileUser._id)
  let followingCountPromise = Follow.countFollowingByID(req.profileUser._id)
  let [postCount, followerCount, followingCount] = await Promise.all([postCountPromise, followerCountPromise, followingCountPromise])
  //array destructuring
  //Above creates three different variables from the values, and the first item will use the first value from the array that we are destructuring ie the Promise.all array.

  req.postCount = postCount
  req.followerCount = followerCount
  req.followingCount = followingCount
  
  next()
}

exports.mustBeLoggedIn = function(req, res, next) {
  if(req.session.user) {//if user exists in session
    next()//tells express to run next function in router.js
  } else {
    req.flash("errors", "You must be logged in to perform that action")
    req.session.save(function(){
      res.redirect('/')
    })
  }
}



// exports.login = function(req, res) {
//  let user = new User(req.body)
//  user.login().then(function(result){
//    req.session.user = {avatar: user.avatar, username: user.data.username, _id: user.data._id}
//    //we're adding a property onto the session called user
//    //we store in the seesion from the User constructor
//    //leveraged session object, sent cookies to browser
//    req.session.save(function() {
//     res.redirect('/')
//   })
//  }).catch(function (err) {
//    req.flash('errors', err)
//    //flash looks in req.session.flash.errors = [err] and adds these properties 
//    req.session.save(function() {
//     res.redirect('/')
//   })
//  })//login returns a Promise
// }

exports.login = function(req, res) {//only sends username and password so we reset data to equal attemptedUser document from database so we can access id etc BITCH!!
  let user = new User(req.body)
  user.login().then(function(result) {
    req.session.user = {avatar: user.avatar, username: user.data.username, _id: user.data._id}
    req.session.save(function() {
      res.redirect('/')
      //console.log(user) use this to remind what user is.
    })
  }).catch(function(e) {//rejects with Invalid username/password - FUCK OFF!
    req.flash('errors', e)//this vs regErrors?
    req.session.save(function() {
      res.redirect('/')
    })
  })
}

exports.apiLogin = function(req, res) {
  let user = new User(req.body)
  user.login().then(function(result) {
   res.json(jwt.sign({_id: user.data._id}, process.env.JWTSECRET, {expiresIn: '7d'}))
  }).catch(function(e) {
    res.json("Bad job, really.")
  })
}

exports.logout = function(req, res) {
  req.session.destroy(function() {
    res.redirect('/')
  })
}
//this is a callback passed into destroy method

//this function runs when post request is made on /register in router.js
exports.register = function(req, res) {
  //req contains info from .post method 
  let user = new User(req.body)
  //new instance of User where req.body is the data passed in.
  //then run register method from User constructor which returns a promise
  user.register().then(() => {
    req.session.user = {username: user.data.username, avatar: user.avatar, _id: user.data._id}
    req.session.save(function() {
      res.redirect('/')
    })
  }).catch((regErrors) => {
    regErrors.forEach(function(error) {
      req.flash('regErrors', error)
    })
    req.session.save(function() {
      res.redirect('/')
    })
  })
  //this runs prototype function in User.js which contains validate function
}

exports.home = async function(req, res) {
  if(req.session.user) {
    // fetch feed of post for current user
    //req.session.user._id comes from login function
    let posts = await Post.getFeed(req.session.user._id)
    res.render('home-dashboard', {
      posts: posts, 
      title: "Home"
    })
    //used to have second argument to create property for reference in html templates, now we create user object for them in app.js
  } else {
    res.render('home-guest',{regErrors: req.flash('regErrors')})
    //second/third argument provides a property called errors that pulls in errors from login promise for use in HTML template. This renders error messages from login validation function.
  }
}

exports.ifUserExists = function(req, res, next) {
  User.findByUserName(req.params.username).then(function(userDocument){
    req.profileUser = userDocument
    next()
  }).catch(function(){
    res.render('404')
  })
}

let upperUsername = function(username) {
  let upperUsername = username.charAt(0).toUpperCase() + username.substring(1);
  return upperUsername;
} 

exports.profilePostsScreen = function(req, res) {
  // ask our post model for posts by a certain author id
  Post.findByAuthorId(req.profileUser._id).then(function(posts){
    //profileUser comes from login()
    //console.log(req.profileUser)
    res.render('profile', {
      currentPage: "posts",
      title: `Profile for: ${upperUsername(req.profileUser.username)}`,
      posts: posts,
      profileUsername: req.profileUser.username,
      profileAvatar: req.profileUser.avatar,
      isFollowing: req.isFollowing,
      isVisitorsProfile: req.isVisitorsProfile,
      counts: {postCount: req.postCount, followerCount: req.followerCount, followingCount: req.followingCount}
    })
  }).catch(function(){
    res.render('404')
  })
}

exports.profileFollowersScreen = async function(req, res) {
  try {
    let followers = await Follow.getFollowersById(req.profileUser._id)
    res.render('profile-followers', {
      currentPage: "followers",
      title: `${upperUsername(req.profileUser.username)}'s followers`,
      followers: followers,
      profileUsername: req.profileUser.username,
      profileAvatar: req.profileUser.avatar,
      isFollowing: req.isFollowing,
      isVisitorsProfile: req.isVisitorsProfile,
      counts: {postCount: req.postCount, followerCount: req.followerCount, followingCount: req.followingCount}

    })
  } catch(e) {
    res.render("404")
  }
}
exports.profileFollowingScreen = async function(req, res) {
  try {
    let following = await Follow.getFollowingById(req.profileUser._id)
    res.render('profile-following', {
      currentPage: "following",
      title: `${upperUsername(req.profileUser.username)} is following`,
      following: following,
      profileUsername: req.profileUser.username,
      profileAvatar: req.profileUser.avatar,
      isFollowing: req.isFollowing,
      isVisitorsProfile: req.isVisitorsProfile,
      counts: {postCount: req.postCount, followerCount: req.followerCount, followingCount: req.followingCount}

    })
  } catch(e) {
    res.render("404")
  }
}

//using exports. node environment knows to export what comes after this for use anywhere userController is required in.