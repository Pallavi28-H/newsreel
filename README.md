# 📰 NewsReel v2

> A warm, editorial-style AI-powered news shorts app — every story written, summarised, and illustrated by AI.

NewsReel v2 reimagines the news as a vertical short-form feed. You type keywords; the app pulls real headlines from Google News, Reddit, and Hacker News, clusters similar stories together, sends them through an LLM for polished summaries, and generates unique AI images for each story — all in a few seconds.

---

## ✨ Features

- 🔍 **Multi-source aggregation** — Google News RSS, Reddit, and Hacker News pulled in parallel
- 🧠 **AI summarisation** — GPT-4o-mini (OpenAI) or Gemini 1.5 Flash writes the headline, summary, and "why it matters"
- 🖼️ **AI image generation** — DALL-E 3 or Gemini Imagen 3 creates a unique portrait image per story
- 🗂️ **Smart clustering** — Jaccard-similarity deduplicates stories across sources before AI processing
- 💾 **Persistent storage** — MongoDB Atlas stores every story, source, and search history
- 📱 **Shorts-style UI** — Vertical swipeable feed with warm editorial design (Playfair Display + Inter)
- 🕓 **Search history** — Recent searches saved and surfaced in the UI

---

## 🗂️ Project Structure

```
newsreel-v2/
├── client/                  # React + Vite frontend
│   ├── src/
│   │   ├── components/      # StoryCard.jsx, ShortsFeed.jsx, LoadingScreen.jsx, SourceModal.jsx
│   │   │                    # ShortsFeed.css, LoadingScreen.css
│   │   ├── pages/           # Home.jsx, Home.css, Feed.jsx, Saved.jsx
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   └── package.json
│
└── server/                  # Express backend
    ├── app.js               # Express app setup (middleware, routes, error handler)
    ├── server.js            # HTTP server entry point
    ├── services/
    │   ├── ai/              # aiService.js  — LLM text summarisation
    │   ├── image/           # imageService.js — AI image generation
    │   └── news/            # googleNewsService.js, redditService.js, hackerNewsService.js
    │                        # newsNormalizer.js, clusterService.js
    ├── controllers/         # newsController.js, storyController.js
    ├── models/              # Story.js, Source.js, SearchHistory.js (Mongoose)
    ├── routes/              # newsRoutes.js, storyRoutes.js, searchHistoryRoutes.js
    ├── config/              # db.js — MongoDB connection
    └── .env
```

---

## 🚀 Getting Started

### Prerequisites

| Tool | Version |
|------|---------|
| Node.js | >= 18 |
| npm | >= 9 |
| MongoDB Atlas | Free tier works |
| OpenAI or Gemini API key | Free tier works for text; DALL-E 3 requires Tier 1 |

---

### 1 — Clone & Install

```bash
git clone <your-repo-url>
cd newsreel-v2

# Install server dependencies
cd server && npm install

# Install client dependencies
cd ../client && npm install
```

---

### 2 — Configure Environment

Edit `server/.env`:

```env
PORT=5000
NODE_ENV=development

# MongoDB Atlas connection string
MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/?retryWrites=true

# --- LLM for text summarisation ---
# OpenAI: set LLM_PROVIDER=openai and paste your sk-... key
# Gemini:  set LLM_PROVIDER=gemini and paste your AIza... key
LLM_API_KEY=sk-proj-...
LLM_PROVIDER=openai

# --- Image generation (optional) ---
# If blank, LLM_API_KEY is used automatically (DALL-E for OpenAI, Imagen for Gemini)
# Set this only if you want a separate dedicated key for images
# IMAGE_API_KEY=

# --- Google Custom Search (optional) ---
# Enables high-quality real-image search via Google CSE (highest priority).
# If not set, the app falls back to Bing Image Search scraping (no key needed).
# GOOGLE_API_KEY=
# GOOGLE_CX=
```

> **Note:** Images are sourced from real web searches (Bing/Google) by default. AI image generation (DALL-E / Imagen) is only used if the image search fails. With OpenAI, the same `LLM_API_KEY` is used for both GPT-4o-mini (text) and DALL-E 3 (images) — no extra config needed.

---

### 3 — Run

Open **two terminals**:

```bash
# Terminal 1 — Backend (http://localhost:5000)
cd server
npm run dev

# Terminal 2 — Frontend (http://localhost:5173)
cd client
npm run dev
```

Then open **http://localhost:5173** in your browser.

---

## 🔌 API Reference

### `POST /api/news/search`
Trigger a full pipeline run: fetch → cluster → summarise → generate image → save → return stories.

**Request body:**
```json
{ "keywords": ["climate change", "renewable energy"] }
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "headline": "Solar Energy Hits Record Capacity Worldwide",
      "summary": "...",
      "whyItMatters": "...",
      "imageUrl": "https://oai.azure.com/...",
      "imagePrompt": "Solar panels at sunset, cinematic news photography",
      "category": "climate change",
      "keywords": ["climate change", "renewable energy"],
      "sources": [ { "sourceName": "Reuters", "url": "...", ... } ]
    }
  ]
}
```

---

### `GET /api/news/trending`
Return trending headlines fetched from Google News RSS (no keywords required).

### `GET /api/news/live-india`
Return live India news stories, each with an image sourced via Bing Image Search scraping.

### `GET /api/stories`
Return all saved stories (latest first).

### `GET /api/stories/:id`
Return a single story with populated sources.

### `GET /api/search/history`
Return the 10 most recent search queries.

### `POST /api/search/history`
Save a search query manually.

**Request body:**
```json
{ "query": "climate change" }
```

### `GET /api/health`
Health check — returns `{ "success": true, "data": { "status": "ok" } }`.

---

## 🎨 Design System

| Token | Value |
|-------|-------|
| Primary (amber ink) | `#d97706` |
| Background (paper) | `#f5f0e8` |
| Heading font | Playfair Display (serif) |
| Body font | Inter (sans-serif) |
| Mono font | JetBrains Mono |
| Border style | Brutalist square |
| Transitions | Wipe, flip-in, offset shadow |

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite 8, Framer Motion, Tailwind CSS 4 |
| Routing | React Router DOM 7 |
| Icons | Lucide React |
| Backend | Express 5, Node.js |
| Database | MongoDB Atlas via Mongoose 9 |
| News sources | Google News RSS, Reddit JSON API, Hacker News Algolia API |
| LLM (text) | OpenAI GPT-4o-mini / Google Gemini 1.5 Flash |
| LLM (images) | OpenAI DALL-E 3 / Google Gemini Imagen 3 |

---

## 📦 Scripts

| Location | Command | Description |
|----------|---------|-------------|
| `server/` | `npm run dev` | Start backend with nodemon (hot reload) |
| `server/` | `npm start` | Start backend (production) |
| `client/` | `npm run dev` | Start Vite dev server |
| `client/` | `npm run build` | Build production bundle |
| `client/` | `npm run preview` | Preview production build |

---

## 🧩 How It Works (Pipeline)

```
User enters keywords
       |
       v
Fetch from 3 sources in parallel
  |-- Google News RSS
  |-- Reddit JSON API
  +-- Hacker News Algolia API
       |
       v
Normalise --> deduplicate --> Jaccard cluster
       |
       v
For each top-5 cluster:
  |-- LLM --> headline + summary + whyItMatters + imagePrompt
  +-- Image AI --> DALL-E 3 / Gemini Imagen portrait image
       |
       v
Save Story + Sources to MongoDB
       |
       v
Return populated stories to client
```

---

## 📄 License

ISC
