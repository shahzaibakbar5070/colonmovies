const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const User = require("../models/User");
const fallbackDB = require("../models/fallbackDB");
const { protect } = require("../middleware/authMiddleware");

const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      username: user.username,
      email: user.email,
      avatar: user.avatar || (user.username ? user.username.charAt(0).toUpperCase() : "🎬"),
      bio: user.bio || "",
      favoriteGenre: user.favoriteGenre || ""
    },
    process.env.JWT_SECRET || "colon_movies_super_secret_jwt_key_2026",
    { expiresIn: "30d" }
  );
};

const isMongoLive = () => mongoose.connection.readyState === 1;

// @route   POST /api/auth/register
router.post("/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ success: false, message: "Please provide all required fields." });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: "Password must be at least 6 characters." });
    }

    let existingUser = null;
    if (isMongoLive()) {
      existingUser = await User.findOne({
        $or: [
          { email: email.toLowerCase() },
          { username: { $regex: new RegExp(`^${username}$`, "i") } }
        ]
      });
    } else {
      existingUser = fallbackDB.findUser({ email }) || fallbackDB.findUser({ username });
    }

    if (existingUser) {
      const isEmail = existingUser.email.toLowerCase() === email.toLowerCase();
      return res.status(400).json({
        success: false,
        message: isEmail ? "Email is already registered." : "Username is already taken."
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    let newUser = null;
    if (isMongoLive()) {
      newUser = await User.create({
        username: username.trim(),
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        avatar: username.trim().charAt(0).toUpperCase()
      });
    } else {
      newUser = fallbackDB.createUser({
        username: username.trim(),
        email: email.toLowerCase().trim(),
        password: hashedPassword
      });
    }

    const token = generateToken(newUser);

    return res.status(201).json({
      success: true,
      message: "Account created successfully!",
      token,
      user: {
        id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        avatar: newUser.avatar,
        bio: newUser.bio,
        favoriteGenre: newUser.favoriteGenre,
        joined: newUser.createdAt
      }
    });
  } catch (err) {
    console.error("Register error:", err);
    return res.status(500).json({ success: false, message: err.message || "Registration failed." });
  }
});

// @route   POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Please provide email and password." });
    }

    let user = null;
    if (isMongoLive()) {
      user = await User.findOne({
        $or: [
          { email: email.toLowerCase().trim() },
          { username: email.trim() }
        ]
      });
    } else {
      user = fallbackDB.findUser({ email }) || fallbackDB.findUser({ username: email });
    }

    if (!user || !user.password) {
      return res.status(401).json({ success: false, message: "Invalid email or password." });
    }

    let isMatch = false;
    try {
      isMatch = await bcrypt.compare(password, user.password);
    } catch (bcryptErr) {
      return res.status(401).json({ success: false, message: "Invalid email or password." });
    }

    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid email or password." });
    }

    const token = generateToken(user);

    return res.json({
      success: true,
      message: "Login successful!",
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        bio: user.bio,
        favoriteGenre: user.favoriteGenre,
        joined: user.createdAt,
        savedMoviesCount: user.savedMovies ? user.savedMovies.length : 0
      }
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ success: false, message: err.message || "Login failed." });
  }
});

// @route   GET /api/auth/me
router.get("/me", protect, async (req, res) => {
  return res.json({
    success: true,
    user: {
      id: req.user._id,
      username: req.user.username,
      email: req.user.email,
      avatar: req.user.avatar,
      bio: req.user.bio,
      favoriteGenre: req.user.favoriteGenre,
      joined: req.user.createdAt,
      savedMoviesCount: req.user.savedMovies ? req.user.savedMovies.length : 0
    }
  });
});

// @route   POST /api/auth/logout
router.post("/logout", (req, res) => {
  return res.json({ success: true, message: "Logged out successfully." });
});

module.exports = router;
