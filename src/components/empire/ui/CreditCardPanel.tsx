import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CreditCard, Clock, TrendingUp, TrendingDown, AlertTriangle, DollarSign, Percent } from 'lucide-react';
import { useCreditStore } from '@/store/useCreditStore';
import { useGameStore } from '@/store/useGameStore';
import { CREDIT_CONFIG } from '@/engine/credit';

interface CreditCardPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const CreditCardPanel: React.FC<CreditCardPanelProps> = ({ isOpen, onClose }) => {
  const [paymentAmount, setPaymentAmount] = useState('');
  const [showPaymentSuccess, setShowPaymentSuccess] = useState(false);
  const [lastScoreChange, setLastScoreChange] = useState<number | null>(null);
  
  const bamboo = useGameStore((state) => state.bamboo);
  const spendBamboo = useGameStore((state) => state.spendBamboo);
  
  const {
    enabled,
    balance,
    limit,
    score,
    minPaymentDue,
    nextDueAt,
    apr,
    missedPayments,
    getCreditRatingInfo,
    getTimeUntilDue,
    payBalance,
    payMinimum,
  } = useCreditStore();
  
  const [timeUntilDue, setTimeUntilDue] = useState(getTimeUntilDue());
  
  useEffect(() => {
    if (!isOpen || balance <= 0) return;
    
    const interval = setInterval(() => {
      setTimeUntilDue(getTimeUntilDue());
    }, 1000);
    
    return () => clearInterval(interval);
  }, [isOpen, balance, getTimeUntilDue]);
  
  if (!isOpen || !enabled) return null;
  
  const ratingInfo = getCreditRatingInfo();
  const availableCredit = limit - balance;
  const utilizationPercent = limit > 0 ? Math.round((balance / limit) * 100) : 0;
  const isHighUtilization = utilizationPercent >= 70;
  const isOverdue = Date.now() > nextDueAt && balance > 0;
  
  const handlePayment = (amount: number) => {
    if (amount <= 0 || bamboo < amount) return;
    
    spendBamboo(amount);
    const result = payBalance(amount);
    
    if (result.success) {
      setShowPaymentSuccess(true);
      setLastScoreChange(result.scoreChange);
      setPaymentAmount('');
      setTimeout(() => {
        setShowPaymentSuccess(false);
        setLastScoreChange(null);
      }, 3000);
    }
  };
  
  const handlePayMinimum = () => {
    if (bamboo < minPaymentDue) return;
    spendBamboo(minPaymentDue);
    const result = payMinimum();
    
    if (result.success) {
      setShowPaymentSuccess(true);
      setLastScoreChange(result.scoreChange);
      setTimeout(() => {
        setShowPaymentSuccess(false);
        setLastScoreChange(null);
      }, 3000);
    }
  };
  
  const handlePayFull = () => {
    if (bamboo < balance) return;
    handlePayment(balance);
  };
  
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CreditCard className="w-8 h-8 text-white" />
                <div>
                  <h2 className="text-white font-bold text-lg">Bamboo Credit Card</h2>
                  <p className="text-white/80 text-sm">Manage your credit</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-white/20 transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>
          
