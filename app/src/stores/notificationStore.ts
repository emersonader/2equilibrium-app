import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as notificationService from '@/services/notificationService';

interface NotificationState {
  // State
  reminderEnabled: boolean;
  reminderHour: number;
  reminderMinute: number;
  permissionGranted: boolean;
  isInitialized: boolean;

  // Actions
  initializeNotifications: () => Promise<void>;
  toggleReminder: () => Promise<void>;
  setReminderTime: (hour: number, minute: number) => Promise<void>;
  refreshPermissionStatus: () => Promise<void>;
  requestPermissions: () => Promise<boolean>;
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      // Initial state
      reminderEnabled: true,
      reminderHour: 8, // 8:00 AM default
      reminderMinute: 0,
      permissionGranted: false,
      isInitialized: false,

      // Initialize notifications on app start
      initializeNotifications: async () => {
        try {
          // Load saved settings
          const settings = await notificationService.getReminderSettings();
          
          // Check permissions
          const hasPermission = await notificationService.checkPermissions();
          
          set({
            reminderEnabled: settings.enabled,
            reminderHour: settings.hour,
            reminderMinute: settings.minute,
            permissionGranted: hasPermission,
            isInitialized: true,
          });

          // If enabled and has permission, schedule the reminder
          if (settings.enabled && hasPermission) {
            await notificationService.scheduleDailyReminder(settings.hour, settings.minute);
          }
          
          console.log('Notifications initialized:', { settings, hasPermission });
        } catch (error) {
          console.error('Failed to initialize notifications:', error);
          set({ isInitialized: true });
        }
      },

      // Toggle reminder on/off
      toggleReminder: async () => {
        const { reminderEnabled, reminderHour, reminderMinute, permissionGranted } = get();
        const newEnabled = !reminderEnabled;

        try {
          if (newEnabled && !permissionGranted) {
            // Request permissions if enabling for the first time
            const granted = await notificationService.initNotifications();
            if (!granted) {
              console.log('Notification permissions not granted');
              return;
            }
            set({ permissionGranted: true });
          }

          if (newEnabled && permissionGranted) {
            // Enable - schedule the reminder
            const success = await notificationService.scheduleDailyReminder(reminderHour, reminderMinute);
            if (success) {
              await notificationService.saveReminderSettings(true, reminderHour, reminderMinute);
              set({ reminderEnabled: true });
            }
          } else {
            // Disable - cancel the reminder
            await notificationService.cancelDailyReminder();
            await notificationService.saveReminderSettings(false, reminderHour, reminderMinute);
            set({ reminderEnabled: false });
          }
          
          console.log('Reminder toggled:', newEnabled);
        } catch (error) {
          console.error('Failed to toggle reminder:', error);
        }
      },

      // Set reminder time
      setReminderTime: async (hour: number, minute: number) => {
        const { reminderEnabled, permissionGranted } = get();

        try {
          set({ reminderHour: hour, reminderMinute: minute });
          
          // Save settings
          await notificationService.saveReminderSettings(reminderEnabled, hour, minute);
          
          // If enabled and has permission, reschedule with new time
          if (reminderEnabled && permissionGranted) {
            const success = await notificationService.updateReminderTime(hour, minute);
            if (!success) {
              console.error('Failed to reschedule reminder with new time');
            }
          }
          
          console.log('Reminder time updated:', { hour, minute });
        } catch (error) {
          console.error('Failed to set reminder time:', error);
        }
      },

      // Refresh permission status
      refreshPermissionStatus: async () => {
        try {
          const hasPermission = await notificationService.checkPermissions();
          set({ permissionGranted: hasPermission });
          
          // If lost permission and reminder was enabled, disable it
          if (!hasPermission && get().reminderEnabled) {
            await notificationService.cancelDailyReminder();
            set({ reminderEnabled: false });
          }
        } catch (error) {
          console.error('Failed to refresh permission status:', error);
        }
      },

      // Request permissions explicitly
      requestPermissions: async () => {
        try {
          const granted = await notificationService.initNotifications();
          set({ permissionGranted: granted });
          
          // If just granted and reminder is enabled, schedule it
          if (granted && get().reminderEnabled) {
            const { reminderHour, reminderMinute } = get();
            await notificationService.scheduleDailyReminder(reminderHour, reminderMinute);
          }
          
          return granted;
        } catch (error) {
          console.error('Failed to request permissions:', error);
          return false;
        }
      },
    }),
    {
      name: 'notification-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        // Persist these fields
        reminderEnabled: state.reminderEnabled,
        reminderHour: state.reminderHour,
        reminderMinute: state.reminderMinute,
      }),
    }
  )
);

export default useNotificationStore;