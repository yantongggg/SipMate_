import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  SafeAreaView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { X, Star } from 'lucide-react-native';
import { Wine } from '@/types/wine';
import DatePicker from './DatePicker';

interface SaveWineModalProps {
  visible: boolean;
  wine: Wine | null;
  onClose: () => void;
  onSave: (wineData: {
    wine: Wine;
    userRating: number;
    userNotes?: string;
    dateTried: string;
  }) => Promise<void>;
}

export default function SaveWineModal({ visible, wine, onClose, onSave }: SaveWineModalProps) {
  const [userRating, setUserRating] = useState<number>(0);
  const [userNotes, setUserNotes] = useState('');
  const [dateTried, setDateTried] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const resetForm = () => {
    setUserRating(0);
    setUserNotes('');
    setDateTried('');
  };

  const validateForm = () => {
    if (userRating === 0) {
      Alert.alert('Rating Required', 'Please provide a rating for this wine (1-5 stars)');
      return false;
    }
    
    if (!dateTried.trim()) {
      Alert.alert('Date Required', 'Please select the date you tried this wine');
      return false;
    }
    
    return true;
  };

  const handleSave = async () => {
    if (!wine) return;

    if (!validateForm()) return;

    setIsLoading(true);
    try {
      await onSave({
        wine,
        userRating,
        userNotes: userNotes.trim() || undefined,
        dateTried,
      });
      
      resetForm();
      onClose();
      Alert.alert('Success', `${wine.name} saved to your library!`);
    } catch (error) {
      Alert.alert('Error', 'Failed to save wine. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const renderStarRating = () => {
    return (
      <View style={styles.ratingContainer}>
        <Text style={styles.ratingLabel}>Your Rating *</Text>
        <View style={styles.starsContainer}>
          {[1, 2, 3, 4, 5].map((star) => (
            <TouchableOpacity
              key={star}
              onPress={() => setUserRating(star)}
              style={styles.starButton}
            >
              <Star
                size={32}
                color={star <= userRating ? '#D4AF37' : '#E5E5E5'}
                fill={star <= userRating ? '#D4AF37' : 'transparent'}
              />
            </TouchableOpacity>
          ))}
        </View>
        {userRating > 0 ? (
          <Text style={styles.ratingText}>{userRating}/5 stars</Text>
        ) : (
          <Text style={styles.requiredText}>Please rate this wine</Text>
        )}
      </View>
    );
  };

  if (!wine) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <SafeAreaView style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={handleClose}>
              <X size={24} color="#666" />
            </TouchableOpacity>
            <Text style={styles.title}>Save Wine</Text>
            <TouchableOpacity
              onPress={handleSave}
              disabled={isLoading || userRating === 0 || !dateTried}
              style={[
                styles.saveButton, 
                (isLoading || userRating === 0 || !dateTried) && styles.saveButtonDisabled
              ]}
            >
              <Text style={[
                styles.saveButtonText, 
                (isLoading || userRating === 0 || !dateTried) && styles.saveButtonTextDisabled
              ]}>
                {isLoading ? 'Saving...' : 'Save'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            <View style={styles.wineInfo}>
              <Text style={styles.wineName}>{wine.name}</Text>
              <Text style={styles.winery}>{wine.winery}</Text>
              <Text style={styles.region}>{wine.region}</Text>
            </View>

            {renderStarRating()}

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Date Tried *</Text>
              <DatePicker
                value={dateTried}
                onDateSelect={setDateTried}
                placeholder="When did you try this wine?"
              />
              {!dateTried && (
                <Text style={styles.requiredText}>Please select the date you tried this wine</Text>
              )}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Tasting Notes (Optional)</Text>
              <TextInput
                style={styles.notesInput}
                value={userNotes}
                onChangeText={setUserNotes}
                placeholder="Share your thoughts about this wine..."
                placeholderTextColor="#999"
                multiline
                maxLength={500}
                textAlignVertical="top"
              />
              <Text style={styles.characterCount}>{userNotes.length}/500</Text>
            </View>
          </View>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#722F37',
    borderRadius: 8,
  },
  saveButtonDisabled: {
    backgroundColor: '#E5E5E5',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButtonTextDisabled: {
    color: '#999',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  wineInfo: {
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  wineName: {
    fontSize: 20,
    fontFamily: 'PlayfairDisplay-Bold',
    color: '#333',
    marginBottom: 4,
  },
  winery: {
    fontSize: 16,
    color: '#666',
    marginBottom: 2,
  },
  region: {
    fontSize: 14,
    color: '#888',
  },
  ratingContainer: {
    marginBottom: 24,
  },
  ratingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 8,
  },
  starButton: {
    paddingHorizontal: 4,
  },
  ratingText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  requiredText: {
    fontSize: 12,
    color: '#E53E3E',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  inputContainer: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  notesInput: {
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    minHeight: 100,
    backgroundColor: '#FAFAFA',
  },
  characterCount: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
    marginTop: 4,
  },
});