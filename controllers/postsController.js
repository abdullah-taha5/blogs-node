const asyncHandler = require("express-async-handler");
const {
  Post,
  validateCreatePost,
  validateUpdatePost,
} = require("../models/Post");
const fs = require("fs");
const { Comment } = require("../models/Comment.js");

/**
 * @desc Create New Post
 * @route /api/posts
 * @method POST
 * @access private (only logged in user)
 */
module.exports.createPostCtrl = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "no image provided" });
  }
  const { error } = validateCreatePost(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }
  // Create a new post and save it to DB
  const { title, description, category } = req.body;
  const post = await Post.create({
    title,
    description,
    category,
    user: req.user._id,
    image: {
      url: req.file.filename,
    },
  });
  // Send response to the client
  res.status(201).json(post);
});
/**
 * @desc Get All Posts
 * @route /api/posts
 * @method GET
 * @access public
 */
module.exports.getAllPostsCtrl = asyncHandler(async (req, res) => {
  const POST_PER_PAGE = 3;
  const { pageNumber, category } = req.query;
  let posts;

  if (pageNumber) {
    posts = await Post.find()
      .skip((pageNumber - 1) * POST_PER_PAGE)
      .limit(POST_PER_PAGE)
      .sort({ createdAt: -1 })
      .populate("user", ["-password"])
      .populate("comments")
  } else if (category) {
    posts = await Post.find({ category })
      .sort({ createdAt: -1 })
      .populate("user", ["-password"])
      .populate("comments")

  } else {
    posts = await Post.find()
      .sort({ createdAt: -1 })
      .populate("user", ["-password"])
      .populate("comments")

  }
  res.status(200).json(posts);
});
/**
 * @desc Get Single Post
 * @route /api/posts/:id
 * @method GET
 * @access public
 */
module.exports.getSinglePostCtrl = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id)
    .populate("user", ["-password"])
    .populate("comments");
  if (!post) {
    return res.status(404).json({ message: "post not found" });
  }
  res.status(200).json(post);
});
/**
 * @desc Delete Post
 * @route /api/posts/:id
 * @method DELETE
 * @access private (only admin or owner of the post)
 */
module.exports.deletePostCtrl = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) {
    return res.status(404).json({ message: "post not found" });
  }
  if (req.user.adminRole || req.user._id === post.user.toString()) {
    await Post.findByIdAndDelete(req.params.id);

    // Delete All Comments That Belong To This Post
    await Comment.deleteMany({postId: post._id})
    res.status(200).json({ message: "post has been deleted successfully" });
    if (post.image.url !== "") {
      fs.unlinkSync(`./images/${post.image.url}`);
    }
  } else {
    res.status(403).json({ message: "access denied, forbidden" });
  }
});
/**
 * @desc Update Post
 * @route /api/posts/:id
 * @method PUT
 * @access private (only owner of the post)
 */
module.exports.updatePostCtrl = asyncHandler(async (req, res) => {
  const { error } = validateUpdatePost(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }
  const post = await Post.findById(req.params.id);
  if (!post) {
    return res.status(404).json({ message: "post not found" });
  }
  if (req.user._id !== post.user.toString()) {
    return res
      .status(403)
      .json({ message: "access denied, you are not allowed" });
  }

  const updatedPost = await Post.findByIdAndUpdate(
    req.params.id,
    {
      $set: {
        title: req.body.title,
        description: req.body.description,
        category: req.body.category,
      },
    },
    { new: true }
  ).populate("user", ["-password"]);
  res.status(200).json(updatedPost);
});
/**
 * @desc Update Post Image
 * @route /api/posts/update-image/:id
 * @method PUT
 * @access private (only owner of the post)
 */
module.exports.updatePostImageCtrl = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "no image provided" });
  }

  const post = await Post.findById(req.params.id);
  if (!post) {
    return res.status(404).json({ message: "post not found" });
  }

  if (req.user._id !== post.user.toString()) {
    return res
      .status(403)
      .json({ message: "access denied, you are not allowed" });
  }
  if (post.image.url !== "") {
    fs.unlinkSync(`./images/${post.image.url}`);
  }
  post.image = {
    url: req.file.filename,
  };
  await post.save();
  // Send response to client
  res.status(200).json({
    message: "successfully uploaded",
    image: { url: req.file.filename },
  });
});

/**
 * @desc Toggle Like
 * @route /api/posts/like/:id
 * @method PUT
 * @access private (only logged in user)
 */
module.exports.toggleLikeCtrl = asyncHandler(async (req, res) => {
  const loggedInUser = req.user._id;
  const { id: postId } = req.params;

  let post = await Post.findById(postId);
  if (!post) {
    return res.status(404).json({ message: "post not found" });
  }

  const isPostAlreadyLiked = post.likes.find(
    (user) => user.toString() === loggedInUser
  );

  if (isPostAlreadyLiked) {
    post = await Post.findByIdAndUpdate(
      postId,
      {
        $pull: { likes: loggedInUser },
      },
      { new: true }
    );
  } else {
    post = await Post.findByIdAndUpdate(
      postId,
      {
        $push: { likes: loggedInUser },
      },
      { new: true }
    );
  }
  res.status(200).json(post);
});
