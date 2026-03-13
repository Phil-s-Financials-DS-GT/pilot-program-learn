import { useEffect, useRef, useCallback } from 'react';
import { useCreditStore } from '@/store/useCreditStore';
import { useGameStore } from '@/store/useGameStore';
import { CREDIT_CONFIG } from '@/engine/credit';

interface UseCreditManagerOptions {
  onLateFee?: (fee: number, scoreChange: number) => void;
  onInterestAccrued?: (amount: number) => void;
  onScoreChange?: (oldScore: number, newScore: number) => void;
}

export const useCreditManager = (options: UseCreditManagerOptions = {}) => {
  const optionsRef = useRef(options);
  optionsRef.current = options;
  
  const lastCheckRef = useRef<number>(Date.now());
  const lastInterestTickRef = useRef<number>(Date.now());
  
  const {
    enabled,
    balance,
    score,
    nextDueAt,
    checkDueDate,
    tickInterest,
  } = useCreditStore();
  
  const xp = useGameStore((state) => state.xp);
  const isUnlocked = useCreditStore((state) => state.isUnlocked);
  
  const canUseCredit = enabled && isUnlocked(xp);
  
  const checkDueDateCallback = useCallback(() => {
    if (!enabled || balance <= 0) return;
    
    const now = Date.now();
    if (now <= nextDueAt) return;
    
    const oldScore = score;
    const result = checkDueDate();
    
    if (result.wasMissed) {
      optionsRef.current.onLateFee?.(result.lateFee, result.scoreChange);
      
      const newScore = useCreditStore.getState().score;
      if (oldScore !== newScore) {
        optionsRef.current.onScoreChange?.(oldScore, newScore);
      }
    }
  }, [enabled, balance, nextDueAt, score, checkDueDate]);
  
  const tickInterestCallback = useCallback(() => {
    if (!enabled || balance <= 0) return;
    
    const now = Date.now();
    const elapsedMs = now - lastInterestTickRef.current;
    const elapsedHours = elapsedMs / (1000 * 60 * 60);
    
    if (elapsedHours < 1) return;
    
    lastInterestTickRef.current = now;
    const interestAmount = tickInterest(elapsedHours);
    
    if (interestAmount > 0) {
      optionsRef.current.onInterestAccrued?.(interestAmount);
    }
  }, [enabled, balance, tickInterest]);
  
  useEffect(() => {
    if (!enabled) return;
    
    const interval = setInterval(() => {
      checkDueDateCallback();
      tickInterestCallback();
    }, 60000);
    
    checkDueDateCallback();
    
    return () => clearInterval(interval);
  }, [enabled, checkDueDateCallback, tickInterestCallback]);
  
  return {
    canUseCredit,
    creditEnabled: enabled,
    currentBalance: balance,
    creditScore: score,
    isOverdue: Date.now() > nextDueAt && balance > 0,
  };
};

export default useCreditManager;
