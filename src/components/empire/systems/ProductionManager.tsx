import { useEffect, useCallback, useRef } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { useBaseLayoutStore, PlacedBuilding } from '@/store/useBaseLayoutStore';
import { getEmpireStorageCapacity, getInterestRatePerHour, getTotalCoinProductionPerHour, getBuildingProductionPerHour, getCollectibleAmount, isBuildingCollectionReady } from './economy';

const PRODUCTION_INTERVAL = 60000; // 1 minute in milliseconds
const LAST_VISIT_KEY = 'bamboo_empire_last_visit';

interface ProductionManagerProps {
  onOfflineEarnings: (earnings: number, duration: string) => void;
  productionMultiplier?: number;
  storageMultiplier?: number;
}

export const useProductionManager = ({
  onOfflineEarnings,
  productionMultiplier = 1,
  storageMultiplier = 1,
}: ProductionManagerProps) => {
  const buildings = useBaseLayoutStore((state) => state.buildings);
  const updateBuildingCollection = useBaseLayoutStore((state) => state.updateBuildingCollection);
  const addBamboo = useGameStore((state) => state.addBamboo);
  const bamboo = useGameStore((state) => state.bamboo);
  
  const productionIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Calculate total storage capacity
  const calculateTotalStorage = useCallback(() => {
    return getEmpireStorageCapacity(buildings, storageMultiplier);
  }, [buildings, storageMultiplier]);
  
  // Calculate total production per hour
  const calculateProductionRate = useCallback(() => {
    return getTotalCoinProductionPerHour(buildings, productionMultiplier);
  }, [buildings, productionMultiplier]);
  
  // Calculate interest from banks
  const calculateInterestRate = useCallback(() => {
    return getInterestRatePerHour(buildings);
  }, [buildings]);
  
  // Process production for all active farms
  const processProduction = useCallback(() => {
    const totalStorage = calculateTotalStorage();
    const currentBamboo = bamboo;
    
    if (currentBamboo >= totalStorage) {
      // Storage is full, no production
      return;
    }
    
    buildings.forEach((building: PlacedBuilding) => {
      const productionPerMinute = getBuildingProductionPerHour(building, buildings, productionMultiplier) / 60;

      if (productionPerMinute > 0) {
        updateBuildingCollection(building.id, productionPerMinute);
      }
    });
    
    // Process bank interest
    const interestRate = calculateInterestRate();
    if (interestRate > 0) {
      const interestPerMinute = (currentBamboo * (interestRate / 100)) / 60;
      if (currentBamboo + interestPerMinute <= totalStorage) {
        addBamboo(interestPerMinute);
      }
    }
  }, [buildings, bamboo, calculateTotalStorage, calculateInterestRate, updateBuildingCollection, addBamboo, productionMultiplier]);
  
  // Collect from a specific building
  const collectFromBuilding = useCallback((buildingId: string) => {
    const building = buildings.find((b: PlacedBuilding) => b.id === buildingId);
    if (!building || !building.pendingCollection) return 0;
    
    if (!isBuildingCollectionReady(building.type, building.pendingCollection)) return 0;
    
    const totalStorage = calculateTotalStorage();
    const currentBamboo = bamboo;
    const amountToCollect = getCollectibleAmount({
      pendingCollection: building.pendingCollection,
      currentBamboo,
      totalStorage,
    });
    
    if (amountToCollect > 0) {
      addBamboo(amountToCollect);
      updateBuildingCollection(buildingId, -amountToCollect);
    }
    
    return amountToCollect;
  }, [buildings, bamboo, calculateTotalStorage, addBamboo, updateBuildingCollection]);
  
  // Calculate offline earnings
  const calculateOfflineEarnings = useCallback(() => {
    const lastVisit = localStorage.getItem(LAST_VISIT_KEY);
    if (!lastVisit) {
      localStorage.setItem(LAST_VISIT_KEY, Date.now().toString());
      return;
    }
    
    const lastVisitTime = parseInt(lastVisit, 10);
    const now = Date.now();
    const elapsedMs = now - lastVisitTime;
    const elapsedMinutes = elapsedMs / 60000;
    
    // Only calculate if away for more than 1 minute
    if (elapsedMinutes < 1) {
      localStorage.setItem(LAST_VISIT_KEY, now.toString());
      return;
    }
    
    const productionRate = calculateProductionRate();
    const totalStorage = calculateTotalStorage();
    const currentBamboo = bamboo;
    
    // Calculate earnings (production per hour * hours elapsed)
    const hoursElapsed = elapsedMinutes / 60;
    let earnings = productionRate * hoursElapsed;
    
    // Cap earnings at available storage
    const spaceAvailable = totalStorage - currentBamboo;
    earnings = Math.min(earnings, spaceAvailable);
    earnings = Math.floor(earnings);
    
    if (earnings > 0) {
      // Format duration string
      let durationStr = '';
      if (hoursElapsed >= 24) {
        const days = Math.floor(hoursElapsed / 24);
        durationStr = `${days} day${days > 1 ? 's' : ''}`;
      } else if (hoursElapsed >= 1) {
        const hours = Math.floor(hoursElapsed);
        durationStr = `${hours} hour${hours > 1 ? 's' : ''}`;
      } else {
        const mins = Math.floor(elapsedMinutes);
        durationStr = `${mins} minute${mins > 1 ? 's' : ''}`;
      }
      
      onOfflineEarnings(earnings, durationStr);
    }
    
    localStorage.setItem(LAST_VISIT_KEY, now.toString());
  }, [bamboo, calculateProductionRate, calculateTotalStorage, onOfflineEarnings]);
  
  // Start production loop
  useEffect(() => {
    // Calculate offline earnings on mount
    calculateOfflineEarnings();
    
    // Start production interval
    productionIntervalRef.current = setInterval(processProduction, PRODUCTION_INTERVAL);
    
    return () => {
      if (productionIntervalRef.current) {
        clearInterval(productionIntervalRef.current);
      }
      // Save last visit time on unmount
      localStorage.setItem(LAST_VISIT_KEY, Date.now().toString());
    };
  }, [processProduction, calculateOfflineEarnings]);
  
  // Update last visit time periodically
  useEffect(() => {
    const saveInterval = setInterval(() => {
      localStorage.setItem(LAST_VISIT_KEY, Date.now().toString());
    }, 30000); // Every 30 seconds
    
    return () => clearInterval(saveInterval);
  }, []);
  
  return {
    totalStorage: calculateTotalStorage(),
    productionRate: calculateProductionRate(),
    interestRate: calculateInterestRate(),
    collectFromBuilding,
  };
};

export default useProductionManager;
