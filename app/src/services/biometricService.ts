import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const BIOMETRIC_CREDENTIALS_KEY = 'biometric_credentials';
const BIOMETRIC_ENABLED_KEY = 'biometric_enabled';

export type BiometricType = 'face' | 'fingerprint' | 'iris' | 'none';

// Cache the module and its availability
let LocalAuthModule: typeof import('expo-local-authentication') | null = null;
let moduleChecked = false;
let moduleAvailable = false;

/**
 * Try to load the LocalAuthentication module
 */
async function loadLocalAuthModule(): Promise<typeof import('expo-local-authentication') | null> {
  if (moduleChecked) {
    return LocalAuthModule;
  }

  try {
    const mod = require('expo-local-authentication');
    // Test if it actually works by calling a simple function
    await mod.hasHardwareAsync();
    LocalAuthModule = mod;
    moduleAvailable = true;
    console.log('Biometric module loaded successfully');
  } catch (error) {
    console.log('Biometric module not available:', error);
    LocalAuthModule = null;
    moduleAvailable = false;
  }

  moduleChecked = true;
  return LocalAuthModule;
}

/**
 * Check if biometric authentication is supported on the device
 */
export async function isBiometricSupported(): Promise<boolean> {
  const LocalAuthentication = await loadLocalAuthModule();
  if (!LocalAuthentication) {
    return false;
  }

  try {
    const compatible = await LocalAuthentication.hasHardwareAsync();
    console.log('Biometric: Has hardware:', compatible);
    if (!compatible) return false;

    const enrolled = await LocalAuthentication.isEnrolledAsync();
    console.log('Biometric: Is enrolled:', enrolled);
    return enrolled;
  } catch (error) {
    console.log('Biometric check failed:', error);
    return false;
  }
}

/**
 * Get the type of biometric authentication available
 */
export async function getBiometricType(): Promise<BiometricType> {
  const LocalAuthentication = await loadLocalAuthModule();
  if (!LocalAuthentication) {
    return 'none';
  }

  try {
    const types = await LocalAuthentication.supportedAuthenticationTypesAsync();

    if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
      return 'face';
    }
    if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
      return 'fingerprint';
    }
    if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) {
      return 'iris';
    }
  } catch (error) {
    console.log('Failed to get biometric type:', error);
  }
  return 'none';
}

/**
 * Get user-friendly label for biometric type
 */
export async function getBiometricLabel(): Promise<string> {
  const type = await getBiometricType();
  switch (type) {
    case 'face':
      return 'Face ID';
    case 'fingerprint':
      return 'Fingerprint';
    case 'iris':
      return 'Iris';
    default:
      return 'Biometric';
  }
}

/**
 * Authenticate user with biometrics
 */
export async function authenticateWithBiometrics(
  promptMessage?: string
): Promise<{ success: boolean; error?: string }> {
  const LocalAuthentication = await loadLocalAuthModule();
  if (!LocalAuthentication) {
    return { success: false, error: 'Biometrics not available' };
  }

  try {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: promptMessage || 'Authenticate to continue',
      fallbackLabel: 'Use passcode',
      cancelLabel: 'Cancel',
      disableDeviceFallback: false,
    });

    if (result.success) {
      return { success: true };
    }

    return {
      success: false,
      error: result.error || 'Authentication failed',
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Save credentials for biometric login
 */
export async function saveBiometricCredentials(
  email: string,
  password: string
): Promise<boolean> {
  try {
    const credentials = JSON.stringify({ email, password });
    await SecureStore.setItemAsync(BIOMETRIC_CREDENTIALS_KEY, credentials);
    await SecureStore.setItemAsync(BIOMETRIC_ENABLED_KEY, 'true');
    return true;
  } catch (error) {
    console.error('Failed to save biometric credentials:', error);
    return false;
  }
}

/**
 * Get stored biometric credentials
 */
export async function getBiometricCredentials(): Promise<{
  email: string;
  password: string;
} | null> {
  try {
    const credentials = await SecureStore.getItemAsync(BIOMETRIC_CREDENTIALS_KEY);
    if (!credentials) return null;

    return JSON.parse(credentials);
  } catch (error) {
    console.error('Failed to get biometric credentials:', error);
    return null;
  }
}

/**
 * Clear stored biometric credentials
 */
export async function clearBiometricCredentials(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(BIOMETRIC_CREDENTIALS_KEY);
    await SecureStore.deleteItemAsync(BIOMETRIC_ENABLED_KEY);
  } catch (error) {
    console.error('Failed to clear biometric credentials:', error);
  }
}

/**
 * Check if biometric login is enabled
 */
export async function isBiometricEnabled(): Promise<boolean> {
  try {
    const enabled = await SecureStore.getItemAsync(BIOMETRIC_ENABLED_KEY);
    return enabled === 'true';
  } catch (error) {
    return false;
  }
}

/**
 * Check if biometric login is available (supported + enabled + has credentials)
 */
export async function isBiometricLoginAvailable(): Promise<boolean> {
  const supported = await isBiometricSupported();
  if (!supported) return false;

  const enabled = await isBiometricEnabled();
  if (!enabled) return false;

  const credentials = await getBiometricCredentials();
  return credentials !== null;
}
