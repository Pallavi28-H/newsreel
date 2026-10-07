import React from 'react';
import { motion } from 'framer-motion';
import { X, ExternalLink, Globe } from 'lucide-react';

const SourceModal = ({ sources, onClose, accentColor = '#d97706' }) => {
  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        style={{
          position: 'absolute', inset: 0,
          background: 'rgba(26,18,8,0.75)',
          backdropFilter: 'blur(4px)',
          zIndex: 40,
        }}
      />

      {/* Bottom sheet */}
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 220 }}
        style={{
          position: 'absolute',
          bottom: 0, left: 0, right: 0,
          zIndex: 50,
          background: 'var(--paper)',
          borderTop: `3px solid ${accentColor}`,
          borderRadius: '8px 8px 0 0',
          maxHeight: '82vh',
          display: 'flex',
          flexDirection: 'column',
          fontFamily: 'var(--font-sans)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '18px 20px 14px',
          borderBottom: '1px solid rgba(26,18,8,0.1)',
          background: 'var(--paper)',
        }}>
          {/* Drag handle */}
          <div style={{
            position: 'absolute',
            top: 8, left: '50%',
            transform: 'translateX(-50%)',
            width: 40, height: 4,
            background: 'rgba(26,18,8,0.15)',
            borderRadius: 2,
          }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: 8 }}>
            <Globe size={18} color={accentColor} />
            <h3 style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '1.2rem',
              fontWeight: 700,
              color: 'var(--ink)',
            }}>
              Source Articles
            </h3>
          </div>
          <button
            onClick={onClose}
            style={{
              marginTop: 8,
              width: 32, height: 32,
              border: '1.5px solid rgba(26,18,8,0.2)',
              borderRadius: '2px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
              color: 'var(--slate)',
              background: 'transparent',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--ink)'; e.currentTarget.style.color = 'var(--paper)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--slate)'; }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Source list */}
        <div style={{
          overflowY: 'auto',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          paddingBottom: '32px',
        }}>
          {!sources || sources.length === 0 ? (
            <p style={{
              textAlign: 'center',
              padding: '2rem',
              color: 'var(--muted)',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.75rem',
              letterSpacing: '0.1em',
            }}>
              No source information available.
            </p>
          ) : (
            sources.map((source, idx) => (
              <motion.a
                key={source._id || idx}
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.06 }}
                style={{
                  display: 'block',
                  padding: '14px',
                  border: '1.5px solid rgba(26,18,8,0.1)',
                  borderRadius: '2px',
                  textDecoration: 'none',
                  background: 'var(--cream)',
                  transition: 'all 0.2s ease',
                  borderLeft: `3px solid ${accentColor}`,
                  boxShadow: 'none',
                }}
                whileHover={{
                  boxShadow: `3px 3px 0 ${accentColor}`,
                  x: -2,
                  y: -2,
                }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '6px',
                }}>
                  <span style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.58rem',
                    fontWeight: 700,
                    letterSpacing: '0.18em',
                    textTransform: 'uppercase',
                    color: accentColor,
                  }}>
                    {source.sourceName}
                  </span>
                  <span style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.58rem',
                    color: 'var(--muted)',
                  }}>
                    {source.publishedAt
                      ? new Date(source.publishedAt).toLocaleDateString()
                      : 'Recent'}
                  </span>
                </div>

                <h4 style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  color: 'var(--ink)',
                  lineHeight: 1.35,
                  marginBottom: source.snippet ? '6px' : '10px',
                }}>
                  {source.headline}
                </h4>

                {source.snippet && (
                  <p style={{
                    fontSize: '0.78rem',
                    color: 'var(--slate)',
                    lineHeight: 1.5,
                    marginBottom: '10px',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}>
                    {source.snippet}
                  </p>
                )}

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.6rem',
                  fontWeight: 700,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: accentColor,
                }}>
                  Read Original <ExternalLink size={11} />
                </div>
              </motion.a>
            ))
          )}
        </div>
      </motion.div>
    </>
  );
};

export default SourceModal;
