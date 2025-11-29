/**
 * Biometric Authentication Service
 * Handles fingerprint/face recognition authentication using device biometrics
 */

import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

// Constants for secure storage keys
const BIOMETRIC_ENABLED_KEY = 'medivault_biometric_enabled';
const STORED_EMAIL_KEY = 'medivault_stored_email';
const STORED_PASSWORD_KEY = 'medivault_stored_password';

/**
 * Biometric authentication types
 */
export type BiometricType = 'fingerprint' | 'facial' | 'iris' | 'none';

/**
 * Result of biometric authentication
 */
export interface BiometricAuthResult {
  success: boolean;
  error?: string;
  credentials?: {
    email: string;
    password: string;
  };
}

/**
 * Check if device has biometric hardware
 */
export const hasHardwareAsync = async (): Promise<boolean> => {
  try {
    return await LocalAuthentication.hasHardwareAsync();
  } catch (error) {
    console.error('Error checking biometric hardware:', error);
    return false;
  }
};

/**
 * Check if device has biometrics enrolled (fingerprint/face registered)
 */
export const isEnrolledAsync = async (): Promise<boolean> => {
  try {
    return await LocalAuthentication.isEnrolledAsync();
  } catch (error) {
    console.error('Error checking biometric enrollment:', error);
    return false;
  }
};

/**
 * Get available biometric authentication types
 */
export const getSupportedBiometricTypes = async (): Promise<BiometricType[]> => {
  try {
    const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
    const biometricTypes: BiometricType[] = [];

    types.forEach((type) => {
      switch (type) {
        case LocalAuthentication.AuthenticationType.FINGERPRINT:
          biometricTypes.push('fingerprint');
          break;
        case LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION:
          biometricTypes.push('facial');
          break;
        case LocalAuthentication.AuthenticationType.IRIS:
          biometricTypes.push('iris');
          break;
      }
    });

    return biometricTypes.length > 0 ? biometricTypes : ['none'];
  } catch (error) {
    console.error('Error getting biometric types:', error);
    return ['none'];
  }
};

/**
 * Get a user-friendly name for the biometric type
 */
export const getBiometricTypeName = async (): Promise<string> => {
  const types = await getSupportedBiometricTypes();
  
  if (types.includes('facial')) {
    return 'Face ID';
  } else if (types.includes('fingerprint')) {
    return 'Fingerprint';
  } else if (types.includes('iris')) {
    return 'Iris';
  }
  
  return 'Biometric';
};

/**
 * Check if biometric authentication is available and ready to use
 */
export const isBiometricAvailable = async (): Promise<boolean> => {
  const hasHardware = await hasHardwareAsync();
  const isEnrolled = await isEnrolledAsync();
  return hasHardware && isEnrolled;
};

/**
 * Check if biometric login is enabled by the user
 */
export const isBiometricEnabled = async (): Promise<boolean> => {
  try {
    const enabled = await SecureStore.getItemAsync(BIOMETRIC_ENABLED_KEY);
    return enabled === 'true';
  } catch (error) {
    console.error('Error checking if biometric is enabled:', error);
    return false;
  }
};

/**
 * Enable or disable biometric login
 */
export const setBiometricEnabled = async (enabled: boolean): Promise<void> => {
  try {
    if (enabled) {
      await SecureStore.setItemAsync(BIOMETRIC_ENABLED_KEY, 'true');
    } else {
      await SecureStore.deleteItemAsync(BIOMETRIC_ENABLED_KEY);
      // Also clear stored credentials when disabling
      await clearStoredCredentials();
    }
  } catch (error) {
    console.error('Error setting biometric enabled:', error);
    throw new Error('Failed to update biometric settings');
  }
};

/**
 * Store user credentials securely for biometric login
 */
export const storeCredentials = async (email: string, password: string): Promise<void> => {
  try {
    await SecureStore.setItemAsync(STORED_EMAIL_KEY, email);
    await SecureStore.setItemAsync(STORED_PASSWORD_KEY, password);
  } catch (error) {
    console.error('Error storing credentials:', error);
    throw new Error('Failed to store credentials securely');
  }
};

/**
 * Get stored credentials (only after successful biometric auth)
 */
export const getStoredCredentials = async (): Promise<{ email: string; password: string } | null> => {
  try {
    const email = await SecureStore.getItemAsync(STORED_EMAIL_KEY);
    const password = await SecureStore.getItemAsync(STORED_PASSWORD_KEY);

    if (email && password) {
      return { email, password };
    }
    return null;
  } catch (error) {
    console.error('Error getting stored credentials:', error);
    return null;
  }
};

