// ============================================================
//  Colon-Movies — TMDB Live API & Offline Fallback Engine
// ============================================================

const TMDB_KEY = "04c35731a5ee918f014970082a0088b1";
const TMDB_BASE = "https://api.themoviedb.org/3";
const IMG_BASE = "https://image.tmdb.org/t/p/w500";
const BACKDROP_BASE = "https://image.tmdb.org/t/p/original";

const GENRE_MAP = {
  28: "Action", 12: "Adventure", 16: "Animation", 35: "Comedy",
  80: "Crime", 99: "Documentary", 18: "Drama", 10751: "Family",
  14: "Fantasy", 36: "History", 27: "Horror", 10402: "Music",
  9648: "Mystery", 10749: "Romance", 878: "Sci-Fi", 10770: "TV Movie",
  53: "Thriller", 10752: "War", 37: "Western"
};

function formatMovie(m) {
  const genres = m.genres
    ? m.genres.map(g => typeof g === "object" ? g.name : g)
    : (m.genre_ids ? m.genre_ids.map(id => GENRE_MAP[id] || "Cinema") : ["Cinema"]);

  return {
    id: m.id,
    title: m.title || m.name || "Untitled Movie",
    year: m.release_date ? m.release_date.split("-")[0] : "2024",
    released: m.release_date || "TBA",
    runtime: m.runtime || 120,
    imdbRating: m.vote_average ? Number(m.vote_average.toFixed(1)) : 7.5,
    genres: genres.length > 0 ? genres : ["Cinema"],
    director: m.director || (m.credits && m.credits.crew ? (m.credits.crew.find(c => c.job === "Director") || {}).name : "Acclaimed Director") || "Director",
    cast: m.cast || (m.credits && m.credits.cast ? m.credits.cast.slice(0, 5).map(c => c.name) : ["Cast Ensemble"]),
    poster: m.poster_path ? `${IMG_BASE}${m.poster_path}` : (m.poster || "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500&q=80"),
    backdrop: m.backdrop_path ? `${BACKDROP_BASE}${m.backdrop_path}` : (m.backdrop || m.poster || "https://images.unsplash.com/photo-1518676590629-3dcbd9c5a5c9?w=1200&q=80"),
    synopsis: m.overview || m.synopsis || "No overview available for this title.",
    trailerUrl: m.trailerUrl || (m.videos && m.videos.results ? (() => {
      const trailer = m.videos.results.find(v => v.type === "Trailer" && v.site === "YouTube");
      return trailer ? `https://www.youtube.com/embed/${trailer.key}` : "https://www.youtube.com/embed/uYPbbksJxIg";
    })() : "https://www.youtube.com/embed/uYPbbksJxIg")
  };
}

window.MovieEngine = {
  // Get trending movies from TMDB with offline fallback
  getTrending: async () => {
    try {
      const res = await fetch(`${TMDB_BASE}/trending/movie/week?api_key=${TMDB_KEY}`);
      if (res.ok) {
        const data = await res.json();
        if (data.results && data.results.length > 0) {
          return data.results.map(formatMovie);
        }
      }
    } catch (e) {
      console.warn("Using offline catalog:", e.message);
    }
    return MOVIES_CATALOG;
  },

  getAll: async () => {
    return window.MovieEngine.getTrending();
  },

  getById: async (id) => {
    // Check fallback catalog first for custom curated data
    const local = MOVIES_CATALOG.find(m => Number(m.id) === Number(id));
    try {
      const res = await fetch(`${TMDB_BASE}/movie/${id}?api_key=${TMDB_KEY}&append_to_response=videos,credits,similar`);
      if (res.ok) {
        const data = await res.json();
        const formatted = formatMovie(data);
        if (local && local.trailerUrl) formatted.trailerUrl = local.trailerUrl;
        return formatted;
      }
    } catch (e) {}
    return local || MOVIES_CATALOG[0];
  },

  search: async (query) => {
    if (!query) return window.MovieEngine.getTrending();
    try {
      const res = await fetch(`${TMDB_BASE}/search/movie?api_key=${TMDB_KEY}&query=${encodeURIComponent(query)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.results && data.results.length > 0) {
          return data.results.map(formatMovie);
        }
      }
    } catch (e) {}

    // Fallback search
    const q = query.toLowerCase().trim();
    return MOVIES_CATALOG.filter(m =>
      m.title.toLowerCase().includes(q) ||
      m.genres.some(g => g.toLowerCase().includes(q))
    );
  },

  filterByGenre: async (genre) => {
    const all = await window.MovieEngine.getTrending();
    if (!genre || genre.toLowerCase() === "all") return all;
    return all.filter(m =>
      m.genres.some(g => g.toLowerCase() === genre.toLowerCase())
    );
  },

  getSimilar: async (id) => {
    try {
      const res = await fetch(`${TMDB_BASE}/movie/${id}/similar?api_key=${TMDB_KEY}`);
      if (res.ok) {
        const data = await res.json();
        if (data.results && data.results.length > 0) {
          return data.results.slice(0, 4).map(formatMovie);
        }
      }
    } catch (e) {}
    return MOVIES_CATALOG.slice(1, 5);
  }
};
