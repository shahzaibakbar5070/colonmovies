# 🎬 Colon-Movies — Cinematic Movie Encyclopedia & Watchlists

A full-stack movie discovery and watchlist web application inspired by IMDb and Netflix, engineered with a **cinematic red-and-black gradient theme**, smooth animations, user authentication, and instant watchlists.

## 🚀 Features
- **Cinematic Red & Black Aesthetic**: Glowing gradients, floating ambient particles, glassmorphism, and responsive design.
- **IMDb-Style Catalog**: Curated blockbusters with ratings, synopsis, director, cast cards, and embedded HD trailers.
- **Instant Search & Filtering**: Real-time search dropdown and genre filter tabs (Action, Sci-Fi, Drama, Crime, etc.).
- **User Authentication**: Secure JWT-based authentication with bcrypt password hashing.
- **Optimistic Instant Watchlist**: Save and remove movies instantly with zero page reloads.
- **Serverless Vercel Ready**: Pre-configured with zero-config Vercel serverless functions, robust `/tmp` fallback database, and stateless JWT claims.

## 🛠️ Tech Stack
- **Frontend**: HTML5, CSS3 (Custom animations & red gradient variables), Vanilla JavaScript.
- **Backend**: Node.js, Express.js.
- **Database**: MongoDB Atlas (with automatic `/tmp` fallback for serverless cold-starts).
- **Hosting**: Ready for Vercel / Render / Node servers.

## 📦 How to Deploy on Vercel
1. Upload this repository to GitHub.
2. In Vercel, click **Import Project** and select the repository.
3. Keep **Framework Preset** as **Other**, with build toggles turned **OFF**.
4. In **Settings → Environment Variables**, add:
   - `MONGO_URI`: Your MongoDB Atlas connection string.
   - `JWT_SECRET`: `colon_movies_super_secret_jwt_key_2026`
5. Deploy and enjoy your cinema web app!
