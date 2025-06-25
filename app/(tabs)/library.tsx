import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BookOpen, Star, Calendar, MapPin, Trash2, DollarSign } from 'lucide-react-native';
import { useWine } from '@/contexts/WineContext';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'expo-router';

export default function LibraryScreen() {
  const { user } = useAuth();
  const { savedWines, loading, unsaveWine, refreshSavedWines } = useWine();
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshSavedWines();
    setRefreshing(false);
  };

  const handleUnsave = (wineId: string, wineName: string) => {
    Alert.alert(
      'Remove from Library',
      `Are you sure you want to remove "${wineName}" from your library?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            const result = await unsaveWine(wineId);
            if (result.error) {
              Alert.alert('Error', result.error);
            }
          },
        },
      ]
    );
  };

  const handleWinePress = (wineId: string) => {
    router.push({
      pathname: '/wine-details',
      params: { id: wineId }
    });
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'No date recorded';
    return new Date(dateString).toLocaleDateString();
  };

  const renderStars = (rating: number | null) => {
    if (!rating) return null;
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={12}
            color="#D4AF37"
            fill={star <= rating ? '#D4AF37' : 'none'}
          />
        ))}
      </View>
    );
  };

  const renderSavedWine = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.wineCard}
      onPress={() => handleWinePress(item.wine_id)}
    >
      <View style={styles.wineCardContent}>
        <View style={styles.wineInfo}>
          <Text style={styles.wineName} numberOfLines={2}>
            {item.wine.name}
          </Text>

          {(item.wine.type || item.wine.winery) && (
            <View style={styles.wineDetails}>
              <Text style={styles.wineType}>
                {[item.wine.type, item.wine.winery].filter(Boolean).join(' • ')}
              </Text>
            </View>
          )}

          {(item.wine.region || item.wine.year) && (
            <View style={styles.wineDetails}>
              <Text style={styles.wineType}>
                {[item.wine.region, item.wine.year].filter(Boolean).join(' • ')}
              </Text>
            </View>
          )}

          {item.wine.price && (
            <View style={styles.priceRow}>
              <DollarSign size={14} color="#8B5A5F" />
              <Text style={styles.priceText}>${item.wine.price}</Text>
            </View>
          )}

          {item.rating && renderStars(item.rating)}

          <View style={styles.savedDetails}>
            {item.date_tried && (
              <View style={styles.detailRow}>
                <Calendar size={14} color="#8B5A5F" />
                <Text style={styles.detailText}>
                  {formatDate(item.date_tried)}
                </Text>
              </View>
            )}

            {item.location && (
              <View style={styles.detailRow}>
                <MapPin size={14} color="#8B5A5F" />
                <Text style={styles.detailText} numberOfLines={1}>
                  {item.location}
                </Text>
              </View>
            )}
          </View>

          {item.user_notes && (
            <Text style={styles.description} numberOfLines={3}>
              {item.user_notes}
            </Text>
          )}
        </View>

        <TouchableOpacity
          style={styles.unsaveButton}
          onPress={() => handleUnsave(item.wine_id, item.wine.name)}
        >
          <Trash2 size={18} color="#DC3545" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );


  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient
          colors={['#722F37', '#8B4B47']}
          style={styles.header}
        >
          <Text style={styles.headerTitle}>My Wine Library</Text>
          <Text style={styles.headerSubtitle}>Your personal wine collection</Text>
        </LinearGradient>
        
        <View style={styles.emptyContainer}>
          <BookOpen size={64} color="#8B5A5F" />
          <Text style={styles.emptyTitle}>Sign in to view your library</Text>
          <Text style={styles.emptyMessage}>
            Create an account to save wines and build your personal collection
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#722F37', '#8B4B47']}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>My Wine Library</Text>
        <Text style={styles.headerSubtitle}>
          {savedWines.length} wine{savedWines.length !== 1 ? 's' : ''} saved
        </Text>
      </LinearGradient>

      {savedWines.length === 0 ? (
        <View style={styles.emptyContainer}>
          <BookOpen size={64} color="#8B5A5F" />
          <Text style={styles.emptyTitle}>Your library is empty</Text>
          <Text style={styles.emptyMessage}>
            Start exploring wines and save your favorites to build your personal collection
          </Text>
        </View>
      ) : (
        <FlatList
          data={savedWines}
          renderItem={renderSavedWine}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.wineList}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={['#722F37']}
              tintColor="#722F37"
            />
          }
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
    paddingHorizontal: 20,
    paddingVertical: 30,
    paddingTop: 50,
  },
  headerTitle: {
    fontFamily: 'PlayfairDisplay-Bold',
    fontSize: 28,
    color: '#F5F5DC',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontFamily: 'PlayfairDisplay-Regular',
    fontSize: 16,
    color: '#F5F5DC',
    opacity: 0.9,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontFamily: 'PlayfairDisplay-Bold',
    fontSize: 24,
    color: '#722F37',
    marginTop: 20,
    marginBottom: 10,
    textAlign: 'center',
  },
  emptyMessage: {
    fontFamily: 'PlayfairDisplay-Regular',
    fontSize: 16,
    color: '#8B5A5F',
    textAlign: 'center',
    lineHeight: 24,
  },
  wineList: {
    padding: 20,
  },
  wineCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  wineCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  wineInfo: {
    flex: 1,
    marginRight: 12,
  },
  wineName: {
    fontFamily: 'PlayfairDisplay-Bold',
    fontSize: 18,
    color: '#722F37',
    marginBottom: 6,
    lineHeight: 24,
  },
  wineDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  wineType: {
    fontFamily: 'PlayfairDisplay-Regular',
    fontSize: 14,
    color: '#8B5A5F',
    textTransform: 'capitalize',
  },
  wineWinery: {
    fontFamily: 'PlayfairDisplay-Italic',
    fontSize: 14,
    color: '#8B5A5F',
    flex: 1,
  },
  separator: {
    marginHorizontal: 8,
    color: '#8B5A5F',
  },
  wineRegion: {
    fontFamily: 'PlayfairDisplay-Regular',
    fontSize: 14,
    color: '#8B5A5F',
  },
  wineYear: {
    fontFamily: 'PlayfairDisplay-Regular',
    fontSize: 14,
    color: '#8B5A5F',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  priceText: {
    fontFamily: 'PlayfairDisplay-Bold',
    fontSize: 14,
    color: '#8B5A5F',
    marginLeft: 4,
  },
  starsContainer: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  savedDetails: {
    marginBottom: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  detailText: {
    fontFamily: 'PlayfairDisplay-Regular',
    fontSize: 13,
    color: '#8B5A5F',
    marginLeft: 6,
    flex: 1,
  },
  description: {
    fontFamily: 'PlayfairDisplay-Italic',
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  unsaveButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#FFF5F5',
    alignSelf: 'flex-start',
  },
});