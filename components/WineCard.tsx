import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Heart, Star } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useWine } from '@/contexts/WineContext';

// Fixed image URL function with fallbacks
const getWineImageUrl = (imageName: string | null, wineType?: string): string => {
  // Random wine images for fallback
  const fallbackImages = [
    'https://images.unsplash.com/photo-1586370434639-0fe43b2d32d6?w=400&h=600&fit=crop', // Red wine bottle
    'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=400&h=600&fit=crop', // Wine glasses
    'https://images.unsplash.com/photo-1547595628-c61a29f496f0?w=400&h=600&fit=crop', // Wine bottle and glass
    'https://images.unsplash.com/photo-1569529465841-dfecdab7503b?w=400&h=600&fit=crop', // Wine collection
    'https://images.unsplash.com/photo-1528823872057-9c018a7a7553?w=400&h=600&fit=crop', // Elegant wine
  ];

  if (!imageName) {
    // Return random fallback image
    const randomIndex = Math.floor(Math.random() * fallbackImages.length);
    return fallbackImages[randomIndex];
  }
  
  // If the imageName already includes the folder path, use it directly
  if (imageName.includes('/')) {
    const baseUrl = 'https://gcvtaawcowvtytbsnftq.supabase.co/storage/v1/object/public';
    return `${baseUrl}/wine-images/${imageName}`;
  }
  
  // Otherwise, determine folder based on wine type
  const folder = (wineType === 'white') ? 'whitewine_png' : 'redwine_png';
  const baseUrl = 'https://gcvtaawcowvtytbsnftq.supabase.co/storage/v1/object/public';
  const imageUrl = `${baseUrl}/wine-images/${folder}/${imageName}`;
  
  return imageUrl;
};

type Wine = {
  id: string;
  name: string;
  type: string;
  winery?: string;
  region?: string;
  year?: number;
  price?: number;
  rating?: number;
  wine_image_name?: string;
};

interface WineCardProps {
  wine: Wine;
}

const { width } = Dimensions.get('window');
const cardWidth = (width - 60) / 2; // Better spacing: 20px margins + 20px gap

