/**
 * MediVault AI - Login Screen
 * User authentication with email/password, Google OAuth, and Biometric
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  LogIn,
  Heart,
  Sparkles,
  Fingerprint,
  ScanFace,
} from 'lucide-react-native';

import { colors, spacing, fontSize, fontWeight, borderRadius, shadows } from '../theme';
import { LoadingOverlay } from '../components/common';
import { useAuthStore, useBiometric, useBiometricActions } from '../store/useAuthStore';
import { isGoogleSignInAvailable, isBiometricAvailable } from '../services';
import { AuthStackScreenProps } from '../navigation/types';

type Props = AuthStackScreenProps<'Login'>;

const LoginScreen: React.FC<Props> = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { signIn, signInWithGoogle, isLoading, error, clearError } = useAuthStore();
  const { biometricAvailable, biometricEnabled, biometricType } = useBiometric();
  const { checkBiometricStatus, signInWithBiometrics, enableBiometricLogin } = useBiometricActions();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showBiometricPrompt, setShowBiometricPrompt] = useState(false);
  
  // Check if Google Sign-In is available (requires development build)
  const googleSignInEnabled = isGoogleSignInAvailable();

  // Check biometric status on mount
  useEffect(() => {
    checkBiometricStatus();
  }, []);

  // Auto-trigger biometric login if enabled
  useEffect(() => {
    const attemptBiometricLogin = async () => {
      if (biometricEnabled && biometricAvailable) {
        await handleBiometricLogin();
      }
    };
    
    // Small delay to let the screen render first
    const timer = setTimeout(attemptBiometricLogin, 500);
    return () => clearTimeout(timer);
  }, [biometricEnabled, biometricAvailable]);

  const handleLogin = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }
    if (!password) {
      Alert.alert('Error', 'Please enter your password');
      return;
    }

    try {
      await signIn({ email: email.trim(), password });
      
      // After successful login, prompt to enable biometrics if available and not enabled
      if (biometricAvailable && !biometricEnabled) {
        promptEnableBiometric();
      }
    } catch (error: any) {
      Alert.alert('Login Failed', error.message);
    }
  };

  const promptEnableBiometric = () => {
    Alert.alert(
      `Enable ${biometricType} Login?`,
      `Would you like to use ${biometricType} for faster, secure login next time?`,
      [
        {
          text: 'Not Now',
          style: 'cancel',
        },
        {
          text: 'Enable',
          onPress: async () => {
            try {
              await enableBiometricLogin(email.trim(), password);
              Alert.alert(
                'Success!',
                `${biometricType} login has been enabled. You can use it next time you sign in.`
              );
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to enable biometric login');
            }
          },
        },
      ]
    );
  };

  const handleBiometricLogin = async () => {
    try {
      const success = await signInWithBiometrics();
      if (!success) {
        // User cancelled or failed - they can still use password
        clearError();
      }
    } catch (error: any) {
      // Silent fail - user can still use password
      console.log('Biometric login error:', error);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch (error: any) {
      if (!error.message.includes('cancelled')) {
        Alert.alert('Google Sign-In Failed', error.message);
      }
    }
  };

  const handleForgotPassword = () => {
    navigation.navigate('ForgotPassword' as never);
  };

  const handleSignUp = () => {
    navigation.navigate('Register' as never);
  };

  // Get the appropriate icon for biometric type
  const BiometricIcon = biometricType.toLowerCase().includes('face') ? ScanFace : Fingerprint;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <LoadingOverlay 
        visible={isLoading} 
        message="Signing in..."
        submessage="Verifying your credentials securely."
      />
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + spacing['8'], paddingBottom: insets.bottom + spacing['8'] },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Logo and Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <View style={styles.logoIcon}>
              <Heart size={32} color={colors.primary[600]} />
            </View>
            <Sparkles size={20} color={colors.primary[400]} style={styles.sparkle} />
          </View>
          <Text style={styles.title}>MediVault AI</Text>
          <Text style={styles.subtitle}>Your Personal Medical Assistant</Text>
        </View>

        {/* Biometric Quick Login - Show when enabled */}
        {biometricAvailable && biometricEnabled && (
          <TouchableOpacity
            style={styles.biometricQuickLogin}
            onPress={handleBiometricLogin}
            activeOpacity={0.8}
          >
            <View style={styles.biometricIconLarge}>
              <BiometricIcon size={48} color={colors.primary[600]} />
            </View>
            <Text style={styles.biometricQuickText}>Tap to login with {biometricType}</Text>
          </TouchableOpacity>
        )}

        {/* Login Form */}
        <View style={styles.form}>
          <Text style={styles.formTitle}>Welcome Back</Text>
          <Text style={styles.formSubtitle}>Sign in to continue</Text>

          {/* Email Input */}
          <View style={styles.inputContainer}>
            <Mail size={20} color={colors.gray[400]} />
            <TextInput
              style={styles.input}
              placeholder="Email address"
              placeholderTextColor={colors.gray[400]}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          {/* Password Input */}
          <View style={styles.inputContainer}>
            <Lock size={20} color={colors.gray[400]} />
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor={colors.gray[400]}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
            />
            <TouchableOpacity 
              onPress={() => setShowPassword(!showPassword)}
              style={styles.eyeButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              activeOpacity={0.7}
            >
              {showPassword ? (
                <EyeOff size={20} color={colors.gray[400]} />
              ) : (
                <Eye size={20} color={colors.gray[400]} />
              )}
            </TouchableOpacity>
          </View>

          {/* Forgot Password */}
          <TouchableOpacity onPress={handleForgotPassword} style={styles.forgotPassword}>
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
          </TouchableOpacity>

          {/* Login Button */}
          <TouchableOpacity
            style={styles.loginButton}
            onPress={handleLogin}
            activeOpacity={0.9}
          >
            <LogIn size={20} color={colors.white} />
            <Text style={styles.loginButtonText}>Sign In</Text>
          </TouchableOpacity>

          {/* Biometric Login Button - Show when available but not using quick login */}
          {biometricAvailable && biometricEnabled && (
            <TouchableOpacity
              style={styles.biometricButton}
              onPress={handleBiometricLogin}
              activeOpacity={0.8}
            >
              <BiometricIcon size={20} color={colors.primary[600]} />
              <Text style={styles.biometricButtonText}>Login with {biometricType}</Text>
            </TouchableOpacity>
          )}

          {/* Google Sign-In Section - Only show when available */}
          {googleSignInEnabled && (
            <>
              {/* Divider */}
              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or continue with</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Google Sign-In Button */}
              <TouchableOpacity
                style={styles.googleButton}
                onPress={handleGoogleSignIn}
                activeOpacity={0.9}
              >
                <Image
                  source={{ uri: 'https://developers.google.com/identity/images/g-logo.png' }}
                  style={styles.googleIcon}
                />
                <Text style={styles.googleButtonText}>Continue with Google</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Sign Up Link */}
        <View style={styles.signUpContainer}>
          <Text style={styles.signUpText}>Don't have an account? </Text>
          <TouchableOpacity onPress={handleSignUp}>
            <Text style={styles.signUpLink}>Sign Up</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  content: {
    flexGrow: 1,
    padding: spacing['6'],
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing['6'],
  },
  logoContainer: {
    position: 'relative',
    marginBottom: spacing['4'],
  },
  logoIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.lg,
  },
  sparkle: {
    position: 'absolute',
    top: -4,
    right: -4,
  },
  title: {
    fontSize: fontSize['3xl'],
    fontWeight: fontWeight.bold,
    color: colors.primary[700],
    marginBottom: spacing['2'],
  },
  subtitle: {
    fontSize: fontSize.base,
    color: colors.text.secondary,
  },
  // Biometric Quick Login
  biometricQuickLogin: {
    backgroundColor: colors.primary[50],
    borderRadius: borderRadius['3xl'],
    padding: spacing['6'],
    alignItems: 'center',
    marginBottom: spacing['6'],
    borderWidth: 2,
    borderColor: colors.primary[200],
    borderStyle: 'dashed',
  },
  biometricIconLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing['3'],
    ...shadows.md,
  },
  biometricQuickText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semiBold,
    color: colors.primary[700],
  },
  form: {
    backgroundColor: colors.white,
    borderRadius: borderRadius['4xl'],
    padding: spacing['8'],
    ...shadows.lg,
    marginBottom: spacing['8'],
  },
  formTitle: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing['1'],
  },
  formSubtitle: {
    fontSize: fontSize.base,
    color: colors.text.secondary,
    marginBottom: spacing['6'],
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray[50],
    borderRadius: borderRadius['2xl'],
    paddingHorizontal: spacing['4'],
    paddingVertical: spacing['3'],
    marginBottom: spacing['4'],
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  input: {
    flex: 1,
    marginLeft: spacing['3'],
    fontSize: fontSize.base,
    color: colors.text.primary,
  },
  eyeButton: {
    padding: spacing['2'],
    marginRight: -spacing['2'],
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: spacing['6'],
  },
  forgotPasswordText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semiBold,
    color: colors.primary[600],
  },
  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary[600],
    borderRadius: borderRadius['2xl'],
    paddingVertical: spacing['4'],
    gap: spacing['2'],
    ...shadows.md,
  },
  loginButtonText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.white,
  },
  // Biometric Button
  biometricButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary[50],
    borderRadius: borderRadius['2xl'],
    paddingVertical: spacing['4'],
    gap: spacing['2'],
    marginTop: spacing['3'],
    borderWidth: 1,
    borderColor: colors.primary[200],
  },
  biometricButtonText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semiBold,
    color: colors.primary[700],
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing['6'],
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border.light,
  },
  dividerText: {
    marginHorizontal: spacing['4'],
    fontSize: fontSize.sm,
    color: colors.text.tertiary,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius['2xl'],
    paddingVertical: spacing['4'],
    gap: spacing['3'],
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  googleIcon: {
    width: 24,
    height: 24,
  },
  googleButtonText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semiBold,
    color: colors.text.primary,
  },
  signUpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signUpText: {
    fontSize: fontSize.base,
    color: colors.text.secondary,
  },
  signUpLink: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    color: colors.primary[600],
  },
});

export default LoginScreen;
