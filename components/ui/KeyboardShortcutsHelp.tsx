'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ShortcutItem {
  keys: string[];
  description: string;
}

const shortcuts: { category: string; items: ShortcutItem[] }[] = [
  {
    category: 'Navigation',
    items: [
      { keys: ['⌘', 'G'], description: 'Go to Home' },
      { keys: ['⌘', 'F'], description: 'Go to Feed' },
      { keys: ['⌘', 'S'], description: 'Go to Spaces' },
      { keys: ['⌘', 'E'], description: 'Go to Events' },
      { keys: ['⌘', 'P'], description: 'Go to Profile/Settings' },
    ],
  },
  {
    category: 'Actions',
    items: [
      { keys: ['/'], description: 'Focus search' },
      { keys: ['Esc'], description: 'Close modal/dialog' },
      { keys: ['?'], description: 'Show this help' },
    ],
  },
];

export function KeyboardShortcutsHelp() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleShowShortcuts = () => setIsOpen(true);
    window.addEventListener('show-shortcuts', handleShowShortcuts);
    return () => window.removeEventListener('show-shortcuts', handleShowShortcuts);
  }, []);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md"
          >
            <div className="bg-card border border-white/10 rounded-xl shadow-xl overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-white/10">
                <h2 className="text-lg font-semibold text-white">Keyboard Shortcuts</h2>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 text-gray-400 hover:text-white transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Content */}
              <div className="p-4 max-h-[60vh] overflow-y-auto">
                {shortcuts.map((section, i) => (
                  <div key={section.category} className={i > 0 ? 'mt-6' : ''}>
                    <h3 className="text-xs font-semibold uppercase text-gray-500 mb-3">
                      {section.category}
                    </h3>
                    <div className="space-y-2">
                      {section.items.map((item) => (
                        <div
                          key={item.description}
                          className="flex items-center justify-between py-2"
                        >
                          <span className="text-sm text-gray-300">{item.description}</span>
                          <div className="flex items-center gap-1">
                            {item.keys.map((key, idx) => (
                              <span key={idx}>
                                <kbd className="px-2 py-1 text-xs font-medium bg-white/10 border border-white/20 rounded text-gray-300">
                                  {key}
                                </kbd>
                                {idx < item.keys.length - 1 && (
                                  <span className="mx-1 text-gray-500">+</span>
                                )}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-white/10 bg-white/5">
                <p className="text-xs text-gray-500 text-center">
                  Press <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-gray-400">?</kbd> to toggle this help
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
