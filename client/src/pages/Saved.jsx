import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Bookmark } from 'lucide-react';
import { motion } from 'framer-motion';
import ShortsFeed from '../components/ShortsFeed.jsx';

const SAVED_KEY = 'newsreel_saved_stories';

const Saved = () => {
  const [stories, setStories] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(SAVED_KEY) || '[]');
      setStories(saved);
    } catch (err) {
      setStories([]);
    }
  }, []);

  if (stories.length === 0) {
    return (
      <div style={{
        background: 'var(--paper)',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'var(--font-sans)',
        color: 'var(--ink)',
        padding: '2rem',
        textAlign: 'center',
      }}>
        <Bookmark size={48} color="var(--muted)" style={{ marginBottom: '1.5rem' }} />
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', marginBottom: '0.5rem' }}>
          No Saved Stories
        </h2>
        <p style={{ color: 'var(--muted)', marginBottom: '2rem' }}>
          Stories you save will appear here.
        </p>
        <button
          onClick={() => navigate('/')}
          style={{
            padding: '0.75rem 2rem',
            background: 'var(--ink)',
            color: 'var(--amber-light)',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.75rem',
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          ← Return to Desk
        </button>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', height: '100vh', width: '100vw', background: 'var(--charcoal)', overflow: 'hidden' }}>
      {/* Back button */}
      <motion.button
        onClick={() => navigate('/')}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.5 }}
        style={{
          position: 'absolute',
          top: '20px',
          left: '20px',
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          background: 'var(--paper)',
          border: '2px solid var(--ink)',
          borderRadius: '2px',
          padding: '6px 14px',
          fontFamily: 'var(--font-mono)',
          fontSize: '0.65rem',
          fontWeight: 700,
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
          color: 'var(--ink)',
          cursor: 'pointer',
          boxShadow: '3px 3px 0 var(--amber)',
          transition: 'box-shadow 0.15s ease, transform 0.15s ease',
        }}
        whileHover={{ boxShadow: '5px 5px 0 var(--amber)', transform: 'translate(-1px, -1px)' }}
        whileTap={{ scale: 0.96 }}
      >
        <ArrowLeft size={12} /> Back
      </motion.button>

      <ShortsFeed stories={stories} />
    </div>
  );
};

export default Saved;
