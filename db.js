const dotenv = require('dotenv')//npm package to use .env file
dotenv.config()//this loads in all values from .env file
const mongodb = require('mongodb')

mongodb.connect(process.env.CONNECTIONSTRING, {useNewUrlParser: true, useUnifiedTopology: true}, function(err, client) {
  module.exports = client.db()//express app will only run once database has been exported.
  const app = require('./app')//requires in express application so app = express
  app.listen(process.env.PORT)
})

//process.env.CONNECTIONSTRING is pulling this in from .env, we would add .env to .ignore file before uploading. 