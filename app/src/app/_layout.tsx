import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { BadgeUnlockModal } from '@/components/badges';
import { useBadgeStore } from '@/stores';

export default function RootLayout() {
  const { newlyEarnedBadge, clearNewlyEarnedBadge } = useBadgeStore();

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
