import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  Modal,
  Image,
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Search, Filter, SlidersHorizontal } from 'lucide-react-native';
import { useWine } from '@/contexts/WineContext';
import WineCard from '@/components/WineCard';
import { Database } from '@/lib/supabase';

type Wine = Database['public']['Tables']['wines']['Row'];

const WINE_TYPES = ['all', 'red', 'white'];

const SORT_OPTIONS = [
  { label: 'Name A-Z', value: 'name_asc' },
  { label: 'Name Z-A', value: 'name_desc' },
  { label: 'Rating (High to Low)', value: 'rating_desc' },
  { label: 'Rating (Low to High)', value: 'rating_asc' },
  { label: 'Price (Low to High)', value: 'price_asc' },
  { label: 'Price (High to Low)', value: 'price_desc' },
  { label: 'Type', value: 'type' },
];

export default function CollectionScreen() {
  const { wines, loading } = useWine();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [sortBy, setSortBy] = useState('name_asc');
  const [showFilters, setShowFilters] = useState(false);

  const handleSortChange = (newSortValue: string) => {
    console.log('=== SORTING DEBUG ===');
    console.log('Previous sort:', sortBy);
    console.log('New sort:', newSortValue);
    console.log('Wines count before sort:', wines.length);
    
    setShowFilters(false);
    setSortBy(newSortValue);
    
    console.log('Sort state updated to:', newSortValue);
  };

  const handleTypeChange = (newType: string) => {
    console.log('=== TYPE FILTER DEBUG ===');
    console.log('Previous type:', selectedType);
    console.log('New type:', newType);
    
    setSelectedType(newType);
    
    console.log('Type filter updated to:', newType);
  };

  const filteredAndSortedWines = useMemo(() => {
    console.log('=== FILTERING AND SORTING ===');
    console.log('Total wines:', wines.length);
    console.log('Search query:', searchQuery);
    console.log('Selected type:', selectedType);
    console.log('Sort by:', sortBy);

    let filtered = [...wines];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(wine =>
        wine.name.toLowerCase().includes(query) ||
        wine.winery?.toLowerCase().includes(query) ||
        wine.region?.toLowerCase().includes(query) ||
        wine.type.toLowerCase().includes(query) ||
        wine.food_pairing?.toLowerCase().includes(query)
      );
      console.log('After search filter:', filtered.length);
    }

    // Apply type filter
    if (selectedType !== 'all') {
      filtered = filtered.filter(wine => wine.type === selectedType);
      console.log('After type filter:', filtered.length);
    }

    // Apply sorting
    const sorted = filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name_asc':
          return a.name.localeCompare(b.name);
        case 'name_desc':
          return b.name.localeCompare(a.name);
        case 'rating_desc':
          return (b.rating || 0) - (a.rating || 0);
        case 'rating_asc':
          return (a.rating || 0) - (b.rating || 0);
        case 'price_desc':
          return (b.price || 0) - (a.price || 0);
        case 'price_asc':
          return (a.price || 0) - (b.price || 0);
        case 'type':
          return a.type.localeCompare(b.type);
        default:
          return 0;
      }
    });

    console.log('After sorting:', sorted.length);
    return sorted;
  }, [wines, searchQuery, selectedType, sortBy]);

  const renderWineCard = ({ item }: { item: Wine }) => (
    <WineCard wine={item} />
  );

  const handleBoltLogoPress = async () => {
    try {
      await Linking.openURL('https://bolt.new/');
    } catch (error) {
      console.error('Failed to open Bolt URL:', error);
    }
  };

  const FilterModal = () => (
    <Modal 
      visible={showFilters} 
      transparent 
      animationType="slide"
      onRequestClose={() => setShowFilters(false)}
    >
      <TouchableOpacity 
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={() => {
          console.log('Modal overlay pressed - closing');
          setShowFilters(false);
        }}
      >
        <TouchableOpacity 
          style={styles.modalContent}
          activeOpacity={1}
          onPress={(e) => e.stopPropagation()}
        >
          <Text style={styles.modalTitle}>Filter & Sort</Text>
          
          <Text style={styles.sectionTitle}>Wine Type</Text>
          <View style={styles.typeContainer}>
            {WINE_TYPES.map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.typeButton,
                  selectedType === type && styles.typeButtonActive
                ]}
                onPress={() => {
                  console.log('Type button pressed:', type);
                  handleTypeChange(type);
                }}
              >
                <Text style={[
                  styles.typeButtonText,
                  selectedType === type && styles.typeButtonTextActive
                ]}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.sectionTitle}>Sort By</Text>
          {SORT_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.sortOption,
                sortBy === option.value && styles.sortOptionActive
              ]}
              onPress={() => {
                console.log('Sort option pressed:', option.value, option.label);
                handleSortChange(option.value);
              }}
            >
              <Text style={[
                styles.sortOptionText,
                sortBy === option.value && styles.sortOptionTextActive
              ]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}

          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => {
              console.log('Apply Filters pressed - closing modal');
              setShowFilters(false);
            }}
          >
            <Text style={styles.closeButtonText}>Apply Filters</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#722F37', '#8B4B47']}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Wine Collection</Text>
        <Text style={styles.headerSubtitle}>Discover exceptional wines</Text>
      </LinearGradient>

      {/* Bolt Logo Button */}
      <TouchableOpacity
        style={styles.boltLogoButton}
        onPress={handleBoltLogoPress}
        activeOpacity={0.8}
      >
        <Image
          source={require('@/assets/images/bolt_logo.png')}
          style={styles.boltLogo}
          resizeMode="contain"
        />
      </TouchableOpacity>

      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Search size={20} color="#8B5A5F" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search wines, wineries, regions..."
            placeholderTextColor="#8B5A5F"
            value={searchQuery}
            onChangeText={(text) => {
              console.log('Search query changed:', text);
              setSearchQuery(text);
            }}
          />
        </View>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => {
            console.log('Filter button pressed - opening modal');
            setShowFilters(true);
          }}
        >
          <SlidersHorizontal size={20} color="#722F37" />
        </TouchableOpacity>
      </View>

      <View style={styles.resultsHeader}>
        <Text style={styles.resultsCount}>
          {filteredAndSortedWines.length} wine{filteredAndSortedWines.length !== 1 ? 's' : ''}
        </Text>
        {selectedType !== 'all' && (
          <Text style={styles.activeFilter}>
            Filtered by: {selectedType}
          </Text>
        )}
        <Text style={styles.sortIndicator}>
          Sorted by: {SORT_OPTIONS.find(opt => opt.value === sortBy)?.label || sortBy}
        </Text>
      </View>

      <FlatList
        data={filteredAndSortedWines}
        renderItem={renderWineCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.wineList}
        showsVerticalScrollIndicator={false}
        refreshing={loading}
        onRefresh={() => {
          console.log('Pull to refresh triggered');
        }}
        numColumns={2}
        ItemSeparatorComponent={() => <View style={{ height: 0 }} />}
        extraData={`${sortBy}-${selectedType}-${searchQuery}`}
      />

      <FilterModal />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5DC',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 30,
    paddingTop: 50,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#F5F5DC',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#F5F5DC',
    opacity: 0.9,
  },
  boltLogoButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 1000,
  },
  boltLogo: {
    width: 32,
    height: 32,
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 15,
    alignItems: 'center',
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
    marginRight: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  filterButton: {
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  resultsHeader: {
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  resultsCount: {
    fontSize: 14,
    color: '#8B5A5F',
    fontWeight: '500',
  },
  activeFilter: {
    fontSize: 12,
    color: '#722F37',
    marginTop: 2,
    fontStyle: 'italic',
  },
  sortIndicator: {
    fontSize: 12,
    color: '#D4AF37',
    marginTop: 2,
    fontStyle: 'italic',
  },
  wineList: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#722F37',
    marginBottom: 20,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#722F37',
    marginTop: 20,
    marginBottom: 10,
  },
  typeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  typeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#D4AF37',
  },
  typeButtonActive: {
    backgroundColor: '#D4AF37',
  },
  typeButtonText: {
    fontSize: 14,
    color: '#722F37',
  },
  typeButtonTextActive: {
    color: 'white',
  },
  sortOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  sortOptionActive: {
    backgroundColor: '#722F37',
  },
  sortOptionText: {
    fontSize: 16,
    color: '#722F37',
  },
  sortOptionTextActive: {
    color: 'white',
  },
  closeButton: {
    backgroundColor: '#722F37',
    paddingVertical: 15,
    borderRadius: 12,
    marginTop: 20,
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
});