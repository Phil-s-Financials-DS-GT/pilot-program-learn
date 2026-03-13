import React, { useMemo, useCallback } from 'react';
import Tile from './Tile';
import { useBaseLayoutStore } from '@/store/useBaseLayoutStore';
import {
  GRID_SIZE,
  createTerrainMap,
  getOccupiedTileSet,
  getRenderOrder,
  getTerrainType,
  gridToScreen,
  isTileWithinFootprint,
  type TerrainType,
} from '../lib/grid';

export {
  GRID_SIZE,
  TILE_WIDTH,
  TILE_HEIGHT,
  getRenderOrder,
  gridToScreen,
  screenToGrid,
} from '../lib/grid';

interface IsometricGridProps {
  selectedTile: { x: number; y: number } | null;
  onTileClick: (x: number, y: number, terrain: TerrainType) => void;
  onTileHover: (x: number, y: number) => void;
  ghostBuilding?: {
    type: string;
    size: { width: number; height: number };
    position: { x: number; y: number };
    isValid: boolean;
  } | null;
}

const IsometricGrid: React.FC<IsometricGridProps> = ({
  selectedTile,
  onTileClick,
  onTileHover,
  ghostBuilding,
}) => {
  const buildings = useBaseLayoutStore((state) => state.buildings);
  
  // Generate terrain map once
  const terrainMap = useMemo(() => createTerrainMap(), []);
  
  // Create a set of occupied tiles for quick lookup
  const occupiedTiles = useMemo(() => getOccupiedTileSet(buildings), [buildings]);
  
  // Check if a tile is buildable
  const isTileBuildable = useCallback((x: number, y: number): boolean => {
    return getTerrainType(x, y) === 'grass' && !occupiedTiles.has(`${x},${y}`);
  }, [occupiedTiles]);
  
  // Check if tile is part of ghost building placement
  const isGhostTile = useCallback((x: number, y: number): boolean => {
    if (!ghostBuilding) return false;
    return isTileWithinFootprint(x, y, ghostBuilding.position, ghostBuilding.size);
  }, [ghostBuilding]);
  
  // Generate tiles sorted by render order
  const sortedTiles = useMemo(() => {
    const tiles: Array<{
      x: number;
      y: number;
      terrain: TerrainType;
      renderOrder: number;
      isOccupied: boolean;
      isBuildable: boolean;
    }> = [];
    
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        tiles.push({
          x,
          y,
          terrain: terrainMap[y][x],
          renderOrder: getRenderOrder(x, y),
          isOccupied: occupiedTiles.has(`${x},${y}`),
          isBuildable: isTileBuildable(x, y),
        });
      }
    }
    
    // Sort by render order for proper depth
    return tiles.sort((a, b) => a.renderOrder - b.renderOrder);
  }, [terrainMap, occupiedTiles, isTileBuildable]);
  return (
    <g>
      {/* Render tiles */}
      {sortedTiles.map(({ x, y, terrain, isOccupied, isBuildable }) => {
        const { screenX, screenY } = gridToScreen(x, y);
        const isSelected = selectedTile?.x === x && selectedTile?.y === y;
        const isGhost = isGhostTile(x, y);

        return (
          <Tile
            key={`${x}-${y}`}
            x={x}
            y={y}
            screenX={screenX}
            screenY={screenY}
            terrain={terrain}
            isSelected={isSelected}
            isOccupied={isOccupied}
            isBuildable={isBuildable}
            isGhostValid={isGhost && ghostBuilding?.isValid}
            isGhostInvalid={isGhost && !ghostBuilding?.isValid}
            onClick={() => onTileClick(x, y, terrain)}
            onHover={() => onTileHover(x, y)}
          />
        );
      })}
    </g>
  );
};

export default IsometricGrid;
