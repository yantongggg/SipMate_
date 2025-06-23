import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Wine, SavedWine } from '@/types/wine';
import { wineService } from '@/services/wineService';
import { useAuth } from './AuthContext';

interface WineContextType {
  savedWines: SavedWine[];
  isLoading: boolean;
  refreshSavedWines: () => Promise<void>;
  addSavedWine: (wine: SavedWine) => void;
  removeSavedWine: (wineId: string) => void;
  isWineSaved: (wineId: string) => boolean;
}

const WineContext = createContext<WineContextType | undefined>(undefined);

export function WineProvider({ children }: { children: ReactNode }) {
  const [savedWines, setSavedWines] = useState<SavedWine[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      refreshSavedWines();
    } else {
      setSavedWines([]);
    }
  }, [user]);

  const refreshSavedWines = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const wines = await wineService.getSavedWines();
      setSavedWines(wines);
    } catch (error) {
      console.error('Error refreshing saved wines:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addSavedWine = (wine: SavedWine) => {
    setSavedWines(prev => {
      // Remove existing wine if it exists, then add the new one at the beginning
      const filtered = prev.filter(w => w.id !== wine.id);
      return [wine, ...filtered];
    });
  };

  const removeSavedWine = (wineId: string) => {
    setSavedWines(prev => prev.filter(w => w.id !== wineId));
  };

  const isWineSaved = (wineId: string) => {
    return savedWines.some(wine => wine.id === wineId);
  };

  return (
    <WineContext.Provider value={{
      savedWines,
      isLoading,
      refreshSavedWines,
      addSavedWine,
      removeSavedWine,
      isWineSaved
    }}>
      {children}
    </WineContext.Provider>
  );
}

export function useWine() {
  const context = useContext(WineContext);
  if (context === undefined) {
    throw new Error('useWine must be used within a WineProvider');
  }
  return context;
}