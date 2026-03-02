import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import * as Updates from 'expo-updates';
import { BadgeUnlockModal } from '@/components/badges';
import { useBadgeStore, useNotificationStore } from '@/stores';

export default function RootLayout() {
  const { newlyEarnedBadge, clearNewlyEarnedBadge } = useBadgeStore();
  const { initializeNotifications } = useNotificationStore();

  // Initialize notifications when app starts
  useEffect(() => {
    initializeNotifications().catch(console.error);
  }, [initializeNotifications]);

  // Check for OTA updates on app start
  useEffect(() => {
    async function checkForUpdates() {
      try {
        if (!__DEV__) {
          const update = await Updates.checkForUpdateAsync();
          
          if (update.isAvailable) {
            console.log('📦 New update available, downloading...');
            await Updates.fetchUpdateAsync();
            console.log('✅ Update downloaded, reloading app...');
            await Updates.reloadAsync();
          }
        }
      } catch (error) {
        console.error('Error checking for updates:', error);
      }
    }

    checkForUpdates();
  }, []);

  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#FFFFFF' },
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="lesson/[id]" />
        <Stack.Screen name="chapter/[id]" />
        <Stack.Screen name="journal-entry/[lessonId]" />
        <Stack.Screen name="badges" />
      </Stack>

      {/* Global Badge Unlock Modal */}
      <BadgeUnlockModal
        visible={!!newlyEarnedBadge}
        badge={newlyEarnedBadge}
        onDismiss={clearNewlyEarnedBadge}
      />
    </>
  );
}
