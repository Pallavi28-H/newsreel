import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bookmark, BookOpen, Clock, Share2 } from 'lucide-react';
import SourceModal from './SourceModal.jsx';

/* ─── Saved stories localStorage helpers ───────────────── */
const SAVED_KEY = 'newsreel_saved_stories';

const getSavedStories = () => {
  try { return JSON.parse(localStorage.getItem(SAVED_KEY) || '[]'); }
  catch { return []; }
};

const toggleSavedStory = (story) => {
  const saved = getSavedStories();
  const idx = saved.findIndex(s => s._id === story._id);
  if (idx === -1) {
    saved.unshift(story); // add to front
  } else {
    saved.splice(idx, 1); // remove
  }
  localStorage.setItem(SAVED_KEY, JSON.stringify(saved));
  return idx === -1; // return new saved state
};

/* ─── Category color map ────────────────────────────────── */
const CATEGORY_COLORS = {
  technology: '#d97706',
  ai:         '#b45309',
  science:    '#0369a1',
  politics:   '#dc2626',
  business:   '#16a34a',
  health:     '#7c3aed',
  sports:     '#ea580c',
  general:    '#78716c',
};


const getCategoryColor = (cat = 'general') =>
  CATEGORY_COLORS[cat.toLowerCase()] ?? CATEGORY_COLORS.general;

