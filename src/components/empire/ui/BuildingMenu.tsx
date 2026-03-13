import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Lock, Coins, Clock, Grid3X3, CreditCard } from 'lucide-react';
import { BuildingType, BUILDING_DEFINITIONS, isBuildingUnlocked } from '../buildings/BuildingTypes';
import { useGameStore } from '@/store/useGameStore';
import { useCreditStore } from '@/store/useCreditStore';

interface BuildingMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectBuilding: (type: BuildingType, useCredit?: boolean) => void;
}

const BuildingMenu: React.FC<BuildingMenuProps> = ({
  isOpen,
  onClose,
  onSelectBuilding,
}) => {
  const bamboo = useGameStore((state) => state.bamboo);
  const xp = useGameStore((state) => state.xp);
  
  const { enabled: creditEnabled, balance: creditBalance, limit: creditLimit } = useCreditStore();
  const availableCredit = creditLimit - creditBalance;
  
  const buildings = Object.values(BUILDING_DEFINITIONS);
  
  const handleSelectBuilding = (type: BuildingType, useCredit: boolean = false) => {
    const def = BUILDING_DEFINITIONS[type];
    if (!isBuildingUnlocked(type, xp)) return;
    
    if (useCredit) {
      if (!creditEnabled || def.cost > availableCredit) return;
    } else {
      if (bamboo < def.cost) return;
    }
    
    onSelectBuilding(type, useCredit);
    onClose();
  };
  
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40"
            onClick={onClose}
          />
          
          {/* Drawer */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 rounded-t-3xl shadow-2xl max-h-[60vh] overflow-hidden"
            data-tutorial="building-menu"
          >
            {/* Header */}
            <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                Build New Structure
              </h2>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Building Grid */}
            <div className="p-4 overflow-y-auto max-h-[calc(60vh-60px)]">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {buildings.map((building, index) => {
                  const isUnlocked = isBuildingUnlocked(building.id, xp);
                  const canAfford = bamboo >= building.cost;
                  const canAffordWithCredit = creditEnabled && building.cost <= availableCredit;
                  const isDisabled = !isUnlocked || (!canAfford && !canAffordWithCredit);
                  
                  return (
                    <motion.div
                      key={building.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <button
                        onClick={() => handleSelectBuilding(building.id)}
                        disabled={isDisabled}
                        data-tutorial={`building-${building.id}`}
                        className={`
                          w-full p-4 rounded-xl border-2 text-left transition-all
                          ${isDisabled
                            ? 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 opacity-60'
                            : 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 hover:shadow-lg hover:scale-[1.02]'
                          }
                        `}
                      >
                        {/* Building Icon */}
                        <div className="flex items-start justify-between mb-3">
                          <div className="text-4xl">
                            {building.emoji}
                          </div>
                          {!isUnlocked && (
                            <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-gray-200 dark:bg-gray-700 text-xs font-medium">
                              <Lock className="w-3 h-3" />
                              {building.unlockXP} XP
                            </div>
                          )}
                        </div>
                        
                        {/* Building Name */}
                        <h3 className="font-bold text-gray-900 dark:text-white mb-1">
                          {building.name}
                        </h3>
                        
                        {/* Description */}
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                          {building.description}
                        </p>
                        
                        {/* Stats */}
                        <div className="flex flex-wrap gap-2 text-xs">
                          {/* Cost */}
                          <div className={`
                            flex items-center gap-1 px-2 py-1 rounded-full
                            ${canAfford
                              ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                              : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                            }
                          `}>
                            <Coins className="w-3 h-3" />
                            {building.cost}
                          </div>
                          
                          {/* Construction Time */}
                          <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
                            <Clock className="w-3 h-3" />
                            {building.constructionTime}s
                          </div>
                          
                          {/* Size */}
                          <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400">
                            <Grid3X3 className="w-3 h-3" />
                            {building.size.width}x{building.size.height}
                          </div>
                        </div>
                        
                        {/* Production/Storage Stats */}
                        {building.baseProduction && (
                          <div className="mt-2 text-xs text-amber-600 dark:text-amber-400">
                            +{building.baseProduction} coins/hour
                          </div>
                        )}
                        {building.baseStorage && (
                          <div className="mt-2 text-xs text-blue-600 dark:text-blue-400">
                            +{building.baseStorage} storage capacity
                          </div>
                        )}
                        {building.baseInterestRate && (
                          <div className="mt-2 text-xs text-emerald-600 dark:text-emerald-400">
                            +{building.baseInterestRate}% interest/hour
                          </div>
                        )}
                        {building.eventProtection && (
                          <div className="mt-2 text-xs text-indigo-600 dark:text-indigo-400">
                            -{building.eventProtection}% event damage
                          </div>
                        )}
                        {building.productionBoost && (
                          <div className="mt-2 text-xs text-pink-600 dark:text-pink-400">
                            +{building.productionBoost}% farm production
                          </div>
                        )}
                        {building.xpConversionRate && (
                          <div className="mt-2 text-xs text-purple-600 dark:text-purple-400">
                            {building.xpConversionRate}x XP conversion
                          </div>
                        )}
                        {building.buildingSlots && (
                          <div className="mt-2 text-xs text-cyan-600 dark:text-cyan-400">
                            +{building.buildingSlots} building slots
                          </div>
                        )}
                        
                        {/* Affordability message or Credit option */}
                        {isUnlocked && !canAfford && canAffordWithCredit && (
                          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelectBuilding(building.id, true);
                              }}
                              className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 rounded-lg text-sm font-medium hover:bg-indigo-200 dark:hover:bg-indigo-900/50 transition-colors"
                            >
                              <CreditCard className="w-4 h-4" />
                              Use Credit ({building.cost})
                            </button>
                          </div>
                        )}
                        {isUnlocked && !canAfford && !canAffordWithCredit && (
                          <div className="mt-2 text-xs text-red-500 font-medium">
                            Need {building.cost - Math.floor(bamboo)} more coins
                          </div>
                        )}
                      </button>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default BuildingMenu;
