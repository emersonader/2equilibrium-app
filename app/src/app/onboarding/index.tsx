import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Dimensions,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { Typography } from '@/constants/typography';
import { Spacing } from '@/constants/spacing';
import { Button } from '@/components/ui/Button';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function OnboardingWelcome() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Logo/Image Area */}
        <View style={styles.imageContainer}>
          <View style={styles.logoCircle}>
            <Ionicons name="leaf" size={80} color={Colors.primary.tiffanyBlue} />
          </View>
        </View>

        {/* Welcome Text */}
        <View style={styles.textContainer}>
          <Text style={styles.title}>Welcome to Your</Text>
          <Text style={styles.titleHighlight}>Wellness Journey</Text>

          <Text style={styles.subtitle}>
            A gentle, holistic approach to lasting transformation. Let's discover your path
            together.
          </Text>
        </View>

        {/* Quote */}
        <View style={styles.quoteContainer}>
          <Text style={styles.quote}>
            "The journey of a thousand miles begins with a single step."
          </Text>
          <Text style={styles.quoteAuthor}>— Lao Tzu</Text>
        </View>
      </View>

      {/* Bottom Actions */}
      <View style={styles.actions}>
        <Button
          title="Begin Your Journey"
          onPress={() => router.push('/onboarding/goals')}
          style={styles.button}
        />

        <Text style={styles.loginText}>
          Already have an account?{' '}
          <Text
            style={styles.loginLink}
            onPress={() => router.push('/(auth)/login')}
          >
            Sign In
          </Text>
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.layout.screenPadding,
    justifyContent: 'center',
  },
  imageContainer: {
    alignItems: 'center',
    marginBottom: Spacing.xxxl,
  },
  logoCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: Colors.primary.tiffanyBlueLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  title: {
    ...Typography.textStyles.h2,
    color: Colors.text.primary,
    textAlign: 'center',
  },
  titleHighlight: {
    ...Typography.textStyles.h1,
    color: Colors.primary.orange,
    textAlign: 'center',
  },
  subtitle: {
    ...Typography.textStyles.body,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  quoteContainer: {
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  quote: {
    ...Typography.textStyles.affirmation,
    color: Colors.text.secondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  quoteAuthor: {
    ...Typography.textStyles.caption,
    color: Colors.text.muted,
    marginTop: Spacing.xs,
  },
  actions: {
    padding: Spacing.layout.screenPadding,
    paddingBottom: Spacing.xxl,
  },
  button: {
    marginBottom: Spacing.md,
  },
  loginText: {
    ...Typography.textStyles.body,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  loginLink: {
    color: Colors.primary.orange,
    fontWeight: '600',
  },
});
