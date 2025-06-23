import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Image,
  Linking,
} from 'react-native';
import { Search, Filter, X, ArrowUpDown } from 'lucide-react-native';
import { Wine } from '@/types/wine';
import { wineService } from '@/services/wineService';
import WineCard from '@/components/WineCard';
import { router } from 'expo-router';

export default function WineCollectionScreen() {
  const [wines, setWines] = useState<Wine[]>([]);
  const [filteredWines, setFilteredWines] = useState<Wine[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<'all' | 'red' | 'white'>('all');
  const [minRating, setMinRating] = useState<number>(0);
  const [sortBy, setSortBy] = useState<'name' | 'price_asc' | 'price_desc' | 'rating'>('name');
  const [showFilters, setShowFilters] = useState(false);
  const [showSortOptions, setShowSortOptions] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadWines();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [wines, searchQuery, selectedType, minRating, sortBy]);

  const loadWines = async () => {
    try {
      const allWines = await wineService.getAllWines();
      setWines(allWines);
    } catch (error) {
      console.error('Error loading wines:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = async () => {
    let filtered = wines;

    if (searchQuery) {
      filtered = await wineService.searchWines(searchQuery);
    }

    if (selectedType !== 'all') {
      filtered = filtered.filter(wine => wine.type === selectedType);
    }

    if (minRating > 0) {
      filtered = filtered.filter(wine => wine.rating >= minRating);
    }

    // Apply sorting
    filtered = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'price_asc':
          return a.price - b.price;
        case 'price_desc':
          return b.price - a.price;
        case 'rating':
          return b.rating - a.rating;
        case 'name':
        default:
          return a.name.localeCompare(b.name);
      }
    });

    setFilteredWines(filtered);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedType('all');
    setMinRating(0);
    setSortBy('name');
    setShowFilters(false);
  };

  const handleWinePress = (wine: Wine) => {
    router.push({
      pathname: '/wine-details',
      params: { wineId: wine.id }
    });
  };

  const handleWineSaved = async (wine: Wine) => {
    // Refresh the wine list to update saved states
    await loadWines();
  };

  const handleBoltPress = () => {
    Linking.openURL('https://bolt.new/');
  };

  const renderWineCard = ({ item }: { item: Wine }) => (
    <WineCard 
      wine={item} 
      onPress={() => handleWinePress(item)} 
      onSave={handleWineSaved}
    />
  );

  const sortOptions = [
    { key: 'name', label: 'Name (A-Z)' },
    { key: 'price_asc', label: 'Price: Low to High' },
    { key: 'price_desc', label: 'Price: High to Low' },
    { key: 'rating', label: 'Rating: High to Low' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.titleSection}>
            <Text style={styles.title}>Wine Collection</Text>
            <Text style={styles.subtitle}>Discover premium wines from around the world</Text>
          </View>
          
          {/* Bolt.new Badge */}
          <TouchableOpacity style={styles.boltBadge} onPress={handleBoltPress}>
            <Image 
              source={require('@/assets/images/white_circle_360x360.png')}
              style={styles.boltImage}
              resizeMode="contain"
            />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Search size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search wines, wineries, regions..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#999"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <X size={20} color="#666" />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          style={[styles.filterButton, showFilters && styles.filterButtonActive]}
          onPress={() => setShowFilters(!showFilters)}
        >
          <Filter size={20} color={showFilters ? '#FFFFFF' : '#722F37'} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterButton, showSortOptions && styles.filterButtonActive]}
          onPress={() => setShowSortOptions(!showSortOptions)}
        >
          <ArrowUpDown size={20} color={showSortOptions ? '#FFFFFF' : '#722F37'} />
        </TouchableOpacity>
      </View>

      {showSortOptions && (
        <View style={styles.sortContainer}>
          <Text style={styles.sortTitle}>Sort by:</Text>
          <View style={styles.sortOptions}>
            {sortOptions.map((option) => (
              <TouchableOpacity
                key={option.key}
                style={[
                  styles.sortOption,
                  sortBy === option.key && styles.sortOptionActive,
                ]}
                onPress={() => {
                  setSortBy(option.key as any);
                  setShowSortOptions(false);
                }}
              >
                <Text
                  style={[
                    styles.sortOptionText,
                    sortBy === option.key && styles.sortOptionTextActive,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {showFilters && (
        <View style={styles.filtersContainer}>
          <View style={styles.filterRow}>
            <Text style={styles.filterLabel}>Type:</Text>
            <View style={styles.typeFilters}>
              {['all', 'red', 'white'].map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.typeFilter,
                    selectedType === type && styles.typeFilterActive,
                  ]}
                  onPress={() => setSelectedType(type as 'all' | 'red' | 'white')}
                >
                  <Text
                    style={[
                      styles.typeFilterText,
                      selectedType === type && styles.typeFilterTextActive,
                    ]}
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.filterRow}>
            <Text style={styles.filterLabel}>Min Rating:</Text>
            <View style={styles.ratingFilters}>
              {[0, 3, 4, 4.5].map((rating) => (
                <TouchableOpacity
                  key={rating}
                  style={[
                    styles.ratingFilter,
                    minRating === rating && styles.ratingFilterActive,
                  ]}
                  onPress={() => setMinRating(rating)}
                >
                  <Text
                    style={[
                      styles.ratingFilterText,
                      minRating === rating && styles.ratingFilterTextActive,
                    ]}
                  >
                    {rating === 0 ? 'Any' : `${rating}+`}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <TouchableOpacity style={styles.clearFiltersButton} onPress={clearFilters}>
            <Text style={styles.clearFiltersText}>Clear Filters</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.resultsHeader}>
        <Text style={styles.resultsCount}>
          {filteredWines.length} wine{filteredWines.length !== 1 ? 's' : ''}
        </Text>
        <Text style={styles.sortIndicator}>
          Sorted by: {sortOptions.find(opt => opt.key === sortBy)?.label}
        </Text>
      </View>

      <FlatList
        data={filteredWines}
        renderItem={renderWineCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
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
    paddingTop: 20,
    paddingBottom: 16,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  titleSection: {
    flex: 1,
  },
  title: {
    fontSize: 32,
    fontFamily: 'PlayfairDisplay-Bold',
    color: '#722F37',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    lineHeight: 22,
  },
  boltBadge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginLeft: 16,
  },
  boltImage: {
    width: 50,
    height: 50,
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 16,
    gap: 12,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
    color: '#333',
  },
  filterButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  filterButtonActive: {
    backgroundColor: '#722F37',
  },
  sortContainer: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sortTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  sortOptions: {
    gap: 8,
  },
  sortOption: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#F8F8F8',
  },
  sortOptionActive: {
    backgroundColor: '#722F37',
  },
  sortOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  sortOptionTextActive: {
    color: '#FFFFFF',
  },
  filtersContainer: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  filterRow: {
    marginBottom: 16,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  typeFilters: {
    flexDirection: 'row',
    gap: 8,
  },
  typeFilter: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    backgroundColor: '#FFFFFF',
  },
  typeFilterActive: {
    backgroundColor: '#722F37',
    borderColor: '#722F37',
  },
  typeFilterText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  typeFilterTextActive: {
    color: '#FFFFFF',
  },
  ratingFilters: {
    flexDirection: 'row',
    gap: 8,
  },
  ratingFilter: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    backgroundColor: '#FFFFFF',
  },
  ratingFilterActive: {
    backgroundColor: '#722F37',
    borderColor: '#722F37',
  },
  ratingFilterText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  ratingFilterTextActive: {
    color: '#FFFFFF',
  },
  clearFiltersButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  clearFiltersText: {
    fontSize: 14,
    color: '#722F37',
    fontWeight: '600',
  },
  resultsHeader: {
    paddingHorizontal: 20,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  resultsCount: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  sortIndicator: {
    fontSize: 14,
    color: '#999',
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
});