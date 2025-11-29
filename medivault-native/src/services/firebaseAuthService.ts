/**
 * Firebase Authentication Service
 * Handles user authentication operations including Google OAuth
 */

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateProfile,
  User,
  UserCredential,
  GoogleAuthProvider,
  signInWithCredential,
} from 'firebase/auth';
import { auth } from '../config/firebase';
import { FIREBASE_WEB_CLIENT_ID } from '@env';

// Google Sign-In module - loaded dynamically to support Expo Go
let GoogleSignin: any = null;
let statusCodes: any = null;
let googleSignInAvailable = false;

// Try to load Google Sign-In (only works in development builds, not Expo Go)
try {
  const googleSignInModule = require('@react-native-google-signin/google-signin');
  GoogleSignin = googleSignInModule.GoogleSignin;
  statusCodes = googleSignInModule.statusCodes;
  googleSignInAvailable = true;
  
  // Configure Google Sign-In
  GoogleSignin.configure({
    webClientId: FIREBASE_WEB_CLIENT_ID,
    offlineAccess: true,
  });
  
  console.log('Google Sign-In configured successfully');
} catch (error) {
  console.warn(
    'Google Sign-In not available. This is expected in Expo Go. ' +
    'Use a development build for Google Sign-In functionality.'
  );
}

// Types
export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
}

export interface SignUpData {
  email: string;
  password: string;
  displayName?: string;
}

export interface SignInData {
  email: string;
  password: string;
}

/**
 * Convert Firebase User to AuthUser
 */
const mapFirebaseUser = (user: User): AuthUser => ({
  uid: user.uid,
  email: user.email,
  displayName: user.displayName,
  photoURL: user.photoURL,
  emailVerified: user.emailVerified,
});

/**
 * Sign up a new user with email and password
 */
export const signUp = async (data: SignUpData): Promise<AuthUser> => {
  try {
    const userCredential: UserCredential = await createUserWithEmailAndPassword(
      auth,
      data.email,
      data.password
    );
    
    // Update display name if provided
    if (data.displayName && userCredential.user) {
      await updateProfile(userCredential.user, {
        displayName: data.displayName,
      });
    }
    
    return mapFirebaseUser(userCredential.user);
  } catch (error: any) {
    throw new Error(getAuthErrorMessage(error.code));
  }
};

/**
 * Sign in an existing user with email and password
 */
export const signIn = async (data: SignInData): Promise<AuthUser> => {
  try {
    const userCredential: UserCredential = await signInWithEmailAndPassword(
      auth,
      data.email,
      data.password
    );
    return mapFirebaseUser(userCredential.user);
  } catch (error: any) {
    throw new Error(getAuthErrorMessage(error.code));
  }
};

/**
 * Check if Google Sign-In is available (development build required)
 */
export const isGoogleSignInAvailable = (): boolean => {
  return googleSignInAvailable;
};

/**
 * Sign in with Google
 */
export const signInWithGoogle = async (): Promise<AuthUser> => {
  // Check if Google Sign-In is available
  if (!googleSignInAvailable || !GoogleSignin) {
    throw new Error(
      'Google Sign-In is not available. ' +
      'Please use a development build instead of Expo Go.'
    );
  }
  
  try {
    // Check if device supports Google Play Services
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    
    // Get the users ID token
    const signInResult = await GoogleSignin.signIn();
    
    // Get the ID token
    const idToken = signInResult.data?.idToken;
    
    if (!idToken) {
      throw new Error('No ID token returned from Google Sign-In');
    }
    
    // Create a Google credential with the token
    const googleCredential = GoogleAuthProvider.credential(idToken);
    
    // Sign-in the user with the credential
    const userCredential = await signInWithCredential(auth, googleCredential);
    
    return mapFirebaseUser(userCredential.user);
  } catch (error: any) {
    if (statusCodes && error.code === statusCodes.SIGN_IN_CANCELLED) {
      throw new Error('Google Sign-In was cancelled');
    } else if (statusCodes && error.code === statusCodes.IN_PROGRESS) {
      throw new Error('Google Sign-In is already in progress');
    } else if (statusCodes && error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
      throw new Error('Google Play Services is not available on this device');
    } else {
      throw new Error(error.message || 'Failed to sign in with Google');
    }
  }
};

/**
 * Sign out the current user (including Google sign-out)
 */
export const signOut = async (): Promise<void> => {
  try {
    // Sign out from Google if available and signed in
    if (googleSignInAvailable && GoogleSignin) {
      try {
        const isSignedIn = await GoogleSignin.isSignedIn();
        if (isSignedIn) {
          await GoogleSignin.signOut();
        }
      } catch (googleError) {
        // Ignore Google sign-out errors, still proceed with Firebase sign-out
        console.warn('Google sign-out error (non-critical):', googleError);
      }
    }
    
    // Sign out from Firebase
    await firebaseSignOut(auth);
  } catch (error: any) {
    throw new Error(getAuthErrorMessage(error.code));
  }
};

/**
 * Send password reset email
 */
export const resetPassword = async (email: string): Promise<void> => {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error: any) {
    throw new Error(getAuthErrorMessage(error.code));
  }
};

/**
 * Get the currently authenticated user
 */
export const getCurrentUser = (): AuthUser | null => {
  const user = auth.currentUser;
  return user ? mapFirebaseUser(user) : null;
};

/**
 * Subscribe to authentication state changes
 */
export const subscribeToAuthChanges = (
  callback: (user: AuthUser | null) => void
): (() => void) => {
  return onAuthStateChanged(auth, (user: User | null) => {
    callback(user ? mapFirebaseUser(user) : null);
  });
};

/**
 * Update user profile
 */
export const updateUserProfile = async (
  displayName?: string,
  photoURL?: string
): Promise<void> => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('No authenticated user');
  }
  
  try {
    await updateProfile(user, {
      displayName: displayName ?? user.displayName,
      photoURL: photoURL ?? user.photoURL,
    });
  } catch (error: any) {
    throw new Error(getAuthErrorMessage(error.code));
  }
};

/**
 * Check if user is signed in with Google
 */
export const isGoogleSignedIn = async (): Promise<boolean> => {
  if (!googleSignInAvailable || !GoogleSignin) {
    return false;
  }
  
  try {
    return await GoogleSignin.isSignedIn();
  } catch {
    return false;
  }
};

/**
 * Get user-friendly error messages for Firebase Auth errors
 */
const getAuthErrorMessage = (errorCode: string): string => {
  const errorMessages: Record<string, string> = {
    'auth/email-already-in-use': 'This email is already registered. Please sign in instead.',
    'auth/invalid-email': 'Please enter a valid email address.',
    'auth/operation-not-allowed': 'Email/password sign-in is not enabled.',
    'auth/weak-password': 'Password should be at least 6 characters.',
    'auth/user-disabled': 'This account has been disabled.',
    'auth/user-not-found': 'No account found with this email.',
    'auth/wrong-password': 'Incorrect password. Please try again.',
    'auth/too-many-requests': 'Too many failed attempts. Please try again later.',
    'auth/network-request-failed': 'Network error. Please check your connection.',
    'auth/invalid-credential': 'Invalid credentials. Please check your email and password.',
    'auth/account-exists-with-different-credential': 'An account already exists with the same email address but different sign-in credentials.',
  };
  
  return errorMessages[errorCode] || 'An authentication error occurred. Please try again.';
};
