import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  RefreshControl,
} from 'react-native';
import { BookOpen, LogIn } from 'lucide-react-native';
import { SavedWine } from '@/types/wine';
import { useAuth } from '@/contexts/AuthContext';
import { useWine } from '@/contexts/WineContext';
import { router } from 'expo-router';
import WineCard from '@/components/WineCard';

export default function LibraryScreen() {
  const [stats, setStats] = useState({ total: 0, red: 0, white: 0 });
  const { user } = useAuth();
  const { savedWines, isLoading, refreshSavedWines, removeSavedWine } = useWine();

  useEffect(() => {
    // Update stats whenever savedWines changes
    const redCount = savedWines.filter(wine => wine.type === 'red').length;
    const whiteCount = savedWines.filter(wine => wine.type === 'white').length;
    
    setStats({
      total: savedWines.length,
      red: redCount,
      white: whiteCount,
    });
  }, [savedWines]);

  const onRefresh = async () => {
    await refreshSavedWines();
  };

  const handleWineRemoved = async (wine: SavedWine) => {
    // The wine is already removed from context by WineCard
    // Just update local stats
    const newTotal = stats.total - 1;
    const newRed = wine.type === 'red' ? stats.red - 1 : stats.red;
    const newWhite = wine.type === 'white' ? stats.white - 1 : stats.white;
    
    setStats({
      total: newTotal,
      red: newRed,
      white: newWhite,
    });
  };

  const handleWinePress = (wine: SavedWine) => {
    router.push({
      pathname: '/wine-details',
      params: { wineId: wine.id }
    });
  };

  const handleLoginPress = () => {
    router.push('/auth');
  };

  const renderStatsCard = () => (
    <View style={styles.statsContainer}>
      <View style={styles.statsCard}>
        <Text style={styles.statsNumber}>{stats.total}</Text>
        <Text style={styles.statsLabel}>Total Wines</Text>
      </View>
      <View style={styles.statsCard}>
        <Text style={[styles.statsNumber, { color: '#722F37' }]}>{stats.red}</Text>
        <Text style={styles.statsLabel}>Red Wines</Text>
      </View>
      <View style={styles.statsCard}>
        <Text style={[styles.statsNumber, { color: '#D4AF37' }]}>{stats.white}</Text>
        <Text style={styles.statsLabel}>White Wines</Text>
      </View>
    </View>
  );

  const renderWineCard = ({ item }: { item: SavedWine }) => (
    <WineCard 
      wine={item} 
      onPress={() => handleWinePress(item)}
      onRemove={handleWineRemoved}
      showSaveDate={true}
      dateSaved={item.dateSaved}
      dateTried={item.dateTried}
      userRating={item.userRating}
      userNotes={item.userNotes}
    />
  );

  const renderGuestView = () => (
    <View style={styles.guestContainer}>
      <BookOpen size={64} color="#722F37" />
      <Text style={styles.guestTitle}>Wine Library</Text>
      <Text style={styles.guestSubtitle}>
        Sign in to access your personal wine collection and save your favorite wines
      </Text>
      <TouchableOpacity style={styles.loginButton} onPress={handleLoginPress}>
        <LogIn size={20} color="#FFFFFF" />
        <Text style={styles.loginButtonText}>Sign In</Text>
      </TouchableOpacity>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <BookOpen size={64} color="#CCC" />
      <Text style={styles.emptyTitle}>Your Wine Library is Empty</Text>
      <Text style={styles.emptySubtitle}>
        Start saving wines from the collection to build your personal library
      </Text>
    </View>
  );

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        {renderGuestView()}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Wine Library</Text>
        <Text style={styles.subtitle}>Your personal wine collection</Text>
      </View>

      {renderStatsCard()}

      {savedWines.length === 0 ? (
        renderEmptyState()
      ) : (
        <FlatList
          data={savedWines}
          renderItem={renderWineCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={onRefresh}
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
    paddingTop: 20,
    paddingBottom: 16,
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
  guestContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  guestTitle: {
    fontSize: 32,
    fontFamily: 'PlayfairDisplay-Bold',
    color: '#722F37',
    marginTop: 20,
    marginBottom: 12,
    textAlign: 'center',
  },
  guestSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#722F37',
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 16,
    shadowColor: '#722F37',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 24,
    gap: 12,
  },
  statsCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statsNumber: {
    fontSize: 28,
    fontFamily: 'PlayfairDisplay-Bold',
    color: '#333',
    marginBottom: 4,
  },
  statsLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontFamily: 'PlayfairDisplay-Bold',
    color: '#333',
    marginTop: 20,
    marginBottom: 12,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
});