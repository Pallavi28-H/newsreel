import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

/**
 * Generates a background image for a story.
 *
 * @param {string} searchQuery - The user's actual search keywords (e.g. "gta 6", "iphone 16").
 *   Used for Bing/Google image search — returns real images matching the topic.
 * @param {string} [aiPrompt] - Optional AI-generated description for AI image generators.
 *   Falls back to searchQuery if not provided.
 *
 * Priority:
 *   1. GOOGLE_API_KEY + GOOGLE_CX set → Google Custom Search API (uses searchQuery)
 *   2. No Google keys → Bing Image Search scrape (uses searchQuery, no API key needed)
 *   3. IMAGE_API_KEY set → DALL-E 3 (uses aiPrompt)
 *   4. LLM_API_KEY + LLM_PROVIDER=openai → DALL-E 3 via LLM key
 *   5. LLM_API_KEY + LLM_PROVIDER=gemini → Gemini Imagen 3
 *   6. Last resort → Picsum Photos (not AI-generated)
 */
export const generateImage = async (searchQuery, aiPrompt) => {
  const generationPrompt = aiPrompt || searchQuery;

  // 1. Bing/Google image search — uses real search keywords for topic-accurate images
  try {
    console.log(`🖼️  Fetching image for: "${searchQuery}"`);
    return await callGoogleImages(searchQuery);
  } catch (err) {
    console.warn(`Image search unavailable: ${err.message}. Trying AI generation.`);
  }

  // 2. Dedicated image key (DALL-E)
  if (process.env.IMAGE_API_KEY) {
    try {
      return await callDallE(generationPrompt, process.env.IMAGE_API_KEY);
    } catch (err) {
      const msg = err.response?.data?.error?.message || err.message;
      console.warn(`DALL-E (IMAGE_API_KEY) unavailable: ${msg}. Trying LLM key next.`);
    }
  }

  // 3. Reuse LLM key for image generation
  if (process.env.LLM_API_KEY) {
    const provider = (process.env.LLM_PROVIDER || '').toLowerCase();

    if (provider === 'openai') {
      try {
        console.log('🖼️  Generating image via DALL-E (LLM key)...');
        return await callDallE(generationPrompt, process.env.LLM_API_KEY);
      } catch (err) {
        const msg = err.response?.data?.error?.message || err.message;
        console.warn(`DALL-E (LLM key) unavailable: ${msg}. Trying Picsum fallback.`);
      }
    } else if (provider === 'gemini') {
      try {
        console.log('🖼️  Generating image via Gemini Imagen (LLM key)...');
        return await callGeminiImagen(generationPrompt, process.env.LLM_API_KEY);
      } catch (err) {
        const msg = err.response?.data?.error?.message || err.message;
        console.warn(`Gemini Imagen unavailable: ${msg}. Trying Picsum fallback.`);
      }
    }
  }

  // 4. Last resort — stock photo
  console.warn('⚠️  No image provider available. Falling back to Picsum Photos.');
  return getPicsumImage();
};

/**
 * Fetches a relevant image for the given prompt.
 * Strategy:
 *   1. Google Custom Search API (if GOOGLE_API_KEY + GOOGLE_CX are set)
 *   2. Bing Image Search scrape — no API key needed.
 *      Bing's HTML contains image data as HTML-entity-encoded JSON:
 *        &quot;murl&quot;:&quot;<url>&quot;
 *      This reliably returns real, topic-relevant images (e.g. "gta 6" → GTA 6 screenshots).
 */
