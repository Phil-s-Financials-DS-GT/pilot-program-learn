import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Home, Plus, History, CreditCard } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTutorialTrigger } from '@/hooks/useTutorial';

// Canvas components
import { IsometricGrid, TerrainType } from './canvas';

// Building components
import { BuildingSprite, GhostPreview, BuildingType, BUILDING_DEFINITIONS } from './buildings';

// UI components
import { BuildingMenu, BuildingInfoPanel, CoinCounter, OfflineProgress, EventBanner, EventHistory, CreditCardPanel, CreditUnlockBanner } from './ui';

// Systems
import { useProductionManager, useEventManager, useCreditManager } from './systems';

// Stores
import { useBaseLayoutStore, PlacedBuilding } from '@/store/useBaseLayoutStore';
import { useGameStore } from '@/store/useGameStore';
import { useCreditStore } from '@/store/useCreditStore';
import { getBuildingAtTile, getBuildingRenderOrder, gridToScreen, GRID_SIZE, PLAYABLE_BORDER, TILE_HEIGHT, TILE_WIDTH } from './lib/grid';

const getEmpireViewBox = (): string => {
  const minTile = PLAYABLE_BORDER;
  const maxTile = GRID_SIZE - PLAYABLE_BORDER - 1;
  const corners = [
    gridToScreen(minTile, minTile),
    gridToScreen(maxTile, minTile),
    gridToScreen(minTile, maxTile),
    gridToScreen(maxTile, maxTile),
  ];

  const minX = Math.min(...corners.map((corner) => corner.screenX)) - TILE_WIDTH * 3;
  const maxX = Math.max(...corners.map((corner) => corner.screenX)) + TILE_WIDTH * 3;
  const minY = Math.min(...corners.map((corner) => corner.screenY)) - TILE_HEIGHT * 7;
  const maxY = Math.max(...corners.map((corner) => corner.screenY)) + TILE_HEIGHT * 5;

  return `${minX} ${minY} ${maxX - minX} ${maxY - minY}`;
};

