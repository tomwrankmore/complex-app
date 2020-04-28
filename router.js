const express = require('express')//included express framework
const router = express.Router()//Router from inside express
const userController = require('./controllers/userController')
const postController = require('./controllers/postController')
const followController = require('./controllers/followController')

//user related routes
router.get('/', userController.home)
//when we get a request from home directory we import the and run function that responds by rendering home-guest html template
router.post('/register', userController.register)
//post request from router runs register function from userController.js
router.post('/login', userController.login)
router.post('/logout', userController.logout)
router.post('/doesUsernameExist', userController.doesUsernameExist)
router.post('/doesEmailExist', userController.doesEmailExist)

//Profile related routes
router.get('/profile/:username', userController.ifUserExists, userController.sharedProfileData, userController.profilePostsScreen)

router.get('/profile/:username/followers', userController.ifUserExists, userController.sharedProfileData, userController.profileFollowersScreen)

router.get('/profile/:username/following', userController.ifUserExists, userController.sharedProfileData, userController.profileFollowingScreen)

//Post related routes
router.get('/create-post', userController.mustBeLoggedIn, postController.viewCreateScreen)

router.post('/create-post', userController.mustBeLoggedIn, postController.create)

router.get('/post/:id', postController.viewSingle)

router.get('/post/:id/edit', userController.mustBeLoggedIn, postController.viewEditScreen)
router.post('/post/:id/edit', userController.mustBeLoggedIn, postController.edit)
router.post('/post/:id/delete', userController.mustBeLoggedIn, postController.delete)

router.post('/search', postController.search)

//Follow related routes

router.post('/addFollow/:username', userController.mustBeLoggedIn, followController.addFollow) //to store a segment of the URL as a query parameter 

router.post('/removeFollow/:username', userController.mustBeLoggedIn, followController.removeFollow) 

module.exports = router 