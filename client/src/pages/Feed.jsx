import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Newspaper } from 'lucide-react';
import { motion } from 'framer-motion';
import ShortsFeed from '../components/ShortsFeed.jsx';
import LoadingScreen from '../components/LoadingScreen.jsx';

const Feed = () => {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  const query = queryParams.get('q');

  useEffect(() => {
    if (!query) { navigate('/'); return; }

    const fetchStories = async () => {
      try {
        setLoading(true);
        const keywords = query.split(',').map(k => k.trim()).filter(k => k);
        const apiUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/api$/, '');
        const response = await axios.post(`${apiUrl}/api/news/search`, { keywords });
        if (response.data.success) {
          setStories(response.data.data);
        } else {
          setError(response.data.error?.message || 'Failed to fetch stories');
        }
      } catch (err) {
        setError(err.message || 'An error occurred.');
      } finally {
        setLoading(false);
      }
    };

    fetchStories();
  }, [query, navigate]);

  if (loading) return <LoadingScreen query={query} />;

  if (error) {
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
        <Newspaper size={48} color="var(--amber)" style={{ marginBottom: '1.5rem' }} />
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', marginBottom: '0.5rem' }}>
          Press Error
        </h2>
        <p style={{ color: 'var(--muted)', marginBottom: '2rem' }}>{error}</p>
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
        <Newspaper size={48} color="var(--muted)" style={{ marginBottom: '1.5rem' }} />
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', marginBottom: '0.5rem' }}>
          No Stories Filed
        </h2>
        <p style={{ color: 'var(--muted)', marginBottom: '2rem' }}>
          No coverage found for "{query}" right now.
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
          ← New Search
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

export default Feed;
