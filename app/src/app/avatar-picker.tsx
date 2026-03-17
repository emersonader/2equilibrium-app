import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants';
import { AVATARS, getAvatarById } from '@/constants/avatars';
import { Button } from '@/components/ui';
import { useUserStore } from '@/stores';

const NUM_COLUMNS = 4;
const AVATAR_SIZE = 76;

export default function AvatarPickerScreen() {
  const router = useRouter();
  const { profile, updateAvatarId } = useUserStore();
  const [selectedId, setSelectedId] = useState(profile?.avatar_id ?? 1);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateAvatarId(selectedId);
      router.back();
    } catch (error) {
      console.error('Failed to save avatar:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="close" size={24} color={Colors.text.primary} />
        </Pressable>
        <Text style={styles.title}>Choose Avatar</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Preview */}
      <View style={styles.preview}>
        <Image
          source={getAvatarById(selectedId).source}
          style={styles.previewImage}
          resizeMode="cover"
        />
        <Text style={styles.previewText}>Tap to select your character</Text>
      </View>

      {/* Grid */}
      <FlatList
        data={AVATARS}
        numColumns={NUM_COLUMNS}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.grid}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const isSelected = item.id === selectedId;
          return (
            <Pressable
              style={[styles.avatarCell, isSelected && styles.avatarCellSelected]}
              onPress={() => setSelectedId(item.id)}
            >
              <Image
                source={item.source}
                style={styles.avatarImage}
                resizeMode="cover"
              />
              {isSelected && (
                <View style={styles.checkmark}>
                  <Ionicons name="checkmark-circle" size={20} color={Colors.primary.tiffanyBlue} />
                </View>
              )}
            </Pressable>
          );
        }}
      />

      {/* Save Button */}
      <View style={styles.footer}>
        <Button
          title="Save Avatar"
          onPress={handleSave}
          loading={saving}
          fullWidth
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.ui.border,
  },
  title: {
    ...Typography.h4,
    color: Colors.text.primary,
  },
  preview: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  previewImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: Colors.primary.tiffanyBlue,
  },
  previewText: {
    ...Typography.bodySmall,
    color: Colors.text.secondary,
    marginTop: Spacing.sm,
  },
  grid: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  avatarCell: {
    flex: 1,
    aspectRatio: 1,
    margin: Spacing.xs,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
    backgroundColor: Colors.background.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarCellSelected: {
    borderColor: Colors.primary.tiffanyBlue,
    backgroundColor: Colors.primary.tiffanyBlueLight,
  },
  avatarImage: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
  },
  checkmark: {
    position: 'absolute',
    bottom: 4,
    right: 4,
  },
  footer: {
    padding: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.ui.border,
  },
});