          {/* Credit Score Section */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Credit Score</p>
                <div className="flex items-center gap-2">
                  <span className="text-3xl font-bold" style={{ color: ratingInfo.color }}>
                    {score}
                  </span>
                  {lastScoreChange !== null && (
                    <motion.span
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`text-sm font-medium ${lastScoreChange > 0 ? 'text-green-500' : 'text-red-500'}`}
                    >
                      {lastScoreChange > 0 ? '+' : ''}{lastScoreChange}
                    </motion.span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <span
                    className="text-sm font-medium px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: `${ratingInfo.color}20`, color: ratingInfo.color }}
                  >
                    {ratingInfo.rating}
                  </span>
                  {missedPayments > 0 && (
                    <span className="text-xs text-red-500 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      {missedPayments} missed
                    </span>
                  )}
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500 dark:text-gray-400">APR</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  {(apr * 100).toFixed(0)}%
                </p>
              </div>
            </div>
          </div>
          
          {/* Balance Section */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Current Balance</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {Math.round(balance)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Credit Limit</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {limit}
                </p>
              </div>
            </div>
            
            {/* Utilization Bar */}
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-gray-500 dark:text-gray-400">
                  Credit Utilization
                </span>
                <span className={isHighUtilization ? 'text-red-500 font-medium' : 'text-gray-600 dark:text-gray-300'}>
                  {utilizationPercent}%
                </span>
              </div>
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <motion.div
                  className={`h-full rounded-full ${
                    utilizationPercent >= 90 ? 'bg-red-500' :
                    utilizationPercent >= 70 ? 'bg-yellow-500' :
                    'bg-green-500'
                  }`}
                  initial={{ width: 0 }}
                  animate={{ width: `${utilizationPercent}%` }}
                />
              </div>
              {isHighUtilization && (
                <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  High utilization may hurt your score
                </p>
              )}
            </div>
            
            <div className="mt-3 flex items-center justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400">Available Credit</span>
              <span className="font-medium text-green-600 dark:text-green-400">
                {availableCredit}
              </span>
            </div>
          </div>
          
          {/* Payment Due Section */}
          {balance > 0 && (
            <div className={`p-4 border-b border-gray-200 dark:border-gray-700 ${isOverdue ? 'bg-red-50 dark:bg-red-900/20' : ''}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Minimum Payment Due</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">
                    {minPaymentDue}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1 justify-end">
                    <Clock className="w-3 h-3" />
                    Due in
                  </p>
                  <p className={`text-lg font-bold ${isOverdue ? 'text-red-500' : 'text-gray-900 dark:text-white'}`}>
                    {timeUntilDue}
                  </p>
                </div>
              </div>
              
              {isOverdue && (
                <div className="mt-2 p-2 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                  <span className="text-sm text-red-700 dark:text-red-300">
                    Payment overdue! Late fees and score penalties apply.
                  </span>
                </div>
              )}
            </div>
          )}
          
          {/* Payment Actions */}
          <div className="p-4">
            {showPaymentSuccess ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-4"
              >
                <div className="text-4xl mb-2">✅</div>
                <p className="text-green-600 dark:text-green-400 font-medium">Payment Successful!</p>
                {lastScoreChange !== null && lastScoreChange > 0 && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Credit score improved by {lastScoreChange} points
                  </p>
                )}
              </motion.div>
            ) : balance > 0 ? (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <button
                    onClick={handlePayMinimum}
                    disabled={bamboo < minPaymentDue}
                    className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                      bamboo >= minPaymentDue
                        ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    Pay Minimum ({minPaymentDue})
                  </button>
                  <button
                    onClick={handlePayFull}
                    disabled={bamboo < balance}
                    className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                      bamboo >= balance
                        ? 'bg-green-600 text-white hover:bg-green-700'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    Pay Full ({Math.round(balance)})
                  </button>
                </div>
                
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    placeholder="Custom amount"
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                  <button
                    onClick={() => handlePayment(Number(paymentAmount))}
                    disabled={!paymentAmount || Number(paymentAmount) <= 0 || bamboo < Number(paymentAmount)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      paymentAmount && Number(paymentAmount) > 0 && bamboo >= Number(paymentAmount)
                        ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    Pay
                  </button>
                </div>
                
                <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                  Your bamboo balance: {Math.round(bamboo)}
                </p>
              </div>
            ) : (
              <div className="text-center py-4">
                <div className="text-4xl mb-2">🎉</div>
                <p className="text-green-600 dark:text-green-400 font-medium">No Balance Due!</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Your credit card is paid off
                </p>
              </div>
            )}
          </div>
          
          {/* Info Footer */}
          <div className="bg-gray-50 dark:bg-gray-800 px-4 py-3 text-xs text-gray-500 dark:text-gray-400">
            <p className="flex items-center gap-1">
              <Percent className="w-3 h-3" />
              Interest accrues daily. Pay on time to improve your score!
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CreditCardPanel;
