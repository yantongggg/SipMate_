import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase, Database } from '@/lib/supabase';
import { useAuth } from './AuthContext';

type Wine = Database['public']['Tables']['wines']['Row'];
type SavedWine = Database['public']['Tables']['saved_wines']['Row'] & {
  wine: Wine;
};

interface SaveWineData {
  rating?: number;
  date_tried?: string;
  location?: string;
  user_notes?: string;
}

interface WineContextType {
  wines: Wine[];
  savedWines: SavedWine[];
  loading: boolean;
  refreshWines: () => Promise<void>;
  refreshSavedWines: () => Promise<void>;
  saveWine: (wineId: string, data: SaveWineData) => Promise<{ error?: string }>;
  unsaveWine: (wineId: string) => Promise<{ error?: string }>;
  isWineSaved: (wineId: string) => boolean;
}

const WineContext = createContext<WineContextType | undefined>(undefined);

export function WineProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [wines, setWines] = useState<Wine[]>([]);
  const [savedWines, setSavedWines] = useState<SavedWine[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    refreshWines();
  }, []);

  useEffect(() => {
    if (user) {
      refreshSavedWines();
    } else {
      setSavedWines([]);
    }
  }, [user]);

  const refreshWines = async () => {
    try {
      const { data, error } = await supabase
        .from('wines')
        .select('*')
        .order('name');

      if (error) {
        console.error('Error fetching wines:', error);
      } else {
        setWines(data || []);
      }
    } catch (error) {
      console.error('Error fetching wines:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshSavedWines = async () => {
    console.log('🔄 === REFRESH SAVED WINES ===');
    
    if (!user || !user.id) {
      console.log('❌ No user, skipping refresh');
      setSavedWines([]);
      return;
    }
    
    console.log('Refreshing for user:', user.id);
    
    try {
      const { data, error } = await supabase
        .from('saved_wines')
        .select(`
          *,
          wine:wines(*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      console.log('Refresh query result count:', data?.length || 0);

      if (error) {
        console.error('❌ Error fetching saved wines:', error);
        return; // Don't throw, just return to prevent cascading errors
      } else {
        console.log('✅ Fetched saved wines count:', data?.length || 0);
        const validSavedWines = (data || []).filter(item => item.wine);
        console.log('Valid saved wines:', validSavedWines.length);
        setSavedWines(validSavedWines as SavedWine[]);
      }
    } catch (error) {
      console.error('❌ Refresh catch error:', error);
      // Don't re-throw, just log the error
    }
    
    console.log('🔄 === REFRESH COMPLETE ===');
  };

  const saveWine = async (wineId: string, data: SaveWineData) => {
    console.log('🍷 === SAVE WINE FUNCTION START ===');
    console.log('Wine ID:', wineId);
    console.log('Data:', JSON.stringify(data, null, 2));
    console.log('User:', user?.id);

    if (!user?.id) {
      return { error: 'You must be logged in to save wines' };
    }

    if (!wineId) {
      return { error: 'Invalid wine ID' };
    }

    try {
      const { data: wineExists, error: wineCheckError } = await supabase
        .from('wines')
        .select('id')
        .eq('id', wineId)
        .single();

      if (wineCheckError || !wineExists) {
        return { error: 'Wine not found in database' };
      }

      const today = new Date().toISOString().split('T')[0];

      const saveData = {
        user_id: user.id,
        wine_id: wineId,
        date_saved: today,
        date_tried: data.date_tried || null,
        user_rating: data.rating || null,
        user_notes: data.user_notes?.trim() || null,
        location: data.location?.trim() || null,
      };

      console.log('📤 Saving data:', saveData);

      const { data: result, error: saveError } = await supabase
        .from('saved_wines')
        .upsert([saveData], {
          onConflict: 'user_id,wine_id',
          ignoreDuplicates: false,
        })
        .select('*, wine:wines(*)');

      if (saveError) {
        return { error: `Save failed: ${saveError.message}` };
      }

      if (!result || result.length === 0) {
        return { error: 'Save completed but no data returned' };
      }

      refreshSavedWines().catch(err => {
        console.error('Error refreshing saved wines after save:', err);
      });

      console.log('✅ Wine saved successfully');
      return {};

    } catch (error: any) {
      return { error: `Unexpected error: ${error.message}` };
    }
  };


  const unsaveWine = async (wineId: string) => {
    console.log('🗑️ === UNSAVE WINE ===');
    console.log('Wine ID:', wineId);
    console.log('User ID:', user?.id);

    if (!user?.id) {
      return { error: 'You must be logged in to unsave wines' };
    }

    try {
      const { error } = await supabase
        .from('saved_wines')
        .delete()
        .eq('user_id', user.id)
        .eq('wine_id', wineId);

      if (error) {
        console.error('❌ Unsave error:', error);
        return { error: error.message };
      }

      console.log('✅ Wine unsaved successfully');
      
      // Refresh saved wines WITHOUT awaiting
      refreshSavedWines().catch(err => {
        console.error('Error refreshing saved wines after unsave:', err);
      });
      
      return {};
    } catch (error: any) {
      console.error('❌ Unsave catch error:', error);
      return { error: 'An unexpected error occurred' };
    }
  };

  const isWineSaved = (wineId: string) => {
    const saved = savedWines.some(saved => saved.wine_id === wineId);
    return saved;
  };

  const value = {
    wines,
    savedWines,
    loading,
    refreshWines,
    refreshSavedWines,
    saveWine,
    unsaveWine,
    isWineSaved,
  };

  return <WineContext.Provider value={value}>{children}</WineContext.Provider>;
}

export function useWine() {
  const context = useContext(WineContext);
  if (context === undefined) {
    throw new Error('useWine must be used within a WineProvider');
  }
  return context;
}