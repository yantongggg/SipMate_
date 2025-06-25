import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  Dimensions,
} from 'react-native';
import { MapPin, X, Search, Navigation, Home } from 'lucide-react-native';

// Fixed interface to match your usage
interface LocationPickerProps {
  visible: boolean;
  onLocationSelect: (location: string) => void;
  onClose: () => void;
  currentLocation?: string;
}

interface LocationSuggestion {
  address: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  type: 'current' | 'search' | 'popular' | 'recent';
}

export default function LocationPicker({ 
  visible, 
  onLocationSelect, 
  onClose, 
  currentLocation = '' 
}: LocationPickerProps) {
  const [searchText, setSearchText] = useState('');
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);

  // Debug logs
  useEffect(() => {
    console.log('🗺️ LocationPicker mounted/updated');
    console.log('Visible:', visible);
    console.log('Current location:', currentLocation);
    console.log('onLocationSelect type:', typeof onLocationSelect);
    console.log('onClose type:', typeof onClose);
  }, [visible, currentLocation, onLocationSelect, onClose]);

  // Popular wine-related locations
  const popularLocations: LocationSuggestion[] = [
    { address: 'At Home', type: 'popular' },
    { address: 'Local Restaurant', type: 'popular' },
    { address: 'Wine Bar', type: 'popular' },
    { address: 'Fine Dining Restaurant', type: 'popular' },
    { address: 'Friend\'s House', type: 'popular' },
    { address: 'Wine Shop', type: 'popular' },
    { address: 'Hotel Restaurant', type: 'popular' },
    { address: 'Rooftop Bar', type: 'popular' },
    { address: 'Private Event', type: 'popular' },
    { address: 'Wine Tasting Event', type: 'popular' },
    { address: 'Business Dinner', type: 'popular' },
    { address: 'Date Night Restaurant', type: 'popular' },
  ];

  // Simulated recent locations
  const recentLocations: LocationSuggestion[] = [
    { address: 'The Ritz Carlton Restaurant, Kuala Lumpur', type: 'recent' },
    { address: 'Marini\'s on 57, KLCC', type: 'recent' },
    { address: 'Fuego at Troika Sky Dining', type: 'recent' },
    { address: 'Home', type: 'recent' },
    { address: 'Sage Restaurant & Wine Bar', type: 'recent' },
  ];

  useEffect(() => {
    if (visible) {
      console.log('🗺️ LocationPicker opened - resetting state');
      // Reset search when modal opens
      setSearchText('');
      setSuggestions([]);
      
      // Get user's current location
      getCurrentLocation();
    }
  }, [visible]);

  const getCurrentLocation = async () => {
    try {
      console.log('🗺️ Getting current location...');
      // In a real app, you would use expo-location or react-native-geolocation
      // For now, we'll simulate getting location for Shah Alam, Malaysia
      const mockLocation = {
        lat: 3.0733,
        lng: 101.5185
      };
      setUserLocation(mockLocation);
      
      // Add current location to suggestions
      const currentLocationSuggestion: LocationSuggestion = {
        address: 'Shah Alam, Selangor, Malaysia (Current Location)',
        coordinates: mockLocation,
        type: 'current'
      };
      
      setSuggestions(prev => {
        console.log('🗺️ Adding current location to suggestions');
        return [currentLocationSuggestion, ...prev];
      });
    } catch (error) {
      console.log('🗺️ Could not get current location:', error);
    }
  };

  const searchLocations = async (query: string) => {
    if (query.length < 2) {
      setSuggestions([]);
      return;
    }

    console.log('🗺️ Searching locations for:', query);
    setLoading(true);
    
    try {
      // Simulate API call to geocoding service
      const mockResults: LocationSuggestion[] = [
        {
          address: `${query}, Shah Alam, Selangor, Malaysia`,
          coordinates: { lat: 3.0733, lng: 101.5185 },
          type: 'search'
        },
        {
          address: `${query}, Kuala Lumpur, Malaysia`,
          coordinates: { lat: 3.1390, lng: 101.6869 },
          type: 'search'
        },
        {
          address: `${query}, Petaling Jaya, Selangor, Malaysia`,
          coordinates: { lat: 3.1073, lng: 101.6135 },
          type: 'search'
        },
      ];

      // Filter popular locations that match search
      const filteredPopular = popularLocations.filter(loc =>
        loc.address.toLowerCase().includes(query.toLowerCase())
      ).map(loc => ({ ...loc, type: 'popular' as const }));

      // Combine results
      const allResults = [...mockResults, ...filteredPopular];
      setSuggestions(allResults);
      
      console.log('🗺️ Search results:', allResults.length, 'locations found');
      
    } catch (error) {
      console.error('🗺️ Location search error:', error);
      Alert.alert('Error', 'Could not search locations. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchText.trim()) {
        searchLocations(searchText);
      } else {
        // Show recent and popular when not searching
        setSuggestions([]);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchText]);

  const handleLocationSelect = (location: LocationSuggestion) => {
    console.log('🗺️ Location selected:', location.address);
    console.log('🗺️ Calling onLocationSelect...');
    
    try {
      onLocationSelect(location.address);
      console.log('🗺️ onLocationSelect called successfully');
    } catch (error) {
      console.error('🗺️ Error calling onLocationSelect:', error);
    }
  };

  const handleCustomLocation = () => {
    if (searchText.trim()) {
      console.log('🗺️ Using custom location:', searchText);
      handleLocationSelect({ address: searchText.trim(), type: 'search' });
    }
  };

  const renderLocationItem = (location: LocationSuggestion, index: number) => {
    let iconColor = '#8B5A5F';
    let backgroundColor = '#F8F9FA';
    let Icon = MapPin;

    switch (location.type) {
      case 'current':
        iconColor = '#D4AF37';
        backgroundColor = '#FFF8E1';
        Icon = Navigation;
        break;
      case 'recent':
        iconColor = '#722F37';
        backgroundColor = '#F0E6E8';
        break;
      case 'popular':
        Icon = Home;
        break;
    }

    return (
      <TouchableOpacity
        key={`${location.type}-${index}`}
        style={[styles.locationItem, { backgroundColor }]}
        onPress={() => {
          console.log('🗺️ Location item pressed:', location.address);
          handleLocationSelect(location);
        }}
      >
        <Icon size={20} color={iconColor} />
        <View style={styles.locationTextContainer}>
          <Text style={styles.locationText}>{location.address}</Text>
          {location.type === 'current' && (
            <Text style={styles.locationSubtext}>Tap to use current location</Text>
          )}
          {location.type === 'recent' && (
            <Text style={styles.locationSubtext}>Recently used</Text>
          )}
          {location.type === 'popular' && (
            <Text style={styles.locationSubtext}>Popular choice</Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const showDefaultSuggestions = !searchText.trim() && suggestions.length === 0;

  // Debug render
  console.log('🗺️ LocationPicker rendering, visible:', visible);

  if (!visible) {
    return null;
  }

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <MapPin size={24} color="#722F37" />
              <Text style={styles.title}>Select Location</Text>
            </View>
            <TouchableOpacity 
              onPress={() => {
                console.log('🗺️ Close button pressed');
                onClose();
              }} 
              style={styles.closeButton}
            >
              <X size={24} color="#722F37" />
            </TouchableOpacity>
          </View>

          {/* Search Input */}
          <View style={styles.searchContainer}>
            <View style={styles.searchInputContainer}>
              <Search size={20} color="#8B5A5F" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                value={searchText}
                onChangeText={(text) => {
                  console.log('🗺️ Search text changed:', text);
                  setSearchText(text);
                }}
                placeholder="Search for restaurants, bars, or addresses..."
                placeholderTextColor="#8B5A5F"
                autoCapitalize="words"
                autoCorrect={false}
              />
            </View>
            {searchText.trim() && (
              <TouchableOpacity
                style={styles.useCustomButton}
                onPress={handleCustomLocation}
              >
                <Text style={styles.useCustomButtonText}>Use "{searchText}"</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Results */}
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Current Location (if available) */}
            {userLocation && suggestions.some(s => s.type === 'current') && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Current Location</Text>
                {suggestions
                  .filter(s => s.type === 'current')
                  .map((location, index) => renderLocationItem(location, index))}
              </View>
            )}

            {/* Search Results */}
            {searchText.trim() && suggestions.filter(s => s.type === 'search').length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Search Results</Text>
                {suggestions
                  .filter(s => s.type === 'search')
                  .map((location, index) => renderLocationItem(location, index))}
              </View>
            )}

            {/* Recent Locations */}
            {(!searchText.trim() || showDefaultSuggestions) && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Recent Locations</Text>
                {recentLocations.map((location, index) => 
                  renderLocationItem(location, index)
                )}
              </View>
            )}

            {/* Popular Suggestions */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                {searchText.trim() ? 'Popular Matches' : 'Popular Locations'}
              </Text>
              {(searchText.trim() 
                ? suggestions.filter(s => s.type === 'popular')
                : popularLocations
              ).map((location, index) => renderLocationItem(location, index))}
            </View>

            {/* No Results */}
            {searchText.trim() && suggestions.length === 0 && !loading && (
              <View style={styles.noResults}>
                <MapPin size={48} color="#CCC" />
                <Text style={styles.noResultsText}>No locations found</Text>
                <Text style={styles.noResultsSubtext}>
                  Try adjusting your search or use custom location above
                </Text>
              </View>
            )}

            {loading && (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Searching locations...</Text>
              </View>
            )}
          </ScrollView>

          {/* Map Note */}
          <View style={styles.mapNote}>
            <Text style={styles.mapNoteText}>
              💡 Tip: Use specific restaurant names or addresses for better results
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: height * 0.85,
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#722F37',
    marginLeft: 8,
  },
  closeButton: {
    padding: 4,
  },
  searchContainer: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
  },
  useCustomButton: {
    marginTop: 8,
    backgroundColor: '#722F37',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  useCustomButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  content: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#722F37',
    marginBottom: 12,
  },
  locationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  locationTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  locationText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  locationSubtext: {
    fontSize: 12,
    color: '#8B5A5F',
    marginTop: 2,
  },
  noResults: {
    padding: 40,
    alignItems: 'center',
  },
  noResultsText: {
    fontSize: 18,
    color: '#666',
    fontWeight: '500',
    marginTop: 16,
    marginBottom: 8,
  },
  noResultsSubtext: {
    fontSize: 14,
    color: '#8B5A5F',
    textAlign: 'center',
    marginBottom: 20,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#8B5A5F',
  },
  mapNote: {
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  mapNoteText: {
    fontSize: 12,
    color: '#8B5A5F',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});