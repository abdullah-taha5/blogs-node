const express = require("express");
const connectToDb = require("./config/connectToDb");
const path = require("path");
const cors = require("cors")
require("dotenv").config();
const { errorHandler, notFound } = require("./middlewares/error");

// Connection To DB
connectToDb();

// Init app
const app = express();
app.use(cors())

// Static Folder
app.use(express.static(path.join(__dirname, "images")));

// Middleware
app.use(express.json());

// Routes
app.use("/api/auth", require("./routes/authRoute"));
app.use("/api/users", require("./routes/usersRoute"));
app.use("/api/posts", require("./routes/postsRoute"));
app.use("/api/comments", require("./routes/commentsRoute"));
app.use("/api/categories", require("./routes/categoriesRoute"));

// Error Handler Middleware
app.use(notFound);
app.use(errorHandler);

// Running The Server
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => console.log(`http://localhost:${PORT}`));
