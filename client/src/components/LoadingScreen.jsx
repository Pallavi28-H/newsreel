import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Rss, FileText, Brain, Image } from 'lucide-react';
import './LoadingScreen.css';

const STAGES = [
  { id: 1, text: 'Scanning the wire…',   sub: 'Discovering live sources',   icon: <Rss size={28} /> },
  { id: 2, text: 'Cross-referencing…',   sub: 'Combining coverage',         icon: <FileText size={28} /> },
  { id: 3, text: 'Briefing the editor…', sub: 'AI analysis underway',       icon: <Brain size={28} /> },
  { id: 4, text: 'Setting the press…',   sub: 'Generating visual spreads',  icon: <Image size={28} /> },
];

const LoadingScreen = ({ query }) => {
  const [currentStage, setCurrentStage] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentStage(prev => (prev < STAGES.length - 1 ? prev + 1 : prev));
    }, 1600);
    return () => clearInterval(timer);
  }, []);

  const progress = ((currentStage + 1) / STAGES.length) * 100;

  return (
    <div className="loading-root">
      {/* Column texture */}
      <div className="loading-columns">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="loading-col" />
        ))}
      </div>

      {/* Masthead mark */}
      <motion.div
        className="loading-mark"
        animate={{ opacity: [1, 0.6, 1] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      >
        NR
      </motion.div>

      {/* Stage area */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStage}
          className="loading-stage"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -14 }}
          transition={{ duration: 0.4 }}
        >
          <div className="stage-icon">{STAGES[currentStage].icon}</div>
          <p className="stage-text">
            {STAGES[currentStage].text}
            <span className="cursor-blink" />
          </p>
          <p className="stage-sub">{STAGES[currentStage].sub}</p>
        </motion.div>
      </AnimatePresence>

      {/* Progress bar */}
      <div className="loading-progress-track">
        <motion.div
          className="loading-progress-fill"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Dots */}
      <div className="stage-dots">
        {STAGES.map((_, i) => (
          <div
            key={i}
            className={`stage-dot ${i === currentStage ? 'active' : i < currentStage ? 'done' : ''}`}
          />
        ))}
      </div>
    </div>
  );
};

export default LoadingScreen;