const EmpireCanvas: React.FC = () => {
  const navigate = useNavigate();
  const viewBox = useMemo(() => getEmpireViewBox(), []);
  
  const { triggerAdvance: triggerBuildMenuOpen } = useTutorialTrigger('build-button-intro');
  const { triggerAdvance: triggerBambooFarmSelect } = useTutorialTrigger('bamboo-farm-select');
  const { triggerAdvance: triggerBuildingPlaced } = useTutorialTrigger('place-building');
  
  // State
  const [selectedTile, setSelectedTile] = useState<{ x: number; y: number } | null>(null);
  const [showBuildMenu, setShowBuildMenu] = useState(false);
  const [selectedBuildingType, setSelectedBuildingType] = useState<BuildingType | null>(null);
  const [ghostPosition, setGhostPosition] = useState<{ x: number; y: number } | null>(null);
  const [selectedBuilding, setSelectedBuilding] = useState<PlacedBuilding | null>(null);
  const [showOfflineProgress, setShowOfflineProgress] = useState(false);
  const [offlineEarnings, setOfflineEarnings] = useState({ amount: 0, duration: '' });
  const [showEventHistory, setShowEventHistory] = useState(false);
  const [dismissedEvent, setDismissedEvent] = useState<string | null>(null);
  const [showCreditPanel, setShowCreditPanel] = useState(false);
  const [pendingCreditPurchase, setPendingCreditPurchase] = useState<BuildingType | null>(null);
  
  // Store state
  const buildings = useBaseLayoutStore((state) => state.buildings);
  const placeNewBuilding = useBaseLayoutStore((state) => state.placeNewBuilding);
  const canPlaceAt = useBaseLayoutStore((state) => state.canPlaceAt);
  const completeConstruction = useBaseLayoutStore((state) => state.completeConstruction);
  const bamboo = useGameStore((state) => state.bamboo);
  const spendBamboo = useGameStore((state) => state.spendBamboo);
  const addBamboo = useGameStore((state) => state.addBamboo);
  
  // Credit store
  const { purchaseWithCredit, enabled: creditEnabled } = useCreditStore();
  
  // Credit manager
  const { canUseCredit, isOverdue } = useCreditManager({
    onLateFee: (fee, scoreChange) => {
      console.log(`Late fee applied: ${fee}, score change: ${scoreChange}`);
    },
  });
  
  // Event callbacks - memoized to prevent unnecessary re-renders
  const handleEventStart = useCallback(() => {
    setDismissedEvent(null);
  }, []);
  
  // Event manager
  const {
    activeEvent,
    eventHistory,
    isCollectionBlocked,
    getRemainingTime,
    insuranceProtection,
    productionMultiplier,
  } = useEventManager({
    onEventStart: handleEventStart,
  });
  
  const showEventBanner = activeEvent && dismissedEvent !== activeEvent.event.id;

  // Production manager
  const handleOfflineEarnings = useCallback((earnings: number, duration: string) => {
    setOfflineEarnings({ amount: earnings, duration });
    setShowOfflineProgress(true);
  }, []);
  
  const { totalStorage, collectFromBuilding } = useProductionManager({
    onOfflineEarnings: handleOfflineEarnings,
    productionMultiplier,
    storageMultiplier: activeEvent?.event.effect.storageMultiplier ?? 1,
  });
  
  // Handle tile click
  const handleTileClick = useCallback((x: number, y: number, terrain: TerrainType) => {
    // If in placement mode
    if (selectedBuildingType) {
      const def = BUILDING_DEFINITIONS[selectedBuildingType];
      const isValid = canPlaceAt(x, y, undefined, def.size) && terrain === 'grass';
      
      if (isValid) {
        // Check if using credit purchase
        if (pendingCreditPurchase === selectedBuildingType) {
          const result = purchaseWithCredit(def.cost);
          if (result.success) {
            placeNewBuilding(selectedBuildingType, x, y, def.size);
            setSelectedBuildingType(null);
            setGhostPosition(null);
            setPendingCreditPurchase(null);
            triggerBuildingPlaced();
          }
        } else if (bamboo >= def.cost) {
          spendBamboo(def.cost);
          placeNewBuilding(selectedBuildingType, x, y, def.size);
          setSelectedBuildingType(null);
          setGhostPosition(null);
          triggerBuildingPlaced();
        }
      }
      return;
    }
    
    // Check if clicking on a building
    const clickedBuilding = getBuildingAtTile(buildings, x, y);
    
    if (clickedBuilding) {
      setSelectedBuilding(clickedBuilding);
      return;
    }
    
    // If clicking on buildable grass tile, show build menu
    if (terrain === 'grass') {
      setSelectedTile({ x, y });
      setShowBuildMenu(true);
    }
  }, [selectedBuildingType, buildings, bamboo, canPlaceAt, spendBamboo, placeNewBuilding, pendingCreditPurchase, purchaseWithCredit]);
  
  // Handle tile hover for ghost preview
  const handleTileHover = useCallback((x: number, y: number) => {
    if (selectedBuildingType) {
      setGhostPosition({ x, y });
    }
  }, [selectedBuildingType]);
  
  // Handle building selection from menu
  const handleSelectBuilding = useCallback((type: BuildingType, useCredit: boolean = false) => {
    setSelectedBuildingType(type);
    setShowBuildMenu(false);
    if (useCredit) {
      setPendingCreditPurchase(type);
    } else {
      setPendingCreditPurchase(null);
    }
    if (type === 'bamboo_farm') {
      triggerBambooFarmSelect();
    }
  }, [triggerBambooFarmSelect]);
  
  // Handle collection from building
  const handleCollect = useCallback((buildingId: string) => {
    if (isCollectionBlocked) return;
    collectFromBuilding(buildingId);
    setSelectedBuilding(null);
  }, [collectFromBuilding, isCollectionBlocked]);
  
  // Handle offline earnings collection
  const handleCollectOffline = useCallback(() => {
    addBamboo(offlineEarnings.amount, 'offline');
    setShowOfflineProgress(false);
  }, [offlineEarnings.amount, addBamboo]);
  
  // Cancel placement mode
  const cancelPlacement = useCallback(() => {
    setSelectedBuildingType(null);
    setGhostPosition(null);
  }, []);
  
  // Check construction completion
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      buildings.forEach((building: PlacedBuilding) => {
        if (building.status === 'constructing' && building.constructionEndTime && now >= building.constructionEndTime) {
          completeConstruction(building.id);
        }
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, [buildings, completeConstruction]);
  
  // Calculate ghost validity
  const ghostIsValid = selectedBuildingType && ghostPosition
    ? canPlaceAt(ghostPosition.x, ghostPosition.y, undefined, BUILDING_DEFINITIONS[selectedBuildingType].size)
    : false;

  return (
    <div
      className="relative w-full h-full overflow-hidden select-none"
    >
      {/* SVG Canvas */}
      <svg
        className="w-full h-full"
        viewBox={viewBox}
        preserveAspectRatio="xMidYMid meet"
        style={{ background: 'linear-gradient(to bottom, #065f46, #064e3b)' }}
        data-tutorial="empire-grid"
      >
        {/* Definitions */}
        <defs>
          {/* Water shimmer gradient */}
          <linearGradient id="waterShimmer" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#93c5fd" stopOpacity="0.5" />
            <stop offset="50%" stopColor="#60a5fa" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.5" />
          </linearGradient>
          
          {/* Gold glow for banks */}
          <radialGradient id="goldGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#fbbf24" stopOpacity="0" />
          </radialGradient>
          
          {/* Lily pad gradient */}
          <radialGradient id="lilyPadGradient" cx="30%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#4ade80" />
            <stop offset="100%" stopColor="#16a34a" />
          </radialGradient>
        </defs>
        
        {/* Isometric Grid */}
        <IsometricGrid
          selectedTile={selectedTile}
          onTileClick={handleTileClick}
          onTileHover={handleTileHover}
          ghostBuilding={selectedBuildingType && ghostPosition ? {
            type: selectedBuildingType,
            size: BUILDING_DEFINITIONS[selectedBuildingType].size,
            position: ghostPosition,
            isValid: ghostIsValid,
          } : null}
        />
        
        {/* Buildings */}
        <g>
          {[...buildings].sort((left, right) => {
            return getBuildingRenderOrder(left) - getBuildingRenderOrder(right);
          }).map((building: PlacedBuilding) => {
            const constructionProgress = building.status === 'constructing' && building.constructionStartTime && building.constructionEndTime
              ? Math.min(100, ((Date.now() - building.constructionStartTime) / (building.constructionEndTime - building.constructionStartTime)) * 100)
              : 100;

            return (
              <BuildingSprite
                key={building.id}
                type={building.type as BuildingType}
                level={building.level}
                status={building.status}
                gridX={building.position.x}
                gridY={building.position.y}
                constructionProgress={constructionProgress}
                pendingCollection={building.pendingCollection}
                isSelected={selectedBuilding?.id === building.id}
                onClick={() => setSelectedBuilding(building)}
              />
            );
          })}
          
          {/* Ghost Preview */}
          {selectedBuildingType && ghostPosition && (
            <GhostPreview
              type={selectedBuildingType}
              gridX={ghostPosition.x}
              gridY={ghostPosition.y}
              isValid={ghostIsValid}
            />
          )}
        </g>
      </svg>
      
      {/* Coin Counter */}
      <CoinCounter totalStorage={totalStorage} />
      
      {/* Top Right Buttons */}
      <div className="absolute top-4 right-4 z-10 flex gap-2">
        {creditEnabled && (
          <button
            onClick={() => setShowCreditPanel(true)}
            className={`p-3 rounded-xl shadow-lg transition-colors relative ${
              isOverdue 
                ? 'bg-red-500 text-white hover:bg-red-600' 
                : 'bg-white/90 dark:bg-gray-800/90 hover:bg-white dark:hover:bg-gray-700'
            }`}
            aria-label="Credit Card"
          >
            <CreditCard className="w-5 h-5" />
            {isOverdue && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full text-black text-xs flex items-center justify-center font-bold">
                !
              </span>
            )}
          </button>
        )}
        <button
          onClick={() => setShowEventHistory(true)}
          className="p-3 rounded-xl bg-white/90 dark:bg-gray-800/90 shadow-lg hover:bg-white dark:hover:bg-gray-700 transition-colors relative"
          aria-label="Event History"
        >
          <History className="w-5 h-5" />
          {eventHistory.length > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-white text-xs flex items-center justify-center">
              {eventHistory.length > 9 ? '9+' : eventHistory.length}
            </span>
          )}
        </button>
        <button
          onClick={() => navigate('/')}
          className="p-3 rounded-xl bg-white/90 dark:bg-gray-800/90 shadow-lg hover:bg-white dark:hover:bg-gray-700 transition-colors"
          aria-label="Return to Home"
        >
          <Home className="w-5 h-5" />
        </button>
      </div>
      
      {/* Event Banner */}
      {showEventBanner && (
        <EventBanner
          activeEvent={activeEvent}
          getRemainingTime={getRemainingTime}
          insuranceProtection={insuranceProtection}
          onDismiss={activeEvent?.event.duration === 0 ? () => setDismissedEvent(activeEvent.event.id) : undefined}
        />
      )}
      
      {/* Build Button (when not in placement mode) */}
      {!selectedBuildingType && (
        <motion.button
          data-tutorial="build-button"
          onClick={() => {
            setShowBuildMenu(true);
            triggerBuildMenuOpen();
          }}
          className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 px-6 py-3 rounded-xl bg-emerald-500 text-white font-bold shadow-lg flex items-center gap-2"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Plus className="w-5 h-5" />
          Build
        </motion.button>
      )}
      
      {/* Cancel Placement Button */}
      {selectedBuildingType && (
        <motion.button
          onClick={cancelPlacement}
          className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 px-6 py-3 rounded-xl bg-red-500 text-white font-bold shadow-lg"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Cancel Placement
        </motion.button>
      )}
      
      {/* Building Menu */}
      <BuildingMenu
        isOpen={showBuildMenu}
        onClose={() => setShowBuildMenu(false)}
        onSelectBuilding={handleSelectBuilding}
      />
      
      {/* Building Info Panel */}
      <BuildingInfoPanel
        building={selectedBuilding}
        onClose={() => setSelectedBuilding(null)}
        onCollect={handleCollect}
      />
      
      {/* Offline Progress Modal */}
      <OfflineProgress
        isOpen={showOfflineProgress}
        earnings={offlineEarnings.amount}
        duration={offlineEarnings.duration}
        onClose={() => setShowOfflineProgress(false)}
        onCollect={handleCollectOffline}
      />
      
      {/* Event History Panel */}
      <EventHistory
        isOpen={showEventHistory}
        onClose={() => setShowEventHistory(false)}
        history={eventHistory}
      />
      
      {/* Credit Card Panel */}
      <CreditCardPanel
        isOpen={showCreditPanel}
        onClose={() => setShowCreditPanel(false)}
      />
      
      {/* Credit Unlock Banner */}
      <CreditUnlockBanner />
    </div>
  );
};

export default EmpireCanvas;
