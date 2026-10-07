import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ArrowRight, Zap, History, Clock } from 'lucide-react';
import axios from 'axios';
import './Home.css';

const DEFAULT_TOPICS = [
  'Live News', 'OpenAI', 'Artificial Intelligence', 'India Startups',
  'Apple', 'Google', 'SpaceX', 'Technology',
];

const TICKER_ITEMS = [
  'AI reshapes global economy',
  'SpaceX Starship reaches orbit',
  'India surpasses UK in tech investment',
  'OpenAI unveils new frontier model',
  'Google Gemini leads enterprise adoption',
  'Climate summit reaches record deal',
  'Apple Vision Pro 2 confirmed',
];

const today = new Date().toLocaleDateString('en-US', {
  weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
});

const Home = () => {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [historyTopics, setHistoryTopics] = useState(DEFAULT_TOPICS);
  const [isHistory, setIsHistory] = useState(false);
  const navigate = useNavigate();

  const [liveNews, setLiveNews] = useState([]);
  const [tickerItems, setTickerItems] = useState([...TICKER_ITEMS, ...TICKER_ITEMS]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const apiUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/api$/, '');

        // Fetch trending news for ticker
        axios.get(`${apiUrl}/api/news/trending`).then(res => {
          if (res.data.success && res.data.data.length > 0) {
            const headlines = res.data.data;
            setTickerItems([...headlines, ...headlines]);
          }
        }).catch(() => {});

        // Fetch search history for chips
        try {
          const historyRes = await axios.get(`${apiUrl}/api/search/history`);
          if (historyRes.data.success && historyRes.data.data.length > 0) {
            const uniqueQueries = [...new Set(historyRes.data.data.map(h => h.query))].slice(0, 7);
            setHistoryTopics(uniqueQueries);
            setIsHistory(true);
          }
        } catch (_) {}

        // Fetch live India news for cards
        const newsRes = await axios.get(`${apiUrl}/api/news/live-india`);
        if (newsRes.data.success && newsRes.data.data.length > 0) {
          setLiveNews(newsRes.data.data);
        }
      } catch (err) {
        console.error('Failed to fetch data', err);
      }
    };
    fetchData();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setIsSearching(true);
    setTimeout(() => {
      navigate(`/feed?q=${encodeURIComponent(query)}`);
    }, 300);
  };

  const handleChipClick = (topic) => {
    setQuery(topic);
  };

  return (
    <div className="home-root dot-grid">

      {/* ── Ticker Bar ── */}
      <div className="ticker-bar">
        <span className="ticker-label">
          <Zap size={10} style={{ marginRight: 5 }} />
          Breaking
        </span>
        <div style={{ overflow: 'hidden', flex: 1 }}>
          <div className="ticker-track">
            {tickerItems.map((item, i) => (
              <span className="ticker-item" key={i}>{item}</span>
            ))}
          </div>
        </div>
      </div>

      {/* ── Masthead ── */}
      <header className="masthead">
        <div className="masthead-date desktop-only">{today}</div>

        <div className="masthead-center">
          <h1 className="masthead-logo">NewsReel</h1>
          <p className="masthead-tagline desktop-only">AI-curated stories · Real-time intelligence</p>
        </div>

        {/* Desktop: Saved Stories button */}
        <div className="masthead-edition desktop-only">
          <button
            onClick={() => navigate('/saved')}
            style={{
              background: 'transparent',
              border: '1px solid var(--amber)',
              color: 'var(--amber)',
              padding: '4px 12px',
              borderRadius: '2px',
              cursor: 'pointer',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.7rem',
              textTransform: 'uppercase',
            }}
          >
            Saved Stories
          </button>
        </div>

        {/* Mobile: LIVE badge */}
        <div className="mobile-only mobile-live-badge">
          <div className="live-dot" />
          LIVE
        </div>
      </header>

      {/* ── Main Content ── */}
      <main className="home-content">
        <div className="home-inner">

          {/* Headline Block — desktop only */}
          <div className="headline-block desktop-only">
            <span className="headline-kicker">
              <span className="kicker-dot" />
              Live Intelligence Feed
            </span>
            <h2 className="main-headline">
              What's unfolding<br />
              <span className="headline-accent">right now?</span>
            </h2>
            <p className="deck-copy">
              Real-time news, AI-synthesised into stunning visual stories.
              Search any topic and get a curated short-form briefing in seconds.
            </p>
          </div>

          {/* Search bar — desktop only */}
          <div className="search-section desktop-only">
            <form onSubmit={handleSearch}>
              <div className={`search-field ${isSearching ? 'scanning' : ''}`}>
                <div className="search-prefix">
                  <Search size={18} />
                </div>
                <input
                  type="text"
                  className="search-input"
                  placeholder="Enter a topic, company, person, or event…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  disabled={isSearching}
                  autoFocus
                />
                <button type="submit" className="search-btn" disabled={isSearching}>
                  {isSearching ? (
                    <div className="spin-loader" />
                  ) : (
                    <>Run Story <ArrowRight size={14} /></>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Topic chips — desktop only */}
          <div className="topics-section desktop-only">
            <p className="topics-label" style={{ display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'center' }}>
              {isHistory ? <><History size={12} /> Recent Searches</> : 'Quick Topics'}
            </p>
            <div className="chips-row">
              {historyTopics.map((topic) => (
                <button
                  key={topic}
                  className="topic-chip"
                  onClick={() => handleChipClick(topic)}
                >
                  <span>{topic}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Live News Cards */}
          {liveNews.length > 0 && (
            <div className="live-news-section">
              <h3 className="live-coverage-title desktop-only">
                <span className="kicker-dot" style={{ display: 'inline-block' }} /> Live Coverage
              </h3>

              <div className="scrollable-feed">
                {liveNews.map(story => (
                  <div
                    key={story._id}
                    className="live-card"
                    onClick={() => navigate(`/feed?q=${encodeURIComponent(story.keywords?.[0] || 'India')}`)}
                  >
                    {/* Image */}
                    <div className="live-card-image">
                      <img
                        src={story.imageUrl || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800&q=80'}
                        alt={story.headline}
                      />
                      <div className="live-card-gradient" />
                      <span className="live-card-badge">{story.category || 'General'}</span>
                    </div>

                    {/* Content */}
                    <div className="live-card-body">
                      <h4 className="live-card-headline">{story.headline}</h4>
                      <p className="live-card-summary">{story.summary}</p>
                      <div className="live-card-footer">
                        <span><Clock size={12} /> {story.sources?.length || 1} sources</span>
                        <span className="live-card-read">Read <ArrowRight size={12} /></span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </main>

      {/* Footer */}
      <footer className="home-footer" style={{ marginTop: 'auto' }}>
        © {new Date().getFullYear()} NewsReel · AI-Powered Press · All sources cited
      </footer>
    </div>
  );
};

export default Home;
