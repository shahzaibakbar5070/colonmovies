const fs = require("fs");
const path = require("path");
const os = require("os");

const DB_PATH = path.join(os.tmpdir(), "colon-movies-db.json");
let memoryDB = { users: [] };

function getData() {
  try {
    if (fs.existsSync(DB_PATH)) {
      const data = JSON.parse(fs.readFileSync(DB_PATH, "utf8"));
      if (data && Array.isArray(data.users)) {
        memoryDB = data;
        return data;
      }
    }
  } catch (e) {}
  return memoryDB;
}

function saveData(data) {
  memoryDB = data;
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), "utf8");
  } catch (e) {}
}

module.exports = {
  findUser: (query) => {
    const db = getData();
    const matches = db.users.filter(u => {
      if (query.email && u.email && u.email.toLowerCase() === query.email.toLowerCase()) return true;
      if (query.username && u.username && u.username.toLowerCase() === query.username.toLowerCase()) return true;
      if (query._id && u._id === query._id) return true;
      return false;
    });
    return matches.find(u => u.password) || matches[0] || null;
  },
  createUser: (userData) => {
    const db = getData();
    const existingIdx = db.users.findIndex(u =>
      (userData.email && u.email && u.email.toLowerCase() === userData.email.toLowerCase()) ||
      (userData.username && u.username && u.username.toLowerCase() === userData.username.toLowerCase()) ||
      (userData._id && u._id === userData._id)
    );

    if (existingIdx !== -1) {
      db.users[existingIdx] = {
        ...db.users[existingIdx],
        ...userData,
        password: userData.password || db.users[existingIdx].password,
        updatedAt: new Date().toISOString()
      };
      saveData(db);
      return db.users[existingIdx];
    }

    const newUser = {
      _id: userData._id || "user_" + Date.now(),
      ...userData,
      avatar: userData.avatar || (userData.username ? userData.username.charAt(0).toUpperCase() : "🎬"),
      bio: userData.bio || "Film buff exploring cinema from blockbusters to indie gems.",
      favoriteGenre: userData.favoriteGenre || "Sci-Fi / Action",
      savedMovies: userData.savedMovies || [],
      createdAt: userData.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    db.users.push(newUser);
    saveData(db);
    return newUser;
  },
  updateUser: (id, updates) => {
    const db = getData();
    const idx = db.users.findIndex(u => u._id === id);
    if (idx === -1) return null;
    db.users[idx] = { ...db.users[idx], ...updates, updatedAt: new Date().toISOString() };
    saveData(db);
    return db.users[idx];
  }
};
