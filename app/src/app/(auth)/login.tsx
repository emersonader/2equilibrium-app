import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Pressable,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, Layout } from '@/constants';
import { Button } from '@/components/ui';
import { useUserStore } from '@/stores/userStore';
import { ensureProfileExists } from '@/services/authService';
import * as biometricService from '@/services/biometricService';

export default function LoginScreen() {
  const router = useRouter();
  const { signIn } = useUserStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Biometric state
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricLabel, setBiometricLabel] = useState('Biometric');
  const [biometricType, setBiometricType] = useState<'face' | 'fingerprint' | 'iris' | 'none'>('none');

  // Check if biometric login is available on mount
  useEffect(() => {
    checkBiometricAvailability();
  }, []);

  const checkBiometricAvailability = async () => {
    const available = await biometricService.isBiometricLoginAvailable();
    setBiometricAvailable(available);

    if (available) {
      const label = await biometricService.getBiometricLabel();
      setBiometricLabel(label);
      const type = await biometricService.getBiometricType();
      setBiometricType(type);
    }
  };

  const handleBiometricLogin = async () => {
    setIsLoading(true);
    try {
      // Authenticate with biometrics
      const authResult = await biometricService.authenticateWithBiometrics(
        `Sign in with ${biometricLabel}`
      );

      if (!authResult.success) {
        if (authResult.error !== 'user_cancel') {
          Alert.alert('Authentication Failed', authResult.error || 'Please try again');
        }
        setIsLoading(false);
        return;
      }

      // Get stored credentials
      const credentials = await biometricService.getBiometricCredentials();
      if (!credentials) {
        Alert.alert('Error', 'No saved credentials found. Please sign in with email and password.');
        setIsLoading(false);
        return;
      }

      // Sign in with stored credentials
      await signIn(credentials.email, credentials.password);
      await ensureProfileExists();
      router.replace('/(tabs)');
    } catch (error: any) {
      Alert.alert(
        'Login Failed',
        error.message || 'Please check your credentials and try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleLogin = async () => {
    const trimmedEmail = email.trim();

    if (!trimmedEmail || !password.trim()) {
      Alert.alert('Missing Information', 'Please enter both email and password.');
      return;
    }

    if (!isValidEmail(trimmedEmail)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }

    setIsLoading(true);
    try {
      await signIn(trimmedEmail, password);

      // Ensure profile exists after login
      await ensureProfileExists();

      router.replace('/(tabs)');
    } catch (error: any) {
      Alert.alert(
        'Login Failed',
        error.message || 'Please check your credentials and try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.logo}>2Equilibrium</Text>
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>
              Continue your wellness journey
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {/* Email Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your email"
                placeholderTextColor={Colors.text.muted}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading}
              />
            </View>

            {/* Password Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Enter your password"
                  placeholderTextColor={Colors.text.muted}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isLoading}
                />
                <Pressable
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.showPasswordButton}
                >
                  <Text style={styles.showPasswordText}>
                    {showPassword ? 'Hide' : 'Show'}
                  </Text>
                </Pressable>
              </View>
            </View>

            {/* Forgot Password */}
            <Pressable
              onPress={() => router.push('/(auth)/forgot-password')}
              style={styles.forgotButton}
            >
              <Text style={styles.forgotText}>Forgot password?</Text>
            </Pressable>

            {/* Login Button */}
            <Button
              title="Sign In"
              onPress={handleLogin}
              loading={isLoading}
              fullWidth
              style={styles.loginButton}
            />

            {/* Biometric Login */}
            {biometricAvailable && (
              <>
                <View style={styles.divider}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>or</Text>
                  <View style={styles.dividerLine} />
                </View>
                <Pressable
                  onPress={handleBiometricLogin}
                  disabled={isLoading}
                  style={({ pressed }) => [
                    styles.biometricButton,
                    pressed && styles.biometricButtonPressed,
                  ]}
                >
                  <Ionicons
                    name={biometricType === 'face' ? 'scan-outline' : 'finger-print-outline'}
                    size={28}
                    color={Colors.primary.orange}
                  />
                  <Text style={styles.biometricText}>
                    Sign in with {biometricLabel}
                  </Text>
                </Pressable>
              </>
            )}
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account?</Text>
            <Pressable onPress={() => router.push('/(auth)/signup')}>
              <Text style={styles.signupLink}>Sign Up</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: Layout.screenPaddingHorizontal,
    justifyContent: 'center',
  },

  // Header
  header: {
    alignItems: 'center',
    marginBottom: Spacing['3xl'],
  },
  logo: {
    ...Typography.h3,
    color: Colors.primary.orange,
    marginBottom: Spacing.lg,
  },
  title: {
    ...Typography.h1,
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    ...Typography.body,
    color: Colors.text.secondary,
    textAlign: 'center',
  },

  // Form
  form: {
    marginBottom: Spacing['3xl'],
  },
  inputGroup: {
    marginBottom: Spacing.lg,
  },
  label: {
    ...Typography.bodySmall,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
  },
  input: {
    height: Layout.inputHeight,
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.base,
    ...Typography.body,
    color: Colors.text.primary,
    borderWidth: 1,
    borderColor: Colors.ui.border,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.ui.border,
  },
  passwordInput: {
    flex: 1,
    height: Layout.inputHeight,
    paddingHorizontal: Spacing.base,
    ...Typography.body,
    color: Colors.text.primary,
  },
  showPasswordButton: {
    paddingHorizontal: Spacing.base,
  },
  showPasswordText: {
    ...Typography.bodySmall,
    color: Colors.primary.orange,
    fontWeight: '600',
  },
  forgotButton: {
    alignSelf: 'flex-end',
    marginBottom: Spacing.xl,
  },
  forgotText: {
    ...Typography.bodySmall,
    color: Colors.primary.orange,
    fontWeight: '500',
  },
  loginButton: {
    marginTop: Spacing.md,
  },

  // Biometric login
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.xl,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.ui.border,
  },
  dividerText: {
    ...Typography.bodySmall,
    color: Colors.text.muted,
    marginHorizontal: Spacing.base,
  },
  biometricButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.base,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.primary.orange,
    backgroundColor: Colors.background.primary,
  },
  biometricButtonPressed: {
    backgroundColor: Colors.primary.orangeLight,
  },
  biometricText: {
    ...Typography.body,
    color: Colors.primary.orange,
    fontWeight: '600',
  },

  // Footer
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  footerText: {
    ...Typography.body,
    color: Colors.text.secondary,
  },
  signupLink: {
    ...Typography.body,
    color: Colors.primary.orange,
    fontWeight: '600',
  },
});
