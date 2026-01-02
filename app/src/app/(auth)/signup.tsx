import React, { useState } from 'react';
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
import { supabase } from '@/services/supabase';

export default function SignupScreen() {
  const router = useRouter();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const validateForm = () => {
    if (!fullName.trim()) {
      Alert.alert('Missing Information', 'Please enter your name.');
      return false;
    }
    if (!email.trim()) {
      Alert.alert('Missing Information', 'Please enter your email.');
      return false;
    }
    if (!password.trim()) {
      Alert.alert('Missing Information', 'Please enter a password.');
      return false;
    }
    if (password.length < 6) {
      Alert.alert('Weak Password', 'Password must be at least 6 characters.');
      return false;
    }
    if (password !== confirmPassword) {
      Alert.alert('Password Mismatch', 'Passwords do not match.');
      return false;
    }
    return true;
  };

  const handleSignup = async () => {
    if (!validateForm()) return;

    if (!supabase) {
      Alert.alert('Error', 'Supabase is not configured');
      return;
    }

    setIsLoading(true);
    console.log('Starting signup...');
    try {
      console.log('Calling signUp...');
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
          },
        },
      });
      console.log('Signup response:', JSON.stringify({ data, error }, null, 2));

      if (error) throw error;

      // Check if email confirmation is required
      if (data.user && !data.session) {
        Alert.alert(
          'Check Your Email',
          'Please check your email and click the confirmation link to complete signup.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          'Welcome!',
          'Your account has been created.',
          [{ text: 'OK', onPress: () => router.replace('/(tabs)') }]
        );
      }
    } catch (error: any) {
      console.log('Signup error:', error);
      Alert.alert(
        'Signup Failed',
        error.message || 'Please try again with different credentials.'
      );
    } finally {
      console.log('Signup finished');
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
          {/* Back Button */}
          <Pressable
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color={Colors.text.primary} />
          </Pressable>

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Begin Your Journey</Text>
            <Text style={styles.subtitle}>
              Create an account to start your wellness transformation
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {/* Full Name Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Full Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your full name"
                placeholderTextColor={Colors.text.muted}
                value={fullName}
                onChangeText={setFullName}
                autoCapitalize="words"
                autoCorrect={false}
                editable={!isLoading}
              />
            </View>

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
                  placeholder="Create a password"
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
              <Text style={styles.hint}>At least 6 characters</Text>
            </View>

            {/* Confirm Password Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Confirm Password</Text>
              <TextInput
                style={styles.input}
                placeholder="Confirm your password"
                placeholderTextColor={Colors.text.muted}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading}
              />
            </View>

            {/* Signup Button */}
            <Button
              title="Create Account"
              onPress={handleSignup}
              loading={isLoading}
              fullWidth
              style={styles.signupButton}
            />

            {/* Terms */}
            <Text style={styles.terms}>
              By creating an account, you agree to our{' '}
              <Text style={styles.termsLink}>Terms of Service</Text> and{' '}
              <Text style={styles.termsLink}>Privacy Policy</Text>
            </Text>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account?</Text>
            <Pressable onPress={() => router.push('/(auth)/login')}>
              <Text style={styles.loginLink}>Sign In</Text>
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
  },

  // Back Button
  backButton: {
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
    padding: Spacing.sm,
    marginLeft: -Spacing.sm,
    alignSelf: 'flex-start',
  },

  // Header
  header: {
    marginBottom: Spacing['2xl'],
  },
  title: {
    ...Typography.h1,
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    ...Typography.body,
    color: Colors.text.secondary,
  },

  // Form
  form: {
    marginBottom: Spacing.xl,
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
  hint: {
    ...Typography.caption,
    color: Colors.text.muted,
    marginTop: Spacing.xs,
  },
  signupButton: {
    marginTop: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  terms: {
    ...Typography.caption,
    color: Colors.text.muted,
    textAlign: 'center',
    lineHeight: 18,
  },
  termsLink: {
    color: Colors.primary.orange,
    fontWeight: '500',
  },

  // Footer
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: 'auto',
    paddingBottom: Spacing.xl,
  },
  footerText: {
    ...Typography.body,
    color: Colors.text.secondary,
  },
  loginLink: {
    ...Typography.body,
    color: Colors.primary.orange,
    fontWeight: '600',
  },
});
