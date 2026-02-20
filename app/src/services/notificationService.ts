import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const NOTIFICATION_SETTINGS_KEY = 'notificationSettings';
const DAILY_REMINDER_IDENTIFIER = 'dailyWellnessReminder';

interface NotificationSettings {
  enabled: boolean;
  hour: number;
  minute: number;
}

// Encouraging messages to rotate through
const REMINDER_MESSAGES = [
  "Take a few minutes for yourself today. Your next lesson is ready.",
  "Small steps lead to big changes. Ready for today's lesson?",
  "Your wellness journey continues. Let's grow together today!",
  "A moment of self-care is waiting for you. Open your lesson!",
  "You're building something beautiful. Today's lesson is ready.",
  "Today is a fresh start. Your wellness lesson awaits.",
  "Progress happens one day at a time. Ready for today's wisdom?",
  "Your future self will thank you for this moment. Let's begin!",
  "Every lesson is a step forward. Today's journey starts now.",
  "You deserve this time for growth. Your lesson is ready!",
];

// Get a random encouraging message
const getRandomMessage = (): string => {
  const randomIndex = Math.floor(Math.random() * REMINDER_MESSAGES.length);
  return REMINDER_MESSAGES[randomIndex];
};

// Configure notification handler (may fail in Expo Go with older SDK)
try {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
} catch (e) {
  console.warn('Failed to set notification handler:', e);
}

/**
 * Initialize notifications - request permissions and configure handler
 */
export const initNotifications = async (): Promise<boolean> => {
  try {
    // Request permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Notification permissions not granted');
      return false;
    }

    // For Android, create a notification channel
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('wellness-reminders', {
        name: 'Wellness Reminders',
        description: 'Daily wellness lesson reminders',
        importance: Notifications.AndroidImportance.DEFAULT,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF8C42', // Using the app's primary orange color
        sound: 'default',
      });
    }

    return true;
  } catch (error) {
    console.error('Failed to initialize notifications:', error);
    return false;
  }
};

/**
 * Schedule a daily reminder notification
 */
export const scheduleDailyReminder = async (hour: number, minute: number): Promise<boolean> => {
  try {
    // Cancel any existing reminders first
    await cancelDailyReminder();

    // Schedule the new reminder
    const identifier = await Notifications.scheduleNotificationAsync({
      identifier: DAILY_REMINDER_IDENTIFIER,
      content: {
        title: "Your wellness lesson awaits 🌱",
        body: getRandomMessage(),
        data: {
          type: 'daily_reminder',
          screen: '/(tabs)/',
        },
      },
      trigger: {
        hour,
        minute,
        repeats: true,
      } as Notifications.CalendarTriggerInput,
    });

    console.log('Daily reminder scheduled with identifier:', identifier);
    return true;
  } catch (error) {
    console.error('Failed to schedule daily reminder:', error);
    return false;
  }
};

/**
 * Cancel the daily reminder notification
 */
export const cancelDailyReminder = async (): Promise<void> => {
  try {
    await Notifications.cancelScheduledNotificationAsync(DAILY_REMINDER_IDENTIFIER);
    console.log('Daily reminder cancelled');
  } catch (error) {
    console.error('Failed to cancel daily reminder:', error);
  }
};

/**
 * Update reminder time by rescheduling
 */
export const updateReminderTime = async (hour: number, minute: number): Promise<boolean> => {
  try {
    const success = await scheduleDailyReminder(hour, minute);
    if (success) {
      await saveReminderSettings(true, hour, minute);
    }
    return success;
  } catch (error) {
    console.error('Failed to update reminder time:', error);
    return false;
  }
};

/**
 * Get reminder settings from AsyncStorage
 */
export const getReminderSettings = async (): Promise<NotificationSettings> => {
  try {
    const settings = await AsyncStorage.getItem(NOTIFICATION_SETTINGS_KEY);
    if (settings) {
      return JSON.parse(settings);
    }
  } catch (error) {
    console.error('Failed to get reminder settings:', error);
  }

  // Default settings: enabled at 8:00 AM
  return {
    enabled: true,
    hour: 8,
    minute: 0,
  };
};

/**
 * Save reminder settings to AsyncStorage
 */
export const saveReminderSettings = async (
  enabled: boolean,
  hour: number,
  minute: number
): Promise<void> => {
  try {
    const settings: NotificationSettings = { enabled, hour, minute };
    await AsyncStorage.setItem(NOTIFICATION_SETTINGS_KEY, JSON.stringify(settings));
    console.log('Reminder settings saved:', settings);
  } catch (error) {
    console.error('Failed to save reminder settings:', error);
  }
};

/**
 * Check if notification permissions are granted
 */
export const checkPermissions = async (): Promise<boolean> => {
  try {
    const { status } = await Notifications.getPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.error('Failed to check notification permissions:', error);
    return false;
  }
};

/**
 * Get all scheduled notifications (for debugging)
 */
export const getScheduledNotifications = async () => {
  try {
    const notifications = await Notifications.getAllScheduledNotificationsAsync();
    console.log('Scheduled notifications:', notifications);
    return notifications;
  } catch (error) {
    console.error('Failed to get scheduled notifications:', error);
    return [];
  }
};

// Listen for notification responses
export const addNotificationReceivedListener = (
  listener: (notification: Notifications.Notification) => void
) => {
  return Notifications.addNotificationReceivedListener(listener);
};

export const addNotificationResponseReceivedListener = (
  listener: (response: Notifications.NotificationResponse) => void
) => {
  return Notifications.addNotificationResponseReceivedListener(listener);
};