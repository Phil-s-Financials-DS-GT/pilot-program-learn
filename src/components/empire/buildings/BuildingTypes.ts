export type BuildingType = 
  | 'bamboo_farm' 
  | 'storage' 
  | 'bank' 
  | 'market_stall' 
  | 'insurance_hut' 
  | 'training_dojo' 
  | 'trading_post' 
  | 'panda_house';

export type BuildingStatus = 'constructing' | 'active' | 'damaged' | 'upgrading';

export interface GridPosition {
  x: number;
  y: number;
}

export interface BuildingSize {
  width: number;
  height: number;
}

export interface BuildingVisualConfig {
  anchorOffsetX?: number;
  anchorOffsetY?: number;
}

export interface BuildingDefinition {
  id: BuildingType;
  name: string;
  description: string;
  educationalDescription: string;
  cost: number;
  size: BuildingSize;
  constructionTime: number;
  maxLevel: number;
  baseProduction?: number;
  baseStorage?: number;
  baseInterestRate?: number;
  productionBoost?: number;
  eventProtection?: number;
  xpConversionRate?: number;
  buildingSlots?: number;
  collectThreshold?: number;
  unlockXP: number;
  emoji: string;
  visual?: BuildingVisualConfig;
}

export interface PlacedBuilding {
  id: string;
  type: BuildingType;
  level: number;
  position: GridPosition;
  size: BuildingSize;
  status: BuildingStatus;
  constructionStartTime?: number;
  constructionEndTime?: number;
  lastCollectionTime?: number;
  pendingCollection?: number;
  placedAt: number;
}

export const BUILDING_DEFINITIONS: Record<BuildingType, BuildingDefinition> = {
  bamboo_farm: {
    id: 'bamboo_farm',
    name: 'Bamboo Farm',
    description: 'Produces bamboo coins over time. Tap to collect!',
    educationalDescription: 'Just like earning a paycheck, your Bamboo Farm represents active income - the money you earn through work and effort. The more farms you have, the more you earn!',
    cost: 50,
    size: { width: 2, height: 2 },
    constructionTime: 30,
    maxLevel: 10,
    baseProduction: 10,
    collectThreshold: 10,
    unlockXP: 0,
    emoji: '🌾',
    visual: { anchorOffsetY: -10 },
  },
  storage: {
    id: 'storage',
    name: 'Storage Building',
    description: 'Increases your maximum bamboo coin capacity.',
    educationalDescription: 'Think of Storage as your savings account capacity. Without enough storage, your earnings overflow and are lost. Smart savers always plan for growth!',
    cost: 30,
    size: { width: 1, height: 1 },
    constructionTime: 20,
    maxLevel: 10,
    baseStorage: 500,
    unlockXP: 0,
    emoji: '📦',
    visual: { anchorOffsetY: -8 },
  },
  bank: {
    id: 'bank',
    name: 'Bamboo Bank',
    description: 'Generates interest on your stored bamboo coins.',
    educationalDescription: 'The Bank represents compound interest - your money making money! This is the secret to building wealth over time. The earlier you start, the more powerful it becomes.',
    cost: 100,
    size: { width: 2, height: 2 },
    constructionTime: 60,
    maxLevel: 5,
    baseInterestRate: 1,
    unlockXP: 100,
    emoji: '🏦',
    visual: { anchorOffsetY: -15 },
  },
  market_stall: {
    id: 'market_stall',
    name: 'Market Stall',
    description: 'Produces coins at variable rates with random bonus events.',
    educationalDescription: 'The Market Stall teaches diversification - "Don\'t put all your eggs in one basket." Variable income can be risky, but also rewarding. Smart investors balance stable and variable income sources.',
    cost: 75,
    size: { width: 1, height: 1 },
    constructionTime: 25,
    maxLevel: 8,
    baseProduction: 8,
    collectThreshold: 10,
    unlockXP: 50,
    emoji: '🏪',
    visual: { anchorOffsetY: -8 },
  },
  insurance_hut: {
    id: 'insurance_hut',
    name: 'Insurance Hut',
    description: 'Reduces damage from negative economic events by 50%.',
    educationalDescription: 'Insurance protects you from unexpected losses. In real life, insurance helps manage risk - from health emergencies to property damage. It costs money now but saves you from bigger losses later.',
    cost: 120,
    size: { width: 1, height: 1 },
    constructionTime: 40,
    maxLevel: 5,
    eventProtection: 50,
    unlockXP: 150,
    emoji: '🛡️',
    visual: { anchorOffsetY: -8 },
  },
  training_dojo: {
    id: 'training_dojo',
    name: 'Training Dojo',
    description: 'Boosts production of all farms by 15% per level.',
    educationalDescription: 'The Training Dojo represents investing in human capital - your skills and knowledge. Education and training increase your earning potential. The best investment you can make is in yourself!',
    cost: 150,
    size: { width: 2, height: 2 },
    constructionTime: 45,
    maxLevel: 5,
    productionBoost: 15,
    unlockXP: 200,
    emoji: '🥋',
    visual: { anchorOffsetY: -15 },
  },
  trading_post: {
    id: 'trading_post',
    name: 'Trading Post',
    description: 'Converts coins to XP at favorable rates.',
    educationalDescription: 'The Trading Post shows how reinvesting profits leads to growth. In business, successful companies reinvest earnings to expand. Sometimes spending money strategically is better than hoarding it.',
    cost: 200,
    size: { width: 2, height: 1 },
    constructionTime: 50,
    maxLevel: 5,
    xpConversionRate: 2,
    unlockXP: 250,
    emoji: '🏛️',
    visual: { anchorOffsetY: -10 },
  },
  panda_house: {
    id: 'panda_house',
    name: 'Panda House',
    description: 'Unlocks ability to place more buildings in your empire.',
    educationalDescription: 'The Panda House represents infrastructure investment. To grow a business, you need to invest in capacity - hiring employees, expanding facilities. Growth requires planning and investment.',
    cost: 250,
    size: { width: 2, height: 2 },
    constructionTime: 60,
    maxLevel: 3,
    buildingSlots: 5,
    unlockXP: 300,
    emoji: '🐼',
    visual: { anchorOffsetY: -15 },
  },
};

export const getBuildingStats = (type: BuildingType, level: number) => {
  const def = BUILDING_DEFINITIONS[type];
  const multiplier = Math.pow(1.3, level - 1);
  
  return {
    production: def.baseProduction ? Math.floor(def.baseProduction * multiplier) : undefined,
    storage: def.baseStorage ? Math.floor(def.baseStorage * multiplier) : undefined,
    interestRate: def.baseInterestRate ? def.baseInterestRate * multiplier : undefined,
    productionBoost: def.productionBoost ? def.productionBoost * level : undefined,
    eventProtection: def.eventProtection ? Math.min(80, def.eventProtection + (level - 1) * 10) : undefined,
    xpConversionRate: def.xpConversionRate ? def.xpConversionRate + (level - 1) * 0.5 : undefined,
    buildingSlots: def.buildingSlots ? def.buildingSlots * level : undefined,
  };
};

export const getUpgradeCost = (type: BuildingType, currentLevel: number): number => {
  const def = BUILDING_DEFINITIONS[type];
  return Math.floor(def.cost * Math.pow(1.5, currentLevel));
};

export const isBuildingUnlocked = (type: BuildingType, currentXP: number): boolean => {
  return currentXP >= BUILDING_DEFINITIONS[type].unlockXP;
};

export const getCollectThreshold = (type: BuildingType): number => {
  return BUILDING_DEFINITIONS[type].collectThreshold ?? 10;
};
