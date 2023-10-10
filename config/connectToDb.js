const mongoose = require("mongoose");

module.exports = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected To Data Base");
  } catch (error) {
    console.log("Connection Failed To Date Base", error);
  }
};
