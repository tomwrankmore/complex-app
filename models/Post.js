const postsCollection = require('../db').db().collection("posts")
const followsCollection = require('../db').db().collection("follows")
const ObjectID = require('mongodb').ObjectID
const User = require('./User')
const sanitizeHTML = require('sanitize-html')

let Post = function(data, userid, requestedPostId) {
  this.data = data
  this.errors = []
  this.userid = userid
  this.requestedPostId = requestedPostId
}

Post.prototype.cleanUp = function() {
  if(typeof(this.data.title) != "string") {this.data.title = ""}
  if(typeof(this.data.body) != "string") {this.data.body = ""}

  //get rid of any bogus properties
  // we are updating data object to ignore anything user might try sneak
  this.data = {
    title: sanitizeHTML(this.data.title.trim(), {allowedTags: [], allowedAttributes: []}),
    body: sanitizeHTML(this.data.body.trim(), {allowedTags: [], allowedAttributes: []}),
    createdDate: new Date(),
    author: ObjectID(this.userid)
  }
}

Post.prototype.validate = function() {
  if(this.data.title == "") {this.errors.push("You must provide a title")}
  if(this.data.body == "") {this.errors.push("You must provide post content")}
}

Post.prototype.create = function() {
  return new Promise((resolve, reject) => {
    this.cleanUp()
    this.validate()
    if(!this.errors.length) {
      postsCollection.insertOne(this.data).then((info) => {
        resolve(info.ops[0]._id)
      }).catch(() => {
        this.errors.push("Please try again later.")
      })
      
    } else { 
      reject(this.errors)
    }
  })
}

Post.prototype.update = function() {
  return new Promise(async (resolve, reject) => {
    try {
      let post = await Post.findSingleById(this.requestedPostId, this.userid)//returns all info from reusablePostQuery
      if (post.isVisitorOwner) {//if id on post matches logged in user id
        // actually update the db
        let status = await this.actuallyUpdate()
        resolve(status)//either "success" or "failure"
      } else {
        reject()
      }
    } catch (err) {
      reject()
    }
  })
}


Post.prototype.actuallyUpdate = function() {
  return new Promise(async(resolve, reject) => {
    this.cleanUp()
    this.validate()
    if(!this.errors.length) {
      await postsCollection.findOneAndUpdate({_id: new ObjectID(this.requestedPostId)}, {$set: {title: this.data.title, body: this.data.body}})
      resolve("success")
    } else {
      resolve("failure")
    }
  })
}

Post.reusablePostQuery = function(uniqueOperations, visitorId) {
  return new Promise(async function(resolve, reject) {
    
    let aggOperations = uniqueOperations.concat([
      {$lookup: {from: "users", localField: "author", foreignField: "_id", as: "authorDocument"}},
      {$project: {
        title: 1,
        body: 1,
        createdDate: 1,
        authorId: "$author",//author field from mongo 
        author: {$arrayElemAt:["$authorDocument", 0]}
      }}
    ])

    let posts = await postsCollection.aggregate(aggOperations).toArray()

  //cleans up post.author property
    posts = posts.map(function(post) {
      post.isVisitorOwner = post.authorId.equals(visitorId)//checks if author id on the post is equal to visitorId which is logged in user.
      //this is a property to be used in templates, the above mongo actil will return a boolean value.
      post.authorID = undefined //so it's not available on the front end
      post.author = {
        username: post.author.username,
        avatar: new User(post.author, true).avatar
      }
      return post
    })
    resolve(posts)
  })
}

Post.findSingleById = function(id, visitorId) {
  return new Promise(async function(resolve, reject) {
    if (typeof(id) != "string" || !ObjectID.isValid(id)) {
      reject()
      return
    }
    let posts = await Post.reusablePostQuery([
        {$match: {_id: new ObjectID(id)}},//where _id matches incoming id from findSingleById request, this is the array that gets passed into reusablePostQuery function
      ], visitorId)
      if (posts.length) {
        resolve(posts[0])//return first item in array 
      } else {
        reject()
      }
    })
}

//Older version of findSingleById
// Post.findSingleById = function(id) {
//   return new Promise(async function(resolve, reject) {
//     if (typeof(id) != "string" || !ObjectID.isValid(id)) {
//       reject()
//       return
//     }
//     let posts = await postsCollection.aggregate([
//       {$match: {_id: new ObjectID(id)}},//where _id matches incoming id from findSingleById request
//       {$lookup: {from: "users", localField: "author", foreignField: "_id", as: "authorDocument"}},
//       {$project: {//fine tune control over what gets passed to HTML template
//         title: 1, //1 = yes
//         body: 1,
//         createdDate: 1,
//         author: {$arrayElemAt:["$authorDocument", 0]}
//         //we want author property to be an object with username, gravatar etc not just the id which is what it is in mongodb
//       }}
//     ]).toArray()
//     //Clean up author property in each post object

//     posts = posts.map(function(post) {
//       post.author = {
//         username: post.author.username,
//         avatar: new User(post.author, true).avatar//true means User runs avatar function
//       }
//       return post
//     })

//       //looks in users collection for matching docs, the field from within the current post item we want to perform the match on is the 'author' fields, ie user id. 
    
//     if (posts.length) {
//       console.log(posts[0])
//       resolve(posts[0])//return first item in array
//     } else {
//       reject()
//     }
//   })
// }

// Older version of findSingleById
// Post.findSingleById = function(id) {
//   return new Promise(async function(resolve, reject) {
//     if (typeof(id) != "string" || !ObjectID.isValid(id)) {
//       reject()
//       return
//     }
//     let post = await postsCollection.findOne({_id: new ObjectID(id)})//compares id in url string to ids in postsCollection returns it if there is one as 'post'
//     if (post) {//if post exists
//       resolve(post)//resolve with that post as parameter
//     } else {
//       reject()
//     }
//   })
// }

Post.findByAuthorId = function(authorId) {
  return Post.reusablePostQuery([
    {$match: {author: authorId}},
    {$sort: {createdDate: -1}}//-1 for descending order
  ])
}

// reusable post function automatically going to create a property on the post named isVisitorOwner

Post.delete = function(postIdToDelete, currentUserId) {
  return new Promise(async (resolve, reject) => {
    try {
      let post = await Post.findSingleById(postIdToDelete, currentUserId)
      if(post.isVisitorOwner) {
        await postsCollection.deleteOne({_id: new ObjectID(postIdToDelete)})
        resolve() 
      } else {
        reject()
      }
    } catch (err) {
      reject()
    }
  })
}

Post.search = function(searchTerm) {
  return new Promise(async (resolve, reject) => {
    if(typeof(searchTerm) == "string") {
      let posts = await Post.reusablePostQuery([
        {$match: {$text: {$search: searchTerm}}},
        {$sort: {score: {$meta: "textScore"}}}
      ])

      resolve(posts)
    } else {
      reject()
    }
  })
}

Post.countPostsByAuthor = function(id) {
  return new Promise(async(resolve, reject) => {
    let postCount = await postsCollection.countDocuments({author: id})
    resolve(postCount)
  })
}

Post.getFeed = async function(id) {
  // create an array the user id's that the current user follows
  let followedUsers = await followsCollection.find({authorId: new ObjectID(id)}).toArray()
  followedUsers = followedUsers.map(function(followDoc){
    return followDoc.followedId
  })
  
  // look for posts where the author is in the above array of followed users
  return Post.reusablePostQuery([
    {$match: {author: {$in: followedUsers}}},
    {$sort: {createdDate: -1}}
  ])
}

module.exports = Post