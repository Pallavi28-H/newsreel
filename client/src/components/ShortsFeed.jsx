import React, { useRef, useState, useEffect } from 'react';
import StoryCard from './StoryCard.jsx';
import './ShortsFeed.css';

const ShortsFeed = ({ stories }) => {
  const containerRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const handleScroll = () => {
    if (!containerRef.current) return;
    const { scrollTop, clientHeight } = containerRef.current;
    const idx = Math.round(scrollTop / clientHeight);
    if (idx !== activeIndex) setActiveIndex(idx);
  };

  useEffect(() => {
    const el = containerRef.current;
    const handleKey = (e) => {
      if (!el) return;
      if (e.key === 'ArrowDown' || e.key === 'PageDown') {
        e.preventDefault();
        el.scrollBy({ top: el.clientHeight, behavior: 'smooth' });
      } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
        e.preventDefault();
        el.scrollBy({ top: -el.clientHeight, behavior: 'smooth' });
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  const progressPct = stories.length > 1
    ? (activeIndex / (stories.length - 1)) * 100
    : 100;

  return (
    <div className="feed-wrapper">
      {/* Vertical progress indicator */}
      <div className="feed-progress">
        <div className="feed-progress-fill" style={{ height: `${progressPct}%` }} />
      </div>

      {/* Story counter */}
      <div className="feed-counter">
        {activeIndex + 1} / {stories.length}
      </div>

      {/* Swipe hint on first card */}
      {activeIndex === 0 && (
        <div className="swipe-hint">
          <div className="swipe-hint-line" />
          <span className="swipe-hint-text">Scroll</span>
        </div>
      )}

      {/* Scroll snap container */}
      <div
        className="snap-container"
        ref={containerRef}
        onScroll={handleScroll}
      >
        {stories.map((story, index) => (
          <div className="snap-point" key={story._id || index}>
            <StoryCard
              story={story}
              isActive={index === activeIndex}
              index={index}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default ShortsFeed;
