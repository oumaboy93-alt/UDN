import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useI18n } from '../lib/i18n';

interface TerminalBootProps {
  onComplete: () => void;
}

export default function TerminalBoot({ onComplete }: TerminalBootProps) {
  const { t } = useI18n();
  const [lines, setLines] = useState<string[]>([]);
  const [isComplete, setIsComplete] = useState(false);

  const bootLines = [
    t('boot.initializing'),
    t('boot.loading_assets'),
    t('boot.securing_connection'),
    t('boot.ready')
  ];

  useEffect(() => {
    let currentLine = 0;
    const interval = setInterval(() => {
      if (currentLine < bootLines.length) {
        setLines(prev => [...prev, bootLines[currentLine]]);
        currentLine++;
      } else {
        clearInterval(interval);
        setTimeout(() => {
          setIsComplete(true);
          setTimeout(onComplete, 1000);
        }, 1000);
      }
    }, 800);

    return () => clearInterval(interval);
  }, []);

  return (
    <AnimatePresence>
      {!isComplete && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-terminal-bg z-[10000] flex flex-col p-8 font-mono text-neon-green"
        >
          <div className="max-w-2xl mx-auto w-full">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="mb-12 text-center"
            >
              <h1 className="text-4xl font-bold tracking-tighter glitch hover:animate-glitch">UDN CORE</h1>
              <p className="text-xs opacity-50 mt-2 tracking-widest uppercase">Unified Drop Network v2.5.0</p>
            </motion.div>

            <div className="space-y-2">
              {lines.map((line, i) => (
                <motion.div
                  key={i}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  className="flex items-center gap-3"
                >
                  <span className="text-xs opacity-50">[{new Date().toLocaleTimeString()}]</span>
                  <span className="text-sm">{line}</span>
                  {i === lines.length - 1 && (
                    <motion.span
                      animate={{ opacity: [1, 0] }}
                      transition={{ repeat: Infinity, duration: 0.5 }}
                      className="w-2 h-4 bg-neon-green"
                    />
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
