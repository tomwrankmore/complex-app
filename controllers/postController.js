const Post = require('../models/Post')

exports.viewCreateScreen = function(req, res) {
  res.render('create-post', {title: "Create new post"})
}

exports.create = function(req, res) {
  let post = new Post(req.body, req.session.user._id)
  post.create().then(function(newId) {
    req.flash("success", "New post successfully created!")
    req.session.save(()=>res.redirect(`/post/${newId}`))
  }).catch(function(error) {
    errors.forEach(error => req.flash("errors", error))
    req.session.save(() => res.redirect("/create-post"))
  })
}

exports.apiCreate = function(req, res) {
  let post = new Post(req.body, req.apiUser._id)
  post.create().then(function(newId) {
    res.json("congrats")
  }).catch(function(errors) {
    res.json(errors)
  })
}

exports.viewSingle = async function(req, res) {
  try {
    let post = await Post.findSingleById(req.params.id, req.visitorId)//visitorId comes from app.js
    res.render('single-post-screen', {post: post, title: post.title})//post comes from promise resolution, now stored as property for html template
  } catch (err) {
    res.render('404')
  }
}

exports.viewEditScreen = async function(req, res) {
  try {
    let post = await Post.findSingleById(req.params.id, req.visitorId)
    if (post.isVisitorOwner) {//reusable post function adds property named isVisitorOwner to post 
      res.render("edit-post", {post: post})
    } else {
      req.flash("errors", "You do not have permission to perform that action")
      req.session.save(() => res.redirect("/"))
    }
  } catch (err) {
    res.render('404')
  }
}

exports.edit = function(req, res) {
  let post = new Post(req.body, req.visitorId, req.params.id)//submitted form data
  post.update().then((status) => {
    // the post was successfully updated in the database ||
    // user did have permission but validation errors
    if (status == "success") {
      //post was updated in DB
      req.flash("success", "Post successfully updated.")
      req.session.save(function() {
        res.redirect(`/post/${req.params.id}/edit`)
      })
    } else {
      post.errors.forEach(function(error) {
        req.flash("errors", error)
      })
      req.session.save(function() {
        res.redirect(`/post/${req.params.id}/edit`)
      })
    }
  }).catch(() => {
    //A post with requested id doesn't exist || 
    //curent visitor is not the owner of the post
    req.flash("errors", "You do not have permission to perform that action.")
    req.session.save(function() {
      res.redirect("/")
     })
  })
}

exports.delete = function(req, res) {
  Post.delete(req.params.id, req.visitorId).then(() => {
    req.flash("success", "Post successfully deleted.")
    req.session.save(() => res.redirect(`/profile/${req.session.user.username}`))
  }).catch(() => {
    req.flash("errors", "You do not have permission to perform that action.")
    req.session.save(() => res.redirect("/"))
  })
}

exports.apiDelete = function(req, res) {
  Post.delete(req.params.id, req.apiUser._id).then(() => {
    res.json("Success")
  }).catch((errors) => {
    res.json("You do not have permission to perform that action")
  })
}

exports.search = function(req, res) {
  Post.search(req.body.searchTerm).then((posts) => {
    res.json(posts)
    console.log(posts)
  }).catch(() => {
    res.json([])
  })
}