import axios from 'axios';

export const fetchRedditNews = async (keywords) => {
  try {
    const query = encodeURIComponent(keywords.join(' '));
    // Using unauthenticated search for hackathon simplicity. In prod, use OAuth.
    const url = `https://www.reddit.com/search.json?q=${query}&sort=new&limit=10`;
    
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'PulseShorts/1.0.0 (Hackathon Project)'
      }
    });

    const items = response.data.data.children;
    
    // Normalize the results
    const results = items.map(item => {
      const data = item.data;
      return {
        sourceName: `Reddit - r/${data.subreddit}`,
        sourceType: 'Reddit',
        headline: data.title,
        url: `https://reddit.com${data.permalink}`,
        publishedAt: new Date(data.created_utc * 1000),
        author: data.author,
        imageUrl: data.thumbnail && data.thumbnail.startsWith('http') ? data.thumbnail : '',
        content: data.selftext || '',
        snippet: data.selftext ? data.selftext.substring(0, 150) + '...' : ''
      };
    });

    return results;
  } catch (error) {
    console.error('Error fetching Reddit News:', error.message);
    return [];
  }
};
