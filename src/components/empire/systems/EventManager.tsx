import { useState, useEffect, useCallback, useRef } from 'react';
import { useBaseLayoutStore } from '@/store/useBaseLayoutStore';
import { useGameStore } from '@/store/useGameStore';
import { useCreditStore } from '@/store/useCreditStore';
import { getBuildingStats } from '../buildings/BuildingTypes';
import { CREDIT_CONFIG } from '@/engine/credit';

export type EventType = 
  | 'bamboo_blight'
  | 'market_crash'
  | 'panda_strike'
  | 'storage_leak'
  | 'tax_collection'
  | 'bamboo_boom'
  | 'lucky_visitor'
  | 'festival_day'
  | 'credit_check'
  | 'interest_spike'
  | 'debt_collector';

export interface EconomicEvent {
  id: string;
  type: EventType;
  name: string;
  description: string;
  educationalDescription: string;
  isNegative: boolean;
  duration: number;
  effect: EventEffect;
  emoji: string;
}

export interface EventEffect {
  productionMultiplier?: number;
  storageMultiplier?: number;
  collectionBlocked?: boolean;
  instantCoinLoss?: number;
  instantCoinGain?: number;
  xpMultiplier?: number;
  creditScoreChange?: number;
  aprIncrease?: number;
  forcePaymentPercent?: number;
}

export interface ActiveEvent {
  event: EconomicEvent;
  startTime: number;
  endTime: number;
  mitigated: boolean;
}

export interface EventHistoryEntry {
  event: EconomicEvent;
  timestamp: number;
  mitigated: boolean;
}

export const EVENT_DEFINITIONS: Record<EventType, Omit<EconomicEvent, 'id'>> = {
  bamboo_blight: {
    type: 'bamboo_blight',
    name: 'Bamboo Blight',
    description: 'A disease has spread! Farms produce 50% less for 2 minutes.',
    educationalDescription: 'Just like crop failures in agriculture, unexpected events can reduce income. Diversification and insurance help protect against such losses.',
    isNegative: true,
    duration: 120000,
    effect: { productionMultiplier: 0.5 },
    emoji: '🦠',
  },
  market_crash: {
    type: 'market_crash',
    name: 'Market Crash',
    description: 'Economic downturn! All production halted for 30 seconds.',
    educationalDescription: 'Market crashes happen in real economies too. Having savings (storage) and passive income (bank interest) helps weather these storms.',
    isNegative: true,
    duration: 30000,
    effect: { productionMultiplier: 0 },
    emoji: '📉',
  },
  panda_strike: {
    type: 'panda_strike',
    name: 'Panda Strike',
    description: 'Workers are on strike! Cannot collect from buildings for 1 minute.',
    educationalDescription: 'Labor disputes can disrupt business operations. Good management and fair treatment of workers prevents strikes.',
    isNegative: true,
    duration: 60000,
    effect: { collectionBlocked: true },
    emoji: '✊',
  },
  storage_leak: {
    type: 'storage_leak',
    name: 'Storage Leak',
    description: 'Oh no! A leak caused you to lose 10% of stored coins.',
    educationalDescription: 'Unexpected expenses happen in life - car repairs, medical bills, home maintenance. Emergency funds help absorb these shocks.',
    isNegative: true,
    duration: 0,
    effect: { instantCoinLoss: 0.1 },
    emoji: '💧',
  },
  tax_collection: {
    type: 'tax_collection',
    name: 'Tax Collection',
    description: 'The emperor demands tribute! 15% of current coins taken.',
    educationalDescription: 'Taxes are a part of life. Understanding tax planning and using tax-advantaged accounts can help minimize their impact.',
    isNegative: true,
    duration: 0,
    effect: { instantCoinLoss: 0.15 },
    emoji: '📜',
  },
  bamboo_boom: {
    type: 'bamboo_boom',
    name: 'Bamboo Boom',
    description: 'Perfect growing conditions! 2x production for 2 minutes.',
    educationalDescription: 'Economic booms create opportunities for growth. Smart investors capitalize on good times while preparing for downturns.',
    isNegative: false,
    duration: 120000,
    effect: { productionMultiplier: 2 },
    emoji: '🌱',
  },
  lucky_visitor: {
    type: 'lucky_visitor',
    name: 'Lucky Visitor',
    description: 'A wealthy traveler visits! Receive a coin bonus.',
    educationalDescription: 'Unexpected windfalls happen - bonuses, gifts, lottery wins. The wise save or invest them rather than spending immediately.',
    isNegative: false,
    duration: 0,
    effect: { instantCoinGain: 100 },
    emoji: '🎁',
  },
  festival_day: {
    type: 'festival_day',
    name: 'Festival Day',
    description: 'Celebration time! All buildings produce bonus XP for 3 minutes.',
    educationalDescription: 'Special opportunities for learning and growth come along. Taking advantage of them accelerates your progress.',
    isNegative: false,
    duration: 180000,
    effect: { xpMultiplier: 2 },
    emoji: '🎉',
  },
  credit_check: {
    type: 'credit_check',
    name: 'Credit Bureau Check',
    description: 'The credit bureau is reviewing your account! High utilization hurts your score.',
    educationalDescription: 'Credit bureaus regularly check your credit utilization ratio. Keeping it below 30% is ideal, and above 70% significantly hurts your score.',
    isNegative: true,
    duration: 0,
    effect: { creditScoreChange: -10 },
    emoji: '📊',
  },
  interest_spike: {
    type: 'interest_spike',
    name: 'Interest Rate Spike',
    description: 'Economic turbulence! Your APR increases by 5% for 24 hours.',
    educationalDescription: 'Variable interest rates can change based on economic conditions. This is why fixed-rate loans can be safer, even if initially more expensive.',
    isNegative: true,
    duration: 86400000,
    effect: { aprIncrease: 0.05 },
    emoji: '📈',
  },
  debt_collector: {
    type: 'debt_collector',
    name: 'Debt Collector Visit',
    description: 'A debt collector demands immediate payment! Pay 25% of balance or lose 50 credit score.',
    educationalDescription: 'Ignoring debt leads to collection agencies. They can damage your credit score significantly and add fees. Always communicate with creditors before it reaches this point.',
    isNegative: true,
    duration: 0,
    effect: { forcePaymentPercent: 0.25, creditScoreChange: -50 },
    emoji: '👔',
  },
};

