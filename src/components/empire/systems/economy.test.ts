import { describe, expect, it } from 'vitest';
import { BUILDING_DEFINITIONS, type PlacedBuilding } from '../buildings/BuildingTypes';
import {
  getCollectibleAmount,
  getEmpireStorageCapacity,
  getTotalCoinProductionPerHour,
  isBuildingCollectionReady,
} from './economy';

const makeBuilding = (
  id: string,
  type: keyof typeof BUILDING_DEFINITIONS,
  level: number,
  status: PlacedBuilding['status'] = 'active',
): PlacedBuilding => ({
  id,
  type,
  level,
  position: { x: 2, y: 2 },
  size: BUILDING_DEFINITIONS[type].size,
  status,
  pendingCollection: 0,
  placedAt: 0,
});

describe('empire economy helpers', () => {
  it('derives storage from the canonical placed-building model', () => {
    const capacity = getEmpireStorageCapacity([makeBuilding('storage-1', 'storage', 1)]);

    expect(capacity).toBe(600);
  });

  it('applies dojo production boosts to active coin-producing buildings', () => {
    const production = getTotalCoinProductionPerHour([
      makeBuilding('farm-1', 'bamboo_farm', 1),
      makeBuilding('dojo-1', 'training_dojo', 1),
    ]);

    expect(production).toBe(11.5);
  });

  it('keeps collection capped by remaining storage instead of deleting overflow', () => {
    const collectible = getCollectibleAmount({
      pendingCollection: 12.2,
      currentBamboo: 596,
      totalStorage: 600,
    });

    expect(collectible).toBe(4);
  });

  it('uses the shared collection threshold for popup and button readiness', () => {
    expect(isBuildingCollectionReady('bamboo_farm', 9.4)).toBe(false);
    expect(isBuildingCollectionReady('bamboo_farm', 10)).toBe(true);
  });
});
