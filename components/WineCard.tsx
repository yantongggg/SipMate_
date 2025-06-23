import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { Bookmark, Star } from 'lucide-react-native';
import { Wine, SavedWine } from '@/types/wine';
import { wineService } from '@/services/wineService';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { useWine } from '@/contexts/WineContext';
import SaveWineModal from './SaveWineModal';

interface WineCardProps {
  wine: Wine;
  onSave?: (wine: Wine) => void;
  onRemove?: (wine: Wine) => void;
  onPress?: () => void;
  showSaveDate?: boolean;
  dateSaved?: string;
  dateTried?: string;
  userRating?: number;
  userNotes?: string;
}

export default function WineCard({ 
  wine, 
  onSave, 
  onRemove, 
  onPress, 
  showSaveDate = false,
  dateSaved,
  dateTried,
  userRating,
  userNotes
}: WineCardProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const { requireAuth, isAuthenticated } = useAuthGuard();
  const { isWineSaved, addSavedWine, removeSavedWine } = useWine();

  const isSaved = isWineSaved(wine.id);

  const handleSave = async () => {
    requireAuth(() => {
      if (isSaved) {
        // If already saved, remove it
        handleRemove();
      } else {
        // If not saved, show save modal
        setShowSaveModal(true);
      }
    });
  };

  const handleRemove = async () => {
    setIsLoading(true);
    try {
      await wineService.removeSavedWine(wine.id);
      removeSavedWine(wine.id);
      onRemove?.(wine);
      Alert.alert('Removed', `${wine.name} removed from your library`);
    } catch (error) {
      console.error('Error removing wine:', error);
      Alert.alert('Error', 'Failed to remove wine');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveWithDetails = async (wineData: {
    wine: Wine;
    userRating?: number;
    userNotes?: string;
    dateTried?: string;
  }) => {
    setIsLoading(true);
    try {
      await wineService.saveWineWithDetails(
        wineData.wine,
        wineData.userRating,
        wineData.userNotes,
        wineData.dateTried
      );
      
      // Create SavedWine object for context
      const savedWine: SavedWine = {
        ...wineData.wine,
        dateSaved: new Date().toISOString(),
        dateTried: wineData.dateTried,
        userRating: wineData.userRating,
        userNotes: wineData.userNotes
      };
      
      addSavedWine(savedWine);
      onSave?.(wine);
      Alert.alert('Saved', `${wine.name} added to your library`);
    } catch (error) {
      console.error('Error saving wine:', error);
      throw error; // Let the modal handle the error
    } finally {
      setIsLoading(false);
    }
  };

  const getImageSource = () => {
    if (imageError) {
      return { uri: wineService.getFallbackImageUrl(wine.type) };
    }
    return { uri: wineService.getWineImageUrl(wine.wineImageName, wine.type) };
  };

  const handleImageError = () => {
    console.log('Image failed to load for wine:', wine.name);
    setImageError(true);
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return dateString;
    }
  };

  return (
    <>
      <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
        <View style={styles.imageContainer}>
          <Image 
            source={getImageSource()}
            style={styles.image}
            onError={handleImageError}
            defaultSource={{ uri: wineService.getFallbackImageUrl(wine.type) }}
          />
          <TouchableOpacity
            style={[styles.saveButton, isSaved && styles.saveButtonActive]}
            onPress={handleSave}
            disabled={isLoading}
          >
            <Bookmark 
              size={20} 
              color={isSaved ? '#FFFFFF' : '#722F37'} 
              fill={isSaved ? '#FFFFFF' : 'transparent'}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <Text style={styles.name} numberOfLines={2}>{wine.name}</Text>
          <Text style={styles.winery} numberOfLines={1}>{wine.winery}</Text>
          <Text style={styles.region} numberOfLines={1}>{wine.region}</Text>
          
          <View style={styles.details}>
            <View style={styles.ratingContainer}>
              <Star size={16} color="#D4AF37" fill="#D4AF37" />
              <Text style={styles.rating}>{wine.rating}</Text>
            </View>
            <Text style={styles.price}>${wine.price}</Text>
          </View>

          <Text style={styles.alcohol}>{wine.alcoholPercentage}% ABV</Text>
          <Text style={styles.pairing} numberOfLines={2}>{wine.foodPairing}</Text>
          <Text style={styles.description} numberOfLines={3}>{wine.description}</Text>

          {/* Show save dates and user data when in library view */}
          {showSaveDate && (
            <View style={styles.libraryInfo}>
              {dateSaved && (
                <View style={styles.dateRow}>
                  <Text style={styles.dateLabel}>Saved:</Text>
                  <Text style={styles.dateText}>{formatDate(dateSaved)}</Text>
                </View>
              )}
              {dateTried && (
                <View style={styles.dateRow}>
                  <Text style={styles.dateLabel}>Tried:</Text>
                  <Text style={styles.dateText}>{formatDate(dateTried)}</Text>
                </View>
              )}
              {userRating && (
                <View style={styles.ratingRow}>
                  <Text style={styles.dateLabel}>Your Rating:</Text>
                  <View style={styles.userRatingContainer}>
                    <Star size={14} color="#D4AF37" fill="#D4AF37" />
                    <Text style={styles.userRatingText}>{userRating}/5</Text>
                  </View>
                </View>
              )}
              {userNotes && (
                <View style={styles.notesContainer}>
                  <Text style={styles.notesLabel}>Your Notes:</Text>
                  <Text style={styles.notesText} numberOfLines={3}>{userNotes}</Text>
                </View>
              )}
            </View>
          )}
        </View>
      </TouchableOpacity>

      <SaveWineModal
        visible={showSaveModal}
        wine={wine}
        onClose={() => setShowSaveModal(false)}
        onSave={handleSaveWithDetails}
      />
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
  },
  imageContainer: {
    position: 'relative',
    height: 200,
    backgroundColor: '#F8F8F8',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  saveButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  saveButtonActive: {
    backgroundColor: '#722F37',
  },
  content: {
    padding: 16,
  },
  name: {
    fontSize: 20,
    fontFamily: 'PlayfairDisplay-Bold',
    color: '#333',
    marginBottom: 4,
    lineHeight: 26,
  },
  winery: {
    fontSize: 16,
    color: '#666',
    marginBottom: 2,
  },
  region: {
    fontSize: 14,
    color: '#888',
    marginBottom: 12,
  },
  details: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 4,
  },
  price: {
    fontSize: 18,
    fontWeight: '700',
    color: '#722F37',
  },
  alcohol: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  pairing: {
    fontSize: 14,
    color: '#722F37',
    fontWeight: '500',
    marginBottom: 8,
    lineHeight: 18,
  },
  description: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  libraryInfo: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  ratingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  dateLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  dateText: {
    fontSize: 12,
    color: '#333',
  },
  userRatingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userRatingText: {
    fontSize: 12,
    color: '#333',
    marginLeft: 4,
  },
  notesContainer: {
    marginTop: 8,
  },
  notesLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  notesText: {
    fontSize: 12,
    color: '#333',
    lineHeight: 16,
    fontStyle: 'italic',
  },
});