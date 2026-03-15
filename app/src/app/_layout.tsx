import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import * as Updates from 'expo-updates';
import * as SplashScreen from 'expo-splash-screen';
import { BadgeUnlockModal } from '@/components/badges';
import { useBadgeStore, useNotificationStore } from '@/stores';

let fontsLoadedGlobal = false;

try {
  const { useFonts, PlayfairDisplay_400Regular, PlayfairDisplay_700Bold } = require('@expo-google-fonts/playfair-display');
  // Will be used inside component
  var useFontsHook = useFonts;
  var fontMap = { PlayfairDisplay_400Regular, PlayfairDisplay_700Bold };
} catch (e) {
  console.warn('Playfair Display fonts not available, using system fonts');
}

// Prevent the splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { newlyEarnedBadge, clearNewlyEarnedBadge } = useBadgeStore();
  const { initializeNotifications } = useNotificationStore();

  // Load fonts (non-blocking — app works without them)
  let fontsLoaded = true;
  try {
    if (useFontsHook && fontMap) {
      const [loaded] = useFontsHook(fontMap);
      fontsLoaded = loaded;
    }
  } catch (e) {
    console.warn('Font loading failed, using system fonts');
    fontsLoaded = true;
  }

  // Hide splash screen when ready
  useEffect(() => {
    async function hideSplashScreen() {
      // Always hide splash after a timeout to prevent infinite white screen
      await SplashScreen.hideAsync();
    }
    if (fontsLoaded) {
      hideSplashScreen();
    } else {
      // Safety: hide splash after 3 seconds even if fonts haven't loaded
      const timeout = setTimeout(() => {
        SplashScreen.hideAsync();
      }, 3000);
      return () => clearTimeout(timeout);
    }
  }, [fontsLoaded]);

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
          contentStyle: { backgroundColor: '#FAFFFE' }, // cream background
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
