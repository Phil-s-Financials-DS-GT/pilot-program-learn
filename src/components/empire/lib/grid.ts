import { type BuildingSize, type GridPosition, type PlacedBuilding } from '../buildings/BuildingTypes';

export type TerrainType = 'grass' | 'water' | 'pathway' | 'bamboo_forest';

export const GRID_SIZE = 20;
export const TILE_WIDTH = 64;
export const TILE_HEIGHT = 32;
export const PLAYABLE_BORDER = 2;
export const GRID_CENTER_X = (GRID_SIZE * TILE_WIDTH) / 2;

export const getGridCenterX = (): number => GRID_CENTER_X;

export const gridToScreen = (gridX: number, gridY: number): { screenX: number; screenY: number } => {
  const screenX = (gridX - gridY) * (TILE_WIDTH / 2) + GRID_CENTER_X;
  const screenY = (gridX + gridY) * (TILE_HEIGHT / 2);
  return { screenX, screenY };
};

export const screenToGrid = (screenX: number, screenY: number): { gridX: number; gridY: number } => {
  const normalizedX = screenX - GRID_CENTER_X;
  const gridX = (normalizedX / (TILE_WIDTH / 2) + screenY / (TILE_HEIGHT / 2)) / 2;
  const gridY = (screenY / (TILE_HEIGHT / 2) - normalizedX / (TILE_WIDTH / 2)) / 2;
  return { gridX: Math.floor(gridX), gridY: Math.floor(gridY) };
};

export const getRenderOrder = (gridX: number, gridY: number): number => gridX + gridY;

export const getBuildingRenderOrder = (building: PlacedBuilding): number => {
  const { x, y } = building.position;
  return x + y + building.size.width + building.size.height;
};

export const getTerrainType = (x: number, y: number): TerrainType => {
  if (x < 0 || y < 0 || x >= GRID_SIZE || y >= GRID_SIZE) {
    return 'bamboo_forest';
  }

  if (x === 0 || y === 0 || x === GRID_SIZE - 1 || y === GRID_SIZE - 1) {
    return 'bamboo_forest';
  }

  if (x === 1 || y === 1 || x === GRID_SIZE - 2 || y === GRID_SIZE - 2) {
    return 'bamboo_forest';
  }

  if (x >= 15 && x <= 17 && y >= 15 && y <= 17) {
    return 'water';
  }

  if (x === Math.floor(GRID_SIZE / 2) || y === Math.floor(GRID_SIZE / 2)) {
    return 'pathway';
  }

  return 'grass';
};

export const createTerrainMap = (): TerrainType[][] => {
  const terrain: TerrainType[][] = [];

  for (let y = 0; y < GRID_SIZE; y++) {
    terrain[y] = [];
    for (let x = 0; x < GRID_SIZE; x++) {
      terrain[y][x] = getTerrainType(x, y);
    }
  }

  return terrain;
};

export const getFootprintTiles = (position: GridPosition, size: BuildingSize): GridPosition[] => {
  const tiles: GridPosition[] = [];

  for (let dx = 0; dx < size.width; dx++) {
    for (let dy = 0; dy < size.height; dy++) {
      tiles.push({ x: position.x + dx, y: position.y + dy });
    }
  }

  return tiles;
};

export const isTileWithinFootprint = (
  tileX: number,
  tileY: number,
  position: GridPosition,
  size: BuildingSize,
): boolean => {
  return (
    tileX >= position.x &&
    tileX < position.x + size.width &&
    tileY >= position.y &&
    tileY < position.y + size.height
  );
};

export const isPlacementWithinBounds = (position: GridPosition, size: BuildingSize): boolean => {
  return (
    position.x >= PLAYABLE_BORDER &&
    position.y >= PLAYABLE_BORDER &&
    position.x + size.width <= GRID_SIZE - PLAYABLE_BORDER &&
    position.y + size.height <= GRID_SIZE - PLAYABLE_BORDER
  );
};

export const clampPositionToBounds = (position: GridPosition, size: BuildingSize): GridPosition => ({
  x: Math.min(Math.max(position.x, PLAYABLE_BORDER), GRID_SIZE - PLAYABLE_BORDER - size.width),
  y: Math.min(Math.max(position.y, PLAYABLE_BORDER), GRID_SIZE - PLAYABLE_BORDER - size.height),
});

export const getOccupiedTileSet = (buildings: PlacedBuilding[], excludeId?: string): Set<string> => {
  const occupied = new Set<string>();

  buildings.forEach((building) => {
    if (building.id === excludeId) {
      return;
    }

    getFootprintTiles(building.position, building.size).forEach((tile) => {
      occupied.add(`${tile.x},${tile.y}`);
    });
  });

  return occupied;
};

export const canPlaceBuildingAt = ({
  buildings,
  position,
  size,
  excludeId,
}: {
  buildings: PlacedBuilding[];
  position: GridPosition;
  size: BuildingSize;
  excludeId?: string;
}): boolean => {
  if (!isPlacementWithinBounds(position, size)) {
    return false;
  }

  const occupiedTiles = getOccupiedTileSet(buildings, excludeId);

  return getFootprintTiles(position, size).every((tile) => {
    return getTerrainType(tile.x, tile.y) === 'grass' && !occupiedTiles.has(`${tile.x},${tile.y}`);
  });
};

export const findNearestValidPlacement = ({
  buildings,
  preferredPosition,
  size,
  excludeId,
}: {
  buildings: PlacedBuilding[];
  preferredPosition: GridPosition;
  size: BuildingSize;
  excludeId?: string;
}): GridPosition | null => {
  const start = clampPositionToBounds(preferredPosition, size);

  if (canPlaceBuildingAt({ buildings, position: start, size, excludeId })) {
    return start;
  }

  for (let radius = 1; radius < GRID_SIZE; radius++) {
    for (let x = start.x - radius; x <= start.x + radius; x++) {
      for (let y = start.y - radius; y <= start.y + radius; y++) {
        if (Math.max(Math.abs(x - start.x), Math.abs(y - start.y)) !== radius) {
          continue;
        }

        const candidate = clampPositionToBounds({ x, y }, size);
        if (canPlaceBuildingAt({ buildings, position: candidate, size, excludeId })) {
          return candidate;
        }
      }
    }
  }

  return null;
};

export const getBuildingAtTile = (
  buildings: PlacedBuilding[],
  x: number,
  y: number,
): PlacedBuilding | null => {
  const sorted = [...buildings].sort((a, b) => getBuildingRenderOrder(b) - getBuildingRenderOrder(a));

  return (
    sorted.find((building) => isTileWithinFootprint(x, y, building.position, building.size)) ?? null
  );
};

export const getFootprintCenter = (position: GridPosition, size: BuildingSize): GridPosition => ({
  x: position.x + (size.width - 1) / 2,
  y: position.y + (size.height - 1) / 2,
});
