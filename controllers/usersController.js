const asyncHandler = require("express-async-handler");
const { User, validateUpdateUser } = require("../models/User");
const { Post } = require("../models/Post");
const bcrypt = require("bcryptjs");
const { Comment } = require("../models/Comment");
const fs = require("fs");


/**
 * @desc Get All Users Profile
 * @route /api/users/profile
 * @method GET
 * @access private (only admin)
 */

module.exports.getAllUsersCtrl = asyncHandler(async (req, res) => {
  const users = await User.find().select("-password").populate("posts");
  res.status(200).json(users);
});

/**
 * @desc Get User Profile
 * @route /api/users/profile/:id
 * @method GET
 * @access public
 */

module.exports.getUserProfileCtrl = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select("-password").populate("posts");
  if (!user) {
    return res.status(404).json({ message: "user not found" });
  }
  res.status(200).json(user);
});

/**
 * @desc Update User Profile
 * @route /api/users/profile/:id
 * @method PUT
 * @access private (only user himself)
 */
module.exports.updateUserProfileCtrl = asyncHandler(async (req, res) => {
  const { error } = validateUpdateUser(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }

  if (req.body.password) {
    const salt = await bcrypt.genSalt(10);
    req.body.password = await bcrypt.hash(req.body.password, salt);
  }

  const updateUser = await User.findByIdAndUpdate(
    req.params.id,
    {
      $set: {
        username: req.body.username,
        password: req.body.password,
        bio: req.body.bio,
      },
    },
    { new: true }
  ).select("-password");
  res.status(200).json(updateUser);
});

/**
 * @desc Profile Photo Upload
 * @route /api/users/profile/profile-photo-upload
 * @method POST
 * @access private (only logged in user)
 */

module.exports.profilePhotoUploadCtrl = asyncHandler(async (req, res) => {
  // Validation
  if (!req.file) {
    return res.status(400).json({ message: "No image provided" });
  }

  // Get the user from DB
  const user = await User.findById(req.user._id);

  // Change the profilePhoto field in the DB
  user.profilePhoto = {
    url: req.file.filename,
  };
  await user.save();
  // Send response to client
  res.status(200).json({
    message: "successfully uploaded",
    profilePhoto: { url: req.file.filename },
  });
});

/**
 * @desc Delete User Profile (Account)
 * @route /api/users/profile/:id
 * @method DELETE
 * @access private (only admin of user himself)
 */
module.exports.deleteUserProfileCtrl = asyncHandler(async (req, res) => {
  const user = User.findById(req.params.id);
  if (!user) {
    return res.status(404).json({message: "user not found"})
  }
  
  // Delete user post & comments & profile picture
  await Post.deleteMany({user: user._id})
  await Comment.deleteMany({user: user._id})
  if (user.profilePhoto.url !== "") {
    fs.unlinkSync(`./images/${user.profilePhoto.url}`);
  }
  // Delete us
  // Delete the user
  await User.findByIdAndDelete(req.params.id);
  res.status(200).json({ message: "User deleted successfully" });
});