import React, { useState } from 'react';
import { StyleSheet, ActivityIndicator } from 'react-native';
import { Button } from '@/components/ui/Button';
import { Colors } from '@/constants/colors';

interface FollowButtonProps {
  isFollowing: boolean;
  onPress: () => Promise<void>;
  size?: 'sm' | 'md';
  disabled?: boolean;
}

export function FollowButton({
  isFollowing,
  onPress,
  size = 'sm',
  disabled = false,
}: FollowButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handlePress = async () => {
    if (isLoading || disabled) return;

    setIsLoading(true);
    try {
      await onPress();
    } catch (error) {
      console.error('Follow action failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      title={isFollowing ? 'Following' : 'Follow'}
      variant={isFollowing ? 'outline' : 'primary'}
      size={size}
      onPress={handlePress}
      disabled={disabled || isLoading}
      loading={isLoading}
      style={[
        styles.button,
        isFollowing && styles.followingButton,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  button: {
    minWidth: 90,
  },
  followingButton: {
    borderColor: Colors.neutral.gray300,
  },
});

export default FollowButton;
