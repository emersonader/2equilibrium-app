import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

const BIOMETRIC_CREDENTIALS_KEY = 'biometric_credentials';
const BIOMETRIC_ENABLED_KEY = 'biometric_enabled';

export type BiometricType = 'face' | 'fingerprint' | 'iris' | 'none';

/**
 * Check if biometric authentication is supported on the device
 */
export async function isBiometricSupported(): Promise<boolean> {
  const compatible = await LocalAuthentication.hasHardwareAsync();
  if (!compatible) return false;

  const enrolled = await LocalAuthentication.isEnrolledAsync();
  return enrolled;
}

/**
 * Get the type of biometric authentication available
 */
export async function getBiometricType(): Promise<BiometricType> {
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
