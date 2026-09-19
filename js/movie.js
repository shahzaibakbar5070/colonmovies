// ============================================================
//  Colon-Movies — Movie Detail Controller (Live TMDB API)
// ============================================================

let currentMovie = null;

async function initMoviePage() {
  renderNav();
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");

  if (!id) {
    document.getElementById("detailContent").innerHTML = `
      <div style="text-align:center;padding:100px 20px;">
        <h2>No Movie Selected</h2>
        <p style="color:var(--text-muted);margin:16px 0;">Please select a movie from the catalog.</p>
        <a href="index.html" class="btn btn-primary">Browse Movies</a>
      </div>
    `;
    return;
  }

  currentMovie = await window.MovieEngine.getById(id);
  if (!currentMovie) {
    document.getElementById("detailContent").innerHTML = `
      <div style="text-align:center;padding:100px 20px;">
        <h2>Movie Not Found</h2>
        <p style="color:var(--text-muted);margin:16px 0;">The requested title could not be found.</p>
        <a href="index.html" class="btn btn-primary">Return to Catalog</a>
      </div>
    `;
    return;
  }

  renderMovieDetails(currentMovie);
}

async function renderMovieDetails(m) {
  document.title = `${m.title} (${m.year}) — Colon-Movies`;

  const heroBackdrop = document.getElementById("detailHero");
  if (heroBackdrop) {
    heroBackdrop.style.backgroundImage = `url('${m.backdrop || m.poster}')`;
  }

  const isSaved = window.Auth ? window.Auth.isWatchlisted(m.id) : false;
  const saveBtnText = isSaved ? "❤️ In Your Watchlist" : "🤍 Add to Watchlist";
  const saveBtnClass = isSaved ? "btn-primary" : "btn-outline";

  document.getElementById("detailPoster").src = m.poster;
  document.getElementById("detailTitle").textContent = m.title;
  document.getElementById("detailImdbRating").textContent = m.imdbRating;
  document.getElementById("detailYear").textContent = m.year;
  document.getElementById("detailRuntime").textContent = `${m.runtime} min`;
  document.getElementById("detailDirector").textContent = m.director || "Director";
  document.getElementById("detailGenres").innerHTML = (m.genres || []).map(g => `<span class="tag-genre" style="font-size:0.85rem;padding:4px 12px;">${g}</span>`).join("");
  document.getElementById("detailSynopsis").textContent = m.synopsis;

  const btn = document.getElementById("saveWatchlistBtn");
  if (btn) {
    btn.textContent = saveBtnText;
    btn.className = `btn ${saveBtnClass} btn-lg`;
  }

  // Render Cast
  const castGrid = document.getElementById("castGrid");
  if (castGrid && m.cast) {
    castGrid.innerHTML = m.cast.map(c => `
      <div class="cast-card">
        <div style="font-size:1.4rem;margin-bottom:4px;">🎭</div>
        <div class="cast-name">${c}</div>
        <div class="cast-role">Cast</div>
      </div>
    `).join("");
  }

  // Render Similar
  const similarGrid = document.getElementById("similarGrid");
  if (similarGrid) {
    const similar = await window.MovieEngine.getSimilar(m.id);
    similarGrid.innerHTML = similar.map(sm => `
      <div class="movie-card" onclick="window.location.href='movie.html?id=${sm.id}'">
        <div class="movie-poster-wrap">
          <img src="${sm.poster}" alt="${sm.title}" loading="lazy" onerror="this.src='favicon.svg'" />
          <div class="movie-rating-badge">⭐ ${sm.imdbRating}</div>
        </div>
        <div class="movie-card-body">
          <h3 class="movie-card-title">${sm.title}</h3>
          <div class="movie-card-meta">
            <span>${sm.year}</span>
            <span>${sm.genres ? sm.genres[0] : "Cinema"}</span>
          </div>
        </div>
      </div>
    `).join("");
  }
}

async function handleWatchlistToggle() {
  if (!window.Auth || !window.Auth.isLoggedIn()) {
    alert("Please log in or register to save movies to your watchlist!");
    window.location.href = "login.html";
    return;
  }
  if (!currentMovie) return;

  const btn = document.getElementById("saveWatchlistBtn");
  const currentlySaved = window.Auth.isWatchlisted(currentMovie.id);

  // Optimistic instant feedback
  if (btn) {
    if (currentlySaved) {
      btn.textContent = "🤍 Add to Watchlist";
      btn.className = "btn btn-outline btn-lg";
    } else {
      btn.textContent = "❤️ In Your Watchlist";
      btn.className = "btn btn-primary btn-lg";
    }
  }

  const res = await window.Auth.toggleWatchlist(currentMovie);
  if (btn && res) {
    if (res.favorited) {
      btn.textContent = "❤️ In Your Watchlist";
      btn.className = "btn btn-primary btn-lg";
    } else {
      btn.textContent = "🤍 Add to Watchlist";
      btn.className = "btn btn-outline btn-lg";
    }
  }
}

function openTrailer() {
  if (!currentMovie || !currentMovie.trailerUrl) return;
  const overlay = document.createElement("div");
  overlay.className = "modal-overlay";
  overlay.id = "trailerModal";
  overlay.innerHTML = `
    <div class="modal-content">
      <button class="modal-close" onclick="closeTrailer()">✕</button>
      <iframe src="${currentMovie.trailerUrl}?autoplay=1" allow="autoplay; encrypted-media" allowfullscreen></iframe>
    </div>
  `;
  document.body.appendChild(overlay);
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) closeTrailer();
  });
}

function closeTrailer() {
  const modal = document.getElementById("trailerModal");
  if (modal) modal.remove();
}

document.addEventListener("DOMContentLoaded", initMoviePage);
