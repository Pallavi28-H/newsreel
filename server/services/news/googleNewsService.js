import Parser from 'rss-parser';

const parser = new Parser({
  customFields: {
    item: ['source']
  }
});

export const fetchGoogleNews = async (keywords) => {
  try {
    const query = encodeURIComponent(keywords.join(' '));
    // Use Google News RSS feed format
    const url = `https://news.google.com/rss/search?q=${query}&hl=en-US&gl=US&ceid=US:en`;
    
    const feed = await parser.parseURL(url);
    
    // Normalize the results
    const results = feed.items.map(item => {
      // Basic normalization
      return {
        sourceName: item.source || 'Google News',
        sourceType: 'News',
        headline: item.title,
        url: item.link,
        publishedAt: new Date(item.pubDate),
        author: item.creator || '',
        imageUrl: '', // Google News RSS usually doesn't have clean images in standard tags
        content: item.content || '',
        snippet: item.contentSnippet || ''
      };
    });

    return results;
  } catch (error) {
    console.error('Error fetching Google News:', error.message);
    // Return empty array on failure so pipeline doesn't break
    return [];
  }
};

export const fetchTrendingHeadlines = async () => {
  try {
    const url = 'https://news.google.com/rss?hl=en-US&gl=US&ceid=US:en';
    const feed = await parser.parseURL(url);
    
    return feed.items.map(item => item.title);
  } catch (error) {
    console.error('Error fetching trending headlines:', error.message);
    return [];
  }
};

export const fetchLiveIndiaNews = async () => {
  try {
    const url = 'https://news.google.com/rss?hl=en-IN&gl=IN&ceid=IN:en';
    const feed = await parser.parseURL(url);
    
    // Return top 5 articles (skip the first item which is just the site title)
    return feed.items.slice(0, 5).map(item => ({
      headline: item.title.split(' - ')[0] || item.title,
      summary: item.contentSnippet || item.title,
      url: item.link,
      category: 'India Live',
      sourceName: item.source || 'News',
    }));
  } catch (error) {
    console.error('Error fetching India live news:', error.message);
    return [];
  }
};
