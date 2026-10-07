# 🤖 AI Architecture — NewsReel v2

This document covers every AI component in NewsReel v2: which models are used, how they are called, what prompts look like, what the output schema is, and how failures are handled.

---

## Overview

NewsReel v2 uses AI for **two distinct tasks**:

| Task | Model (OpenAI) | Model (Gemini) | File |
|------|----------------|----------------|------|
| Text summarisation | GPT-4o-mini | Gemini 1.5 Flash | `server/services/ai/aiService.js` |
| Image generation | DALL-E 3 → DALL-E 2 | Gemini Imagen 3 | `server/services/image/imageService.js` |

> **Note:** Image generation is attempted via real-image search (Bing/Google) first. AI image models are only used when search-based images are unavailable.

---

## 1. Text Summarisation (`aiService.js`)

### Trigger

Called once per news cluster (up to 5 clusters per search). Input is up to 3 source articles from the cluster.

### Prompt

```
Summarize these news sources into a short mobile story card. Return ONLY valid JSON, no markdown.

Source: Reuters
Headline: Solar energy hits a new record...
Snippet: Global solar capacity reached...

[... up to 3 sources ...]

JSON format:
{
  "headline":     "max 12 words",
  "summary":      "max 50 words, 2-3 sentences",
  "whyItMatters": "1 sentence",
  "imagePrompt":  "10-15 word photo description"
}
```

### Output Schema

```ts
{
  headline:     string   // ≤ 12 words, title-case
  summary:      string   // ≤ 50 words, 2–3 sentences
  whyItMatters: string   // 1 sentence explaining significance
  imagePrompt:  string   // 10–15 word description passed to image AI
}
```

### Model Config

| Parameter | OpenAI | Gemini |
|-----------|--------|--------|
| Model | `gpt-4o-mini` | `gemini-1.5-flash` (with fallback chain) |
| Response format | `json_object` | `application/json` MIME type |
| Max tokens | 250 | 250 |
| Temperature | 0.4 | 0.4 |
| Timeout | 20 s | 20 s |

### Gemini Model Fallback Chain

Gemini models are tried in this order until one responds with HTTP 200:

```
gemini-1.5-flash  →  gemini-2.0-flash  →  gemini-1.5-flash-latest  →  gemini-pro
```

404 errors skip to the next model. All other errors (429, auth) are thrown and handled by the retry wrapper.

### Rate Limit Handling

```
Exponential backoff: 5s → 10s → 15s → 20s (4 attempts max)
Only retries on HTTP 429 (rate limited)
All other errors surface immediately
```

### Fallback (No LLM)

If no `LLM_API_KEY` is set, or all retries fail, `generateSummaryFromRealData()` is used instead:

- `headline` — taken directly from the top article in the cluster
- `summary` — built by joining real snippets from up to 3 articles (capped at 60 words)
- `whyItMatters` — auto-generated: `"Covered by {sources} — this story about {keywords} is trending"`
- `imagePrompt` — first 60 characters of the headline + `". Cinematic news photography, dramatic lighting."`

No AI is used in this path; all content is real data from the scraped articles.

---

## 2. Image Generation (`imageService.js`)

Images are sourced using the following priority chain. Real web images are preferred over AI-generated ones for topic accuracy.

### Priority Chain

```
generateImage(searchQuery, aiPrompt)
        |
        v
1. Google Custom Search API
   (GOOGLE_API_KEY + GOOGLE_CX set?)
        YES → returns real image URL for searchQuery
         NO ↓

2. Bing Image Search scrape  ← default path (no keys needed)
   Scrapes murl JSON from Bing HTML response
        SUCCESS → returns real image URL
         FAIL ↓

3. IMAGE_API_KEY set?
        YES → DALL-E 3 (1024×1792) → DALL-E 2 (512×512) on tier failure
         NO ↓

4. LLM_PROVIDER = openai?
        YES → DALL-E 3 → DALL-E 2 using LLM_API_KEY
         NO ↓

5. LLM_PROVIDER = gemini?
        YES → Gemini Imagen 3 (9:16 portrait) using LLM_API_KEY
         NO ↓

6. Last resort → Picsum Photos (random stock photo, NOT AI — warns in logs)
```

### Google Custom Search API (Step 1)

```
GET https://www.googleapis.com/customsearch/v1
  ?q=<searchQuery>
  &cx=<GOOGLE_CX>
  &key=<GOOGLE_API_KEY>
  &searchType=image
  &num=1

Returns: URL string from items[0].link
Timeout: 10 s
```

### Bing Image Search Scrape (Step 2)

No API key required. The scraper fetches Bing's HTML page and extracts `murl` (media URL) values from the HTML-entity-encoded JSON embedded in the response.

```
GET https://www.bing.com/images/search?q=<searchQuery>&FORM=HDRSC2&first=1

Extraction strategy (in order):
  1. &quot;murl&quot;:&quot;<url>.jpg|png|webp&quot;  ← primary (known image extensions)
  2. &quot;murl&quot;:&quot;<url>&quot;               ← broad (any murl)
  3. https://tse*.mm.bing.net/th?...              ← Bing CDN thumbnail (always present)

Timeout: 12 s
```

### DALL-E 3

