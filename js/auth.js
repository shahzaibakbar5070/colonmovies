// ============================================================
//  Colon-Movies — Stateless JWT Auth & Watchlist Client
// ============================================================

const API_BASE = window.location.origin.startsWith("http") ? "" : "http://localhost:3000";
const TOKEN_KEY = "colonmovies_jwt_token";
const USER_KEY = "colonmovies_user_session";
const WATCHLIST_CACHE = "colonmovies_watchlist_cache";

function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

function setSession(token, user) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
}

function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(WATCHLIST_CACHE);
}

function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY) || "null");
  } catch (e) {
    return null;
  }
}

function isLoggedIn() {
  return getToken() !== null && getCurrentUser() !== null;
}

async function authFetch(url, options = {}) {
  const token = getToken();
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { "Authorization": `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  try {
    const res = await fetch(`${API_BASE}${url}`, { ...options, headers });
    const data = await res.json();
    return { ok: res.ok, status: res.status, data };
  } catch (err) {
    console.error(`API error [${url}]:`, err);
    return {
      ok: false,
      status: 0,
      data: { success: false, message: "Could not connect to server." }
    };
  }
}

async function register(username, email, password) {
  const res = await authFetch("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ username, email, password })
  });

  if (res.ok && res.data.success) {
    return { success: true, message: res.data.message };
  }
  return { success: false, message: res.data.message || "Registration failed." };
}

async function login(email, password) {
  const res = await authFetch("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password })
  });

  if (res.ok && res.data.success) {
    setSession(res.data.token, res.data.user);
    fetchWatchlist();
    return { success: true, user: res.data.user, message: res.data.message };
  }
  return { success: false, message: res.data.message || "Login failed." };
}

async function logout() {
  try {
    await authFetch("/api/auth/logout", { method: "POST" });
  } catch (e) {}
  clearSession();
  window.location.href = "index.html";
}

async function updateProfile({ username, bio, favoriteGenre }) {
  const res = await authFetch("/api/profile", {
    method: "PUT",
    body: JSON.stringify({ username, bio, favoriteGenre })
  });

  if (res.ok && res.data.success) {
    const current = getCurrentUser() || {};
    const updated = { ...current, ...res.data.user };
    setSession(null, updated);
    return { success: true, user: updated, message: res.data.message };
  }
  return { success: false, message: res.data.message || "Failed to update profile." };
}

function getWatchlist() {
  try {
    return JSON.parse(localStorage.getItem(WATCHLIST_CACHE) || "[]");
  } catch (e) {
    return [];
  }
}

async function fetchWatchlist() {
  if (!isLoggedIn()) return [];
  const res = await authFetch("/api/profile/favorites");
  if (res.ok && res.data.success) {
    const list = res.data.favorites || [];
    localStorage.setItem(WATCHLIST_CACHE, JSON.stringify(list));
    return list;
  }
  return getWatchlist();
}

function isWatchlisted(movieId) {
  const list = getWatchlist();
  return list.some(m => Number(m.id) === Number(movieId));
}

// Optimistic instant toggle (no refresh required!)
async function toggleWatchlist(movie) {
  if (!isLoggedIn()) {
    return { success: false, message: "Please log in to add movies to your watchlist." };
  }

  const currentlySaved = isWatchlisted(movie.id);
  let localList = getWatchlist();

  if (currentlySaved) {
    localList = localList.filter(m => Number(m.id) !== Number(movie.id));
  } else {
    localList.unshift({
      id: Number(movie.id),
      title: movie.title || movie.name || "Movie #" + movie.id,
      poster_path: movie.poster || movie.poster_path || "",
      backdrop_path: movie.backdrop || movie.backdrop_path || "",
      vote_average: movie.imdbRating || movie.vote_average || 0,
      release_date: movie.year || movie.release_date || "TBA",
      genres: movie.genres || []
    });
  }
  localStorage.setItem(WATCHLIST_CACHE, JSON.stringify(localList));

  const res = await authFetch("/api/profile/favorites", {
    method: "POST",
    body: JSON.stringify({
      id: movie.id,
      title: movie.title,
      poster_path: movie.poster || "",
      backdrop_path: movie.backdrop || "",
      vote_average: movie.imdbRating || 0,
      release_date: movie.year || "TBA",
      genres: movie.genres || [],
      action: currentlySaved ? "remove" : "add"
    })
  });

  if (res.ok && res.data.success) {
    return { success: true, favorited: res.data.favorited, count: res.data.count };
  }
  return { success: true, favorited: !currentlySaved, count: localList.length };
}

// Optimistic instant 1-click removal
async function removeWatchlist(movieId) {
  let localList = getWatchlist().filter(m => Number(m.id) !== Number(movieId));
  localStorage.setItem(WATCHLIST_CACHE, JSON.stringify(localList));

  try {
    await authFetch("/api/profile/favorites", {
      method: "POST",
      body: JSON.stringify({ id: movieId, action: "remove" })
    });
  } catch (e) {}

  return { success: true, count: localList.length };
}

// Safe session sync on page load (won't wipe session on temporary serverless cold start)
if (isLoggedIn()) {
  authFetch("/api/auth/me").then(res => {
    if (res.ok && res.data.success) {
      setSession(null, res.data.user);
    } else if (res.status === 401 && res.data && res.data.message && res.data.message.includes("invalid or expired")) {
      clearSession();
    }
  });
}

window.Auth = {
  register,
  login,
  logout,
  getCurrentUser,
  isLoggedIn,
  updateProfile,
  getWatchlist,
  fetchWatchlist,
  isWatchlisted,
  toggleWatchlist,
  removeWatchlist
};
