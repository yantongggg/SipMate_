import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  Linking,
} from 'react-native';
import { ArrowLeft, Bookmark, Star, ExternalLink, Wine as WineIcon } from 'lucide-react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Wine } from '@/types/wine';
import { wineService } from '@/services/wineService';
import { useAuthGuard } from '@/hooks/useAuthGuard';

export default function WineDetailsScreen() {
  const { wineId } = useLocalSearchParams<{ wineId: string }>();
  const [wine, setWine] = useState<Wine | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const { requireAuth, isAuthenticated } = useAuthGuard();

  useEffect(() => {
    if (wineId) {
      loadWineDetails();
    }
  }, [wineId]);

  useEffect(() => {
    if (wine && isAuthenticated) {
      checkSavedStatus();
    }
  }, [wine, isAuthenticated]);

  const loadWineDetails = async () => {
    try {
      const wineData = await wineService.getWineById(wineId);
      setWine(wineData);
    } catch (error) {
      console.error('Error loading wine details:', error);
      Alert.alert('Error', 'Failed to load wine details');
    } finally {
      setIsLoading(false);
    }
  };

  const checkSavedStatus = async () => {
    if (!wine) return;
    const saved = await wineService.isWineSaved(wine.id);
    setIsSaved(saved);
  };

  const handleSave = async () => {
    if (!wine) return;
    
    requireAuth(async () => {
      try {
        if (isSaved) {
          await wineService.removeSavedWine(wine.id);
          setIsSaved(false);
          Alert.alert('Removed', `${wine.name} removed from your library`);
        } else {
          await wineService.saveWine(wine);
          setIsSaved(true);
          Alert.alert('Saved', `${wine.name} added to your library`);
        }
      } catch (error) {
        Alert.alert('Error', 'Failed to update wine status');
      }
    });
  };

  const handleOpenUrl = async () => {
    if (!wine?.url) return;
    
    try {
      const supported = await Linking.canOpenURL(wine.url);
      if (supported) {
        await Linking.openURL(wine.url);
      } else {
        Alert.alert('Error', 'Cannot open this URL');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to open URL');
    }
  };

  const getImageSource = () => {
    if (!wine) return { uri: '' };
    if (imageError) {
      return { uri: wineService.getFallbackImageUrl(wine.type) };
    }
    return { uri: wineService.getWineImageUrl(wine.wineImageName, wine.type) };
  };

  const handleImageError = () => {
    console.log('Image failed to load for wine:', wine?.name);
    setImageError(true);
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <WineIcon size={48} color="#722F37" />
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
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#722F37" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Wine Details</Text>
        <TouchableOpacity 
          style={[styles.headerButton, isSaved && styles.saveButtonActive]} 
          onPress={handleSave}
        >
          <Bookmark 
            size={24} 
            color={isSaved ? '#FFFFFF' : '#722F37'} 
            fill={isSaved ? '#FFFFFF' : 'transparent'}
          />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.imageContainer}>
          <Image 
            source={getImageSource()}
            style={styles.image}
            onError={handleImageError}
            defaultSource={{ uri: wineService.getFallbackImageUrl(wine.type) }}
          />
        </View>

        <View style={styles.detailsContainer}>
          <Text style={styles.wineName}>{wine.name}</Text>
          <Text style={styles.winery}>{wine.winery}</Text>
          <Text style={styles.region}>{wine.region}</Text>

          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <View style={styles.ratingContainer}>
                <Star size={20} color="#D4AF37" fill="#D4AF37" />
                <Text style={styles.rating}>{wine.rating}</Text>
              </View>
              <Text style={styles.statLabel}>Rating</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.price}>${wine.price}</Text>
              <Text style={styles.statLabel}>Price</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.alcohol}>{wine.alcoholPercentage}%</Text>
              <Text style={styles.statLabel}>ABV</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>{wine.description}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Food Pairing</Text>
            <Text style={styles.foodPairing}>{wine.foodPairing}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Wine Type</Text>
            <View style={styles.typeContainer}>
              <View style={[styles.typeBadge, wine.type === 'red' ? styles.redBadge : styles.whiteBadge]}>
                <Text style={[styles.typeText, wine.type === 'red' ? styles.redText : styles.whiteText]}>
                  {wine.type.charAt(0).toUpperCase() + wine.type.slice(1)} Wine
                </Text>
              </View>
            </View>
          </View>

          {wine.url && (
            <View style={styles.section}>
              <TouchableOpacity style={styles.urlButton} onPress={handleOpenUrl}>
                <ExternalLink size={20} color="#722F37" />
                <Text style={styles.urlButtonText}>View on Vivino</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5DC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: '#722F37',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F5F5DC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButtonActive: {
    backgroundColor: '#722F37',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  content: {
    flex: 1,
  },
  imageContainer: {
    height: 300,
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  detailsContainer: {
    padding: 20,
  },
  wineName: {
    fontSize: 28,
    fontFamily: 'PlayfairDisplay-Bold',
    color: '#333',
    marginBottom: 8,
    lineHeight: 34,
  },
  winery: {
    fontSize: 20,
    color: '#666',
    marginBottom: 4,
    fontWeight: '500',
  },
  region: {
    fontSize: 16,
    color: '#888',
    marginBottom: 24,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  rating: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginLeft: 4,
  },
  price: {
    fontSize: 20,
    fontWeight: '700',
    color: '#722F37',
    marginBottom: 4,
  },
  alcohol: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'PlayfairDisplay-Bold',
    color: '#333',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
  },
  foodPairing: {
    fontSize: 16,
    color: '#722F37',
    lineHeight: 24,
    fontWeight: '500',
  },
  typeContainer: {
    flexDirection: 'row',
  },
  typeBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 2,
  },
  redBadge: {
    backgroundColor: '#FFF5F5',
    borderColor: '#722F37',
  },
  whiteBadge: {
    backgroundColor: '#FFFBF0',
    borderColor: '#D4AF37',
  },
  typeText: {
    fontSize: 14,
    fontWeight: '600',
  },
  redText: {
    color: '#722F37',
  },
  whiteText: {
    color: '#D4AF37',
  },
  urlButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#722F37',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  urlButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#722F37',
    marginLeft: 8,
  },
});