import { collectAndNormalizeNews } from '../services/news/newsNormalizer.js';
import { clusterStories } from '../services/news/clusterService.js';
import { generateStoryFromCluster } from '../services/ai/aiService.js';
import { generateImage } from '../services/image/imageService.js';
import { Story } from '../models/Story.js';
import { Source } from '../models/Source.js';
import { SearchHistory } from '../models/SearchHistory.js';
import { fetchTrendingHeadlines, fetchLiveIndiaNews } from '../services/news/googleNewsService.js';
import { callGoogleImages } from '../services/image/imageService.js';

export const processNewsSearch = async (req, res, next) => {
  try {
    const { keywords } = req.body;

    if (!keywords || !Array.isArray(keywords) || keywords.length === 0) {
      return res.status(400).json({ success: false, error: { message: 'Keywords are required' } });
    }

    // Save search history (fire and forget)
    SearchHistory.create({ query: keywords.join(', ') }).catch(e => console.error('SearchHistory error:', e));

    // 1. Collect & Normalize from real sources
    const rawNews = await collectAndNormalizeNews(keywords);

    if (rawNews.length === 0) {
      return res.json({ success: true, data: [] });
    }

    // 2. Cluster similar stories
    const clusters = clusterStories(rawNews);

    // 3. Process top 5 clusters
    const finalStories = [];
    const topClusters = clusters.slice(0, 5);

    for (const [i, cluster] of topClusters.entries()) {
      // Small gap between API calls to stay within rate limits
      if (i > 0) await new Promise(r => setTimeout(r, 1000));
      // 4. Generate AI summary
      const aiData = await generateStoryFromCluster(cluster, keywords);

      // 5. Generate image — use the real search keywords for image search (Bing/Google)
      //    so "gta 6" searches for GTA 6 images, not the AI-generated description.
      //    The aiData.imagePrompt is kept as fallback for AI generation providers (DALL-E, Imagen).
      const imageUrl = await generateImage(keywords.join(' '), aiData.imagePrompt);

      // 6. Save sources to DB
      const savedSources = await Promise.all(
        cluster.items.map(item => Source.create(item))
      );

      // 7. Save story to DB
      const savedStory = await Story.create({
        clusterId: cluster.id,
        headline: aiData.headline,
        summary: aiData.summary,
        whyItMatters: aiData.whyItMatters,
        imageUrl,
        imagePrompt: aiData.imagePrompt,
        category: keywords[0] || 'General',
        keywords,
        sources: savedSources.map(s => s._id),
      });

      // 8. Return fully populated story
      const populated = await Story.findById(savedStory._id).populate('sources');
      finalStories.push(populated);
    }

    res.json({ success: true, data: finalStories });

  } catch (error) {
    next(error);
  }
};
export const getTrendingNews = async (req, res, next) => {
  try {
    const headlines = await fetchTrendingHeadlines();
    res.json({ success: true, data: headlines });
  } catch (error) {
    next(error);
  }
};

export const getLiveIndiaCoverage = async (req, res, next) => {
  try {
    const articles = await fetchLiveIndiaNews();
    
    // Fetch images for each in parallel
    const stories = await Promise.all(articles.map(async (article, idx) => {
      let imageUrl = '';
      try {
        // use Bing image scrape with the headline
        imageUrl = await callGoogleImages(article.headline);
      } catch (e) {
        console.log(`Failed to fetch image for: ${article.headline}`);
      }
      return {
        _id: `live_${idx}`, // Fake ID for react key
        headline: article.headline,
        summary: article.summary,
        imageUrl: imageUrl || `https://picsum.photos/seed/${idx}/800/600`,
        category: 'India Live',
        keywords: ['India'],
        sources: [1], // Mock 1 source
      };
    }));
    
    res.json({ success: true, data: stories });
  } catch (error) {
    next(error);
  }
};
