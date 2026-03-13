/**
 * Bamboo Empire Game State Store
 * 
 * Zustand store managing all game state and actions.
 */

import { create } from 'zustand';
import {
  BuildingType,
  DefenseType,
  EventType,
  BUILDINGS,
  DEFENSES,
  INITIAL_STATE,
  ENERGY,
  REPAIR,
  TIMING,
  getBuildingStats,
  getDefenseStats,
  canUpgradeBuilding,
  canUpgradeDefense,
} from '@/config/gameConfig';
import { useBaseLayoutStore } from '@/store/useBaseLayoutStore';
import { getEmpireStorageCapacity } from '@/components/empire/systems/economy';

// ============================================
// TYPES
// ============================================

export interface Modifier {
  id: string;
  type: 'incomeCut' | 'burnout' | 'productionBoost' | 'damage';
  value: number; // Percentage or flat value
  expiresAt: number; // Timestamp when modifier expires
  description: string;
}

export interface EventLog {
  id: string;
  type: EventType;
  timestamp: number;
  choice?: string;
  outcome?: string;
  xpChange?: number;
}

export interface ActiveEvent {
  id: string;
  type: EventType;
  triggeredAt: number;
  resolved: boolean;
}

export interface GameState {
  // Resources
  bamboo: number;
  xp: number;
  energy: number;

  // Buildings & Defenses
  buildings: Record<BuildingType, number>;
  defenses: Record<DefenseType, number>;

  // Timing
  lastTick: number;
  lastEventCheck: number;

  // Active effects
  activeModifiers: Modifier[];
  activeEvent: ActiveEvent | null;
  eventHistory: EventLog[];

  // Pause system
  isPaused: boolean;
  pauseStartedAt: number | null;
  pauseCooldownUntil: number;

  // Stats tracking
  highEnergyCycles: number;
  totalBambooEarned: number;
  totalXpEarned: number;

  // Game initialized
  initialized: boolean;
}

export interface GameActions {
  // Core actions
  tick: (elapsedMs: number) => void;
  upgradeBuilding: (type: BuildingType) => boolean;
  upgradeDefense: (type: DefenseType) => boolean;

  // Event actions
  setActiveEvent: (event: ActiveEvent | null) => void;
  resolveEvent: (choice: string) => void;
  addEventToHistory: (log: EventLog) => void;

  // Recovery actions
  recoverEnergy: () => boolean;
  repairMode: () => boolean;
  togglePauseGrowth: () => boolean;

  // Platform integration
  addBamboo: (amount: number, source?: string) => void;
  spendBamboo: (amount: number) => boolean;
  addXp: (amount: number, source?: string) => void;

  // Modifier management
  addModifier: (modifier: Modifier) => void;
  removeExpiredModifiers: () => void;
  clearDamageModifiers: () => void;

  // Persistence
  loadState: (state: Partial<GameState>) => void;
  getState: () => GameState;
  resetGame: () => void;

  // Computed values
  getProductionPerHour: () => number;
  getBurnRatePerHour: () => number;
  getStorageCapacity: () => number;
  getEnergyMultiplier: () => number;
}

type GameStore = GameState & GameActions;

const getActiveEmpireStorageCapacity = (): number | null => {
  const placedBuildings = useBaseLayoutStore.getState().buildings;

  if (placedBuildings.length === 0) {
    return null;
  }

  return getEmpireStorageCapacity(placedBuildings);
};

// ============================================
// INITIAL STATE
// ============================================

const createInitialState = (): GameState => ({
  bamboo: INITIAL_STATE.bamboo,
  xp: INITIAL_STATE.xp,
  energy: INITIAL_STATE.energy,
  buildings: { ...INITIAL_STATE.buildings },
  defenses: { ...INITIAL_STATE.defenses },
  lastTick: Date.now(),
  lastEventCheck: Date.now(),
  activeModifiers: [],
  activeEvent: null,
  eventHistory: [],
  isPaused: false,
  pauseStartedAt: null,
  pauseCooldownUntil: 0,
  highEnergyCycles: 0,
  totalBambooEarned: INITIAL_STATE.bamboo,
  totalXpEarned: INITIAL_STATE.xp,
  initialized: false,
});

