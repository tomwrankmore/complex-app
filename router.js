const express = require('express')//included express framework
const router = express.Router()//Router from inside express
const userController = require('./controllers/userController')

router.get('/', userController.home)
//when we get a request from home directory we import the and run function that responds by rendering home-guest html template

router.post('/register', userController.register)
//post request from router runs register function from userController.js

router.post('/login', userController.login)

module.exports = router 