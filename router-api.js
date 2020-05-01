const cors = require('cors')
const apiRouter = require('express').Router()
const userController = require('./controllers/userController')
const postController = require('./controllers/postController')
const followController = require('./controllers/followController')

apiRouter.use(cors())
//this .use means cors will be called on any route below:
//this will configure all routes to set the cross origin resource sharing policy so that it is allowed from any domain.

//we don't need /api because in app.js we tell express to use this file on all /api/ requests.

apiRouter.post('/login', userController.apiLogin)
apiRouter.post('/create-post', userController.apiMustBeLoggedIn, postController.apiCreate)
apiRouter.delete('/post/:id', userController.apiMustBeLoggedIn, postController.apiDelete)
apiRouter.get('/postsByAuthor/:username', userController.apiGetPostsByUsername)

module.exports = apiRouter