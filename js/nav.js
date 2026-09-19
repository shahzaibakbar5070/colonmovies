// ============================================================
//  Colon-Movies — Header Navigation Component
// ============================================================

function renderNav(activePage = "home") {
  const isLogged = window.Auth && window.Auth.isLoggedIn();
  const user = isLogged ? window.Auth.getCurrentUser() : null;

  const authMarkup = isLogged
    ? `
      <div class="nav-user-chip" onclick="window.location.href='profile.html'">
        <div class="nav-avatar-icon">${user.avatar || "🎬"}</div>
        <span style="font-weight:600;font-size:0.9rem;">${user.username}</span>
      </div>
      <button class="btn btn-outline" onclick="Auth.logout()" style="padding:6px 14px;font-size:0.82rem;">Logout</button>
    `
    : `
      <a href="login.html" class="btn btn-outline" style="padding:7px 16px;">Sign In</a>
      <a href="register.html" class="btn btn-primary" style="padding:7px 18px;">Get Started</a>
    `;

  const navHtml = `
    <header class="nav-header" id="mainHeader">
      <div class="nav-container">
        <a href="index.html" class="nav-logo">
          <div class="logo-icon">🎬</div>
          Colon<span>Movies</span>
        </a>

        <div class="nav-search-bar">
          <input type="text" id="headerSearch" class="nav-search-input" placeholder="Search millions of movies..." autocomplete="off" />
          <button id="headerSearchBtn" class="nav-search-btn">🔍</button>
          <div id="searchDropdown" class="search-dropdown"></div>
        </div>

        <nav class="nav-links">
          <a href="index.html" class="nav-link ${activePage === 'home' ? 'active' : ''}">Explore</a>
          <a href="profile.html" class="nav-link ${activePage === 'watchlist' ? 'active' : ''}">Watchlist</a>
          <a href="about.html" class="nav-link ${activePage === 'about' ? 'active' : ''}">About</a>
        </nav>

        <div class="nav-auth">
          ${authMarkup}
        </div>
      </div>
    </header>
  `;

  const existing = document.getElementById("mainHeader");
  if (existing) existing.remove();
  document.body.insertAdjacentHTML("afterbegin", navHtml);

  window.addEventListener("scroll", () => {
    const header = document.getElementById("mainHeader");
    if (!header) return;
    if (window.scrollY > 40) {
      header.classList.add("scrolled");
    } else {
      header.classList.remove("scrolled");
    }
  });

  setupHeaderSearch();
}

function setupHeaderSearch() {
  const input = document.getElementById("headerSearch");
  const dropdown = document.getElementById("searchDropdown");
  if (!input || !dropdown) return;

  let debounceTimer;
  input.addEventListener("input", (e) => {
    clearTimeout(debounceTimer);
    const q = e.target.value.trim();
    if (q.length < 1) {
      dropdown.classList.remove("show");
      dropdown.innerHTML = "";
      return;
    }

    debounceTimer = setTimeout(async () => {
      const results = await window.MovieEngine.search(q);
      if (!results || results.length === 0) {
        dropdown.innerHTML = `<div style="padding:16px;text-align:center;color:var(--text-dim);font-size:0.9rem;">No movies found for "${q}"</div>`;
      } else {
        dropdown.innerHTML = results.slice(0, 5).map(m => `
          <div class="search-item" onclick="window.location.href='movie.html?id=${m.id}'">
            <img src="${m.poster}" alt="${m.title}" onerror="this.src='favicon.svg'" />
            <div class="search-item-info">
              <h4>${m.title}</h4>
              <div class="search-item-meta">
                <span>${m.year}</span>
                <span>•</span>
                <span style="color:var(--gold-imdb);">⭐ ${m.imdbRating}</span>
                <span>•</span>
                <span>${(m.genres || []).slice(0, 2).join(', ')}</span>
              </div>
            </div>
          </div>
        `).join("");
      }
      dropdown.classList.add("show");
    }, 280);
  });

  document.addEventListener("click", (e) => {
    if (!input.contains(e.target) && !dropdown.contains(e.target)) {
      dropdown.classList.remove("show");
    }
  });

  input.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      const q = input.value.trim();
      if (q) window.location.href = `index.html?search=${encodeURIComponent(q)}`;
    }
  });
}