export default function WineCard({ wine }: WineCardProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { isWineSaved, saveWine, unsaveWine, refreshSavedWines } = useWine();
  const [isSaved, setIsSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Check if wine is saved when component mounts or wine changes
  useEffect(() => {
    if (user && wine.id) {
      const savedStatus = isWineSaved(wine.id);
      setIsSaved(savedStatus);
      console.log(`Wine ${wine.name} is saved:`, savedStatus);
    } else {
      setIsSaved(false);
    }
  }, [wine.id, user, isWineSaved]);

  const handlePress = () => {
    console.log('Wine card pressed:', wine.id);
    router.push({
      pathname: '/wine-details',
      params: { id: wine.id }
    });
  };

  const handleSave = async () => {
    console.log('=== SAVE BUTTON PRESSED ===');
    console.log('Wine:', wine.name);
    console.log('User:', user?.id);
    console.log('Currently saved:', isSaved);

    if (!user) {
      console.log('No user logged in, redirecting to auth');
      Alert.alert(
        'Sign In Required',
        'Please sign in to save wines to your library',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Sign In', onPress: () => router.push('/auth') }
        ]
      );
      return;
    }

    setSaving(true);

    try {
      if (isSaved) {
        // Unsave the wine
        console.log('Unsaving wine...');
        const result = await unsaveWine(wine.id);
        
        if (result.error) {
          console.error('Unsave error:', result.error);
          Alert.alert('Error', 'Failed to remove wine from library');
        } else {
          console.log('Wine unsaved successfully');
          setIsSaved(false);
          await refreshSavedWines();
        }
      } else {
        // Save the wine - Use correct function signature
        console.log('Saving wine...');
        const result = await saveWine(wine.id, {
          rating: undefined,
          date_tried: undefined,
          location: undefined,
          user_notes: undefined,
        });
        
        if (result.error) {
          console.error('Save error:', result.error);
          Alert.alert('Error', 'Failed to save wine to library');
        } else {
          console.log('Wine saved successfully');
          setIsSaved(true);
          await refreshSavedWines();
        }
      }
    } catch (error) {
      console.error('Save/unsave catch error:', error);
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setSaving(false);
    }
  };

  const wineImageUrl = getWineImageUrl(wine.wine_image_name, wine.type);

  const handleImageError = () => {
    console.log('Image failed to load:', wineImageUrl);
    setImageError(true);
  };

  // Get fallback image if main image fails
  const getFallbackImage = () => {
    const fallbackImages = [
      'https://images.unsplash.com/photo-1586370434639-0fe43b2d32d6?w=400&h=600&fit=crop',
      'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=400&h=600&fit=crop',
      'https://images.unsplash.com/photo-1547595628-c61a29f496f0?w=400&h=600&fit=crop',
    ];
    const randomIndex = Math.floor(Math.random() * fallbackImages.length);
    return fallbackImages[randomIndex];
  };

  // Helper function to build wine details text safely
  const buildWineDetailsText = () => {
    const parts = [];
    if (wine.type) parts.push(wine.type);
    if (wine.region) parts.push(wine.region);
    if (wine.winery) parts.push(wine.winery);
    return parts.join(', ');
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={handlePress} style={styles.card}>
        <View style={styles.imageContainer}>
          <Image
            source={{ 
              uri: imageError ? getFallbackImage() : wineImageUrl
            }}
            style={styles.image}
            resizeMode="cover"
            onError={handleImageError}
            onLoad={() => console.log('✅ Image loaded successfully')}
          />
          
          {/* Save Button - Positioned over image */}
          <TouchableOpacity
            style={[
              styles.saveButton,
              isSaved && styles.saveButtonActive,
              saving && styles.saveButtonSaving
            ]}
            onPress={handleSave}
            disabled={saving}
          >
            <Heart
              size={14}
              color={isSaved ? '#fff' : '#D4AF37'}
              fill={isSaved ? '#fff' : 'none'}
            />
          </TouchableOpacity>
        </View>
        
        <View style={styles.content}>
          <Text style={styles.name} numberOfLines={2}>
            {wine.name || 'Unknown Wine'}
          </Text>
          
          {wine.winery && (
            <Text style={styles.winery} numberOfLines={1}>
              {wine.winery}
            </Text>
          )}
          
          {wine.region && (
            <Text style={styles.region} numberOfLines={1}>
              {wine.region}
            </Text>
          )}
          
          <View style={styles.bottomRow}>
            <View style={styles.leftInfo}>
              {wine.year && (
                <Text style={styles.year}>{wine.year.toString()}</Text>
              )}
              
              {wine.price && (
                <Text style={styles.price}>
                  ${wine.price.toString()}
                </Text>
              )}
            </View>

            {/* Rating display - Fixed to use proper Text wrapping */}
            {wine.rating && (
              <View style={styles.ratingContainer}>
                <View style={styles.ratingContent}>
                  <Star size={12} color="#D4AF37" fill="#D4AF37" />
                  <Text style={styles.rating}>{wine.rating}</Text>
                </View>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: cardWidth,
    marginBottom: 16,
    marginHorizontal: 4, // Small horizontal margin for spacing
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 6,
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: 180, // Slightly increased height
  },
  image: {
    width: '100%',
    height: '100%',
  },
  content: {
    padding: 14, // Slightly increased padding
  },
  name: {
    fontSize: 15, // Slightly smaller font
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#722F37',
    lineHeight: 19,
  },
  winery: {
    fontSize: 13,
    color: '#8B5A5F',
    marginBottom: 2,
    fontStyle: 'italic',
  },
  region: {
    fontSize: 11,
    color: '#888',
    marginBottom: 8,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  leftInfo: {
    flex: 1,
  },
  year: {
    fontSize: 11,
    color: '#888',
    marginBottom: 2,
  },
  price: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#D4AF37',
  },
  ratingContainer: {
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  ratingContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    fontSize: 11,
    fontWeight: '600',
    color: '#722F37',
    marginLeft: 2,
  },
  saveButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderWidth: 1,
    borderColor: '#D4AF37',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  saveButtonActive: {
    backgroundColor: '#D4AF37',
    borderColor: '#D4AF37',
  },
  saveButtonSaving: {
    opacity: 0.6,
  },
});