import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors } from '@/constants/colors';
import { Typography } from '@/constants/typography';

interface UserAvatarProps {
  name: string;
  avatarUrl?: string | null;
  size?: 'small' | 'medium' | 'large' | 'xlarge';
  onPress?: () => void;
}

function getAvatarSize(size: 'small' | 'medium' | 'large' | 'xlarge'): number {
  switch (size) {
    case 'small':
      return 32;
    case 'medium':
      return 44;
    case 'large':
      return 64;
    case 'xlarge':
      return 96;
  }
}

function getFontSize(size: 'small' | 'medium' | 'large' | 'xlarge'): number {
  switch (size) {
    case 'small':
      return 12;
    case 'medium':
      return 16;
    case 'large':
      return 24;
    case 'xlarge':
      return 36;
  }
}

function getInitials(name: string): string {
  const parts = name.trim().split(' ');
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
}

export function UserAvatar({ name, avatarUrl, size = 'medium', onPress }: UserAvatarProps) {
  const dimension = getAvatarSize(size);
  const fontSize = getFontSize(size);
  const initials = getInitials(name);

  const content = avatarUrl ? (
    <Image
      source={{ uri: avatarUrl }}
      style={[styles.image, { width: dimension, height: dimension, borderRadius: dimension / 2 }]}
    />
  ) : (
    <View
      style={[
        styles.initialsContainer,
        { width: dimension, height: dimension, borderRadius: dimension / 2 },
      ]}
    >
      <Text style={[styles.initials, { fontSize }]}>{initials}</Text>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  image: {
    backgroundColor: Colors.neutral.gray100,
  },
  initialsContainer: {
    backgroundColor: Colors.primary.orangeLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  initials: {
    color: Colors.primary.orange,
    fontWeight: '600',
  },
});

export default UserAvatar;
