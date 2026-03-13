import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CreditCard, X, Sparkles, AlertCircle, ChevronRight } from 'lucide-react';
import { useCreditStore } from '@/store/useCreditStore';
import { useGameStore } from '@/store/useGameStore';
import { CREDIT_CONFIG } from '@/engine/credit';

interface CreditUnlockBannerProps {
  onUnlock?: () => void;
}

const CreditUnlockBanner: React.FC<CreditUnlockBannerProps> = ({ onUnlock }) => {
  const [isDismissed, setIsDismissed] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  
  const xp = useGameStore((state) => state.xp);
  const { enabled, isUnlocked, enableCreditCard } = useCreditStore();
  
  const canUnlock = isUnlocked(xp);
  const shouldShow = canUnlock && !enabled && !isDismissed;
  
  if (!shouldShow) return null;
  
  const handleUnlock = () => {
    enableCreditCard();
    onUnlock?.();
  };
  
  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-20 left-4 right-4 z-40"
      >
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl shadow-2xl overflow-hidden">
          <div className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <motion.div
                  className="p-2 bg-white/20 rounded-xl"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                >
                  <CreditCard className="w-6 h-6 text-white" />
                </motion.div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-white text-lg">Credit Card Unlocked!</h3>
                    <Sparkles className="w-4 h-4 text-yellow-300" />
                  </div>
                  <p className="text-white/80 text-sm">
                    You've earned {xp} XP - credit is now available!
                  </p>
                </div>
              </div>
              
              <button
                onClick={() => setIsDismissed(true)}
                className="p-1 rounded-full hover:bg-white/20 transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
            
            <div className="mt-4 flex gap-2">
              <motion.button
                onClick={handleUnlock}
                className="flex-1 py-2.5 px-4 bg-white text-indigo-600 rounded-xl font-bold flex items-center justify-center gap-2"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <CreditCard className="w-4 h-4" />
                Activate Credit Card
              </motion.button>
              
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="py-2.5 px-4 bg-white/20 text-white rounded-xl font-medium flex items-center gap-1"
              >
                Learn More
                <ChevronRight className={`w-4 h-4 transition-transform ${showDetails ? 'rotate-90' : ''}`} />
              </button>
            </div>
          </div>
          
          <AnimatePresence>
            {showDetails && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="bg-black/20 px-4 py-3"
              >
                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <span className="text-xl">🐼</span>
                    <div>
                      <p className="text-white/90 text-sm font-medium mb-1">Phil says:</p>
                      <p className="text-white/80 text-sm">
                        Credit cards can help you build faster, but use them wisely! 
                        Pay on time to improve your credit score, or face penalties.
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="bg-white/10 rounded-lg p-2">
                      <p className="text-white/60 text-xs">Starting Limit</p>
                      <p className="text-white font-bold">{CREDIT_CONFIG.initialLimit} coins</p>
                    </div>
                    <div className="bg-white/10 rounded-lg p-2">
                      <p className="text-white/60 text-xs">APR</p>
                      <p className="text-white font-bold">{(CREDIT_CONFIG.apr * 100).toFixed(0)}%</p>
                    </div>
                    <div className="bg-white/10 rounded-lg p-2">
                      <p className="text-white/60 text-xs">Payment Cycle</p>
                      <p className="text-white font-bold">{CREDIT_CONFIG.paymentCycleHours}h</p>
                    </div>
                    <div className="bg-white/10 rounded-lg p-2">
                      <p className="text-white/60 text-xs">Late Fee</p>
                      <p className="text-white font-bold">{CREDIT_CONFIG.lateFee} coins</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-2 bg-yellow-500/20 rounded-lg p-2">
                    <AlertCircle className="w-4 h-4 text-yellow-300 flex-shrink-0 mt-0.5" />
                    <p className="text-yellow-100 text-xs">
                      Missing payments will hurt your credit score and add late fees. 
                      High utilization (over 70%) also impacts your score!
                    </p>
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

export default CreditUnlockBanner;
