import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  ScrollView,
  Modal,
  TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { User, BookOpen, LogOut, Settings, Wine, X, Eye, EyeOff, Lock } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useWine } from '@/contexts/WineContext';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';

export default function ProfileScreen() {
  const { user, profile, signOut } = useAuth();
  const { savedWines } = useWine();
  const router = useRouter();
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('🔐 Starting sign out process...');
              await signOut();
              console.log('✅ Sign out successful');
              // The auth context will handle navigation automatically
            } catch (error) {
              console.error('❌ Sign out error:', error);
              Alert.alert('Error', 'Failed to sign out. Please try again.');
            }
          },
        },
      ]
    );
  };

  const validatePasswordForm = () => {
    const errors: Record<string, string> = {};

    if (!currentPassword) {
      errors.currentPassword = 'Current password is required';
    }

    if (!newPassword) {
      errors.newPassword = 'New password is required';
    } else if (newPassword.length < 6) {
      errors.newPassword = 'Password must be at least 6 characters';
    }

    if (!confirmPassword) {
      errors.confirmPassword = 'Please confirm your new password';
    } else if (newPassword !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    if (currentPassword && newPassword && currentPassword === newPassword) {
      errors.newPassword = 'New password must be different from current password';
    }

    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChangePassword = async () => {
    console.log('🔐 === CHANGE PASSWORD ===');
    
    if (!validatePasswordForm()) {
      console.log('❌ Password form validation failed');
      return;
    }

    if (!user || !profile) {
      Alert.alert('Error', 'User session not found. Please sign in again.');
      return;
    }

    setPasswordLoading(true);

    try {
      // First verify current password by attempting to sign in
      console.log('🔍 Verifying current password...');
      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email: `${profile.username}@sipmate.app`,
        password: currentPassword,
      });

      if (verifyError) {
        console.log('❌ Current password verification failed:', verifyError.message);
        setPasswordErrors({ currentPassword: 'Current password is incorrect' });
        return;
      }

      console.log('✅ Current password verified');

      // Update password
      console.log('🔄 Updating password...');
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (updateError) {
        console.log('❌ Password update failed:', updateError.message);
        Alert.alert('Error', `Failed to update password: ${updateError.message}`);
        return;
      }

      console.log('✅ Password updated successfully');
      
      // Reset form and close modal
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordErrors({});
      setShowPasswordModal(false);
      
      Alert.alert(
        'Success! 🎉',
        'Your password has been updated successfully.',
        [{ text: 'OK' }]
      );

    } catch (error: any) {
      console.error('❌ Password change error:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleSignIn = () => {
    router.push('/auth');
  };

  // Calculate stats from saved wines
  const wineStats = {
    total: savedWines.length,
    red: savedWines.filter(wine => wine.wine?.type === 'red').length,
    white: savedWines.filter(wine => wine.wine?.type === 'white').length,
    rated: savedWines.filter(wine => wine.rating && wine.rating > 0).length,
  };

  const SettingsModal = () => (
    <Modal visible={showSettingsModal} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Settings</Text>
            <TouchableOpacity onPress={() => setShowSettingsModal(false)}>
              <X size={24} color="#722F37" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody}>
            {/* Account Section */}
            <View style={styles.settingsSection}>
              <Text style={styles.settingsSectionTitle}>Account</Text>
              
              <TouchableOpacity 
                style={styles.settingsItem}
                onPress={() => {
                  setShowSettingsModal(false);
                  setShowPasswordModal(true);
                }}
              >
                <Lock size={20} color="#722F37" />
                <Text style={styles.settingsItemText}>Change Password</Text>
              </TouchableOpacity>
            </View>

            {/* App Info Section */}
            <View style={styles.settingsSection}>
              <Text style={styles.settingsSectionTitle}>About</Text>
              
              <View style={styles.settingsItem}>
                <Text style={styles.settingsItemText}>Version</Text>
                <Text style={styles.settingsItemValue}>1.0.0</Text>
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  const PasswordModal = () => (
    <Modal visible={showPasswordModal} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Change Password</Text>
            <TouchableOpacity onPress={() => {
              setShowPasswordModal(false);
              setCurrentPassword('');
              setNewPassword('');
              setConfirmPassword('');
              setPasswordErrors({});
            }}>
              <X size={24} color="#722F37" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody}>
            {/* Current Password */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Current Password</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={[
                    styles.passwordInput,
                    passwordErrors.currentPassword && styles.inputError
                  ]}
                  value={currentPassword}
                  onChangeText={(text) => {
                    setCurrentPassword(text);
                    if (passwordErrors.currentPassword) {
                      setPasswordErrors(prev => ({ ...prev, currentPassword: '' }));
                    }
                  }}
                  placeholder="Enter current password"
                  placeholderTextColor="#8B5A5F"
                  secureTextEntry={!showCurrentPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowCurrentPassword(!showCurrentPassword)}
                >
                  {showCurrentPassword ? (
                    <EyeOff size={20} color="#8B5A5F" />
                  ) : (
                    <Eye size={20} color="#8B5A5F" />
                  )}
                </TouchableOpacity>
              </View>
              {passwordErrors.currentPassword && (
                <Text style={styles.errorText}>{passwordErrors.currentPassword}</Text>
              )}
            </View>

            {/* New Password */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>New Password</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={[
                    styles.passwordInput,
                    passwordErrors.newPassword && styles.inputError
                  ]}
                  value={newPassword}
                  onChangeText={(text) => {
                    setNewPassword(text);
                    if (passwordErrors.newPassword) {
                      setPasswordErrors(prev => ({ ...prev, newPassword: '' }));
                    }
                  }}
                  placeholder="Enter new password"
                  placeholderTextColor="#8B5A5F"
                  secureTextEntry={!showNewPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowNewPassword(!showNewPassword)}
                >
                  {showNewPassword ? (
                    <EyeOff size={20} color="#8B5A5F" />
                  ) : (
                    <Eye size={20} color="#8B5A5F" />
                  )}
                </TouchableOpacity>
              </View>
              {passwordErrors.newPassword && (
                <Text style={styles.errorText}>{passwordErrors.newPassword}</Text>
              )}
            </View>

            {/* Confirm Password */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Confirm New Password</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={[
                    styles.passwordInput,
                    passwordErrors.confirmPassword && styles.inputError
                  ]}
                  value={confirmPassword}
                  onChangeText={(text) => {
                    setConfirmPassword(text);
                    if (passwordErrors.confirmPassword) {
                      setPasswordErrors(prev => ({ ...prev, confirmPassword: '' }));
                    }
                  }}
                  placeholder="Confirm new password"
                  placeholderTextColor="#8B5A5F"
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff size={20} color="#8B5A5F" />
                  ) : (
                    <Eye size={20} color="#8B5A5F" />
                  )}
                </TouchableOpacity>
              </View>
              {passwordErrors.confirmPassword && (
                <Text style={styles.errorText}>{passwordErrors.confirmPassword}</Text>
              )}
            </View>

            {/* Password Requirements */}
            <View style={styles.passwordRequirements}>
              <Text style={styles.requirementsTitle}>Password Requirements:</Text>
              <Text style={styles.requirementText}>• At least 6 characters long</Text>
              <Text style={styles.requirementText}>• Different from current password</Text>
            </View>
          </ScrollView>

          {/* Update Button */}
          <TouchableOpacity
            style={[
              styles.updateButton,
              passwordLoading && styles.updateButtonDisabled
            ]}
            onPress={handleChangePassword}
            disabled={passwordLoading}
          >
            <Text style={styles.updateButtonText}>
              {passwordLoading ? 'Updating...' : 'Update Password'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  if (!user) {
    // Not signed in - show sign in prompt
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient
          colors={['#722F37', '#8B4B47']}
          style={styles.header}
        >
          <Text style={styles.headerTitle}>Profile</Text>
          <Text style={styles.headerSubtitle}>Your wine journey</Text>
        </LinearGradient>

        <View style={styles.signInContainer}>
          <User size={64} color="#8B5A5F" />
          <Text style={styles.signInTitle}>Welcome to SipMate</Text>
          <Text style={styles.signInMessage}>
            Sign in to save your favorite wines, track your tastings, and build your personal wine library
          </Text>
          
          <TouchableOpacity style={styles.signInButton} onPress={handleSignIn}>
            <Text style={styles.signInButtonText}>Sign In</Text>
          </TouchableOpacity>

          <View style={styles.guestFeatures}>
            <Text style={styles.featuresTitle}>What you'll get:</Text>
            <View style={styles.featureItem}>
              <Wine size={20} color="#722F37" />
              <Text style={styles.featureText}>Personal wine library</Text>
            </View>
            <View style={styles.featureItem}>
              <BookOpen size={20} color="#D4AF37" />
              <Text style={styles.featureText}>Save and rate wines</Text>
            </View>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // Signed in - show profile
  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#722F37', '#8B4B47']}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Profile</Text>
        <Text style={styles.headerSubtitle}>Welcome back!</Text>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* User Info */}
        <View style={styles.userCard}>
          <View style={styles.userIcon}>
            <User size={32} color="#722F37" />
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>
              {profile?.username || 'Wine Enthusiast'}
            </Text>
            <Text style={styles.userEmail}>
              {profile?.email || user.email || 'No email'}
            </Text>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <Text style={styles.sectionTitle}>Your Wine Journey</Text>
          
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <BookOpen size={24} color="#D4AF37" />
              <Text style={styles.statNumber}>{wineStats.total}</Text>
              <Text style={styles.statLabel}>Saved Wines</Text>
            </View>
            
            <View style={styles.statCard}>
              <Wine size={24} color="#722F37" />
              <Text style={styles.statNumber}>{wineStats.red}</Text>
              <Text style={styles.statLabel}>Red Wines</Text>
            </View>

            <View style={styles.statCard}>
              <Wine size={24} color="#D4AF37" />
              <Text style={styles.statNumber}>{wineStats.white}</Text>
              <Text style={styles.statLabel}>White Wines</Text>
            </View>
            
            <View style={styles.statCard}>
              <Wine size={24} color="#8B4B47" />
              <Text style={styles.statNumber}>{wineStats.rated}</Text>
              <Text style={styles.statLabel}>Rated Wines</Text>
            </View>
          </View>
        </View>

        {/* Menu Options */}
        <View style={styles.menuContainer}>
          <Text style={styles.sectionTitle}>Menu</Text>
          
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => router.push('/library')}
          >
            <BookOpen size={20} color="#722F37" />
            <Text style={styles.menuItemText}>My Wine Library</Text>
            <Text style={styles.menuItemBadge}>{wineStats.total}</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => setShowSettingsModal(true)}
          >
            <Settings size={20} color="#722F37" />
            <Text style={styles.menuItemText}>Settings</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.menuItem, styles.signOutItem]}
            onPress={handleSignOut}
          >
            <LogOut size={20} color="#DC3545" />
            <Text style={[styles.menuItemText, styles.signOutText]}>Sign Out</Text>
          </TouchableOpacity>
        </View>

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={styles.appVersion}>SipMate v1.0.0</Text>
          <Text style={styles.appTagline}>Discover. Save. Enjoy.</Text>
        </View>
      </ScrollView>

      {/* Modals */}
      <SettingsModal />
      <PasswordModal />
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
  content: {
    flex: 1,
    padding: 20,
  },
  signInContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  signInTitle: {
    fontFamily: 'PlayfairDisplay-Bold',
    fontSize: 24,
    color: '#722F37',
    marginTop: 20,
    marginBottom: 10,
    textAlign: 'center',
  },
  signInMessage: {
    fontFamily: 'PlayfairDisplay-Regular',
    fontSize: 16,
    color: '#8B5A5F',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
  },
  signInButton: {
    backgroundColor: '#722F37',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
    marginBottom: 30,
  },
  signInButtonText: {
    fontFamily: 'PlayfairDisplay-Bold',
    fontSize: 18,
    color: 'white',
    textAlign: 'center',
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
  userCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  userIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFF8E1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontFamily: 'PlayfairDisplay-Bold',
    fontSize: 18,
    color: '#722F37',
    marginBottom: 4,
  },
  userEmail: {
    fontFamily: 'PlayfairDisplay-Regular',
    fontSize: 14,
    color: '#8B5A5F',
  },
  statsContainer: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontFamily: 'PlayfairDisplay-Bold',
    fontSize: 20,
    color: '#722F37',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontFamily: 'PlayfairDisplay-Bold',
    fontSize: 24,
    color: '#722F37',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontFamily: 'PlayfairDisplay-Regular',
    fontSize: 12,
    color: '#8B5A5F',
    textAlign: 'center',
  },
  menuContainer: {
    marginBottom: 20,
  },
  menuItem: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  menuItemText: {
    fontFamily: 'PlayfairDisplay-Regular',
    fontSize: 16,
    color: '#722F37',
    marginLeft: 12,
    flex: 1,
  },
  menuItemBadge: {
    backgroundColor: '#722F37',
    color: 'white',
    fontSize: 12,
    fontFamily: 'PlayfairDisplay-Bold',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    overflow: 'hidden',
  },
  signOutItem: {
    marginTop: 10,
  },
  signOutText: {
    color: '#DC3545',
  },
  appInfo: {
    alignItems: 'center',
    paddingVertical: 20,
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
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
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
    fontFamily: 'PlayfairDisplay-Bold',
    fontSize: 24,
    color: '#722F37',
  },
  modalBody: {
    flex: 1,
    padding: 20,
  },
  settingsSection: {
    marginBottom: 30,
  },
  settingsSectionTitle: {
    fontFamily: 'PlayfairDisplay-Bold',
    fontSize: 18,
    color: '#722F37',
    marginBottom: 12,
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    marginBottom: 8,
  },
  settingsItemText: {
    fontFamily: 'PlayfairDisplay-Regular',
    fontSize: 16,
    color: '#722F37',
    marginLeft: 12,
    flex: 1,
  },
  settingsItemValue: {
    fontFamily: 'PlayfairDisplay-Regular',
    fontSize: 14,
    color: '#8B5A5F',
  },
  // Password Modal Styles
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontFamily: 'PlayfairDisplay-Bold',
    fontSize: 16,
    color: '#722F37',
    marginBottom: 8,
  },
  passwordContainer: {
    position: 'relative',
  },
  passwordInput: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    paddingRight: 50,
    fontFamily: 'PlayfairDisplay-Regular',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  eyeButton: {
    position: 'absolute',
    right: 16,
    top: 14,
    padding: 4,
  },
  inputError: {
    borderColor: '#DC3545',
  },
  errorText: {
    fontFamily: 'PlayfairDisplay-Regular',
    fontSize: 14,
    color: '#DC3545',
    marginTop: 6,
  },
  passwordRequirements: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
    marginTop: 10,
  },
  requirementsTitle: {
    fontFamily: 'PlayfairDisplay-Bold',
    fontSize: 14,
    color: '#722F37',
    marginBottom: 8,
  },
  requirementText: {
    fontFamily: 'PlayfairDisplay-Regular',
    fontSize: 12,
    color: '#8B5A5F',
    marginBottom: 4,
  },
  updateButton: {
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
  updateButtonDisabled: {
    opacity: 0.6,
  },
  updateButtonText: {
    fontFamily: 'PlayfairDisplay-Bold',
    fontSize: 18,
    color: 'white',
    textAlign: 'center',
  },
});