/**
 * Check if credentials are stored for biometric login
 */
export const hasStoredCredentials = async (): Promise<boolean> => {
  const credentials = await getStoredCredentials();
  return credentials !== null;
};

/**
 * Clear stored credentials
 */
export const clearStoredCredentials = async (): Promise<void> => {
  try {
    await SecureStore.deleteItemAsync(STORED_EMAIL_KEY);
    await SecureStore.deleteItemAsync(STORED_PASSWORD_KEY);
  } catch (error) {
    console.error('Error clearing credentials:', error);
  }
};

/**
 * Authenticate user with biometrics
 */
export const authenticateWithBiometrics = async (
  promptMessage?: string
): Promise<BiometricAuthResult> => {
  try {
    // Check if biometrics are available
    const isAvailable = await isBiometricAvailable();
    if (!isAvailable) {
      return {
        success: false,
        error: 'Biometric authentication is not available on this device',
      };
    }

    // Check if biometric is enabled
    const isEnabled = await isBiometricEnabled();
    if (!isEnabled) {
      return {
        success: false,
        error: 'Biometric login is not enabled',
      };
    }

    // Check if we have stored credentials
    const credentials = await getStoredCredentials();
    if (!credentials) {
      return {
        success: false,
        error: 'No stored credentials found. Please log in with your password first.',
      };
    }

    const biometricName = await getBiometricTypeName();

    // Perform biometric authentication
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: promptMessage || `Login to MediVault with ${biometricName}`,
      cancelLabel: 'Cancel',
      disableDeviceFallback: false, // Allow PIN/pattern fallback
      fallbackLabel: 'Use Password',
    });

    if (result.success) {
      return {
        success: true,
        credentials,
      };
    } else {
      let errorMessage = 'Biometric authentication failed';
      
      // Handle different error types from expo-local-authentication
      switch (result.error) {
        case 'system_cancel':
          errorMessage = 'Authentication was cancelled by the system';
          break;
        case 'app_cancel':
          errorMessage = 'Authentication was cancelled';
          break;
        case 'authentication_failed':
          errorMessage = 'Authentication failed. Please try again.';
          break;
        case 'not_enrolled':
          errorMessage = 'No biometrics enrolled on this device';
          break;
        case 'not_available':
          errorMessage = 'Biometric authentication is not available';
          break;
        case 'passcode_not_set':
          errorMessage = 'Device passcode is not set';
          break;
        case 'timeout':
          errorMessage = 'Authentication timed out. Please try again.';
          break;
        default:
          errorMessage = 'Biometric authentication failed';
      }

      return {
        success: false,
        error: errorMessage,
      };
    }
  } catch (error: any) {
    console.error('Biometric authentication error:', error);
    return {
      success: false,
      error: error.message || 'An unexpected error occurred',
    };
  }
};

/**
 * Setup biometric login after successful password authentication
 * This stores the credentials securely and enables biometric login
 */
export const setupBiometricLogin = async (email: string, password: string): Promise<void> => {
  try {
    // Store credentials securely
    await storeCredentials(email, password);
    // Enable biometric login
    await setBiometricEnabled(true);
  } catch (error) {
    console.error('Error setting up biometric login:', error);
    throw new Error('Failed to setup biometric login');
  }
};

/**
 * Disable biometric login and clear all stored data
 */
export const disableBiometricLogin = async (): Promise<void> => {
  try {
    await setBiometricEnabled(false);
    await clearStoredCredentials();
  } catch (error) {
    console.error('Error disabling biometric login:', error);
    throw new Error('Failed to disable biometric login');
  }
};

/**
 * Check if biometric login can be offered to the user
 * (device supports it and credentials are stored)
 */
export const canUseBiometricLogin = async (): Promise<boolean> => {
  const isAvailable = await isBiometricAvailable();
  const isEnabled = await isBiometricEnabled();
  const hasCredentials = await hasStoredCredentials();
  
  return isAvailable && isEnabled && hasCredentials;
};

export default {
  hasHardwareAsync,
  isEnrolledAsync,
  getSupportedBiometricTypes,
  getBiometricTypeName,
  isBiometricAvailable,
  isBiometricEnabled,
  setBiometricEnabled,
  storeCredentials,
  getStoredCredentials,
  hasStoredCredentials,
  clearStoredCredentials,
  authenticateWithBiometrics,
  setupBiometricLogin,
  disableBiometricLogin,
  canUseBiometricLogin,
};
