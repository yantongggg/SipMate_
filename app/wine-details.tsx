import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native';
import { ArrowLeft, Heart } from 'lucide-react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useWine } from '@/contexts/WineContext';
import SaveWineModal from '@/components/SaveWineModal';

// Fixed image URL function with fallbacks
const getWineImageUrl = (imageName: string | null, wineType?: string): string => {
  // Fallback images for when wine image is not available
  const fallbackImages = [
    'https://images.unsplash.com/photo-1586370434639-0fe43b2d32d6?w=400&h=600&fit=crop', // Red wine bottle
    'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=400&h=600&fit=crop', // Wine glasses
    'https://images.unsplash.com/photo-1547595628-c61a29f496f0?w=400&h=600&fit=crop', // Wine bottle and glass
    'https://images.unsplash.com/photo-1569529465841-dfecdab7503b?w=400&h=600&fit=crop', // Wine collection
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
  
  console.log(`Image URL for ${imageName} (${wineType}):`, imageUrl);
  return imageUrl;
};

interface WineDetails {
  id: string;
  name: string;
  winery: string | null;
  type: string;
  region: string | null;
  year: number | null;
  price: number | null;
  rating: number | null;
  food_pairing: string | null;
  alcohol_percentage: number | null;
  description: string | null;
  wine_image_name: string | null;
  url: string | null;
  [key: string]: any;
}

export default function WineDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { isWineSaved, unsaveWine, savedWines } = useWine();
  const [wine, setWine] = useState<WineDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Real-time check if wine is saved
  useEffect(() => {
    if (user && wine?.id) {
      const savedStatus = isWineSaved(wine.id);
      setIsSaved(savedStatus);
      console.log(`Wine ${wine.name} is saved:`, savedStatus);
    } else {
      setIsSaved(false);
    }
  }, [user, wine?.id, savedWines]);

  useEffect(() => {
    console.log('=== COMPONENT MOUNTED ===');
    console.log('Wine Details mounted with ID:', id);
    
    if (id) {
      fetchWineDetails();
    } else {
      console.log('=== NO ID PROVIDED ===');
      setLoading(false);
      Alert.alert('Error', 'No wine ID provided');
    }
  }, [id]);

  const fetchWineDetails = async () => {
    console.log('=== STARTING FETCH ===');
    console.log('Fetching wine details for ID:', id);
    
    try {
      const { data, error } = await supabase
        .from('wines')
        .select('*')
        .eq('id', id)
        .single();

      console.log('=== SUPABASE RESPONSE ===');
      console.log('Data:', data);
      console.log('Error:', error);

      if (error) {
        console.error('=== ERROR DETAILS ===');
        console.error('Error:', error);
        Alert.alert('Error', `Failed to load wine details: ${error.message}`);
        setLoading(false);
        return;
      }

      if (!data) {
        console.log('=== NO DATA RECEIVED ===');
        Alert.alert('Error', 'No wine found with this ID');
        setLoading(false);
        return;
      }

      console.log('=== SUCCESS ===');
      setWine(data);
      
    } catch (error) {
      console.error('=== CATCH ERROR ===');
      console.error('Catch error:', error);
      Alert.alert('Error', 'Failed to load wine details');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    console.log('🍷 Save button pressed in WineDetailsScreen');
    
    if (!user) {
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

    if (isSaved) {
      // If wine is already saved, show confirmation to unsave
      Alert.alert(
        'Remove from Library',
        `Remove "${wine?.name}" from your library?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Remove',
            style: 'destructive',
            onPress: async () => {
              if (!wine?.id) return;
              setSaving(true);
              try {
                const result = await unsaveWine(wine.id);
                if (result.error) {
                  Alert.alert('Error', 'Failed to remove wine from library');
                }
              } catch (error) {
                Alert.alert('Error', 'An unexpected error occurred');
              } finally {
                setSaving(false);
              }
            }
          }
        ]
      );
    } else {
      // If wine is not saved, show the save modal
      console.log('🍷 Opening SaveWineModal');
      setShowSaveModal(true);
    }
  };

  const handleModalClose = () => {
    console.log('🍷 SaveWineModal closed');
    setShowSaveModal(false);
  };

  // Get existing saved wine data if it exists
  const getSavedWineData = () => {
    if (!isSaved || !wine?.id) return null;
    const savedWineData = savedWines.find(sw => sw.wine_id === wine.id);
    return savedWineData || null;
  };

  const handleImageError = () => {
    console.log('Image failed to load, switching to fallback');
    setImageError(true);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading wine details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!wine) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Wine not found</Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const wineImageUrl = getWineImageUrl(wine.wine_image_name, wine.type);
  const displayImageUrl = imageError ? getWineImageUrl(null) : wineImageUrl;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backIconButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color="#722F37" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Wine Details</Text>
        
        {/* Save Button in Header */}
        <TouchableOpacity
          style={[
            styles.headerSaveButton,
            isSaved && styles.headerSaveButtonActive,
            saving && styles.headerSaveButtonSaving
          ]}
          onPress={handleSave}
          disabled={saving}
        >
          <Heart
            size={20}
            color={isSaved ? '#fff' : '#722F37'}
            fill={isSaved ? '#fff' : 'none'}
          />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Wine Image */}
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: displayImageUrl }}
            style={styles.wineImage}
            resizeMode="cover"
            onError={handleImageError}
            onLoad={() => {
              console.log('Image loaded successfully:', displayImageUrl);
            }}
          />
        </View>

        <View style={styles.detailsContainer}>
          <Text style={styles.wineName}>
            {wine.name || 'Unknown Wine'}
          </Text>

          {wine.type && (
            <View style={styles.wineDetailRow}>
              <Text style={styles.wineDetailLabel}>Type:</Text>
              <Text style={styles.wineDetailValue}>{wine.type}</Text>
            </View>
          )}

          {wine.winery && (
            <View style={styles.wineDetailRow}>
              <Text style={styles.wineDetailLabel}>Winery:</Text>
              <Text style={styles.wineDetailValue}>{wine.winery}</Text>
            </View>
          )}

          {wine.region && (
            <View style={styles.wineDetailRow}>
              <Text style={styles.wineDetailLabel}>Region:</Text>
              <Text style={styles.wineDetailValue}>{wine.region}</Text>
            </View>
          )}

          {wine.year && (
            <View style={styles.wineDetailRow}>
              <Text style={styles.wineDetailLabel}>Year:</Text>
              <Text style={styles.wineDetailValue}>{wine.year.toString()}</Text>
            </View>
          )}

          {wine.alcohol_percentage && (
            <View style={styles.wineDetailRow}>
              <Text style={styles.wineDetailLabel}>Alcohol:</Text>
              <Text style={styles.wineDetailValue}>{wine.alcohol_percentage.toString()}% ABV</Text>
            </View>
          )}

          {wine.price && (
            <View style={styles.wineDetailRow}>
              <Text style={styles.wineDetailLabel}>Price:</Text>
              <Text style={styles.wineDetailValue}>${wine.price.toString()}</Text>
            </View>
          )}

          {wine.rating && (
            <View style={styles.wineDetailRow}>
              <Text style={styles.wineDetailLabel}>Rating:</Text>
              <Text style={styles.wineDetailValue}>{wine.rating.toString()}/5</Text>
            </View>
          )}

          {wine.food_pairing && (
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>Food Pairing</Text>
              <Text style={styles.sectionText}>{wine.food_pairing}</Text>
            </View>
          )}

          {wine.description && (
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>About This Wine</Text>
              <Text style={styles.sectionText}>{wine.description}</Text>
            </View>
          )}

          {wine.url && (
            <TouchableOpacity 
              style={styles.urlButton}
              onPress={() => {
                console.log('URL clicked:', wine.url);
              }}
            >
              <Text style={styles.urlButtonText}>View More Details</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {/* Save Wine Modal */}
      {showSaveModal && (
        <SaveWineModal
          visible={showSaveModal}
          wine={wine}
          existingData={getSavedWineData()}
          onClose={handleModalClose}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5DC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 50,
  },
  backIconButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#722F37',
    flex: 1,
    textAlign: 'center',
    marginRight: 40,
  },
  headerSaveButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF8E1',
    borderWidth: 1,
    borderColor: '#D4AF37',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  headerSaveButtonActive: {
    backgroundColor: '#D4AF37',
    borderColor: '#D4AF37',
  },
  headerSaveButtonSaving: {
    opacity: 0.6,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#8B5A5F',
    marginBottom: 10,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorText: {
    fontSize: 20,
    color: '#722F37',
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: '#722F37',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  backButtonText: {
    fontSize: 16,
    color: 'white',
  },
  imageContainer: {
    height: 300,
    backgroundColor: '#f0f0f0',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
    overflow: 'hidden',
  },
  wineImage: {
    width: '100%',
    height: '100%',
  },
  detailsContainer: {
    padding: 20,
  },
  wineName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#722F37',
    marginBottom: 16,
    textAlign: 'center',
  },
  wineDetailRow: {
    flexDirection: 'row',
    marginBottom: 8,
    alignItems: 'flex-start',
  },
  wineDetailLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#722F37',
    width: 80,
    marginRight: 8,
  },
  wineDetailValue: {
    fontSize: 16,
    color: '#8B5A5F',
    flex: 1,
  },
  sectionContainer: {
    marginTop: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#722F37',
    marginBottom: 8,
  },
  sectionText: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
  },
  urlButton: {
    backgroundColor: '#722F37',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 16,
    alignItems: 'center',
  },
  urlButtonText: {
    fontSize: 16,
    color: 'white',
    fontWeight: 'bold',
  },
});