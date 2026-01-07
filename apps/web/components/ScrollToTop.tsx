'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUp } from 'lucide-react';

export default function ScrollToTop() {
  const [isVisible, setIsVisible] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const toggleVisibility = () => {
      const scrolled = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = (scrolled / docHeight) * 100;

      setScrollProgress(progress);

      // Show button when page is scrolled down 300px
      if (scrolled > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', toggleVisibility);
    // Initial check
    toggleVisibility();

    return () => {
      window.removeEventListener('scroll', toggleVisibility);
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 20 }}
          transition={{ duration: 0.3 }}
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 z-50 group"
          aria-label="Scroll to top"
          title="Scroll to top"
        >
          {/* Glass morphism container */}
          <div className="relative">
            {/* Glow effect on hover */}
            <div className="absolute inset-0 rounded-full bg-white/10 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            {/* Progress ring */}
            <svg className="absolute inset-0 w-14 h-14 -rotate-90" viewBox="0 0 56 56">
              <circle
                cx="28"
                cy="28"
                r="26"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="text-white/10"
              />
              <circle
                cx="28"
                cy="28"
                r="26"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeDasharray={`${2 * Math.PI * 26}`}
                strokeDashoffset={`${2 * Math.PI * 26 * (1 - scrollProgress / 100)}`}
                className="text-teal-400 transition-all duration-150"
                strokeLinecap="round"
              />
            </svg>

            {/* Button */}
            <div className="relative w-14 h-14 glass rounded-full flex items-center justify-center text-white/60 group-hover:text-white group-hover:bg-white/[0.08] transition-all duration-300 group-hover:scale-105 active:scale-95">
              <ArrowUp className="w-5 h-5 group-hover:-translate-y-0.5 transition-transform duration-300" />
            </div>
          </div>
        </motion.button>
      )}
    </AnimatePresence>
  );
}
