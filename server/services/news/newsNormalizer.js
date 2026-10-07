import { fetchGoogleNews } from './googleNewsService.js';
import { fetchHackerNews } from './hackerNewsService.js';

export const collectAndNormalizeNews = async (keywords) => {
  console.log(`Collecting news for keywords: ${keywords.join(', ')}`);

  // Run both sources in parallel; each handles its own errors gracefully
  const [googleResults, hnResults] = await Promise.all([
    fetchGoogleNews(keywords),
    fetchHackerNews(keywords),
  ]);

  let combined = [...googleResults, ...hnResults];

  // Filter out items missing headline or URL
  combined = combined.filter(item => item.headline && item.url);

  // Remove duplicates by URL
  const seen = new Set();
  combined = combined.filter(item => {
    if (seen.has(item.url)) return false;
    seen.add(item.url);
    return true;
  });

  // Sort by date, newest first
  combined.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));

  console.log(`Total normalized articles: ${combined.length} (Google: ${googleResults.length}, HN: ${hnResults.length})`);
  return combined;
};
