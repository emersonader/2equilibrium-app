import { Stack } from 'expo-router';
import { Colors } from '@/constants/colors';

export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.background.primary },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="goals" />
      <Stack.Screen name="experience" />
      <Stack.Screen name="notifications" />
      <Stack.Screen name="subscription" />
    </Stack>
  );
}
