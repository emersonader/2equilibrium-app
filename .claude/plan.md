# Face ID / Biometric Authentication Implementation Plan

## Overview
Add optional biometric authentication (Face ID on iOS, fingerprint on Android) to allow users to quickly unlock the app without entering their password.

## Prerequisites
- `expo-secure-store` - Already installed (for storing credentials securely)
- `expo-local-authentication` - Needs to be installed (for biometric APIs)

## Implementation Steps

### 1. Install expo-local-authentication
```bash
cd app && npx expo install expo-local-authentication
```

### 2. Create BiometricService (`src/services/biometricService.ts`)
New service file with the following functions:
- `isBiometricSupported()` - Check if device supports biometrics
- `getBiometricType()` - Returns 'face' or 'fingerprint' for UI labels
- `authenticateWithBiometrics()` - Trigger biometric prompt
- `saveBiometricCredentials(email, password)` - Securely store credentials
- `getBiometricCredentials()` - Retrieve stored credentials
- `clearBiometricCredentials()` - Remove stored credentials
- `isBiometricEnabled()` - Check if user has enabled biometric login

### 3. Update Profile Settings Screen (`src/app/(tabs)/profile.tsx`)
Add a toggle in settings section:
- "Use Face ID / Fingerprint" toggle
- Only show if device supports biometrics
- When enabled: prompt for password confirmation, then store credentials
- When disabled: clear stored credentials

### 4. Update Login Screen (`src/app/(auth)/login.tsx`)
- Check if biometric credentials exist on mount
- If yes, show "Use Face ID" / "Use Fingerprint" button
- On biometric success: retrieve credentials, auto-login
- Keep manual email/password as fallback

### 5. Update User Store (optional enhancement)
Add `biometricEnabled` preference tracking for UI consistency.

## File Changes Summary

| File | Action | Description |
|------|--------|-------------|
| `package.json` | Modify | Add expo-local-authentication |
| `src/services/biometricService.ts` | Create | New service for biometric logic |
| `src/app/(tabs)/profile.tsx` | Modify | Add biometric toggle in settings |
| `src/app/(auth)/login.tsx` | Modify | Add biometric login option |

## Security Notes
- Credentials stored in SecureStore (encrypted, hardware-backed)
- Biometric prompt handled by OS (not app code)
- Fallback to password always available
- No credentials transmitted or logged

## Estimated Complexity
Low-medium. The expo libraries handle the heavy lifting. Main work is UI integration.
