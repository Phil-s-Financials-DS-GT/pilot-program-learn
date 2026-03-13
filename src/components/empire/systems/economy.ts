import {
  BUILDING_DEFINITIONS,
  getBuildingStats,
  getCollectThreshold,
  type BuildingType,
  type PlacedBuilding,
} from '../buildings/BuildingTypes';

export const BASE_STORAGE_CAPACITY = 100;

const COIN_PRODUCERS = new Set<BuildingType>(['bamboo_farm', 'market_stall']);

export const getEmpireStorageCapacity = (
  buildings: PlacedBuilding[],
  storageMultiplier: number = 1,
): number => {
  const buildingStorage = buildings.reduce((total, building) => {
    if (building.status !== 'active' || !BUILDING_DEFINITIONS[building.type].baseStorage) {
      return total;
    }

    return total + (getBuildingStats(building.type, building.level).storage ?? 0);
  }, 0);

  return Math.floor((BASE_STORAGE_CAPACITY + buildingStorage) * storageMultiplier);
};

export const getTrainingBoostMultiplier = (buildings: PlacedBuilding[]): number => {
  const totalBoostPercent = buildings.reduce((total, building) => {
    if (building.type !== 'training_dojo' || building.status !== 'active') {
      return total;
    }

    return total + (getBuildingStats('training_dojo', building.level).productionBoost ?? 0);
  }, 0);

  return 1 + totalBoostPercent / 100;
};

export const getBuildingProductionPerHour = (
  building: PlacedBuilding,
  buildings: PlacedBuilding[],
  productionMultiplier: number = 1,
): number => {
  if (building.status !== 'active' || !COIN_PRODUCERS.has(building.type)) {
    return 0;
  }

  const baseProduction = getBuildingStats(building.type, building.level).production ?? 0;
  const trainingBoost = getTrainingBoostMultiplier(buildings);

  return baseProduction * trainingBoost * productionMultiplier;
};

export const getTotalCoinProductionPerHour = (
  buildings: PlacedBuilding[],
  productionMultiplier: number = 1,
): number => {
  return buildings.reduce((total, building) => {
    return total + getBuildingProductionPerHour(building, buildings, productionMultiplier);
  }, 0);
};

export const getInterestRatePerHour = (buildings: PlacedBuilding[]): number => {
  return buildings.reduce((total, building) => {
    if (building.type !== 'bank' || building.status !== 'active') {
      return total;
    }

    return total + (getBuildingStats('bank', building.level).interestRate ?? 0);
  }, 0);
};

export const getBuildingCollectThresholdFor = (type: BuildingType): number => {
  return getCollectThreshold(type);
};

export const isBuildingCollectionReady = (type: BuildingType, pendingCollection: number): boolean => {
  return Math.round(pendingCollection) >= getBuildingCollectThresholdFor(type);
};

export const getCollectibleAmount = ({
  pendingCollection,
  currentBamboo,
  totalStorage,
}: {
  pendingCollection: number;
  currentBamboo: number;
  totalStorage: number;
}): number => {
  const pendingRounded = Math.round(pendingCollection);
  const spaceAvailable = Math.max(0, totalStorage - currentBamboo);
  return Math.min(pendingRounded, spaceAvailable);
};