export const callGoogleImages = async (prompt) => {
  // 1. Use official Google Custom Search API if keys are present
  if (process.env.GOOGLE_API_KEY && process.env.GOOGLE_CX) {
    try {
      const url = `https://www.googleapis.com/customsearch/v1?q=${encodeURIComponent(prompt)}&cx=${process.env.GOOGLE_CX}&key=${process.env.GOOGLE_API_KEY}&searchType=image&num=1`;
      const response = await axios.get(url, { timeout: 10000 });
      if (response.data.items && response.data.items.length > 0) {
        console.log('✅ Image fetched via Google Custom Search API');
        return response.data.items[0].link;
      }
    } catch (err) {
      console.warn(`Google Custom Search API failed: ${err.message}. Falling back to Bing scrape.`);
    }
  }

  // 2. Bing Image Search scrape — no API key required.
  //    Bing's HTML embeds image data as HTML-entity-encoded JSON.
  //    The original image URL appears as: &quot;murl&quot;:&quot;<url>&quot;
  console.log('🔍 Scraping Bing Image Search for image...');
  const searchUrl = `https://www.bing.com/images/search?q=${encodeURIComponent(prompt)}&FORM=HDRSC2&first=1`;
  const response = await axios.get(searchUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    },
    timeout: 12000
  });

  // Primary: &quot;murl&quot;:&quot;<url>&quot; — HTML-entity-encoded JSON (most reliable)
  const murlMatch = response.data.match(/&quot;murl&quot;:&quot;(https?:\/\/[^&"<]+\.(?:jpg|jpeg|png|webp))&quot;/i);
  if (murlMatch && murlMatch[1]) {
    console.log('✅ Image scraped from Bing (murl match)');
    return murlMatch[1];
  }

  // Secondary: broader — catches murl URLs without a known extension
  const murlBroad = response.data.match(/&quot;murl&quot;:&quot;(https?:\/\/[^&"<]+)&quot;/i);
  if (murlBroad && murlBroad[1]) {
    console.log('✅ Image scraped from Bing (broad murl match)');
    return murlBroad[1];
  }

  // Tertiary: Bing thumbnail CDN (tse*.mm.bing.net) — always present as fallback
  const tbnMatch = response.data.match(/https?:\/\/tse\d+\.mm\.bing\.net\/th\?[^"'\s<>]+/i);
  if (tbnMatch) {
    console.log('✅ Bing thumbnail CDN image used');
    return tbnMatch[0];
  }

  throw new Error('No image found via Bing Image Search scrape');
};

/**
 * Tries DALL-E 3 first (portrait 1024×1792), then DALL-E 2 (512×512 square).
 * Accepts an explicit apiKey so it works for both IMAGE_API_KEY and LLM_API_KEY.
 */
const callDallE = async (prompt, apiKey) => {
  const safePrompt = prompt.substring(0, 500);
  const headers = {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  };

  // Try DALL-E 3 (portrait, best quality)
  try {
    const response = await axios.post(
      'https://api.openai.com/v1/images/generations',
      {
        model: 'dall-e-3',
        prompt: safePrompt,
        n: 1,
        size: '1024x1792',
        quality: 'standard',
      },
      { headers, timeout: 30000 }
    );
    console.log('✅ Image generated via DALL-E 3');
    return response.data.data[0].url;
  } catch (err) {
    // DALL-E 3 not available on this tier — fall back to DALL-E 2
    console.warn('DALL-E 3 not available, trying DALL-E 2...');
  }

  // Try DALL-E 2 (square, available on all tiers)
  const response2 = await axios.post(
    'https://api.openai.com/v1/images/generations',
    {
      model: 'dall-e-2',
      prompt: safePrompt,
      n: 1,
      size: '512x512',
    },
    { headers, timeout: 20000 }
  );
  console.log('✅ Image generated via DALL-E 2');
  return response2.data.data[0].url;
};

/**
 * Generates an image using Google's Gemini Imagen 3 model.
 * Requires a Gemini API key with image generation access.
 */
const callGeminiImagen = async (prompt, apiKey) => {
  const safePrompt = prompt.substring(0, 500);

  // Imagen 3 via Gemini Developer API
  const response = await axios.post(
    `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${apiKey}`,
    {
      instances: [{ prompt: safePrompt }],
      parameters: {
        sampleCount: 1,
        aspectRatio: '9:16', // portrait for Shorts format
        safetyFilterLevel: 'block_few',
        personGeneration: 'allow_adult',
      },
    },
    { timeout: 30000 }
  );

  // Response contains base64-encoded image — convert to data URI
  const base64 = response.data.predictions[0].bytesBase64Encoded;
  const mimeType = response.data.predictions[0].mimeType || 'image/png';
  console.log('✅ Image generated via Gemini Imagen 3');
  return `data:${mimeType};base64,${base64}`;
};

/**
 * Picsum Photos — last-resort fallback (not AI generated).
 * Portrait 1080×1920 for Shorts format.
 */
const getPicsumImage = () => {
  const seed = Math.floor(Math.random() * 9999);
  return `https://picsum.photos/seed/${seed}/1080/1920`;
};
