import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { X, Wine, Eye, EyeOff } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

export default function AuthScreen() {
  const router = useRouter();
  const { signIn, signUp } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Form fields
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!username.trim()) {
      newErrors.username = 'Username is required';
    } else if (username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    } else if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      newErrors.username = 'Username can only contain letters, numbers, and underscores';
    }

    if (!isLogin && !email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!isLogin && !email.includes('@')) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (!isLogin && !confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (!isLogin && password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    console.log('=== AUTH SUBMIT ===');
    console.log('Mode:', isLogin ? 'Login' : 'Register');
    console.log('Username:', username);
    console.log('Email:', email);
    
    if (!validateForm()) {
      console.log('Form validation failed:', errors);
      return;
    }

    setLoading(true);
    try {
      let result;
      
      if (isLogin) {
        console.log('Attempting login...');
        result = await signIn(username, password);
      } else {
        console.log('Attempting registration...');
        result = await signUp(username, email, password);
      }

      console.log('Auth result:', result);

      if (result.error) {
        console.log('Auth error:', result.error);
        Alert.alert('Error', result.error);
      } else {
        console.log('Auth successful, navigating back...');
        // Small delay to ensure state updates
        setTimeout(() => {
          router.back();
        }, 100);
      }
    } catch (error) {
      console.error('Auth catch error:', error);
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (currentPassword: string, newPassword: string) => {
    console.log('=== CHANGE PASSWORD ===');
    
    try {
      // First, verify current password by attempting to sign in
      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email: `${username}@sipmate.app`, // Using your current auth pattern
        password: currentPassword,
      });

      if (verifyError) {
        throw new Error('Current password is incorrect');
      }

      // Update password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (updateError) {
        throw new Error(updateError.message);
      }

      console.log('Password updated successfully');
      return { success: true };
    } catch (error) {
      console.error('Password change error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to change password' 
      };
    }
  };

  const resetForm = () => {
    setUsername('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setErrors({});
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  const switchMode = () => {
    console.log('Switching auth mode from', isLogin ? 'login' : 'register', 'to', !isLogin ? 'login' : 'register');
    setIsLogin(!isLogin);
    resetForm();
  };

  const handleClose = () => {
    console.log('Closing auth screen');
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#722F37', '#8B4B47']}
        style={styles.header}
      >
        <TouchableOpacity
          style={styles.closeButton}
          onPress={handleClose}
        >
          <X size={24} color="white" />
        </TouchableOpacity>
        
        <View style={styles.headerContent}>
          <Wine size={40} color="#D4AF37" />
          <Text style={styles.headerTitle}>
            {isLogin ? 'Welcome Back' : 'Join SipMate'}
          </Text>
          <Text style={styles.headerSubtitle}>
            {isLogin 
              ? 'Sign in to continue your wine journey' 
              : 'Start your wine discovery adventure'
            }
          </Text>
        </View>
      </LinearGradient>

      <KeyboardAvoidingView 
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          style={styles.form}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Username */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Username</Text>
            <TextInput
              style={[
                styles.input,
                errors.username && styles.inputError
              ]}
              value={username}
              onChangeText={(text) => {
                setUsername(text.toLowerCase().trim());
                if (errors.username) {
                  setErrors(prev => ({ ...prev, username: '' }));
                }
              }}
              placeholder="Enter your username"
              placeholderTextColor="#8B5A5F"
              autoCapitalize="none"
              autoCorrect={false}
              maxLength={20}
            />
            {errors.username && (
              <Text style={styles.errorText}>{errors.username}</Text>
            )}
          </View>

          {/* Email (Register only) */}
          {!isLogin && (
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Email</Text>
              <TextInput
                style={[
                  styles.input,
                  errors.email && styles.inputError
                ]}
                value={email}
                onChangeText={(text) => {
                  setEmail(text.toLowerCase().trim());
                  if (errors.email) {
                    setErrors(prev => ({ ...prev, email: '' }));
                  }
                }}
                placeholder="Enter your email"
                placeholderTextColor="#8B5A5F"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
              {errors.email && (
                <Text style={styles.errorText}>{errors.email}</Text>
              )}
            </View>
          )}

          {/* Password */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Password</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={[
                  styles.passwordInput,
                  errors.password && styles.inputError
                ]}
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  if (errors.password) {
                    setErrors(prev => ({ ...prev, password: '' }));
                  }
                }}
                placeholder="Enter your password"
                placeholderTextColor="#8B5A5F"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff size={20} color="#8B5A5F" />
                ) : (
                  <Eye size={20} color="#8B5A5F" />
                )}
              </TouchableOpacity>
            </View>
            {errors.password && (
              <Text style={styles.errorText}>{errors.password}</Text>
            )}
          </View>

          {/* Confirm Password (Register only) */}
          {!isLogin && (
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Confirm Password</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={[
                    styles.passwordInput,
                    errors.confirmPassword && styles.inputError
                  ]}
                  value={confirmPassword}
                  onChangeText={(text) => {
                    setConfirmPassword(text);
                    if (errors.confirmPassword) {
                      setErrors(prev => ({ ...prev, confirmPassword: '' }));
                    }
                  }}
                  placeholder="Confirm your password"
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
              {errors.confirmPassword && (
                <Text style={styles.errorText}>{errors.confirmPassword}</Text>
              )}
            </View>
          )}

          {/* Submit Button */}
          <TouchableOpacity
            style={[
              styles.submitButton,
              loading && styles.submitButtonDisabled
            ]}
            onPress={handleSubmit}
            disabled={loading}
          >
            <Text style={styles.submitButtonText}>
              {loading 
                ? (isLogin ? 'Signing In...' : 'Creating Account...') 
                : (isLogin ? 'Sign In' : 'Create Account')
              }
            </Text>
          </TouchableOpacity>

        

          {/* Switch Mode */}
          <View style={styles.switchContainer}>
            <Text style={styles.switchText}>
              {isLogin ? "Don't have an account? " : "Already have an account? "}
            </Text>
            <TouchableOpacity onPress={switchMode}>
              <Text style={styles.switchLink}>
                {isLogin ? 'Sign Up' : 'Sign In'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 1,
    padding: 8,
  },
  headerContent: {
    alignItems: 'center',
    paddingTop: 20,
  },
  headerTitle: {
    fontFamily: 'PlayfairDisplay-Bold',
    fontSize: 28,
    color: '#F5F5DC',
    marginTop: 16,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontFamily: 'PlayfairDisplay-Regular',
    fontSize: 16,
    color: '#F5F5DC',
    opacity: 0.9,
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  form: {
    flex: 1,
    padding: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontFamily: 'PlayfairDisplay-Bold',
    fontSize: 16,
    color: '#722F37',
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontFamily: 'PlayfairDisplay-Regular',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  inputError: {
    borderColor: '#DC3545',
  },
  passwordContainer: {
    position: 'relative',
  },
  passwordInput: {
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    paddingRight: 50,
    fontFamily: 'PlayfairDisplay-Regular',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  eyeButton: {
    position: 'absolute',
    right: 16,
    top: 14,
    padding: 4,
  },
  errorText: {
    fontFamily: 'PlayfairDisplay-Regular',
    fontSize: 14,
    color: '#DC3545',
    marginTop: 6,
  },
  submitButton: {
    backgroundColor: '#722F37',
    borderRadius: 12,
    paddingVertical: 16,
    marginTop: 10,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontFamily: 'PlayfairDisplay-Bold',
    fontSize: 18,
    color: 'white',
    textAlign: 'center',
  },
  testAccountInfo: {
    backgroundColor: '#FFF8E1',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#D4AF37',
  },
  testAccountTitle: {
    fontFamily: 'PlayfairDisplay-Bold',
    fontSize: 14,
    color: '#722F37',
    marginBottom: 4,
  },
  testAccountText: {
    fontFamily: 'PlayfairDisplay-Regular',
    fontSize: 12,
    color: '#8B5A5F',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 30,
  },
  switchText: {
    fontFamily: 'PlayfairDisplay-Regular',
    fontSize: 16,
    color: '#8B5A5F',
  },
  switchLink: {
    fontFamily: 'PlayfairDisplay-Bold',
    fontSize: 16,
    color: '#722F37',
  },
});