// ============================================
// STORE
// ============================================

export const useGameStore = create<GameStore>((set, get) => ({
  ...createInitialState(),

  // ----------------------------------------
  // CORE ACTIONS
  // ----------------------------------------

  tick: (elapsedMs: number) => {
    const state = get();
    const hours = elapsedMs / (1000 * 60 * 60);

    // Remove expired modifiers
    const now = Date.now();
    const activeModifiers = state.activeModifiers.filter(m => m.expiresAt > now);

    // Calculate production
    let production = get().getProductionPerHour() * hours;
    let burnRate = get().getBurnRatePerHour() * hours;
    const capacity = get().getStorageCapacity();

    // Apply pause effects
    if (state.isPaused) {
      production = 0;
      burnRate = 0;
    }

    // Calculate energy changes
    let energyChange = 0;
    if (state.isPaused) {
      // Recover energy while paused
      energyChange = (ENERGY.pausedRecoveryPerHour * hours);
    } else {
      // Drain energy while working
      energyChange = -(ENERGY.passiveDrainPerHour * hours);
    }

    // Check if pause should end
    let isPaused = state.isPaused;
    let pauseStartedAt = state.pauseStartedAt;
    if (isPaused && pauseStartedAt && (now - pauseStartedAt >= TIMING.pauseGrowthDurationMs)) {
      isPaused = false;
      pauseStartedAt = null;
    }

    // Update bamboo (production - burn, capped at capacity)
    let newBamboo = state.bamboo + production - burnRate;
    newBamboo = Math.max(0, Math.min(newBamboo, capacity));

    // Update energy (capped at 0-100)
    let newEnergy = state.energy + energyChange;
    newEnergy = Math.max(0, Math.min(ENERGY.max, newEnergy));

    // Track high energy cycles
    let highEnergyCycles = state.highEnergyCycles;
    if (newEnergy > ENERGY.thresholds.medium) {
      highEnergyCycles++;
    } else {
      highEnergyCycles = 0;
    }

    set({
      bamboo: newBamboo,
      energy: newEnergy,
      lastTick: now,
      activeModifiers,
      isPaused,
      pauseStartedAt,
      highEnergyCycles,
    });
  },

  upgradeBuilding: (type: BuildingType) => {
    const state = get();
    const currentLevel = state.buildings[type];
    const check = canUpgradeBuilding(type, currentLevel, state.bamboo, state.xp);

    if (!check.canUpgrade) {
      return false;
    }

    const nextLevelStats = getBuildingStats(type, currentLevel + 1);
    const cost = nextLevelStats.upgradeCost;

    set({
      bamboo: state.bamboo - cost,
      buildings: {
        ...state.buildings,
        [type]: currentLevel + 1,
      },
    });

    return true;
  },

  upgradeDefense: (type: DefenseType) => {
    const state = get();
    const currentLevel = state.defenses[type];
    const check = canUpgradeDefense(type, currentLevel, state.bamboo, state.xp);

    if (!check.canUpgrade) {
      return false;
    }

    const nextLevelStats = getDefenseStats(type, currentLevel + 1);
    const cost = nextLevelStats.upgradeCost;

    set({
      bamboo: state.bamboo - cost,
      defenses: {
        ...state.defenses,
        [type]: currentLevel + 1,
      },
    });

    return true;
  },

  // ----------------------------------------
  // EVENT ACTIONS
  // ----------------------------------------

  setActiveEvent: (event: ActiveEvent | null) => {
    set({ activeEvent: event });
  },

  resolveEvent: (choice: string) => {
    const state = get();
    if (!state.activeEvent) return;

    const eventLog: EventLog = {
      id: state.activeEvent.id,
      type: state.activeEvent.type,
      timestamp: Date.now(),
      choice,
    };

    set({
      activeEvent: null,
      eventHistory: [eventLog, ...state.eventHistory].slice(0, 50), // Keep last 50
    });
  },

  addEventToHistory: (log: EventLog) => {
    const state = get();
    set({
      eventHistory: [log, ...state.eventHistory].slice(0, 50),
    });
  },

  // ----------------------------------------
  // RECOVERY ACTIONS
  // ----------------------------------------

  recoverEnergy: () => {
    const state = get();
    if (state.bamboo < ENERGY.recoveryCost) {
      return false;
    }

    const newEnergy = Math.min(ENERGY.max, state.energy + ENERGY.recoveryAmount);

    set({
      bamboo: state.bamboo - ENERGY.recoveryCost,
      energy: newEnergy,
    });

    return true;
  },

  repairMode: () => {
    const state = get();
    if (state.bamboo < REPAIR.cost) {
      return false;
    }

    // Remove all damage modifiers
    const activeModifiers = state.activeModifiers.filter(m => m.type !== 'damage');

    set({
      bamboo: state.bamboo - REPAIR.cost,
      activeModifiers,
    });

    return true;
  },

  togglePauseGrowth: () => {
    const state = get();
    const now = Date.now();

    // Check if on cooldown
    if (now < state.pauseCooldownUntil) {
      return false;
    }

    if (state.isPaused) {
      // Resume growth
      set({
        isPaused: false,
        pauseStartedAt: null,
        pauseCooldownUntil: now + TIMING.pauseGrowthCooldownMs,
      });
    } else {
      // Start pause
      set({
        isPaused: true,
        pauseStartedAt: now,
      });
    }

    return true;
  },

  // ----------------------------------------
  // PLATFORM INTEGRATION
  // ----------------------------------------

  addBamboo: (amount: number, _source?: string) => {
    const state = get();
    const capacity = getActiveEmpireStorageCapacity() ?? get().getStorageCapacity();
    const newBamboo = Math.min(state.bamboo + amount, capacity);

    set({
      bamboo: newBamboo,
      totalBambooEarned: state.totalBambooEarned + amount,
    });
  },

  spendBamboo: (amount: number) => {
    const state = get();
    if (state.bamboo < amount) {
      return false;
    }
    set({
      bamboo: state.bamboo - amount,
    });
    return true;
  },

  addXp: (amount: number, _source?: string) => {
    const state = get();

    set({
      xp: state.xp + amount,
      totalXpEarned: state.totalXpEarned + amount,
    });
  },

  // ----------------------------------------
  // MODIFIER MANAGEMENT
  // ----------------------------------------

  addModifier: (modifier: Modifier) => {
    const state = get();
    set({
      activeModifiers: [...state.activeModifiers, modifier],
    });
  },

  removeExpiredModifiers: () => {
    const state = get();
    const now = Date.now();
    set({
      activeModifiers: state.activeModifiers.filter(m => m.expiresAt > now),
    });
  },

  clearDamageModifiers: () => {
    const state = get();
    set({
      activeModifiers: state.activeModifiers.filter(m => m.type !== 'damage'),
    });
  },

  // ----------------------------------------
  // PERSISTENCE
  // ----------------------------------------

  loadState: (savedState: Partial<GameState>) => {
    set({
      ...savedState,
      initialized: true,
    });
  },

  getState: () => {
    const { tick, upgradeBuilding, upgradeDefense, ...state } = get();
    return state as unknown as GameState;
  },

  resetGame: () => {
    set({
      ...createInitialState(),
      initialized: true,
      lastTick: Date.now(),
      lastEventCheck: Date.now(),
    });
  },

  // ----------------------------------------
  // COMPUTED VALUES
  // ----------------------------------------

  getProductionPerHour: () => {
    const state = get();
    const energyMultiplier = get().getEnergyMultiplier();

    // Get base production from Bamboo Farm
    const farmStats = getBuildingStats('bambooFarm', state.buildings.bambooFarm);
    let farmProduction = farmStats.productionPerHour || 0;

    // Get growth from Workshop
    const workshopStats = getBuildingStats('workshop', state.buildings.workshop);
    const workshopProduction = workshopStats.growthPerHour || 0;

    // Apply income cut modifier
    const incomeCutModifier = state.activeModifiers.find(m => m.type === 'incomeCut');
    if (incomeCutModifier) {
      farmProduction *= (1 - incomeCutModifier.value / 100);
    }

    // Apply production boost modifier
    const boostModifier = state.activeModifiers.find(m => m.type === 'productionBoost');
    if (boostModifier) {
      farmProduction *= (1 + boostModifier.value / 100);
    }
    
    // Apply improvements production bonus (from useImprovementsStore)
    // Note: This is read from localStorage to avoid circular dependency
    try {
      const improvementsData = localStorage.getItem('bamboo-empire-improvements');
      if (improvementsData) {
        const improvements = JSON.parse(improvementsData);
        // Greenhouse Dome bonus
        if (improvements.greenhouseDome > 0) {
          const bonusPercent = improvements.greenhouseDome === 1 ? 15 : 
                               improvements.greenhouseDome === 2 ? 25 : 40;
          farmProduction *= (1 + bonusPercent / 100);
        }
        // Automation chain bonuses
        if (improvements.automationI > 0) {
          farmProduction *= 1.10;
        }
        if (improvements.automationII > 0) {
          farmProduction *= 1.20;
        }
        if (improvements.automationIII > 0) {
          farmProduction *= 1.30;
        }
      }
    } catch {
      // Ignore localStorage errors
    }

    // Apply energy multiplier
    const totalProduction = (farmProduction + workshopProduction) * energyMultiplier;

    return Math.round(totalProduction * 10) / 10;
  },

  getBurnRatePerHour: () => {
    const state = get();
    const pandaHouseStats = getBuildingStats('pandaHouse', state.buildings.pandaHouse);
    let burnRate = pandaHouseStats.burnRatePerHour || 0;
    
    // Apply compost yard recovery (from improvements)
    try {
      const improvementsData = localStorage.getItem('bamboo-empire-improvements');
      if (improvementsData) {
        const improvements = JSON.parse(improvementsData);
        if (improvements.compostYard > 0) {
          const recoveryPercent = improvements.compostYard === 1 ? 10 : 
                                  improvements.compostYard === 2 ? 20 : 30;
          burnRate *= (1 - recoveryPercent / 100);
        }
      }
    } catch {
      // Ignore localStorage errors
    }
    
    return burnRate;
  },

  getStorageCapacity: () => {
    const activeEmpireCapacity = getActiveEmpireStorageCapacity();
    if (activeEmpireCapacity !== null) {
      return activeEmpireCapacity;
    }

    const state = get();
    const storageStats = getBuildingStats('bambooStorage', state.buildings.bambooStorage);
    let capacity = storageStats.capacity || 200;
    
    // Apply supply chain buffer bonus
    try {
      const improvementsData = localStorage.getItem('bamboo-empire-improvements');
      if (improvementsData) {
        const improvements = JSON.parse(improvementsData);
        if (improvements.supplyChainBuffer > 0) {
          const bonusPercent = improvements.supplyChainBuffer === 1 ? 15 : 30;
          capacity *= (1 + bonusPercent / 100);
        }
      }
    } catch {
      // Ignore localStorage errors
    }
    
    return Math.floor(capacity);
  },

  getEnergyMultiplier: () => {
    const state = get();
    
    // Check for labor training improvement that lowers threshold
    let mediumThreshold = ENERGY.thresholds.medium;
    try {
      const improvementsData = localStorage.getItem('bamboo-empire-improvements');
      if (improvementsData) {
        const improvements = JSON.parse(improvementsData);
        if (improvements.laborTraining > 0) {
          mediumThreshold = improvements.laborTraining === 1 ? 50 : 40;
        }
      }
    } catch {
      // Ignore localStorage errors
    }
    
    if (state.energy < ENERGY.thresholds.low) {
      return ENERGY.multipliers.low;
    }
    if (state.energy < mediumThreshold) {
      return ENERGY.multipliers.medium;
    }
    return ENERGY.multipliers.high;
  },
}));



