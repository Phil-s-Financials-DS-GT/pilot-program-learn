import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useGameStore } from '@/store/useGameStore';
import { initializeCreditStore } from '@/store/useCreditStore';
import { loadGameState, createFreshState } from '@/engine/persistence';

/**
 * Global component that initializes the Bamboo Empire game state on app load.
 * This ensures the game store is ready before any game component tries to award resources.
 */
const GameStateInitializer = () => {
  const { user } = useAuth();
  const isInitialized = useGameStore((state) => state.initialized);

  useEffect(() => {
    const initializeGameState = async () => {
      if (isInitialized) return;

      try {
        const savedState = await loadGameState(user?.id);
        if (savedState) {
          useGameStore.getState().loadState(savedState);
        } else {
          // Initialize with fresh state if no saved state exists
          const freshState = createFreshState();
          useGameStore.getState().loadState(freshState);
        }
        
        // Initialize credit store from localStorage
        initializeCreditStore();
      } catch (error) {
        console.error('Failed to initialize game state:', error);
        // Still initialize with fresh state to prevent blocking
        const freshState = createFreshState();
        useGameStore.getState().loadState(freshState);
        initializeCreditStore();
      }
    };

    initializeGameState();
  }, [user?.id, isInitialized]);

  // This component doesn't render anything
  return null;
};

export default GameStateInitializer;
