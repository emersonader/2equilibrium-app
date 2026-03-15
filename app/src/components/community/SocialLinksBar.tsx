import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { Typography } from '@/constants/typography';
import { Spacing } from '@/constants/spacing';
import { SOCIAL_LINKS } from '@/constants/socialLinks';

interface SocialLinksBarProps {
  title?: string;
}

export function SocialLinksBar({ title = 'Join our community' }: SocialLinksBarProps) {
  const handleSocialPress = async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      }
    } catch (error) {
      console.error('Error opening social link:', error);
    }
  };

  return (
    <View style={styles.container}>
      {title && <Text style={styles.title}>{title}</Text>}
      <View style={styles.linksContainer}>
        <TouchableOpacity
          style={[styles.socialButton, styles.facebookButton]}
          onPress={() => handleSocialPress(SOCIAL_LINKS.facebook)}
          activeOpacity={0.8}
        >
          <Ionicons name="logo-facebook" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.socialButton, styles.instagramButton]}
          onPress={() => handleSocialPress(SOCIAL_LINKS.instagram)}
          activeOpacity={0.8}
        >
          <Ionicons name="logo-instagram" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: Spacing.sm,
  },
  title: {
    ...Typography.body,
    color: Colors.text.secondary,
    marginBottom: Spacing.xs,
    textAlign: 'center',
  },
  linksContainer: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  socialButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: Colors.text.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  facebookButton: {
    backgroundColor: '#1877F2', // Facebook brand color
  },
  instagramButton: {
    backgroundColor: '#E4405F', // Instagram brand color
  },
});