const StoryCard = ({ story, isActive, index }) => {
  const [isSaved, setIsSaved] = useState(() =>
    getSavedStories().some(s => s._id === story._id)
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const accentColor = getCategoryColor(story.category);

  const handleSave = () => {
    const nowSaved = toggleSavedStory(story);
    setIsSaved(nowSaved);
  };

  /* ── Stagger variants ──────────────────────────────────── */
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.15 },
    },
  };

  const lineVariant = {
    hidden: { scaleX: 0, originX: 0 },
    visible: { scaleX: 1, transition: { duration: 0.5, ease: 'easeOut' } },
  };

  const fadeUp = {
    hidden: { opacity: 0, y: 24 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
  };

  const fadePop = {
    hidden: { opacity: 0, scale: 0.88 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.35, ease: 'backOut' } },
  };

  const publishDate = new Date(story.publishedAt || Date.now())
    .toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <div
      className="story-card"
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        maxWidth: '420px',
        overflow: 'hidden',
        background: '#111',
        opacity: isActive ? 1 : 0.35,
        transition: 'opacity 0.6s ease',
        boxShadow: isActive
          ? '0 32px 80px rgba(0,0,0,0.7), 8px 8px 0 var(--amber)'
          : '0 8px 30px rgba(0,0,0,0.4)',
      }}
    >
      {/* ── Background image — Ken Burns on active ── */}
      <motion.div
        style={{ position: 'absolute', inset: 0 }}
        animate={{ scale: isActive ? 1.07 : 1 }}
        transition={{ duration: 18, ease: 'linear' }}
      >
        <img
          src={story.imageUrl || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800&q=80'}
          alt={story.headline}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      </motion.div>

      {/* ── Warm editorial gradient overlay — bottom heavy ── */}
      <div style={{
        position: 'absolute', inset: 0,
        background: `linear-gradient(
          to top,
          rgba(26,18,8,0.97)   0%,
          rgba(26,18,8,0.85)  35%,
          rgba(26,18,8,0.4)   65%,
          rgba(26,18,8,0.1)  100%
        )`,
      }} />

      {/* ── Top badge strip ── */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        padding: '16px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        zIndex: 10,
      }}>
        <motion.div
          initial={{ opacity: 0, x: -14 }}
          animate={isActive ? { opacity: 1, x: 0 } : { opacity: 0, x: -14 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '7px',
            background: accentColor,
            color: '#fff',
            padding: '4px 12px',
            borderRadius: '2px',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.6rem',
            fontWeight: 700,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
          }}
        >
          <span style={{
            width: '6px', height: '6px',
            borderRadius: '50%',
            background: '#fff',
            animation: 'press-pulse 2s ease-in-out infinite',
          }} />
          {story.category || 'General'}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 14 }}
          animate={isActive ? { opacity: 1, x: 0 } : { opacity: 0, x: 14 }}
          transition={{ delay: 0.35, duration: 0.4 }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.58rem',
            color: 'rgba(245,240,232,0.6)',
            letterSpacing: '0.1em',
          }}
        >
          <Clock size={11} />
          {publishDate}
        </motion.div>
      </div>

      {/* ── Main content — bottom area ── */}
      <div style={{
        position: 'absolute',
        bottom: 0, left: 0, right: 0,
        padding: '24px 22px 80px',
        zIndex: 10,
      }}>
        <AnimatePresence>
          {isActive && (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {/* Amber rule line */}
              <motion.div
                variants={lineVariant}
                style={{
                  height: '2px',
                  background: accentColor,
                  marginBottom: '16px',
                  borderRadius: '1px',
                }}
              />

              {/* Headline — big serif */}
              <motion.h2
                variants={fadeUp}
                style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: 'clamp(1.5rem, 5vw, 2.1rem)',
                  fontWeight: 900,
                  lineHeight: 1.1,
                  color: '#fef9ee',
                  letterSpacing: '-0.5px',
                  marginBottom: '12px',
                }}
              >
                {story.headline}
              </motion.h2>

              {/* Deck / summary — sans */}
              <motion.p
                variants={fadeUp}
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: '0.9rem',
                  color: 'rgba(245,240,232,0.82)',
                  lineHeight: 1.65,
                  marginBottom: '16px',
                  fontWeight: 400,
                }}
              >
                {story.summary}
              </motion.p>

              {/* Why it matters block */}
              {story.whyItMatters && (
                <motion.div
                  variants={fadePop}
                  style={{
                    borderLeft: `3px solid ${accentColor}`,
                    paddingLeft: '14px',
                    marginBottom: '20px',
                  }}
                >
                  <p style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.6rem',
                    letterSpacing: '0.18em',
                    textTransform: 'uppercase',
                    color: accentColor,
                    marginBottom: '6px',
                  }}>
                    Why it matters
                  </p>
                  <p style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: '0.82rem',
                    color: 'rgba(245,240,232,0.7)',
                    lineHeight: 1.55,
                  }}>
                    {story.whyItMatters}
                  </p>
                </motion.div>
              )}

              {/* Source count */}
              <motion.div
                variants={fadeUp}
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.6rem',
                  letterSpacing: '0.1em',
                  color: 'rgba(245,240,232,0.35)',
                  textTransform: 'uppercase',
                  marginBottom: '16px',
                }}
              >
                {story.sources?.length || 1} source{(story.sources?.length || 1) !== 1 ? 's' : ''} · AI synthesised
              </motion.div>

              {/* Thin separator */}
              <motion.div
                variants={lineVariant}
                style={{ height: '1px', background: 'rgba(245,240,232,0.12)', marginBottom: '16px' }}
              />

              {/* Action bar */}
              <motion.div
                variants={fadeUp}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
              >
                <div style={{ display: 'flex', gap: '10px' }}>
                  {/* Save */}
                  <motion.button
                    onClick={handleSave}
                    whileHover={{ scale: 1.12 }}
                    whileTap={{ scale: 0.9 }}
                    title={isSaved ? 'Unsave story' : 'Save story'}
                    style={{
                      width: '38px', height: '38px',
                      borderRadius: '2px',
                      border: isSaved ? `2px solid ${accentColor}` : '2px solid rgba(245,240,232,0.2)',
                      background: isSaved ? `${accentColor}22` : 'transparent',
                      color: isSaved ? accentColor : 'rgba(245,240,232,0.6)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.25s ease',
                    }}
                  >
                    <Bookmark size={16} fill={isSaved ? accentColor : 'none'} />
                  </motion.button>
                  
                  {/* Share */}
                  <motion.button
                    onClick={() => {
                      if (navigator.share) {
                        navigator.share({
                          title: story.headline,
                          text: story.summary,
                          url: window.location.href,
                        }).catch(console.error);
                      } else {
                        navigator.clipboard.writeText(`${story.headline}\n${window.location.href}`);
                        alert('Link copied to clipboard!');
                      }
                    }}
                    whileHover={{ scale: 1.12 }}
                    whileTap={{ scale: 0.9 }}
                    style={{
                      width: '38px', height: '38px',
                      borderRadius: '2px',
                      border: '2px solid rgba(245,240,232,0.2)',
                      background: 'transparent',
                      color: 'rgba(245,240,232,0.6)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.25s ease',
                    }}
                  >
                    <Share2 size={16} />
                  </motion.button>

                </div>

                {/* Sources button — editorial style */}
                <motion.button
                  onClick={() => setIsModalOpen(true)}
                  whileHover={{ x: 2, boxShadow: `3px 3px 0 ${accentColor}` }}
                  whileTap={{ scale: 0.95 }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '7px',
                    padding: '8px 18px',
                    border: '2px solid rgba(245,240,232,0.3)',
                    borderRadius: '2px',
                    background: 'transparent',
                    color: 'rgba(245,240,232,0.8)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <BookOpen size={13} />
                  Read Sources
                </motion.button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Source Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <SourceModal
            sources={story._sourcesData || story.sources}
            onClose={() => setIsModalOpen(false)}
            accentColor={accentColor}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default StoryCard;
