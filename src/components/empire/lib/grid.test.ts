import { describe, expect, it } from 'vitest';
import { BUILDING_DEFINITIONS, type PlacedBuilding } from '../buildings/BuildingTypes';
import { canPlaceBuildingAt, findNearestValidPlacement, gridToScreen } from './grid';

const makeBuilding = (
  id: string,
  type: keyof typeof BUILDING_DEFINITIONS,
  x: number,
  y: number,
): PlacedBuilding => ({
  id,
  type,
  level: 1,
  position: { x, y },
  size: BUILDING_DEFINITIONS[type].size,
  status: 'active',
  pendingCollection: 0,
  placedAt: 0,
});

describe('empire grid helpers', () => {
  it('relocates invalid legacy border placements into the playable grid', () => {
    const relocated = findNearestValidPlacement({
      buildings: [],
      preferredPosition: { x: 1, y: 0 },
      size: BUILDING_DEFINITIONS.bamboo_farm.size,
    });

    expect(relocated).not.toBeNull();
    expect(relocated?.x).toBeGreaterThanOrEqual(2);
    expect(relocated?.y).toBeGreaterThanOrEqual(2);
    expect(
      canPlaceBuildingAt({
        buildings: [],
        position: relocated!,
        size: BUILDING_DEFINITIONS.bamboo_farm.size,
      }),
    ).toBe(true);
  });

  it('rejects invalid terrain placements such as water tiles', () => {
    const canPlaceOnWater = canPlaceBuildingAt({
      buildings: [],
      position: { x: 15, y: 15 },
      size: BUILDING_DEFINITIONS.storage.size,
    });

    expect(canPlaceOnWater).toBe(false);
  });

  it('maps grid coordinates into the shared fixed screen space', () => {
    const anchor = gridToScreen(2, 8);

    expect(anchor).toEqual({ screenX: 448, screenY: 160 });
  });

  it('rejects placements that overlap an existing building footprint', () => {
    const buildings = [makeBuilding('farm-1', 'bamboo_farm', 2, 2)];
    const overlappingPlacement = canPlaceBuildingAt({
      buildings,
      position: { x: 3, y: 3 },
      size: BUILDING_DEFINITIONS.storage.size,
    });

    expect(overlappingPlacement).toBe(false);
  });
});
