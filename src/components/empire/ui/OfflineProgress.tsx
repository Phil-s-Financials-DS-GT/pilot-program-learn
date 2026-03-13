import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Coins, Clock, X } from 'lucide-react';

interface OfflineProgressProps {
  isOpen: boolean;
  earnings: number;
  duration: string;
  onClose: () => void;
  onCollect: () => void;
}

const OfflineProgress: React.FC<OfflineProgressProps> = ({
  isOpen,
  earnings,
  duration,
  onClose,
  onCollect,
}) => {
  const handleCollect = () => {
    onCollect();
    onClose();
  };
  
  return (
    <AnimatePresence>
      {isOpen && earnings > 0 && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
            onClick={onClose}
          >
            {/* Modal */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden"
            >
              {/* Header with gradient */}
              <div className="bg-gradient-to-r from-emerald-500 to-teal-500 p-6 text-white text-center relative">
                <button
                  onClick={onClose}
                  className="absolute top-3 right-3 p-1 rounded-full hover:bg-white/20 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
                
                <div className="text-5xl mb-2">🐼</div>
                <h2 className="text-xl font-bold">Welcome Back!</h2>
                <p className="text-emerald-100 text-sm">Your empire has been busy</p>
              </div>
              
              {/* Content */}
              <div className="p-6">
                {/* Duration */}
                <div className="flex items-center justify-center gap-2 text-gray-500 dark:text-gray-400 mb-4">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm">While you were gone for {duration}</span>
                </div>
                
                {/* Earnings */}
                <div className="bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 rounded-xl p-4 mb-6">
                  <div className="text-center">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      Your farms produced
                    </p>
                    <div className="flex items-center justify-center gap-2">
                      <Coins className="w-8 h-8 text-amber-500" />
                      <span className="text-3xl font-bold text-amber-600 dark:text-amber-400">
                        +{earnings.toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      bamboo coins
                    </p>
                  </div>
                </div>
                
                {/* Collect Button */}
                <motion.button
                  onClick={handleCollect}
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold text-lg shadow-lg"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Collect Coins!
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default OfflineProgress;
