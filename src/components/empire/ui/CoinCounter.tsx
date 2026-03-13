import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Coins, Package, Sparkles, AlertTriangle, TrendingUp, TrendingDown, CreditCard } from 'lucide-react';
import { useGameStore } from '@/store/useGameStore';
import { useCreditStore } from '@/store/useCreditStore';

interface CoinCounterProps {
  totalStorage: number;
}

const CoinCounter: React.FC<CoinCounterProps> = ({ totalStorage }) => {
  const bamboo = useGameStore((state) => state.bamboo);
  const xp = useGameStore((state) => state.xp);
  
  const { enabled: creditEnabled, score: creditScore, getCreditRatingInfo } = useCreditStore();
  
  const [displayBamboo, setDisplayBamboo] = useState(bamboo);
  const [isAnimating, setIsAnimating] = useState(false);
  const [changeAmount, setChangeAmount] = useState(0);
  const prevBambooRef = useRef(bamboo);
  
  const [prevCreditScore, setPrevCreditScore] = useState(creditScore);
  const [scoreFlash, setScoreFlash] = useState<'up' | 'down' | null>(null);
  const [scoreTrend, setScoreTrend] = useState<'up' | 'down' | 'stable'>('stable');
  
  useEffect(() => {
    if (creditScore !== prevCreditScore) {
      if (creditScore > prevCreditScore) {
        setScoreFlash('up');
        setScoreTrend('up');
      } else {
        setScoreFlash('down');
        setScoreTrend('down');
      }
      setPrevCreditScore(creditScore);
      
      setTimeout(() => setScoreFlash(null), 2000);
      setTimeout(() => setScoreTrend('stable'), 10000);
    }
  }, [creditScore, prevCreditScore]);
  
  // Animate the counter when bamboo changes
  useEffect(() => {
    const diff = bamboo - prevBambooRef.current;
    if (diff !== 0) {
      setChangeAmount(diff);
      setIsAnimating(true);
      
      // Animate count up/down
      const duration = 500;
      const steps = 20;
      const stepDuration = duration / steps;
      const stepAmount = diff / steps;
      
      let currentStep = 0;
      const interval = setInterval(() => {
        currentStep++;
        setDisplayBamboo((prev) => prev + stepAmount);
        
        if (currentStep >= steps) {
          clearInterval(interval);
          setDisplayBamboo(bamboo);
          setTimeout(() => setIsAnimating(false), 300);
        }
      }, stepDuration);
      
      prevBambooRef.current = bamboo;
      
      return () => clearInterval(interval);
    }
  }, [bamboo]);
  
  const storagePercentage = (bamboo / totalStorage) * 100;
  const isNearFull = storagePercentage >= 90;
  const isFull = storagePercentage >= 100;
  
  return (
    <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between gap-4">
      {/* Bamboo Coins */}
      <motion.div
        data-tutorial="coin-counter"
        className={`
          flex items-center gap-2 px-4 py-2 rounded-xl shadow-lg backdrop-blur-sm
          ${isAnimating ? 'ring-2 ring-amber-400' : ''}
          ${isFull ? 'bg-red-500/90' : 'bg-white/90 dark:bg-gray-800/90'}
        `}
        animate={isAnimating ? { scale: [1, 1.05, 1] } : {}}
        transition={{ duration: 0.3 }}
      >
        <Coins className={`w-6 h-6 ${isFull ? 'text-white' : 'text-amber-500'}`} />
        <div className="flex flex-col">
          <span className={`font-bold text-lg ${isFull ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
            {Math.round(displayBamboo).toLocaleString()}
          </span>
          <div className="flex items-center gap-1">
            <Package className={`w-3 h-3 ${isFull ? 'text-white/70' : 'text-gray-400'}`} />
            <span className={`text-xs ${isFull ? 'text-white/70' : 'text-gray-500'}`}>
              {Math.round(bamboo).toLocaleString()} / {totalStorage.toLocaleString()}
            </span>
          </div>
        </div>
        
        {/* Change indicator */}
        <AnimatePresence>
          {isAnimating && changeAmount !== 0 && (
            <motion.span
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`
                absolute -top-2 -right-2 px-2 py-0.5 rounded-full text-xs font-bold
                ${changeAmount > 0 ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}
              `}
            >
              {changeAmount > 0 ? '+' : ''}{Math.round(changeAmount)}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.div>
      
      {/* Storage Warning */}
      <AnimatePresence>
        {isNearFull && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className={`
              flex items-center gap-2 px-3 py-2 rounded-xl shadow-lg
              ${isFull ? 'bg-red-500 text-white' : 'bg-amber-500 text-white'}
            `}
          >
            <AlertTriangle className="w-4 h-4" />
            <span className="text-sm font-medium">
              {isFull ? 'Storage Full!' : 'Storage Almost Full!'}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* XP and Credit Score */}
      <div className="flex items-center gap-2">
        {/* Credit Score (if enabled) */}
        {creditEnabled && (
          <motion.div
            className={`
              flex items-center gap-2 px-3 py-2 rounded-xl shadow-lg backdrop-blur-sm
              ${scoreFlash === 'down' ? 'bg-red-500/90 text-white' : 
                scoreFlash === 'up' ? 'bg-green-500/90 text-white' : 
                'bg-white/90 dark:bg-gray-800/90'}
            `}
            animate={scoreFlash ? { scale: [1, 1.1, 1] } : {}}
            transition={{ duration: 0.3 }}
          >
            <CreditCard 
              className={`w-4 h-4 ${
                scoreFlash ? 'text-white' : 'text-indigo-500'
              }`} 
            />
            <div className="flex items-center gap-1">
              <span 
                className={`font-bold text-sm ${
                  scoreFlash ? 'text-white' : ''
                }`}
                style={{ color: scoreFlash ? undefined : getCreditRatingInfo().color }}
              >
                {creditScore}
              </span>
              {scoreTrend !== 'stable' && (
                <motion.span
                  initial={{ opacity: 0, x: -5 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 5 }}
                >
                  {scoreTrend === 'up' ? (
                    <TrendingUp className={`w-3 h-3 ${scoreFlash ? 'text-white' : 'text-green-500'}`} />
                  ) : (
                    <TrendingDown className={`w-3 h-3 ${scoreFlash ? 'text-white' : 'text-red-500'}`} />
                  )}
                </motion.span>
              )}
            </div>
          </motion.div>
        )}
        
        {/* XP Counter */}
        <motion.div
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/90 dark:bg-gray-800/90 shadow-lg backdrop-blur-sm"
        >
          <Sparkles className="w-5 h-5 text-purple-500" />
          <span className="font-bold text-gray-900 dark:text-white">
            {Math.round(xp).toLocaleString()} XP
          </span>
        </motion.div>
      </div>
    </div>
  );
};

export default CoinCounter;
