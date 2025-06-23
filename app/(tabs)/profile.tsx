import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
  ScrollView,
} from 'react-native';
import { LogOut, Mail, User, Wine, Award, Calendar, LogIn, Settings, Key } from 'lucide-react-native';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useWine } from '@/contexts/WineContext';
import { authService } from '@/services/authService';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const { savedWines } = useWine();
  const [wineStats, setWineStats] = useState({ total: 0, red: 0, white: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    // Update stats whenever savedWines changes (real-time updates)
    const redCount = savedWines.filter(wine => wine.type === 'red').length;
    const whiteCount = savedWines.filter(wine => wine.type === 'white').length;
    
    const newStats = {
      total: savedWines.length,
      red: redCount,
      white: whiteCount,
    };
    
    setWineStats(newStats);
  }, [savedWines]);

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out of your account?',
      [
        { 
          text: 'Cancel', 
          style: 'cancel',
          onPress: () => console.log('🚫 Logout cancelled by user')
        },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            console.log('🔓 Profile: User confirmed logout');
            await performLogout();
          },
        },
      ]
    );
  };

  const performLogout = async () => {
    setIsLoggingOut(true);
    setError(null);
    
    try {
      console.log('🔓 Profile: Starting logout process...');
      
      // Close any open modals first
      setShowAccountModal(false);
      setShowPasswordModal(false);
      
      // Call logout function from context
      await logout();
      
      console.log('✅ Profile: Logout completed successfully');
      
    } catch (error) {
      console.error('❌ Profile: Logout error:', error);
      
      // Set error state to show user
      setError('Failed to sign out. Please try again.');
      
      // Show error alert with retry option
      Alert.alert(
        'Logout Error', 
        'There was an issue signing out. Please try again.',
        [
          {
            text: 'Retry',
            onPress: () => {
              setError(null);
              performLogout();
            }
          },
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => setError(null)
          }
        ]
      );
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleChangePassword = async () => {
    if (!newPassword.trim() || !confirmPassword.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    setIsUpdatingPassword(true);
    try {
      const result = await authService.updatePassword(newPassword);
      if (result.success) {
        Alert.alert('Success', 'Password updated successfully!');
        setShowPasswordModal(false);
        setNewPassword('');
        setConfirmPassword('');
      } else {
        Alert.alert('Error', result.error || 'Failed to update password');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update password');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleLoginPress = () => {
    router.push('/auth');
  };

  // Calculate achievements based on current stats with real-time updates
  const achievements = [
    {
      id: 'wine_explorer',
      title: 'Wine Explorer',
      description: wineStats.total > 0 ? 'Started your wine journey!' : 'Save your first wine to unlock',
      icon: Award,
      color: '#D4AF37',
      completed: wineStats.total > 0,
      progress: `${Math.min(wineStats.total, 1)}/1`
    },
    {
      id: 'red_enthusiast',
      title: 'Red Wine Enthusiast',
      description: wineStats.red >= 3 ? 'Collected 3+ red wines!' : `Save ${3 - wineStats.red} more red wines to unlock`,
      icon: Award,
      color: '#722F37',
      completed: wineStats.red >= 3,
      progress: `${wineStats.red}/3`
    },
    {
      id: 'white_connoisseur',
      title: 'White Wine Connoisseur',
      description: wineStats.white >= 3 ? 'Collected 3+ white wines!' : `Save ${3 - wineStats.white} more white wines to unlock`,
      icon: Award,
      color: '#D4AF37',
      completed: wineStats.white >= 3,
      progress: `${wineStats.white}/3`
    },
    {
      id: 'collector',
      title: 'Wine Collector',
      description: wineStats.total >= 10 ? 'Collected 10+ wines!' : `Save ${10 - wineStats.total} more wines to unlock`,
      icon: Award,
      color: '#8B4513',
      completed: wineStats.total >= 10,
      progress: `${wineStats.total}/10`
    }
  ];

  const renderGuestView = () => (
    <View style={styles.guestContainer}>
      <View style={styles.guestIconContainer}>
        <User size={64} color="#722F37" />
      </View>
      <Text style={styles.guestTitle}>Welcome to SipMate</Text>
      <Text style={styles.guestSubtitle}>
        Sign in to access your profile, track your wine journey, and unlock achievements
      </Text>
      <TouchableOpacity style={styles.loginButton} onPress={handleLoginPress}>
        <LogIn size={20} color="#FFFFFF" />
        <Text style={styles.loginButtonText}>Sign In</Text>
      </TouchableOpacity>
      
      <View style={styles.guestFeatures}>
        <Text style={styles.featuresTitle}>What you'll get:</Text>
        <View style={styles.featureItem}>
          <Wine size={20} color="#722F37" />
          <Text style={styles.featureText}>Personal wine library</Text>
        </View>
        <View style={styles.featureItem}>
          <Award size={20} color="#D4AF37" />
          <Text style={styles.featureText}>Achievement tracking</Text>
        </View>
        <View style={styles.featureItem}>
          <Calendar size={20} color="#666" />
          <Text style={styles.featureText}>Wine journey history</Text>
        </View>
      </View>
    </View>
  );

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        {renderGuestView()}
      </SafeAreaView>
    );
  }

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#722F37" />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Profile</Text>
          <Text style={styles.subtitle}>Your wine journey</Text>
        </View>

        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <User size={48} color="#FFFFFF" />
            </View>
          </View>

          <View style={styles.userInfo}>
            <Text style={styles.username}>{user.username}</Text>
            {user.email && (
              <View style={styles.emailContainer}>
                <Mail size={16} color="#666" />
                <Text style={styles.email}>{user.email}</Text>
              </View>
            )}
          </View>

          <TouchableOpacity 
            style={styles.accountButton}
            onPress={() => setShowAccountModal(true)}
            disabled={isLoggingOut}
          >
            <Settings size={20} color="#722F37" />
            <Text style={styles.accountButtonText}>Account Settings</Text>
          </TouchableOpacity>
        </View>

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity 
              style={styles.retryButton}
              onPress={() => {
                setError(null);
                performLogout();
              }}
            >
              <Text style={styles.retryButtonText}>Retry Logout</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Wine Statistics</Text>
          
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Wine size={32} color="#722F37" />
              <Text style={styles.statNumber}>{wineStats.total}</Text>
              <Text style={styles.statLabel}>Total Wines</Text>
            </View>
            
            <View style={styles.statCard}>
              <Wine size={32} color="#722F37" />
              <Text style={[styles.statNumber, { color: '#722F37' }]}>{wineStats.red}</Text>
              <Text style={styles.statLabel}>Red Wines</Text>
            </View>
            
            <View style={styles.statCard}>
              <Wine size={32} color="#D4AF37" />
              <Text style={[styles.statNumber, { color: '#D4AF37' }]}>{wineStats.white}</Text>
              <Text style={styles.statLabel}>White Wines</Text>
            </View>
          </View>
        </View>

        <View style={styles.achievementsSection}>
          <Text style={styles.sectionTitle}>Achievements</Text>
          
          <View style={styles.achievementsList}>
            {achievements.map((achievement) => {
              const IconComponent = achievement.icon;
              return (
                <View key={achievement.id} style={styles.achievementCard}>
                  <IconComponent size={24} color={achievement.color} />
                  <View style={styles.achievementInfo}>
                    <Text style={styles.achievementTitle}>{achievement.title}</Text>
                    <Text style={styles.achievementDescription}>
                      {achievement.description}
                    </Text>
                  </View>
                  <View style={[styles.achievementBadge, achievement.completed && styles.achievementBadgeComplete]}>
                    <Text style={[styles.achievementBadgeText, achievement.completed && styles.achievementBadgeTextComplete]}>
                      {achievement.completed ? '✓' : achievement.progress}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        <View style={styles.appInfo}>
          <Text style={styles.appVersion}>SipMate v1.0.0</Text>
          <Text style={styles.appTagline}>Discover. Save. Enjoy.</Text>
        </View>

        {/* Quick Logout Button */}
        <View style={styles.quickLogoutSection}>
          <TouchableOpacity 
            style={[styles.quickLogoutButton, isLoggingOut && styles.quickLogoutButtonDisabled]} 
            onPress={handleLogout}
            disabled={isLoggingOut}
          >
            {isLoggingOut ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <LogOut size={20} color="#FFFFFF" />
            )}
            <Text style={styles.quickLogoutText}>
              {isLoggingOut ? 'Signing Out...' : 'Sign Out'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Account Settings Modal */}
      <Modal
        visible={showAccountModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAccountModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowAccountModal(false)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Account Settings</Text>
            <View style={{ width: 60 }} />
          </View>

          <View style={styles.modalContent}>
            <TouchableOpacity 
              style={styles.settingItem}
              onPress={() => {
                setShowAccountModal(false);
                setShowPasswordModal(true);
              }}
            >
              <Key size={24} color="#722F37" />
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Change Password</Text>
                <Text style={styles.settingDescription}>Update your account password</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.settingItem} 
              onPress={() => {
                setShowAccountModal(false);
                handleLogout();
              }}
              disabled={isLoggingOut}
            >
              <LogOut size={24} color="#E53E3E" />
              <View style={styles.settingInfo}>
                <Text style={[styles.settingTitle, { color: '#E53E3E' }]}>Sign Out</Text>
                <Text style={styles.settingDescription}>
                  {isLoggingOut ? 'Signing out...' : 'Sign out of your account'}
                </Text>
              </View>
              {isLoggingOut && (
                <ActivityIndicator size="small" color="#E53E3E" />
              )}
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Change Password Modal */}
      <Modal
        visible={showPasswordModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowPasswordModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowPasswordModal(false)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Change Password</Text>
            <TouchableOpacity 
              onPress={handleChangePassword}
              disabled={isUpdatingPassword || !newPassword.trim() || !confirmPassword.trim()}
            >
              <Text style={[
                styles.modalSave, 
                (isUpdatingPassword || !newPassword.trim() || !confirmPassword.trim()) && styles.modalSaveDisabled
              ]}>
                {isUpdatingPassword ? 'Updating...' : 'Save'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>New Password</Text>
              <TextInput
                style={styles.input}
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="Enter new password (min 6 characters)"
                placeholderTextColor="#999"
                secureTextEntry
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Confirm Password</Text>
              <TextInput
                style={styles.input}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Confirm new password"
                placeholderTextColor="#999"
                secureTextEntry
              />
            </View>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5DC',
  },
  guestContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  guestIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F5F5DC',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 3,
    borderColor: '#722F37',
  },
  guestTitle: {
    fontSize: 32,
    fontFamily: 'PlayfairDisplay-Bold',
    color: '#722F37',
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
    marginBottom: 40,
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
  guestFeatures: {
    alignItems: 'flex-start',
    width: '100%',
  },
  featuresTitle: {
    fontSize: 18,
    fontFamily: 'PlayfairDisplay-Bold',
    color: '#333',
    marginBottom: 16,
    alignSelf: 'center',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  featureText: {
    fontSize: 16,
    color: '#666',
    marginLeft: 12,
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
    backgroundColor: '#FFF5F5',
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#E53E3E',
  },
  errorText: {
    fontSize: 16,
    color: '#E53E3E',
    marginBottom: 12,
  },
  retryButton: {
    backgroundColor: '#E53E3E',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignSelf: 'flex-start',
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
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
  profileSection: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#722F37',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userInfo: {
    alignItems: 'center',
    marginBottom: 20,
  },
  username: {
    fontSize: 24,
    fontFamily: 'PlayfairDisplay-Bold',
    color: '#333',
    marginBottom: 8,
  },
  emailContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  email: {
    fontSize: 16,
    color: '#666',
    marginLeft: 6,
  },
  accountButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5DC',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#722F37',
  },
  accountButtonText: {
    color: '#722F37',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  statsSection: {
    marginHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'PlayfairDisplay-Bold',
    color: '#333',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
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
  statNumber: {
    fontSize: 24,
    fontFamily: 'PlayfairDisplay-Bold',
    color: '#333',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
    textAlign: 'center',
  },
  achievementsSection: {
    marginHorizontal: 20,
    marginBottom: 24,
  },
  achievementsList: {
    gap: 12,
  },
  achievementCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  achievementInfo: {
    flex: 1,
    marginLeft: 12,
  },
  achievementTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  achievementDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 18,
  },
  achievementBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  achievementBadgeComplete: {
    backgroundColor: '#722F37',
  },
  achievementBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  achievementBadgeTextComplete: {
    color: '#FFFFFF',
  },
  appInfo: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  appVersion: {
    fontSize: 14,
    color: '#999',
    marginBottom: 4,
  },
  appTagline: {
    fontSize: 16,
    fontFamily: 'PlayfairDisplay-Bold',
    color: '#722F37',
  },
  quickLogoutSection: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  quickLogoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E53E3E',
    borderRadius: 12,
    paddingVertical: 16,
    shadowColor: '#E53E3E',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  quickLogoutButtonDisabled: {
    opacity: 0.7,
  },
  quickLogoutText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  modalCancel: {
    fontSize: 16,
    color: '#666',
  },
  modalSave: {
    fontSize: 16,
    fontWeight: '600',
    color: '#722F37',
  },
  modalSaveDisabled: {
    color: '#CCC',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  settingInfo: {
    flex: 1,
    marginLeft: 16,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: '#666',
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F8F8F8',
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
  },
});