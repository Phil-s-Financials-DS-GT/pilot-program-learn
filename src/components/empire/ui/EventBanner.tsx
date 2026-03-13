import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Shield, Clock, AlertTriangle, Sparkles } from 'lucide-react';
import { ActiveEvent, EconomicEvent } from '../systems/EventManager';

interface EventBannerProps {
  activeEvent: ActiveEvent | null;
  getRemainingTime: () => number;
  insuranceProtection: number;
  onDismiss?: () => void;
}

const EventBanner: React.FC<EventBannerProps> = ({
  activeEvent,
  getRemainingTime,
  insuranceProtection,
  onDismiss,
}) => {
  const [remainingTime, setRemainingTime] = useState(0);
  const [showDetails, setShowDetails] = useState(false);
  
  useEffect(() => {
    if (!activeEvent || activeEvent.event.duration === 0) return;
    
    const interval = setInterval(() => {
      setRemainingTime(getRemainingTime());
    }, 100);
    
    return () => clearInterval(interval);
  }, [activeEvent, getRemainingTime]);
  
  if (!activeEvent) return null;
  
  const { event, mitigated } = activeEvent;
  const isInstant = event.duration === 0;
  const progress = isInstant ? 100 : ((event.duration - remainingTime) / event.duration) * 100;
  
  const formatTime = (ms: number) => {
    const seconds = Math.ceil(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    if (minutes > 0) {
      return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    return `${seconds}s`;
  };
  
  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -100, opacity: 0 }}
        className="fixed top-4 left-4 right-4 z-50"
      >
        <div
          className={`rounded-2xl shadow-2xl overflow-hidden ${
            event.isNegative
              ? 'bg-gradient-to-r from-red-500 to-rose-600'
              : 'bg-gradient-to-r from-emerald-500 to-teal-600'
          }`}
        >
          <div className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <motion.span
                  className="text-4xl"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 1 }}
                >
                  {event.emoji}
                </motion.span>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-white text-lg">{event.name}</h3>
                    {event.isNegative ? (
                      <AlertTriangle className="w-4 h-4 text-yellow-300" />
                    ) : (
                      <Sparkles className="w-4 h-4 text-yellow-300" />
                    )}
                  </div>
                  <p className="text-white/90 text-sm">{event.description}</p>
                </div>
              </div>
              
              {isInstant && onDismiss && (
                <button
                  onClick={onDismiss}
                  className="p-1 rounded-full hover:bg-white/20 transition-colors"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              )}
            </div>
            
            {mitigated && insuranceProtection > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-2 flex items-center gap-2 text-white/90 text-sm bg-white/20 rounded-lg px-3 py-1.5"
              >
                <Shield className="w-4 h-4" />
                <span>Insurance reduced damage by {insuranceProtection}%!</span>
              </motion.div>
            )}
            
            {!isInstant && (
              <div className="mt-3">
                <div className="flex items-center justify-between text-white/80 text-xs mb-1">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>Time remaining</span>
                  </div>
                  <span className="font-mono font-bold">{formatTime(remainingTime)}</span>
                </div>
                <div className="h-2 bg-white/30 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-white rounded-full"
                    initial={{ width: '0%' }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.1 }}
                  />
                </div>
              </div>
            )}
            
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="mt-2 text-white/70 text-xs hover:text-white transition-colors"
            >
              {showDetails ? 'Hide details' : 'Learn more about this event'}
            </button>
          </div>
          
          <AnimatePresence>
            {showDetails && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="bg-black/20 px-4 py-3"
              >
                <div className="flex items-start gap-2">
                  <span className="text-xl">🐼</span>
                  <div>
                    <p className="text-white/90 text-sm font-medium mb-1">Phil says:</p>
                    <p className="text-white/80 text-sm">{event.educationalDescription}</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default EventBanner;
