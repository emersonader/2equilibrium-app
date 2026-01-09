import { Stack } from 'expo-router';
import { Colors } from '@/constants/colors';

export default function BadgesLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: Colors.background.primary,
        },
        headerTintColor: Colors.text.primary,
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: 'Badges',
          headerBackTitle: 'Back',
        }}
      />
      <Stack.Screen
        name="[id]"
        options={{
          title: 'Badge Details',
          headerBackTitle: 'Badges',
        }}
      />
    </Stack>
  );
}
