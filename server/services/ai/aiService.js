import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

// Pause helper
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// Retry with exponential backoff — waits much longer for free-tier 429s
const withRetry = async (fn, retries = 4, baseDelayMs = 5000) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      const is429 = err.response?.status === 429;
      if (attempt === retries || !is429) throw err;
      const wait = baseDelayMs * attempt; // 5s, 10s, 15s, 20s
      console.warn(`⚠️  Rate limited (attempt ${attempt}/${retries}). Waiting ${wait / 1000}s...`);
      await sleep(wait);
    }
  }
};

export const generateStoryFromCluster = async (cluster, keywords) => {
  const sourcesText = cluster.items
    .slice(0, 3)
    .map(item =>
      `Source: ${item.sourceName}\nHeadline: ${item.headline}\nSnippet: ${(item.snippet || item.content || '').substring(0, 200)}`
    )
    .join('\n\n');

  try {
    if (process.env.LLM_API_KEY && process.env.LLM_PROVIDER === 'openai') {
      return await withRetry(() => callOpenAI(sourcesText, keywords, cluster));
    } else if (process.env.LLM_API_KEY && process.env.LLM_PROVIDER === 'gemini') {
      return await withRetry(() => callGemini(sourcesText, keywords, cluster));
    }
  } catch (err) {
    console.warn(`LLM unavailable: ${err.message}. Using structured real-data summary.`);
  }

  return generateSummaryFromRealData(cluster, keywords);
};

/**
 * Builds a clean, structured summary from actual fetched article data.
 * Used when LLM is unavailable or rate-limited.
 */
const generateSummaryFromRealData = (cluster, keywords) => {
  const mainItem = cluster.items[0];
  const otherItems = cluster.items.slice(1, 4);

  // Build summary from real content
  let summary = '';
  const rawText = (mainItem.snippet || mainItem.content || '').trim();

  if (rawText.length > 40) {
    summary = rawText.replace(/\s+/g, ' ');
  } else {
    // Combine snippets from multiple sources
    const snippets = cluster.items
      .map(i => (i.snippet || i.content || '').trim())
      .filter(s => s.length > 20)
      .slice(0, 3);

    summary = snippets.join(' ');
    if (!summary) {
      summary = `${mainItem.headline}. Reported by ${cluster.items.map(i => i.sourceName).join(', ')}.`;
    }
  }

  // Cap at ~60 words
  summary = summary.split(' ').slice(0, 60).join(' ').trim();
  if (!summary.endsWith('.')) summary += '.';

  const uniqueSources = [...new Set(cluster.items.map(i => i.sourceName))].slice(0, 3).join(', ');
  const whyItMatters = `Covered by ${uniqueSources} — this story about "${keywords.join(', ')}" is trending and gaining attention.`;

  // Keep image prompt short and safe (under 200 chars)
  const shortHeadline = mainItem.headline.substring(0, 60);
  const imagePrompt = `${shortHeadline}. Cinematic news photography, dramatic lighting.`;

  return {
    headline: mainItem.headline,
    summary: summary.substring(0, 400),
    whyItMatters: whyItMatters.substring(0, 300),
    imagePrompt,
  };
};

const callOpenAI = async (sourcesText, keywords, cluster) => {
  const prompt = `Summarize these news sources into a short mobile story card. Return ONLY valid JSON, no markdown.

${sourcesText}

JSON format: {"headline":"max 12 words","summary":"max 50 words, 2-3 sentences","whyItMatters":"1 sentence","imagePrompt":"10-15 word photo description"}`;

  const response = await axios.post(
    'https://api.openai.com/v1/chat/completions',
    {
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      max_tokens: 250,
      temperature: 0.4,
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.LLM_API_KEY}`,
        'Content-Type': 'application/json',
      },
      timeout: 20000,
    }
  );

  return JSON.parse(response.data.choices[0].message.content);
};

const callGemini = async (sourcesText, keywords, cluster) => {
  const prompt = `Summarize these news sources into a short mobile story card. Return ONLY valid JSON, no markdown.

${sourcesText}

JSON format: {"headline":"max 12 words","summary":"max 50 words, 2-3 sentences","whyItMatters":"1 sentence","imagePrompt":"10-15 word photo description"}`;

  // Try models in order of preference
  const models = ['gemini-1.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash-latest', 'gemini-pro'];

  for (const model of models) {
    try {
      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.LLM_API_KEY}`,
        {
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: 'application/json',
            maxOutputTokens: 250,
            temperature: 0.4,
          },
        },
        { timeout: 20000 }
      );

      const text = response.data.candidates[0].content.parts[0].text;
      console.log(`✅ Gemini model used: ${model}`);
      return JSON.parse(text);
    } catch (err) {
      if (err.response?.status === 404) {
        console.warn(`Gemini model "${model}" not found, trying next...`);
        continue;
      }
      throw err; // Re-throw non-404 errors (429, auth failures, etc.)
    }
  }

  throw new Error('No Gemini model available');
};
