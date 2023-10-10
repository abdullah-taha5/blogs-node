const asyncHandler = require("express-async-handler");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const {
  User,
  validateRegisterUser,
  validateLoginUser,
} = require("../models/User");

/**
 * @desc Register New User
 * @route /api/auth/register
 * @method POST
 * @access public
 */
const registerUserCtrl = asyncHandler(async (req, res) => {
  const { error } = validateRegisterUser(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }

  let user = await User.findOne({ email: req.body.email });
  if (user) {
    return res.status(400).json({ message: "User already exist" });
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(req.body.password, salt);

  await User.create({
    username: req.body.username,
    email: req.body.email,
    password: hashedPassword,
  });
  res
    .status(201)
    .json({ message: "you registered successfully, please log in" });
});

/**
 * @desc Login User
 * @route /api/auth/login
 * @method POST
 * @access public
 */
const loginUserCtrl = asyncHandler(async (req, res) => {
  const { error } = validateLoginUser(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }

  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return res.status(400).json({ message: "invalid email or password" });
  }

  const isPasswordMatch = await bcrypt.compare(
    req.body.password,
    user.password
  );
  if (isPasswordMatch) {
    const token = jwt.sign(
      {
        _id: user._id,
        username: user.username,
        email: user.email,
        adminRole: user.adminRole,
        profilePhoto: user.profilePhoto,
      },
      process.env.JWT_SECRET
    );
    return res
      .status(200)
      .json({
        _id: user._id,
        username: user.username,
        email: user.email,
        adminRole: user.adminRole,
        profilePhoto: user.profilePhoto,
        token,
      });
  } else {
    return res.status(400).json({ message: "please check your password" });
  }
});
module.exports = {
  registerUserCtrl,
  loginUserCtrl,
};
