import { supabase } from '@/lib/supabase';
import { Wine, SavedWine } from '@/types/wine';

export const wineService = {
  async getAllWines(): Promise<Wine[]> {
    try {
      const { data, error } = await supabase
        .from('wines')
        .select('*')
        .order('name');

      if (error) throw error;

      return data.map(wine => ({
        id: wine.id,
        name: wine.name,
        winery: wine.winery,
        region: wine.region,
        price: wine.price,
        rating: wine.rating,
        foodPairing: wine.food_pairing,
        alcoholPercentage: wine.alcohol_percentage,
        description: wine.description,
        wineImageName: wine.wine_image_name,
        type: wine.type as 'red' | 'white',
        url: wine.url || ''
      }));
    } catch (error) {
      console.error('Error fetching wines:', error);
      return [];
    }
  },

  async searchWines(query: string): Promise<Wine[]> {
    try {
      const { data, error } = await supabase
        .from('wines')
        .select('*')
        .or(`name.ilike.%${query}%,winery.ilike.%${query}%,region.ilike.%${query}%,description.ilike.%${query}%`)
        .order('name');

      if (error) throw error;

      return data.map(wine => ({
        id: wine.id,
        name: wine.name,
        winery: wine.winery,
        region: wine.region,
        price: wine.price,
        rating: wine.rating,
        foodPairing: wine.food_pairing,
        alcoholPercentage: wine.alcohol_percentage,
        description: wine.description,
        wineImageName: wine.wine_image_name,
        type: wine.type as 'red' | 'white',
        url: wine.url || ''
      }));
    } catch (error) {
      console.error('Error searching wines:', error);
      return [];
    }
  },

  async filterWines(type?: 'red' | 'white', minRating?: number): Promise<Wine[]> {
    try {
      let query = supabase.from('wines').select('*');

      if (type) {
        query = query.eq('type', type);
      }

      if (minRating) {
        query = query.gte('rating', minRating);
      }

      const { data, error } = await query.order('name');

      if (error) throw error;

      return data.map(wine => ({
        id: wine.id,
        name: wine.name,
        winery: wine.winery,
        region: wine.region,
        price: wine.price,
        rating: wine.rating,
        foodPairing: wine.food_pairing,
        alcoholPercentage: wine.alcohol_percentage,
        description: wine.description,
        wineImageName: wine.wine_image_name,
        type: wine.type as 'red' | 'white',
        url: wine.url || ''
      }));
    } catch (error) {
      console.error('Error filtering wines:', error);
      return [];
    }
  },

  async sortWines(sortBy: 'name' | 'price_asc' | 'price_desc' | 'rating'): Promise<Wine[]> {
    try {
      let query = supabase.from('wines').select('*');

      switch (sortBy) {
        case 'name':
          query = query.order('name');
          break;
        case 'price_asc':
          query = query.order('price', { ascending: true });
          break;
        case 'price_desc':
          query = query.order('price', { ascending: false });
          break;
        case 'rating':
          query = query.order('rating', { ascending: false });
          break;
        default:
          query = query.order('name');
      }

      const { data, error } = await query;

      if (error) throw error;

      return data.map(wine => ({
        id: wine.id,
        name: wine.name,
        winery: wine.winery,
        region: wine.region,
        price: wine.price,
        rating: wine.rating,
        foodPairing: wine.food_pairing,
        alcoholPercentage: wine.alcohol_percentage,
        description: wine.description,
        wineImageName: wine.wine_image_name,
        type: wine.type as 'red' | 'white',
        url: wine.url || ''
      }));
    } catch (error) {
      console.error('Error sorting wines:', error);
      return [];
    }
  },

  async getWineById(id: string): Promise<Wine | null> {
    try {
      const { data, error } = await supabase
        .from('wines')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      return {
        id: data.id,
        name: data.name,
        winery: data.winery,
        region: data.region,
        price: data.price,
        rating: data.rating,
        foodPairing: data.food_pairing,
        alcoholPercentage: data.alcohol_percentage,
        description: data.description,
        wineImageName: data.wine_image_name,
        type: data.type as 'red' | 'white',
        url: data.url || ''
      };
    } catch (error) {
      console.error('Error fetching wine by ID:', error);
      return null;
    }
  },

  async saveWine(wine: Wine): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      console.log('Saving wine for user:', user.id, 'wine:', wine.id);

      const { error } = await supabase
        .from('saved_wines')
        .upsert({
          user_id: user.id,
          wine_id: wine.id,
          date_saved: new Date().toISOString()
        }, {
          onConflict: 'user_id,wine_id'
        });

      if (error) {
        console.error('Error saving wine:', error);
        throw error;
      }

      console.log('Wine saved successfully');
    } catch (error) {
      console.error('Error saving wine:', error);
      throw error;
    }
  },

  async saveWineWithDetails(
    wine: Wine, 
    userRating: number, 
    userNotes?: string, 
    dateTried?: string
  ): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      console.log('Saving wine with details for user:', user.id, 'wine:', wine.id);

      const saveData: any = {
        user_id: user.id,
        wine_id: wine.id,
        date_saved: new Date().toISOString(),
        user_rating: userRating,
      };

      if (userNotes) {
        saveData.user_notes = userNotes;
      }

      if (dateTried) {
        // Parse the date string properly
        try {
          const parsedDate = new Date(dateTried);
          if (!isNaN(parsedDate.getTime())) {
            saveData.date_tried = parsedDate.toISOString();
          }
        } catch (dateError) {
          console.warn('Invalid date format, skipping date_tried:', dateTried);
        }
      }

      const { error } = await supabase
        .from('saved_wines')
        .upsert(saveData, {
          onConflict: 'user_id,wine_id'
        });

      if (error) {
        console.error('Error saving wine with details:', error);
        throw error;
      }

      console.log('Wine saved with details successfully');
    } catch (error) {
      console.error('Error saving wine with details:', error);
      throw error;
    }
  },

  async getSavedWines(): Promise<SavedWine[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('No authenticated user found');
        return [];
      }

      console.log('Fetching saved wines for user:', user.id);

      // Query with proper column selection
      const { data, error } = await supabase
        .from('saved_wines')
        .select(`
          date_saved,
          date_tried,
          user_rating,
          user_notes,
          wines!inner (
            id,
            name,
            winery,
            region,
            price,
            rating,
            food_pairing,
            alcohol_percentage,
            description,
            wine_image_name,
            type,
            url
          )
        `)
        .eq('user_id', user.id)
        .order('date_saved', { ascending: false });

      if (error) {
        console.error('Error fetching saved wines:', error);
        throw error;
      }

      console.log('Saved wines fetched:', data?.length || 0);

      return (data || []).map(savedWine => ({
        id: savedWine.wines.id,
        name: savedWine.wines.name,
        winery: savedWine.wines.winery,
        region: savedWine.wines.region,
        price: savedWine.wines.price,
        rating: savedWine.wines.rating,
        foodPairing: savedWine.wines.food_pairing,
        alcoholPercentage: savedWine.wines.alcohol_percentage,
        description: savedWine.wines.description,
        wineImageName: savedWine.wines.wine_image_name,
        type: savedWine.wines.type as 'red' | 'white',
        url: savedWine.wines.url || '',
        dateSaved: savedWine.date_saved,
        dateTried: savedWine.date_tried,
        userRating: savedWine.user_rating,
        userNotes: savedWine.user_notes
      }));
    } catch (error) {
      console.error('Error fetching saved wines:', error);
      return [];
    }
  },

  async removeSavedWine(wineId: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      console.log('Removing saved wine for user:', user.id, 'wine:', wineId);

      const { error } = await supabase
        .from('saved_wines')
        .delete()
        .eq('user_id', user.id)
        .eq('wine_id', wineId);

      if (error) {
        console.error('Error removing saved wine:', error);
        throw error;
      }

      console.log('Wine removed successfully');
    } catch (error) {
      console.error('Error removing saved wine:', error);
      throw error;
    }
  },

  async isWineSaved(wineId: string): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { data, error } = await supabase
        .from('saved_wines')
        .select('id')
        .eq('user_id', user.id)
        .eq('wine_id', wineId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking if wine is saved:', error);
        return false;
      }

      return !!data;
    } catch (error) {
      console.error('Error checking if wine is saved:', error);
      return false;
    }
  },

  // Get wine image URL from Supabase Storage with better mobile support
  getWineImageUrl(imageName: string, type: 'red' | 'white'): string {
    try {
      const folder = type === 'red' ? 'redwine_png' : 'whitewine_png';
      const { data } = supabase.storage
        .from('wine-images')
        .getPublicUrl(`${folder}/${imageName}`);
      
      // Ensure the URL is properly formatted for mobile
      const url = data.publicUrl;
      
      // Add cache busting and ensure proper format
      if (url && !url.includes('?')) {
        return `${url}?t=${Date.now()}`;
      }
      
      return url || this.getFallbackImageUrl(type);
    } catch (error) {
      console.error('Error getting wine image URL:', error);
      return this.getFallbackImageUrl(type);
    }
  },

  // Fallback images from Pexels for when Supabase images fail
  getFallbackImageUrl(type: 'red' | 'white'): string {
    return type === 'red' 
      ? 'https://images.pexels.com/photos/1407846/pexels-photo-1407846.jpeg?auto=compress&cs=tinysrgb&w=400'
      : 'https://images.pexels.com/photos/1407847/pexels-photo-1407847.jpeg?auto=compress&cs=tinysrgb&w=400';
  }
};