const NEGATIVE_EVENTS: EventType[] = ['bamboo_blight', 'market_crash', 'panda_strike', 'storage_leak', 'tax_collection'];
const CREDIT_NEGATIVE_EVENTS: EventType[] = ['credit_check', 'interest_spike', 'debt_collector'];
const POSITIVE_EVENTS: EventType[] = ['bamboo_boom', 'lucky_visitor', 'festival_day'];

interface UseEventManagerOptions {
  onEventStart?: (event: ActiveEvent) => void;
  onEventEnd?: (event: ActiveEvent) => void;
}

export const useEventManager = (options: UseEventManagerOptions = {}) => {
  const [activeEvent, setActiveEvent] = useState<ActiveEvent | null>(null);
  const [eventHistory, setEventHistory] = useState<EventHistoryEntry[]>([]);
  const [isCollectionBlocked, setIsCollectionBlocked] = useState(false);
  const [productionMultiplier, setProductionMultiplier] = useState(1);
  const [xpMultiplier, setXpMultiplier] = useState(1);
  
  const eventTimerRef = useRef<NodeJS.Timeout | null>(null);
  const nextEventTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isInitializedRef = useRef(false);
  
  const optionsRef = useRef(options);
  optionsRef.current = options;
  
  const buildings = useBaseLayoutStore((state) => state.buildings);
  const bamboo = useGameStore((state) => state.bamboo);
  const spendBamboo = useGameStore((state) => state.spendBamboo);
  const addBamboo = useGameStore((state) => state.addBamboo);
  
  const creditEnabled = useCreditStore((state) => state.enabled);
  const creditBalance = useCreditStore((state) => state.balance);
  const creditLimit = useCreditStore((state) => state.limit);
  const creditScore = useCreditStore((state) => state.score);
  const payBalance = useCreditStore((state) => state.payBalance);
  
  const getInsuranceProtection = useCallback(() => {
    const insuranceBuildings = buildings.filter(b => b.type === 'insurance_hut' && b.status === 'active');
    if (insuranceBuildings.length === 0) return 0;
    
    let totalProtection = 0;
    insuranceBuildings.forEach(building => {
      const stats = getBuildingStats('insurance_hut', building.level);
      if (stats.eventProtection) {
        totalProtection += stats.eventProtection;
      }
    });
    
    return Math.min(totalProtection, 80);
  }, [buildings]);
  
  const triggerEvent = useCallback((eventType?: EventType) => {
    if (activeEvent) return;
    
    let selectedType: EventType;
    if (eventType) {
      selectedType = eventType;
    } else {
      const isNegative = Math.random() < 0.6;
      let eventPool: EventType[];
      
      if (isNegative) {
        const hasCreditBalance = creditEnabled && creditBalance > 0;
        const isHighUtilization = creditEnabled && creditLimit > 0 && (creditBalance / creditLimit) >= 0.7;
        
        if (hasCreditBalance && Math.random() < 0.3) {
          if (isHighUtilization) {
            eventPool = CREDIT_NEGATIVE_EVENTS;
          } else {
            eventPool = [...NEGATIVE_EVENTS, 'credit_check'];
          }
        } else {
          eventPool = NEGATIVE_EVENTS;
        }
      } else {
        eventPool = POSITIVE_EVENTS;
      }
      
      selectedType = eventPool[Math.floor(Math.random() * eventPool.length)];
    }
    
    const eventDef = EVENT_DEFINITIONS[selectedType];
    const event: EconomicEvent = {
      ...eventDef,
      id: `${selectedType}-${Date.now()}`,
    };
    
    const protection = event.isNegative ? getInsuranceProtection() : 0;
    const mitigated = protection > 0;
    const mitigationFactor = 1 - (protection / 100);
    
    if (event.effect.instantCoinLoss) {
      const baseLoss = Math.floor(bamboo * event.effect.instantCoinLoss);
      const actualLoss = Math.floor(baseLoss * mitigationFactor);
      if (actualLoss > 0) {
        spendBamboo(actualLoss);
      }
    }
    
    if (event.effect.instantCoinGain) {
      addBamboo(event.effect.instantCoinGain, 'event');
    }
    
    if (event.effect.creditScoreChange && creditEnabled) {
      const isHighUtilization = creditLimit > 0 && (creditBalance / creditLimit) >= CREDIT_CONFIG.highUtilizationThreshold;
      if (event.type === 'credit_check' && isHighUtilization) {
        const scoreChange = Math.floor(event.effect.creditScoreChange * mitigationFactor);
        useCreditStore.setState((state) => ({
          score: Math.max(CREDIT_CONFIG.minScore, state.score + scoreChange),
        }));
      }
    }
    
    if (event.effect.forcePaymentPercent && creditEnabled && creditBalance > 0) {
      const requiredPayment = Math.ceil(creditBalance * event.effect.forcePaymentPercent);
      if (bamboo >= requiredPayment) {
        spendBamboo(requiredPayment);
        payBalance(requiredPayment);
      } else if (event.effect.creditScoreChange) {
        const scoreChange = Math.floor(event.effect.creditScoreChange * mitigationFactor);
        useCreditStore.setState((state) => ({
          score: Math.max(CREDIT_CONFIG.minScore, state.score + scoreChange),
        }));
      }
    }
    
    const now = Date.now();
    const newActiveEvent: ActiveEvent = {
      event,
      startTime: now,
      endTime: event.duration > 0 ? now + event.duration : now,
      mitigated,
    };
    
    if (event.duration > 0) {
      if (event.effect.productionMultiplier !== undefined) {
        const adjustedMultiplier = event.isNegative
          ? 1 - (1 - event.effect.productionMultiplier) * mitigationFactor
          : event.effect.productionMultiplier;
        setProductionMultiplier(adjustedMultiplier);
      }
      
      if (event.effect.collectionBlocked) {
        setIsCollectionBlocked(!mitigated || mitigationFactor > 0.5);
      }
      
      if (event.effect.xpMultiplier) {
        setXpMultiplier(event.effect.xpMultiplier);
      }
      
      setActiveEvent(newActiveEvent);
      optionsRef.current.onEventStart?.(newActiveEvent);
      
      eventTimerRef.current = setTimeout(() => {
        setActiveEvent(null);
        setProductionMultiplier(1);
        setIsCollectionBlocked(false);
        setXpMultiplier(1);
        optionsRef.current.onEventEnd?.(newActiveEvent);
      }, event.duration);
    } else {
      setActiveEvent(newActiveEvent);
      optionsRef.current.onEventStart?.(newActiveEvent);
      setTimeout(() => {
        setActiveEvent(null);
        optionsRef.current.onEventEnd?.(newActiveEvent);
      }, 3000);
    }
    
    setEventHistory(prev => [{
      event,
      timestamp: now,
      mitigated,
    }, ...prev.slice(0, 19)]);
    
  }, [activeEvent, bamboo, spendBamboo, addBamboo, getInsuranceProtection, creditEnabled, creditBalance, creditLimit, payBalance]);
  
  const triggerEventRef = useRef(triggerEvent);
  triggerEventRef.current = triggerEvent;
  
  const scheduleNextEvent = useCallback(() => {
    const minDelay = 180000;
    const maxDelay = 300000;
    const delay = minDelay + Math.random() * (maxDelay - minDelay);
    
    nextEventTimerRef.current = setTimeout(() => {
      triggerEventRef.current();
      scheduleNextEvent();
    }, delay);
  }, []);
  
  useEffect(() => {
    if (isInitializedRef.current) return;
    isInitializedRef.current = true;
    
    const initialDelay = 60000 + Math.random() * 60000;
    nextEventTimerRef.current = setTimeout(() => {
      triggerEventRef.current();
      scheduleNextEvent();
    }, initialDelay);
    
    return () => {
      if (eventTimerRef.current) clearTimeout(eventTimerRef.current);
      if (nextEventTimerRef.current) clearTimeout(nextEventTimerRef.current);
    };
  }, [scheduleNextEvent]);
  
  const getRemainingTime = useCallback(() => {
    if (!activeEvent || activeEvent.event.duration === 0) return 0;
    return Math.max(0, activeEvent.endTime - Date.now());
  }, [activeEvent]);
  
  return {
    activeEvent,
    eventHistory,
    isCollectionBlocked,
    productionMultiplier,
    xpMultiplier,
    triggerEvent,
    getRemainingTime,
    insuranceProtection: getInsuranceProtection(),
  };
};

export default useEventManager;
