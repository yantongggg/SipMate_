import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
} from 'react-native';
import { X, Star, Calendar, MapPin, FileText } from 'lucide-react-native';
import { useWine } from '../contexts/WineContext';
import DatePicker from './DatePicker';
import LocationPicker from './LocationPicker';

interface Wine {
  id: string;
  name: string;
  type: string;
  region: string | null;
  winery?: string | null;
}

interface SavedWineData {
  rating?: number | null;
  date_tried?: string | null;
  location?: string | null;
  user_notes?: string | null;
}

interface SaveWineModalProps {
  visible: boolean;
  wine: Wine;
  existingData?: SavedWineData | null;
  onClose: () => void;
}

export default function SaveWineModal({ 
  visible, 
  wine, 
  existingData, 
  onClose 
}: SaveWineModalProps) {
  const { saveWine } = useWine();
  const [rating, setRating] = useState<number>(0);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [location, setLocation] = useState('');
  const [userNotes, setUserNotes] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (visible && wine) {
      console.log('🍷 SaveWineModal opened for wine:', wine.name);
      
      // Reset or populate form
      if (existingData) {
        setRating(existingData.rating || 0);
        setSelectedDate(existingData.date_tried ? new Date(existingData.date_tried) : new Date());
        setLocation(existingData.location || '');
        setUserNotes(existingData.user_notes || '');
      } else {
        setRating(0);
        setSelectedDate(new Date());
        setLocation('');
        setUserNotes('');
      }
      setErrors({});
      setShowDatePicker(false);
      setShowLocationPicker(false);
    }
  }, [visible, wine, existingData]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (rating === 0) {
      newErrors.rating = 'Please rate this wine (1-5 stars)';
    }
    
    if (selectedDate > new Date()) {
      newErrors.date = 'Date cannot be in the future';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    console.log('🍷 SaveWineModal - handleSave called');
    console.log('Wine:', wine?.name);
    console.log('User Rating:', rating);
    console.log('Date Tried:', selectedDate.toISOString().split('T')[0]);
    console.log('Location:', location);
    console.log('Notes:', userNotes);

    if (!wine?.id) {
      Alert.alert('Error', 'Wine information is missing');
      return;
    }

    if (!validateForm()) {
      console.log('Form validation failed');
      return;
    }

    setLoading(true);

    try {
      const saveData = {
        rating, // This maps to user_rating in Supabase
        date_tried: selectedDate.toISOString().split('T')[0],
        location: location.trim() || null,
        user_notes: userNotes.trim() || null,
      };

      const result = await saveWine(wine.id, saveData);

      if (result?.error) {
        console.error('❌ Save failed:', result.error);
        Alert.alert('Save Failed', result.error);
      } else {
        Alert.alert(
          'Success! 🎉',
          existingData ? 'Wine notes updated!' : 'Wine saved to your library!',
          [{ text: 'OK', onPress: onClose }]
        );
      }
    } catch (error: any) {
      console.error('❌ Save error:', error);
      Alert.alert('Error', `Failed to save: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };


  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setShowDatePicker(false);
    if (errors.date) {
      setErrors(prev => ({ ...prev, date: '' }));
    }
  };

  const handleLocationSelect = (selectedLocation: string) => {
    setLocation(selectedLocation);
    setShowLocationPicker(false);
  };

  const renderStars = () => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => {
              setRating(star === rating ? 0 : star);
              if (errors.rating) {
                setErrors(prev => ({ ...prev, rating: '' }));
              }
            }}
            style={styles.starButton}
          >
            <Star
              size={32}
              color="#D4AF37"
              fill={star <= rating ? '#D4AF37' : 'none'}
            />
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const isFormValid = () => rating > 0;

  const formatDisplayDate = (date: Date) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric',
        year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
      });
    }
  };

  if (!visible) {
    return null;
  }

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {existingData ? 'Update Wine Notes' : 'Save Wine'}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color="#722F37" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            {/* Wine Info */}
            <View style={styles.wineInfo}>
              <Text style={styles.wineName}>{wine?.name || 'Wine'}</Text>
              {wine && (
                <Text style={styles.wineDetails}>
                  {`${wine.type ?? ''}${wine.region ? `, ${wine.region}` : ''}${wine.winery ? `, ${wine.winery}` : ''}`}
                </Text>
              )}
            </View>
            {/* Rating - REQUIRED */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Star size={20} color="#722F37" />
                <Text style={styles.sectionTitle}>Your Rating *</Text>
              </View>
              {renderStars()}
              <Text style={[styles.ratingText, errors.rating && styles.errorText]}>
                {errors.rating || (rating > 0 ? `${rating} star${rating !== 1 ? 's' : ''}` : 'Tap stars to rate (required)')}
              </Text>
            </View>

            {/* Date - REQUIRED */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Calendar size={20} color="#722F37" />
                <Text style={styles.sectionTitle}>Date Tried *</Text>
              </View>
              
              <TouchableOpacity
                style={[styles.inputButton, errors.date && styles.inputError]}
                onPress={() => setShowDatePicker(true)}
              >
                <View style={styles.inputButtonContent}>
                  <Text style={styles.inputButtonText}>
                    {formatDisplayDate(selectedDate)}
                  </Text>
                  <Text style={styles.inputButtonSubtext}>
                    {selectedDate.toLocaleDateString()}
                  </Text>
                </View>
                <Calendar size={20} color="#722F37" />
              </TouchableOpacity>

              {errors.date && (
                <Text style={styles.errorText}>{errors.date}</Text>
              )}
            </View>

            {/* Location - OPTIONAL */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <MapPin size={20} color="#722F37" />
                <Text style={styles.sectionTitle}>Location (Optional)</Text>
              </View>
              
              <TouchableOpacity
                style={styles.inputButton}
                onPress={() => setShowLocationPicker(true)}
              >
                <View style={styles.inputButtonContent}>
                  <Text style={[
                    styles.inputButtonText,
                    !location && styles.inputPlaceholder
                  ]}>
                    {location || 'Where did you try this wine?'}
                  </Text>
                  {location && (
                    <Text style={styles.inputButtonSubtext}>Tap to change location</Text>
                  )}
                </View>
                <MapPin size={20} color="#722F37" />
              </TouchableOpacity>
            </View>

            {/* Notes - OPTIONAL */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <FileText size={20} color="#722F37" />
                <Text style={styles.sectionTitle}>Tasting Notes (Optional)</Text>
              </View>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={userNotes}
                onChangeText={setUserNotes}
                placeholder="Share your thoughts about this wine..."
                placeholderTextColor="#8B5A5F"
                multiline
                numberOfLines={4}
                maxLength={500}
                textAlignVertical="top"
              />
              <Text style={styles.characterCount}>
                {userNotes.length}/500
              </Text>
            </View>
          </ScrollView>

          {/* Save Button */}
          <TouchableOpacity
            style={[
              styles.saveButton, 
              loading && styles.saveButtonDisabled,
              !isFormValid() && styles.saveButtonInvalid
            ]}
            onPress={handleSave}
            disabled={loading || !isFormValid()}
          >
            <Text style={styles.saveButtonText}>
              {loading 
                ? 'Saving...' 
                : (existingData ? 'Update Notes' : 'Save to Library')
              }
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Date Picker */}
      {showDatePicker && (
        <DatePicker
          visible={showDatePicker}
          date={selectedDate}
          onDateChange={handleDateSelect}
          onClose={() => setShowDatePicker(false)}
        />
      )}

      {/* Location Picker */}
      {showLocationPicker && (
        <LocationPicker
          visible={showLocationPicker}
          onLocationSelect={handleLocationSelect}
          onClose={() => setShowLocationPicker(false)}
          currentLocation={location}
        />
      )}
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#722F37',
  },
  closeButton: {
    padding: 4,
  },
  modalBody: {
    flex: 1,
    padding: 20,
  },
  wineInfo: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  wineName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#722F37',
    marginBottom: 4,
  },
  wineDetails: {
    fontSize: 14,
    color: '#8B5A5F',
    textTransform: 'capitalize',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#722F37',
    marginLeft: 8,
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 8,
  },
  starButton: {
    padding: 4,
    marginHorizontal: 2,
  },
  ratingText: {
    fontSize: 14,
    color: '#8B5A5F',
    textAlign: 'center',
  },
  inputButton: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  inputButtonContent: {
    flex: 1,
  },
  inputButtonText: {
    fontSize: 16,
    color: '#722F37',
    fontWeight: '500',
  },
  inputPlaceholder: {
    color: '#8B5A5F',
    fontWeight: 'normal',
  },
  inputButtonSubtext: {
    fontSize: 12,
    color: '#8B5A5F',
    marginTop: 4,
    fontStyle: 'italic',
  },
  textInput: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    fontSize: 16,
    color: '#333',
  },
  textArea: {
    height: 120,
    marginBottom: 8,
  },
  characterCount: {
    fontSize: 12,
    color: '#8B5A5F',
    textAlign: 'right',
  },
  inputError: {
    borderColor: '#DC3545',
  },
  errorText: {
    fontSize: 12,
    color: '#DC3545',
    marginTop: 4,
  },
  saveButton: {
    backgroundColor: '#722F37',
    margin: 20,
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonInvalid: {
    backgroundColor: '#CCC',
  },
  saveButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
});