const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, "Please provide a username"],
      unique: true,
      trim: true,
      minlength: [3, "Username must be at least 3 characters"]
    },
    email: {
      type: String,
      required: [true, "Please provide an email"],
      unique: true,
      lowercase: true,
      trim: true
    },
    password: {
      type: String,
      required: [true, "Please provide a password"],
      minlength: [6, "Password must be at least 6 characters"]
    },
    avatar: {
      type: String,
      default: "🎬"
    },
    bio: {
      type: String,
      default: "Film buff exploring cinema from blockbusters to indie gems.",
      maxlength: [300, "Bio cannot exceed 300 characters"]
    },
    favoriteGenre: {
      type: String,
      default: "Sci-Fi / Action"
    },
    savedMovies: [
      {
        id: { type: Number, required: true },
        title: { type: String, required: true },
        poster_path: { type: String, default: "" },
        backdrop_path: { type: String, default: "" },
        vote_average: { type: Number, default: 0 },
        release_date: { type: String, default: "" },
        genres: [{ type: String }],
        overview: { type: String, default: "" },
        runtime: { type: Number, default: 0 },
        savedAt: { type: Date, default: Date.now }
      }
    ]
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
