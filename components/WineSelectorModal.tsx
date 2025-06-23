import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Modal,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { X, Search } from 'lucide-react-native';
import { Wine as WineType } from '@/types/wine';

interface WineSelectorModalProps {
  visible: boolean;
  onClose: () => void;
  wines: WineType[];
  onSelect: (wine: WineType) => void;
  isLoading?: boolean;
  onRetryLoad?: () => void;
}

export default function WineSelectorModal({ 
  visible, 
  onClose, 
  wines, 
  onSelect, 
  isLoading = false,
  onRetryLoad 
}: WineSelectorModalProps) {
  const [query, setQuery] = useState('');

  // DEBUG: Log wines data when modal opens
  useEffect(() => {
    if (visible) {
      console.log('🔍 WineSelectorModal opened with:', {
        winesCount: wines.length,
        isLoading,
        firstWine: wines[0] ? {
          id: wines[0].id,
          name: wines[0].name,
          winery: wines[0].winery,
          region: wines[0].region,
          type: wines[0].type,
          price: wines[0].price
        } : 'No wines',
        sampleWines: wines.slice(0, 3).map(wine => ({
          id: wine.id,
          name: wine.name,
          winery: wine.winery
        }))
      });
    }
  }, [visible, wines, isLoading]);

  // Reset search when modal opens/closes
  useEffect(() => {
    if (!visible) {
      setQuery('');
    }
  }, [visible]);

  // Memoize filtered wines to prevent unnecessary re-renders
  const filteredWines = useMemo(() => {
    console.log('🔍 Filtering wines:', {
      totalWines: wines.length,
      query: query.trim(),
      queryLength: query.length
    });

    if (!query.trim()) {
      console.log('✅ No query, returning all wines:', wines.length);
      return wines;
    }
    
    const searchTerm = query.toLowerCase().trim();
    const filtered = wines.filter(wine => {
      // Add safety checks for undefined values
      const name = wine.name?.toLowerCase() || '';
      const winery = wine.winery?.toLowerCase() || '';
      const region = wine.region?.toLowerCase() || '';
      
      return name.includes(searchTerm) ||
             winery.includes(searchTerm) ||
             region.includes(searchTerm);
    });
    
    console.log('✅ Filtered wines:', {
      searchTerm,
      filteredCount: filtered.length,
      sampleFiltered: filtered.slice(0, 3).map(wine => wine.name)
    });
    
    return filtered;
  }, [wines, query]);

  // Use useCallback to prevent unnecessary re-renders
  const handleWineSelect = useCallback((wine: WineType) => {
    console.log('🍷 Wine selected in modal:', wine.name);
    
    // First update the selection
    onSelect(wine);
    
    // Then close the modal and reset state
    setQuery('');
    onClose();
  }, [onSelect, onClose]);

  const handleClose = useCallback(() => {
    console.log('❌ Closing wine selector modal');
    setQuery('');
    onClose();
  }, [onClose]);

  const handleClearSearch = useCallback(() => {
    setQuery('');
  }, []);

  const renderWineItem = useCallback(({ item, index }: { item: WineType; index: number }) => {
    // DEBUG: Log first few items being rendered
    if (index < 3) {
      console.log(`🍷 Rendering wine item ${index}:`, {
        id: item.id,
        name: item.name,
        winery: item.winery,
        region: item.region,
        price: item.price,
        type: item.type
      });
    }

    return (
      <TouchableOpacity 
        style={styles.wineItem} 
        onPress={() => handleWineSelect(item)}
        activeOpacity={0.7}
      >
        <View style={styles.wineItemContent}>
          <Text style={styles.wineItemName} numberOfLines={2}>
            {item.name || 'Unknown Wine'}
          </Text>
          <Text style={styles.wineItemWinery} numberOfLines={1}>
            {item.winery || 'Unknown Winery'}
          </Text>
          <Text style={styles.wineItemRegion} numberOfLines={1}>
            {item.region || 'Unknown Region'}
          </Text>
          <View style={styles.wineItemDetails}>
            <Text style={styles.wineItemPrice}>
              ${item.price || '0'}
            </Text>
            <View style={[
              styles.wineItemTypeBadge, 
              item.type === 'red' ? styles.redWineBadge : styles.whiteWineBadge
            ]}>
              <Text style={[
                styles.wineItemTypeText,
                item.type === 'red' ? styles.redWineText : styles.whiteWineText
              ]}>
                {item.type ? item.type.charAt(0).toUpperCase() + item.type.slice(1) : 'Wine'}
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  }, [handleWineSelect]);

  const renderEmptyState = () => {
    console.log('📭 Rendering empty state:', {
      hasQuery: !!query,
      queryLength: query.length,
      winesLength: wines.length,
      filteredLength: filteredWines.length
    });

    return (
      <View style={styles.emptyContainer}>
        {query ? (
          <>
            <Text style={styles.emptyTitle}>No wines found</Text>
            <Text style={styles.emptyText}>
              Try adjusting your search terms or browse all wines
            </Text>
            <Text style={styles.debugText}>
              Searched for: "{query}" in {wines.length} wines
            </Text>
            <TouchableOpacity 
              style={styles.clearSearchButton} 
              onPress={handleClearSearch}
            >
              <Text style={styles.clearSearchButtonText}>Clear Search</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={styles.emptyTitle}>No wines available</Text>
            <Text style={styles.emptyText}>
              Unable to load wines from the database
            </Text>
            <Text style={styles.debugText}>
              Total wines: {wines.length}, Loading: {isLoading ? 'Yes' : 'No'}
            </Text>
            {onRetryLoad && (
              <TouchableOpacity style={styles.retryButton} onPress={onRetryLoad}>
                <Text style={styles.retryButtonText}>Retry Loading</Text>
              </TouchableOpacity>
            )}
          </>
        )}
      </View>
    );
  };

  const renderLoadingState = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#722F37" />
      <Text style={styles.loadingText}>Loading wines...</Text>
    </View>
  );

  const keyExtractor = useCallback((item: WineType, index: number) => {
    // Ensure we have a unique key
    return item.id || `wine-${index}`;
  }, []);

  const getItemLayout = useCallback((data: any, index: number) => ({
    length: 100, // Approximate height of each item
    offset: 100 * index,
    index,
  }), []);

  // DEBUG: Log render decision
  console.log('🎨 WineSelectorModal render decision:', {
    visible,
    isLoading,
    winesCount: wines.length,
    filteredCount: filteredWines.length,
    query
  });

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <SafeAreaView style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <X size={24} color="#666" />
            </TouchableOpacity>
            <Text style={styles.title}>Select a Wine</Text>
            <View style={styles.placeholder} />
          </View>

          <View style={styles.searchContainer}>
            <Search size={20} color="#666" />
            <TextInput
              style={styles.searchInput}
              value={query}
              onChangeText={setQuery}
              placeholder="Search wines by name, winery, or region..."
              placeholderTextColor="#999"
              autoCorrect={false}
              autoCapitalize="none"
              returnKeyType="search"
              clearButtonMode="while-editing"
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={handleClearSearch} style={styles.clearButton}>
                <X size={20} color="#666" />
              </TouchableOpacity>
            )}
          </View>

          {/* DEBUG: Show current state */}
          <View style={styles.debugContainer}>
            <Text style={styles.debugText}>
              {isLoading 
                ? 'Loading wine list...'
                : `Currently showing: ${filteredWines.length} of ${wines.length} wines`}
            </Text>
          </View>

          {isLoading ? (
            renderLoadingState()
          ) : (
            <FlatList
              data={filteredWines}
              renderItem={renderWineItem}
              keyExtractor={keyExtractor}
              style={styles.wineList}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              ListEmptyComponent={renderEmptyState}
              contentContainerStyle={filteredWines.length === 0 ? styles.emptyListContainer : styles.listContentContainer}
              removeClippedSubviews={false} // Disable for debugging
              maxToRenderPerBatch={20}
              windowSize={10}
              initialNumToRender={15}
              updateCellsBatchingPeriod={50}
              onLayout={() => console.log('📐 FlatList layout complete')}
              onContentSizeChange={(width, height) => 
                console.log('📏 FlatList content size:', { width, height })
              }
            />
          )}

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              {isLoading 
                ? 'Loading...' 
                : `${filteredWines.length} wine${filteredWines.length !== 1 ? 's' : ''} ${query ? 'found' : 'available'}`
              }
            </Text>
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
  closeButton: {
    padding: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  placeholder: {
    width: 32, // Same width as close button for balance
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
  },
  clearButton: {
    padding: 4,
  },
  // DEBUG: Add debug container
  debugContainer: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: '#FFF3CD',
    borderWidth: 1,
    borderColor: '#FFEAA7',
    marginHorizontal: 20,
    marginBottom: 8,
    borderRadius: 4,
  },
  debugText: {
    fontSize: 12,
    color: '#856404',
    textAlign: 'center',
  },
  wineList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  listContentContainer: {
    paddingBottom: 20,
  },
  emptyListContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  wineItem: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    backgroundColor: '#FFFFFF', // Ensure background
  },
  wineItemContent: {
    flex: 1,
  },
  wineItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  wineItemWinery: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  wineItemRegion: {
    fontSize: 12,
    color: '#888',
    marginBottom: 8,
  },
  wineItemDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  wineItemPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#722F37',
  },
  wineItemTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  redWineBadge: {
    backgroundColor: '#FFF5F5',
    borderColor: '#722F37',
  },
  whiteWineBadge: {
    backgroundColor: '#FFFBF0',
    borderColor: '#D4AF37',
  },
  wineItemTypeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  redWineText: {
    color: '#722F37',
  },
  whiteWineText: {
    color: '#D4AF37',
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  clearSearchButton: {
    backgroundColor: '#F5F5DC',
    borderWidth: 1,
    borderColor: '#722F37',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 16,
  },
  clearSearchButtonText: {
    color: '#722F37',
    fontSize: 14,
    fontWeight: '600',
  },
  retryButton: {
    backgroundColor: '#722F37',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    backgroundColor: '#F8F8F8',
  },
  footerText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});