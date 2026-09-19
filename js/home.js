// ============================================================
//  Colon-Movies — Home Page Controller (Live TMDB API)
// ============================================================

function createMovieCard(movie) {
  return `
    <div class="movie-card" onclick="window.location.href='movie.html?id=${movie.id}'">
      <div class="movie-poster-wrap">
        <img src="${movie.poster}" alt="${movie.title}" loading="lazy" onerror="this.src='favicon.svg'" />
        <div class="movie-rating-badge">⭐ ${movie.imdbRating}</div>
      </div>
      <div class="movie-card-body">
        <h3 class="movie-card-title">${movie.title}</h3>
        <div class="movie-card-meta">
          <span>${movie.year}</span>
          <span>${movie.genres ? movie.genres[0] : "Cinema"}</span>
        </div>
        <div class="movie-card-genres">
          ${(movie.genres || []).slice(0, 2).map(g => `<span class="tag-genre">${g}</span>`).join("")}
        </div>
      </div>
    </div>
  `;
}

function renderHeroBanner(movie) {
  const hero = document.getElementById("heroSection");
  if (!hero || !movie) return;

  hero.innerHTML = `
    <div class="hero-backdrop" style="background-image: url('${movie.backdrop || movie.poster}');"></div>
    <div class="hero-gradient-overlay"></div>
    <div class="hero-content">
      <div class="hero-badge">🔥 Featured Blockbuster</div>
      <h1 class="hero-title">${movie.title}</h1>
      <div class="hero-meta">
        <span class="rating-imdb">⭐ ${movie.imdbRating} Rating</span>
        <span>${movie.year}</span>
        <span>•</span>
        <span>${movie.runtime} min</span>
        <span>•</span>
        <span>${(movie.genres || []).join(" / ")}</span>
      </div>
      <p class="hero-synopsis">${movie.synopsis}</p>
      <div class="hero-actions">
        <a href="movie.html?id=${movie.id}" class="btn btn-primary btn-lg">🎬 Watch Trailer & Details</a>
        <button class="btn btn-outline btn-lg" onclick="handleHeroWatchlist(${movie.id})">
          ${window.Auth && window.Auth.isWatchlisted(movie.id) ? "❤️ In Watchlist" : "🤍 Add to Watchlist"}
        </button>
      </div>
    </div>
  `;
}

async function handleHeroWatchlist(movieId) {
  const movie = await window.MovieEngine.getById(movieId);
  if (!movie) return;
  await window.Auth.toggleWatchlist(movie);
  renderHeroBanner(movie);
}

async function initHomePage() {
  renderNav("home");

  const urlParams = new URLSearchParams(window.location.search);
  const searchParam = urlParams.get("search");

  if (searchParam) {
    await renderSearchResultsView(decodeURIComponent(searchParam));
    return;
  }

  // Load trending movies from TMDB
  const trending = await window.MovieEngine.getTrending();
  if (trending && trending.length > 0) {
    renderHeroBanner(trending[0]);
    renderMoviesList(trending);
  }

  // Render Genre Tabs
  const genres = ["All", "Action", "Sci-Fi", "Drama", "Adventure", "Crime", "Animation", "Thriller", "Horror"];
  const pillsWrap = document.getElementById("genrePills");
  if (pillsWrap) {
    pillsWrap.innerHTML = genres.map((g, i) => `
      <button class="genre-pill ${i === 0 ? 'active' : ''}" onclick="filterGenre('${g}', this)">${g}</button>
    `).join("");
  }
}

async function filterGenre(genre, btn) {
  document.querySelectorAll(".genre-pill").forEach(p => p.classList.remove("active"));
  if (btn) btn.classList.add("active");
  const filtered = await window.MovieEngine.filterByGenre(genre);
  renderMoviesList(filtered);
}

function renderMoviesList(movies) {
  const grid = document.getElementById("moviesGrid");
  const countEl = document.getElementById("movieCount");
  if (!grid) return;

  if (countEl) countEl.textContent = `Showing ${movies.length} movies (Live TMDB API)`;

  if (!movies || movies.length === 0) {
    grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:60px 20px;color:var(--text-muted);">No movies found matching criteria.</div>`;
    return;
  }
  grid.innerHTML = movies.map(createMovieCard).join("");
}

async function renderSearchResultsView(query) {
  const hero = document.getElementById("heroSection");
  if (hero) hero.style.display = "none";

  const titleEl = document.querySelector(".section-title");
  if (titleEl) titleEl.textContent = `Search Results for "${query}"`;

  const results = await window.MovieEngine.search(query);
  renderMoviesList(results);
}

document.addEventListener("DOMContentLoaded", initHomePage);
