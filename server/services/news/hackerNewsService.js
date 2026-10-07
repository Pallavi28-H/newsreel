import axios from 'axios';

/**
 * Fetches stories from HackerNews via Algolia API.
 * Free, no auth required, no rate limiting issues.
 */
export const fetchHackerNews = async (keywords) => {
  try {
    const query = encodeURIComponent(keywords.join(' '));
    const url = `https://hn.algolia.com/api/v1/search?query=${query}&tags=story&hitsPerPage=15`;

    const response = await axios.get(url, { timeout: 8000 });
    const hits = response.data.hits;

    const results = hits
      .filter(hit => hit.title && hit.url)
      .map(hit => ({
        sourceName: `HackerNews - ${hit.author || 'unknown'}`,
        sourceType: 'HackerNews',
        headline: hit.title,
        url: hit.url || `https://news.ycombinator.com/item?id=${hit.objectID}`,
        publishedAt: new Date(hit.created_at),
        author: hit.author || '',
        imageUrl: '',
        content: hit.story_text || '',
        snippet: hit.story_text ? hit.story_text.substring(0, 150) : '',
      }));

    console.log(`HackerNews: fetched ${results.length} results for "${keywords.join(', ')}"`);
    return results;
  } catch (error) {
    console.error('Error fetching HackerNews:', error.message);
    return [];
  }
};
