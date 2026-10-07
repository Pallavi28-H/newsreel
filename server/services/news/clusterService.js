// Basic semantic similarity based on Jaccard Index of words
const getWords = (text) => {
  return new Set(text.toLowerCase().replace(/[^\w\s]|_/g, "").split(/\s+/).filter(w => w.length > 3));
};

const calculateSimilarity = (text1, text2) => {
  const set1 = getWords(text1);
  const set2 = getWords(text2);
  
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  
  if (union.size === 0) return 0;
  return intersection.size / union.size;
};

export const clusterStories = (normalizedNews) => {
  const clusters = [];
  const SIMILARITY_THRESHOLD = 0.25; // Adjustable threshold

  for (const item of normalizedNews) {
    let addedToCluster = false;
    
    for (const cluster of clusters) {
      // Compare against the main headline of the cluster
      const similarity = calculateSimilarity(item.headline, cluster.mainHeadline);
      
      if (similarity >= SIMILARITY_THRESHOLD) {
        cluster.items.push(item);
        addedToCluster = true;
        break;
      }
    }

    if (!addedToCluster) {
      clusters.push({
        id: `cluster-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
        mainHeadline: item.headline, // First one becomes representative
        items: [item]
      });
    }
  }

  return clusters;
};
