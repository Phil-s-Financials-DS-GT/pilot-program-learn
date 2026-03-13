/**
 * Base Layout Store
 * 
 * Centralized Zustand store for managing Bamboo Empire's base layout state.
 * Handles building positions, placement mode, and drag/drop functionality.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  BUILDING_DEFINITIONS,
  type BuildingSize,
  type BuildingStatus,
  type BuildingType,
  type GridPosition,
  type PlacedBuilding,
} from '@/components/empire/buildings/BuildingTypes';
import { canPlaceBuildingAt, findNearestValidPlacement } from '@/components/empire/lib/grid';

export type { PlacedBuilding } from '@/components/empire/buildings/BuildingTypes';

export type DefenseType = 'emergencyFund' | 'diversificationBarrier' | 'energyShield';

export interface PlacedDefense {
  id: string;
  type: DefenseType;
  gridX: number;
  gridY: number;
  placedAt: number;
}

export interface PlacementItem {
  type: 'building' | 'defense';
  itemType: BuildingType | DefenseType;
}

interface BaseLayoutState {
  // Placed items on the grid
  buildings: PlacedBuilding[];
  defenses: PlacedDefense[];
  
  // Placement mode
  isPlacementMode: boolean;
  placementItem: PlacementItem | null;
  
  // Edit/move mode
  isEditMode: boolean;
  editingId: string | null;
  selectedId: string | null;
  
  // Drag state
  isDragging: boolean;
  dragScreenPosition: { x: number; y: number } | null;
}

interface BaseLayoutActions {
  // Placement mode
  startPlacement: (item: PlacementItem) => void;
  cancelPlacement: () => void;
  placeNewBuilding: (type: BuildingType, gridX: number, gridY: number, size?: BuildingSize) => void;
  placeNewDefense: (type: DefenseType, gridX: number, gridY: number) => void;
  
  // Edit mode
  startEditMode: (id: string) => void;
  endEditMode: () => void;
  selectItem: (id: string | null) => void;
  
  // Move items
  moveBuilding: (id: string, gridX: number, gridY: number) => void;
  moveDefense: (id: string, gridX: number, gridY: number) => void;
  
  // Remove items
  removeBuilding: (id: string) => void;
  removeDefense: (id: string) => void;
  
  // Building management
  upgradeBuilding: (id: string) => void;
  updateBuildingStatus: (id: string, status: BuildingStatus) => void;
  updateBuildingCollection: (id: string, amount: number) => void;
  completeConstruction: (id: string) => void;
  
  // Drag state
  setDragging: (isDragging: boolean) => void;
  updateDragPosition: (position: { x: number; y: number } | null) => void;
  
  // Utility
  canPlaceAt: (gridX: number, gridY: number, excludeId?: string, size?: BuildingSize) => boolean;
  canMoveTo: (gridX: number, gridY: number, excludeId?: string) => boolean;
  isPositionOccupied: (gridX: number, gridY: number, excludeId?: string) => boolean;
  
  // Reset
  resetLayout: () => void;
}

type BaseLayoutStore = BaseLayoutState & BaseLayoutActions;

const normalizeBuildingType = (rawType: unknown): BuildingType | null => {
  switch (rawType) {
    case 'bamboo_farm':
    case 'bambooFarm':
      return 'bamboo_farm';
    case 'storage':
    case 'bambooStorage':
      return 'storage';
    case 'bank':
      return 'bank';
    case 'market_stall':
      return 'market_stall';
    case 'insurance_hut':
      return 'insurance_hut';
    case 'training_dojo':
      return 'training_dojo';
    case 'trading_post':
      return 'trading_post';
    case 'panda_house':
    case 'pandaHouse':
      return 'panda_house';
    default:
      return null;
  }
};

const normalizePersistedBuildings = (rawBuildings: unknown): PlacedBuilding[] => {
  if (!Array.isArray(rawBuildings)) return [];

  return rawBuildings
    .reduce<PlacedBuilding[]>((normalizedBuildings, item, index) => {
      const record = item as Partial<PlacedBuilding> & Record<string, unknown>;
      const normalizedType = normalizeBuildingType(record.type);
      if (!normalizedType) return normalizedBuildings;

      const rawPos = record.position as { x?: unknown; y?: unknown } | undefined;
      const rawGridX = typeof record.gridX === 'number' ? record.gridX : undefined;
      const rawGridY = typeof record.gridY === 'number' ? record.gridY : undefined;
      const fallbackX = typeof rawPos?.x === 'number' ? rawPos.x : (rawGridX ?? 2);
      const fallbackY = typeof rawPos?.y === 'number' ? rawPos.y : (rawGridY ?? 2);
      const definition = BUILDING_DEFINITIONS[normalizedType];
      const preferredPosition: GridPosition = {
        x: Math.floor(fallbackX),
        y: Math.floor(fallbackY),
      };
      const normalizedPosition = findNearestValidPlacement({
        buildings: normalizedBuildings,
        preferredPosition,
        size: definition.size,
      });

      if (!normalizedPosition) {
        return normalizedBuildings;
      }

      const normalizedStatus: BuildingStatus =
        record.status === 'constructing' || record.status === 'active' || record.status === 'damaged' || record.status === 'upgrading'
          ? record.status
          : 'active';

      const level = typeof record.level === 'number' && Number.isFinite(record.level) && record.level > 0
        ? Math.floor(record.level)
        : 1;

      normalizedBuildings.push({
        id: typeof record.id === 'string' ? record.id : `migrated_building_${normalizedType}_${Date.now()}_${index}`,
        type: normalizedType,
        level,
        position: normalizedPosition,
        size: definition.size,
        status: normalizedStatus,
        constructionStartTime: typeof record.constructionStartTime === 'number' ? record.constructionStartTime : undefined,
        constructionEndTime: typeof record.constructionEndTime === 'number' ? record.constructionEndTime : undefined,
        lastCollectionTime: typeof record.lastCollectionTime === 'number' ? record.lastCollectionTime : undefined,
        pendingCollection: typeof record.pendingCollection === 'number' ? record.pendingCollection : 0,
        placedAt: typeof record.placedAt === 'number' ? record.placedAt : Date.now(),
      });

      return normalizedBuildings;
    }, []);
};

const initialState: BaseLayoutState = {
  buildings: [],
  defenses: [],
  isPlacementMode: false,
  placementItem: null,
  isEditMode: false,
  editingId: null,
  selectedId: null,
  isDragging: false,
  dragScreenPosition: null,
};

export const useBaseLayoutStore = create<BaseLayoutStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      // Placement mode
      startPlacement: (item) => {
        set({
          isPlacementMode: true,
          placementItem: item,
          isEditMode: false,
          editingId: null,
          selectedId: null,
        });
      },

      cancelPlacement: () => {
        set({
          isPlacementMode: false,
          placementItem: null,
          isDragging: false,
          dragScreenPosition: null,
        });
      },

      placeNewBuilding: (type, gridX, gridY, size = BUILDING_DEFINITIONS[type].size) => {
        const state = get();
        if (!state.canPlaceAt(gridX, gridY, undefined, size)) return;

        const now = Date.now();
        const constructionTime = BUILDING_DEFINITIONS[type].constructionTime * 1000;

        const newBuilding: PlacedBuilding = {
          id: `building_${type}_${Date.now()}`,
          type,
          level: 1,
          position: { x: gridX, y: gridY },
          size,
          status: 'constructing',
          constructionStartTime: now,
          constructionEndTime: now + constructionTime,
          pendingCollection: 0,
          placedAt: now,
        };

        set({
          buildings: [...state.buildings, newBuilding],
          isPlacementMode: false,
          placementItem: null,
          isDragging: false,
          dragScreenPosition: null,
        });
      },

      placeNewDefense: (type, gridX, gridY) => {
        const state = get();
        if (!state.canPlaceAt(gridX, gridY)) return;

        const newDefense: PlacedDefense = {
          id: `defense_${type}_${Date.now()}`,
          type,
          gridX,
          gridY,
          placedAt: Date.now(),
        };

        set({
          defenses: [...state.defenses, newDefense],
          isPlacementMode: false,
          placementItem: null,
          isDragging: false,
          dragScreenPosition: null,
        });
      },

      // Edit mode
      startEditMode: (id) => {
        set({
          isEditMode: true,
          editingId: id,
          selectedId: id,
          isDragging: true,
        });
      },

      endEditMode: () => {
        set({
          isEditMode: false,
          editingId: null,
          isDragging: false,
          dragScreenPosition: null,
        });
      },

      selectItem: (id) => {
        set({ selectedId: id });
      },

      // Move items
      moveBuilding: (id, gridX, gridY) => {
        const state = get();
        if (!state.canMoveTo(gridX, gridY, id)) return;

        set({
          buildings: state.buildings.map((b) =>
            b.id === id ? { ...b, position: { x: gridX, y: gridY } } : b
          ),
          isEditMode: false,
          editingId: null,
          isDragging: false,
          dragScreenPosition: null,
        });
      },

      moveDefense: (id, gridX, gridY) => {
        const state = get();
        if (!state.canMoveTo(gridX, gridY, id)) return;

        set({
          defenses: state.defenses.map((d) =>
            d.id === id ? { ...d, gridX, gridY } : d
          ),
          isEditMode: false,
          editingId: null,
          isDragging: false,
          dragScreenPosition: null,
        });
      },

      // Remove items
      removeBuilding: (id) => {
        set((state) => ({
          buildings: state.buildings.filter((b) => b.id !== id),
          selectedId: state.selectedId === id ? null : state.selectedId,
        }));
      },

      removeDefense: (id) => {
        set((state) => ({
          defenses: state.defenses.filter((d) => d.id !== id),
          selectedId: state.selectedId === id ? null : state.selectedId,
        }));
      },

      // Building management
      upgradeBuilding: (id) => {
        set((state) => ({
          buildings: state.buildings.map((b) =>
            b.id === id ? { ...b, level: b.level + 1 } : b
          ),
        }));
      },

      updateBuildingStatus: (id, status) => {
        set((state) => ({
          buildings: state.buildings.map((b) =>
            b.id === id ? { ...b, status } : b
          ),
        }));
      },

      updateBuildingCollection: (id, amount) => {
        set((state) => ({
          buildings: state.buildings.map((b) =>
            b.id === id
              ? { ...b, pendingCollection: Math.max(0, (b.pendingCollection || 0) + amount) }
              : b
          ),
        }));
      },

      completeConstruction: (id) => {
        set((state) => ({
          buildings: state.buildings.map((b) =>
            b.id === id
              ? { ...b, status: 'active' as BuildingStatus, lastCollectionTime: Date.now() }
              : b
          ),
        }));
      },

      // Drag state
      setDragging: (isDragging) => {
        set({ isDragging });
      },

      updateDragPosition: (position) => {
        set({ dragScreenPosition: position });
      },

      // Utility functions
      canPlaceAt: (gridX, gridY, excludeId, size = { width: 1, height: 1 }) => {
        return canPlaceBuildingAt({
          buildings: get().buildings,
          position: { x: gridX, y: gridY },
          size,
          excludeId,
        });
      },

      canMoveTo: (gridX, gridY, excludeId) => {
        const buildingToMove = get().buildings.find((building) => building.id === excludeId);
        return get().canPlaceAt(gridX, gridY, excludeId, buildingToMove?.size);
      },

      isPositionOccupied: (gridX, gridY, excludeId) => {
        const state = get();
        
        // Check buildings (considering their size)
        const buildingOccupied = state.buildings.some((b) => {
          if (b.id === excludeId) return false;
          const pos = b.position;
          const size = b.size;
          
          return (
            gridX >= pos.x &&
            gridX < pos.x + size.width &&
            gridY >= pos.y &&
            gridY < pos.y + size.height
          );
        });
        
        const defenseOccupied = state.defenses.some(
          (d) => d.gridX === gridX && d.gridY === gridY && d.id !== excludeId
        );
        
        return buildingOccupied || defenseOccupied;
      },

      // Reset
      resetLayout: () => {
        set(initialState);
      },
    }),
    {
      name: 'bamboo-empire-layout',
      version: 3,
      migrate: (persistedState) => {
        const stateRecord = (persistedState || {}) as Record<string, unknown>;
        return {
          ...stateRecord,
          buildings: normalizePersistedBuildings(stateRecord.buildings),
          defenses: Array.isArray(stateRecord.defenses) ? stateRecord.defenses : [],
        };
      },
      partialize: (state) => ({
        buildings: state.buildings,
        defenses: state.defenses,
      }),
    }
  )
);

// Derived selectors
export const getAvailableBuildings = (
  placedBuildings: PlacedBuilding[],
  unlockedBuildings: BuildingType[]
): BuildingType[] => {
  const placedTypes = placedBuildings.map((b) => b.type);
  return unlockedBuildings.filter((type) => !placedTypes.includes(type));
};

export const getAvailableDefenses = (
  placedDefenses: PlacedDefense[],
  unlockedDefenses: DefenseType[]
): DefenseType[] => {
  const placedTypes = placedDefenses.map((d) => d.type);
  return unlockedDefenses.filter((type) => !placedTypes.includes(type));
};

export default useBaseLayoutStore;