```
POST https://api.openai.com/v1/images/generations

Body:
{
  "model":   "dall-e-3",
  "prompt":  "<aiPrompt, max 500 chars>",
  "n":       1,
  "size":    "1024x1792",   // portrait for Shorts format
  "quality": "standard"
}

Returns: URL string (expires after ~1 hour from OpenAI CDN)
Timeout: 30 s
```

### DALL-E 2 (tier fallback)

```
POST https://api.openai.com/v1/images/generations

Body:
{
  "model":  "dall-e-2",
  "prompt": "<aiPrompt, max 500 chars>",
  "n":      1,
  "size":   "512x512"      // DALL-E 2 only supports square sizes
}

Returns: URL string
Timeout: 20 s
```

> DALL-E 2 is used automatically if DALL-E 3 returns a tier/permission error. DALL-E 2 is available on all OpenAI tiers including the free tier.

### Gemini Imagen 3

```
POST https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key={LLM_API_KEY}

Body:
{
  "instances": [{ "prompt": "<aiPrompt, max 500 chars>" }],
  "parameters": {
    "sampleCount":       1,
    "aspectRatio":       "9:16",          // portrait for Shorts format
    "safetyFilterLevel": "block_few",
    "personGeneration":  "allow_adult"
  }
}

Returns: base64-encoded PNG/JPEG → stored as data:image/png;base64,... URI
Timeout: 30 s
```

> Gemini Imagen 3 requires a **paid** Google AI Studio account. The free tier does not support image generation.

---

## 3. The `imagePrompt` field

The `imagePrompt` generated by the LLM is used as the prompt for AI image generation (steps 3–5 above). It is **not** used for real-image search (steps 1–2 use the raw `searchQuery` keywords instead).

It must be:

- **10–15 words** (enforced by LLM prompt)
- **Descriptive and visual** — describes a photographic scene, not an abstract concept
- **Safe** — no names of real public figures (DALL-E policy)

### Examples

| Story topic | imagePrompt |
|-------------|-------------|
| Solar energy record | `"Solar panels gleaming at golden hour, cinematic aerial photography"` |
| Election results | `"Busy election night newsroom, dramatic lighting, reporters at monitors"` |
| AI regulation bill | `"Government building exterior at dusk, symbolic tech legislation"` |

---

## 4. Full Pipeline (AI steps highlighted)

```
POST /api/news/search  { keywords: [...] }
        |
        v
collectAndNormalizeNews(keywords)     — no AI
        |
        v
clusterStories(rawNews)               — no AI (Jaccard similarity)
        |
        v
for each cluster (top 5):
   |
   +---> [AI] generateStoryFromCluster()   — LLM text summarisation
   |          returns: headline, summary, whyItMatters, imagePrompt
   |
   +---> generateImage(searchQuery, imagePrompt)
              1. Bing/Google image search (real image, no AI)
              2. DALL-E 3 / Gemini Imagen (AI, if search fails)
              returns: imageUrl
        |
        v
Story.create({ ...aiData, imageUrl })  — persisted to MongoDB
        |
        v
Return populated stories to client
```

---

## 5. Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `LLM_API_KEY` | Yes | OpenAI `sk-proj-...` or Google `AIza...` key |
| `LLM_PROVIDER` | Yes | `openai` or `gemini` |
| `IMAGE_API_KEY` | No | Dedicated key for DALL-E image generation only. If blank, `LLM_API_KEY` is used. |
| `GOOGLE_API_KEY` | No | Google Custom Search API key. Enables step 1 of the image pipeline. |
| `GOOGLE_CX` | No | Google Custom Search Engine ID. Required alongside `GOOGLE_API_KEY`. |

---

## 6. Cost Estimates (per search = 5 stories)

### OpenAI

| Call | Model | Approx. cost |
|------|-------|-------------|
| 5× text summaries | GPT-4o-mini | ~\$0.001 |
| 5× images | DALL-E 3 (standard, 1024×1792) | ~\$0.20 |
| **Total per search** | | **~\$0.20** |

> Images are only charged if Bing/Google image search fails for all 5 stories.

### Gemini

| Call | Model | Approx. cost |
|------|-------|-------------|
| 5× text summaries | Gemini 1.5 Flash | ~\$0.00 (free tier) |
| 5× images | Imagen 3 | ~\$0.04 |
| **Total per search** | | **~\$0.04** |

> Prices based on public API pricing as of 2025. Always check the official pricing pages for current rates.

---

## 7. Logs to Watch

```
🖼️  Fetching image for: "climate change"         — Bing image search started
✅  Image scraped from Bing (murl match)          — Bing scrape succeeded
✅  Image fetched via Google Custom Search API    — Google CSE succeeded
🖼️  Generating image via DALL-E (LLM key)...      — AI image generation (OpenAI)
✅  Image generated via DALL-E 3                  — DALL-E 3 succeeded
DALL-E 3 not available, trying DALL-E 2...        — tier downgrade
🖼️  Generating image via Gemini Imagen (LLM key)... — Gemini Imagen started
✅  Image generated via Gemini Imagen 3           — Gemini Imagen succeeded
✅  Gemini model used: gemini-1.5-flash           — LLM text success
⚠️  Rate limited (attempt 2/4). Waiting 10s...   — backoff in progress
⚠️  No image provider available. Falling back to Picsum Photos — no provider found
```
