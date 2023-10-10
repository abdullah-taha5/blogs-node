const asyncHandler = require("express-async-handler");
const {
  validateCreateComment,
  Comment,
  validateUpdateComment,
} = require("../models/Comment.js");
const { User } = require("../models/User");
/**
 * @desc Create New Comment
 * @route /api/comments
 * @method POST
 * @access private (only logged in user)
 */
module.exports.createCommentCtrl = asyncHandler(async (req, res) => {
  const { error } = validateCreateComment(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }

  const profile = await User.findById(req.user._id);
  const comment = await Comment.create({
    postId: req.body.postId,
    text: req.body.text,
    user: req.user._id,
    username: profile.username,
  });
  res.status(201).json(comment);
});

/**
 * @desc Get All Comments
 * @route /api/comments
 * @method GET
 * @access private (only admin)
 */
module.exports.getAllCommentsCtrl = asyncHandler(async (req, res) => {
  const comments = await Comment.find().populate("user");

  res.status(200).json(comments);
});

/**
 * @desc Delete Comment
 * @route /api/comments/:id
 * @method DELETE
 * @access private (only admin or owner of the comment)
 */
module.exports.deleteCommentCtrl = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const comment = await Comment.findById(id);
  if (!comment) {
    return req.status(404).json({ message: "comment not found" });
  }

  if (req.user.adminRole || req.user._id === comment.user.toString()) {
    await Comment.findByIdAndDelete(id);
    res.status(200).json({ message: "comment has been deleted" });
  } else {
    res.status(403).json({ message: "access denied, not allowed" });
  }
});

/**
 * @desc Update Comment
 * @route /api/comments/:id
 * @method PUT
 * @access private (only owner off the comment)
 */
module.exports.updateCommentCtrl = asyncHandler(async (req, res) => {
  const { error } = validateUpdateComment(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }

  const comment = await Comment.findById(req.params.id);

  if (!comment) {
    return req.status(404).json({ message: "comment not found" });
  }

  if (req.user._id !== comment.user.toString()) {
    res.status(403).json({ message: "access denied, only user himself can edit his comment" });
  }

  const updatedComment = await Comment.findByIdAndUpdate(req.params.id, {
    $set: {
        text: req.body.text
    }
  }, {new: true})
  res.status(200).json(updatedComment)
});
