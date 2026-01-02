import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Types for health data
export interface HealthData {
  steps: number | null;
  distance: number | null; // in meters
  activeCalories: number | null;
  sleepHours: number | null;
  heartRate: number | null; // average BPM
  weight: number | null; // in kg
  lastSynced: string | null;
}

export interface HealthPermissions {
  steps: boolean;
  distance: boolean;
  activeCalories: boolean;
  sleep: boolean;
  heartRate: boolean;
  weight: boolean;
}

// Storage keys
const HEALTH_CONNECT_STATUS_KEY = '@health_connect_status';
const HEALTH_DATA_CACHE_KEY = '@health_data_cache';

// Platform-specific health modules
let HealthKit: any = null;
let HealthConnect: any = null;

// Load health modules
if (Platform.OS === 'ios') {
  try {
    // Use the new @kingstinct/react-native-healthkit library
    HealthKit = require('@kingstinct/react-native-healthkit');
    console.log('HealthKit module loaded successfully');
    console.log('HealthKit available functions:', Object.keys(HealthKit).slice(0, 20));
  } catch (e) {
    console.warn('Apple HealthKit not available:', e);
  }
} else if (Platform.OS === 'android') {
  try {
    HealthConnect = require('react-native-health-connect');
    console.log('Health Connect module loaded:', !!HealthConnect);
  } catch (e) {
    console.warn('Health Connect not available:', e);
  }
}

/**
 * Check if health services are available on this device
 */
export async function isHealthAvailable(): Promise<boolean> {
  console.log('Checking health availability, Platform:', Platform.OS);

  if (Platform.OS === 'ios') {
    if (!HealthKit) {
      console.log('HealthKit module not loaded');
      return false;
    }

    try {
      // Use async version for better compatibility
      const available = await HealthKit.isHealthDataAvailableAsync();
      console.log('HealthKit available:', available);
      return available;
    } catch (e) {
      console.warn('Error checking HealthKit availability:', e);
      // Try sync version as fallback
      try {
        const available = HealthKit.isHealthDataAvailable();
        console.log('HealthKit available (sync):', available);
        return available;
      } catch {
        return false;
      }
    }
  } else if (Platform.OS === 'android') {
    try {
      if (!HealthConnect) return false;
      const status = await HealthConnect.getSdkStatus();
      return status === HealthConnect.SdkAvailabilityStatus.SDK_AVAILABLE;
    } catch {
      return false;
    }
  }
  return false;
}

/**
 * Check if health connect is currently connected/authorized
 */
export async function isConnected(): Promise<boolean> {
  try {
    const status = await AsyncStorage.getItem(HEALTH_CONNECT_STATUS_KEY);
    return status === 'connected';
  } catch {
    return false;
  }
}

/**
 * Request health permissions and connect
 */
export async function connectHealth(): Promise<boolean> {
  if (Platform.OS === 'ios') {
    return connectAppleHealth();
  } else if (Platform.OS === 'android') {
    return connectGoogleHealth();
  }
  return false;
}

/**
 * Connect to Apple HealthKit (iOS)
 */
async function connectAppleHealth(): Promise<boolean> {
  if (!HealthKit) {
    console.warn('Apple HealthKit not loaded');
    return false;
  }

  try {
    // Define the permissions we need to read and write
    const readPermissions = [
      'HKQuantityTypeIdentifierStepCount',
      'HKQuantityTypeIdentifierDistanceWalkingRunning',
      'HKQuantityTypeIdentifierActiveEnergyBurned',
      'HKQuantityTypeIdentifierHeartRate',
      'HKQuantityTypeIdentifierBodyMass',
      'HKQuantityTypeIdentifierHeight',
      'HKCategoryTypeIdentifierSleepAnalysis',
    ];

    const writePermissions = [
      'HKQuantityTypeIdentifierBodyMass',
    ];

    console.log('Requesting HealthKit authorization...');

    // Request authorization using the new library
    const authorized = await HealthKit.requestAuthorization(readPermissions, writePermissions);

    console.log('HealthKit authorization result:', authorized);

    if (authorized) {
      await AsyncStorage.setItem(HEALTH_CONNECT_STATUS_KEY, 'connected');
      return true;
    }

    return false;
  } catch (error) {
    console.warn('HealthKit authorization error:', error);
    return false;
  }
}

/**
 * Connect to Google Health Connect (Android)
 */
async function connectGoogleHealth(): Promise<boolean> {
  if (!HealthConnect) {
    console.warn('Health Connect not loaded');
    return false;
  }

  try {
    // Initialize the SDK
    await HealthConnect.initialize();

    // Request permissions
    const granted = await HealthConnect.requestPermission([
      { accessType: 'read', recordType: 'Steps' },
      { accessType: 'read', recordType: 'Distance' },
      { accessType: 'read', recordType: 'ActiveCaloriesBurned' },
      { accessType: 'read', recordType: 'SleepSession' },
      { accessType: 'read', recordType: 'HeartRate' },
      { accessType: 'read', recordType: 'Weight' },
      { accessType: 'read', recordType: 'Height' },
      { accessType: 'write', recordType: 'Weight' },
    ]);

    if (granted.length > 0) {
      await AsyncStorage.setItem(HEALTH_CONNECT_STATUS_KEY, 'connected');
      return true;
    }
    return false;
  } catch (error) {
    console.warn('Health Connect error:', error);
    return false;
  }
}

/**
 * Disconnect from health services
 */
export async function disconnectHealth(): Promise<void> {
  await AsyncStorage.removeItem(HEALTH_CONNECT_STATUS_KEY);
  await AsyncStorage.removeItem(HEALTH_DATA_CACHE_KEY);
}

/**
 * Get today's health data
 */
export async function getTodayHealthData(): Promise<HealthData> {
  const defaultData: HealthData = {
    steps: null,
    distance: null,
    activeCalories: null,
    sleepHours: null,
    heartRate: null,
    weight: null,
    lastSynced: null,
  };

  const isConnectedStatus = await isConnected();
  if (!isConnectedStatus) {
    return defaultData;
  }

  if (Platform.OS === 'ios') {
    return getAppleHealthData();
  } else if (Platform.OS === 'android') {
    return getGoogleHealthData();
  }

  return defaultData;
}

/**
 * Get health data from Apple HealthKit
 */
async function getAppleHealthData(): Promise<HealthData> {
  if (!HealthKit) {
    return getDefaultHealthData();
  }

  const today = new Date();
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const startOfYesterday = new Date(startOfDay.getTime() - 24 * 60 * 60 * 1000);

  try {
    const [steps, distance, calories, sleep, heartRate, weight] = await Promise.all([
      getAppleSteps(startOfDay, today),
      getAppleDistance(startOfDay, today),
      getAppleCalories(startOfDay, today),
      getAppleSleep(startOfYesterday, today),
      getAppleHeartRate(startOfDay, today),
      getAppleWeight(),
    ]);

    const healthData: HealthData = {
      steps,
      distance,
      activeCalories: calories,
      sleepHours: sleep,
      heartRate,
      weight,
      lastSynced: new Date().toISOString(),
    };

    // Cache the data
    await AsyncStorage.setItem(HEALTH_DATA_CACHE_KEY, JSON.stringify(healthData));

    return healthData;
  } catch (error) {
    console.warn('Error fetching Apple Health data:', error);
    return getDefaultHealthData();
  }
}

// Apple HealthKit helper functions using @kingstinct/react-native-healthkit
async function getAppleSteps(startDate: Date, endDate: Date): Promise<number | null> {
  try {
    const stats = await HealthKit.queryStatisticsForQuantity(
      'HKQuantityTypeIdentifierStepCount',
      {
        from: startDate,
        to: endDate,
      },
      {
        mostRecentQuantityDateInterval: undefined,
        statisticsOptions: ['cumulativeSum'],
      }
    );

    if (stats?.sumQuantity?.quantity) {
      return Math.round(stats.sumQuantity.quantity);
    }
    return null;
  } catch (e) {
    console.warn('Error getting steps:', e);
    return null;
  }
}

async function getAppleDistance(startDate: Date, endDate: Date): Promise<number | null> {
  try {
    const stats = await HealthKit.queryStatisticsForQuantity(
      'HKQuantityTypeIdentifierDistanceWalkingRunning',
      {
        from: startDate,
        to: endDate,
      },
      {
        mostRecentQuantityDateInterval: undefined,
        statisticsOptions: ['cumulativeSum'],
      }
    );

    if (stats?.sumQuantity?.quantity) {
      // Already in meters
      return Math.round(stats.sumQuantity.quantity);
    }
    return null;
  } catch (e) {
    console.warn('Error getting distance:', e);
    return null;
  }
}

async function getAppleCalories(startDate: Date, endDate: Date): Promise<number | null> {
  try {
    const stats = await HealthKit.queryStatisticsForQuantity(
      'HKQuantityTypeIdentifierActiveEnergyBurned',
      {
        from: startDate,
        to: endDate,
      },
      {
        mostRecentQuantityDateInterval: undefined,
        statisticsOptions: ['cumulativeSum'],
      }
    );

    if (stats?.sumQuantity?.quantity) {
      return Math.round(stats.sumQuantity.quantity);
    }
    return null;
  } catch (e) {
    console.warn('Error getting calories:', e);
    return null;
  }
}

async function getAppleSleep(startDate: Date, endDate: Date): Promise<number | null> {
  try {
    const samples = await HealthKit.queryCategorySamples(
      'HKCategoryTypeIdentifierSleepAnalysis',
      {
        from: startDate,
        to: endDate,
      }
    );

    if (!samples || samples.length === 0) return null;

    // Calculate total sleep time in hours
    let totalMinutes = 0;
    samples.forEach((sample: any) => {
      // Filter for actual sleep (not just in bed)
      if (sample.value === 1 || sample.value === 'asleep') {
        const start = new Date(sample.startDate);
        const end = new Date(sample.endDate);
        totalMinutes += (end.getTime() - start.getTime()) / (1000 * 60);
      }
    });

    return Math.round(totalMinutes / 60 * 10) / 10;
  } catch (e) {
    console.warn('Error getting sleep:', e);
    return null;
  }
}

async function getAppleHeartRate(startDate: Date, endDate: Date): Promise<number | null> {
  try {
    const stats = await HealthKit.queryStatisticsForQuantity(
      'HKQuantityTypeIdentifierHeartRate',
      {
        from: startDate,
        to: endDate,
      },
      {
        mostRecentQuantityDateInterval: undefined,
        statisticsOptions: ['discreteAverage'],
      }
    );

    if (stats?.averageQuantity?.quantity) {
      return Math.round(stats.averageQuantity.quantity);
    }
    return null;
  } catch (e) {
    console.warn('Error getting heart rate:', e);
    return null;
  }
}

async function getAppleWeight(): Promise<number | null> {
  try {
    // Get most recent weight sample
    const sample = await HealthKit.getMostRecentQuantitySample('HKQuantityTypeIdentifierBodyMass');

    if (sample?.quantity) {
      // Weight is in kg
      return Math.round(sample.quantity * 10) / 10;
    }
    return null;
  } catch (e) {
    console.warn('Error getting weight:', e);
    return null;
  }
}

/**
 * Get health data from Google Health Connect
 */
async function getGoogleHealthData(): Promise<HealthData> {
  if (!HealthConnect) {
    return getDefaultHealthData();
  }

  const today = new Date();
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const startOfYesterday = new Date(startOfDay.getTime() - 24 * 60 * 60 * 1000);

  const timeRangeFilter = {
    operator: 'between',
    startTime: startOfDay.toISOString(),
    endTime: today.toISOString(),
  };

  const sleepTimeRange = {
    operator: 'between',
    startTime: startOfYesterday.toISOString(),
    endTime: today.toISOString(),
  };

  try {
    const [steps, distance, calories, sleep, heartRate, weight] = await Promise.all([
      getGoogleSteps(timeRangeFilter),
      getGoogleDistance(timeRangeFilter),
      getGoogleCalories(timeRangeFilter),
      getGoogleSleep(sleepTimeRange),
      getGoogleHeartRate(timeRangeFilter),
      getGoogleWeight(),
    ]);

    const healthData: HealthData = {
      steps,
      distance,
      activeCalories: calories,
      sleepHours: sleep,
      heartRate,
      weight,
      lastSynced: new Date().toISOString(),
    };

    // Cache the data
    await AsyncStorage.setItem(HEALTH_DATA_CACHE_KEY, JSON.stringify(healthData));

    return healthData;
  } catch (error) {
    console.warn('Error fetching Google Health data:', error);
    return getDefaultHealthData();
  }
}

// Google Health Connect helper functions
async function getGoogleSteps(timeRangeFilter: any): Promise<number | null> {
  try {
    const result = await HealthConnect.readRecords('Steps', { timeRangeFilter });
    if (!result.records || result.records.length === 0) return null;
    const total = result.records.reduce((sum: number, r: any) => sum + (r.count || 0), 0);
    return total;
  } catch {
    return null;
  }
}

async function getGoogleDistance(timeRangeFilter: any): Promise<number | null> {
  try {
    const result = await HealthConnect.readRecords('Distance', { timeRangeFilter });
    if (!result.records || result.records.length === 0) return null;
    const total = result.records.reduce((sum: number, r: any) => sum + (r.distance?.inMeters || 0), 0);
    return Math.round(total);
  } catch {
    return null;
  }
}

async function getGoogleCalories(timeRangeFilter: any): Promise<number | null> {
  try {
    const result = await HealthConnect.readRecords('ActiveCaloriesBurned', { timeRangeFilter });
    if (!result.records || result.records.length === 0) return null;
    const total = result.records.reduce((sum: number, r: any) => sum + (r.energy?.inKilocalories || 0), 0);
    return Math.round(total);
  } catch {
    return null;
  }
}

async function getGoogleSleep(timeRangeFilter: any): Promise<number | null> {
  try {
    const result = await HealthConnect.readRecords('SleepSession', { timeRangeFilter });
    if (!result.records || result.records.length === 0) return null;
    let totalMinutes = 0;
    result.records.forEach((session: any) => {
      const start = new Date(session.startTime);
      const end = new Date(session.endTime);
      totalMinutes += (end.getTime() - start.getTime()) / (1000 * 60);
    });
    return Math.round(totalMinutes / 60 * 10) / 10;
  } catch {
    return null;
  }
}

async function getGoogleHeartRate(timeRangeFilter: any): Promise<number | null> {
  try {
    const result = await HealthConnect.readRecords('HeartRate', { timeRangeFilter });
    if (!result.records || result.records.length === 0) return null;
    let totalBpm = 0;
    let count = 0;
    result.records.forEach((r: any) => {
      if (r.samples) {
        r.samples.forEach((s: any) => {
          totalBpm += s.beatsPerMinute || 0;
          count++;
        });
      }
    });
    return count > 0 ? Math.round(totalBpm / count) : null;
  } catch {
    return null;
  }
}

async function getGoogleWeight(): Promise<number | null> {
  try {
    const endTime = new Date().toISOString();
    const startTime = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(); // Last 30 days
    const result = await HealthConnect.readRecords('Weight', {
      timeRangeFilter: { operator: 'between', startTime, endTime },
    });
    if (!result.records || result.records.length === 0) return null;
    // Get the most recent weight
    const latest = result.records[result.records.length - 1];
    return Math.round((latest.weight?.inKilograms || 0) * 10) / 10;
  } catch {
    return null;
  }
}

/**
 * Write weight to health services
 */
export async function writeWeight(weightKg: number): Promise<boolean> {
  const isConnectedStatus = await isConnected();
  if (!isConnectedStatus) return false;

  if (Platform.OS === 'ios') {
    return writeAppleWeight(weightKg);
  } else if (Platform.OS === 'android') {
    return writeGoogleWeight(weightKg);
  }
  return false;
}

async function writeAppleWeight(weightKg: number): Promise<boolean> {
  if (!HealthKit) return false;

  try {
    await HealthKit.saveQuantitySample(
      'HKQuantityTypeIdentifierBodyMass',
      'kg',
      weightKg,
      {
        start: new Date(),
        end: new Date(),
      }
    );
    return true;
  } catch (e) {
    console.warn('Error saving weight:', e);
    return false;
  }
}

async function writeGoogleWeight(weightKg: number): Promise<boolean> {
  if (!HealthConnect) return false;

  try {
    const now = new Date().toISOString();
    await HealthConnect.insertRecords([
      {
        recordType: 'Weight',
        time: now,
        weight: { unit: 'kilograms', value: weightKg },
      },
    ]);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get cached health data (useful when offline)
 */
export async function getCachedHealthData(): Promise<HealthData | null> {
  try {
    const cached = await AsyncStorage.getItem(HEALTH_DATA_CACHE_KEY);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch {
    // Ignore errors
  }
  return null;
}

/**
 * Get default empty health data
 */
function getDefaultHealthData(): HealthData {
  return {
    steps: null,
    distance: null,
    activeCalories: null,
    sleepHours: null,
    heartRate: null,
    weight: null,
    lastSynced: null,
  };
}

/**
 * Get the health service name for the current platform
 */
export function getHealthServiceName(): string {
  if (Platform.OS === 'ios') {
    return 'Apple Health';
  } else if (Platform.OS === 'android') {
    return 'Health Connect';
  }
  return 'Health Service';
}

/**
 * Open the health app settings
 */
export async function openHealthSettings(): Promise<void> {
  if (Platform.OS === 'android' && HealthConnect) {
    try {
      await HealthConnect.openHealthConnectSettings();
    } catch {
      // Ignore errors
    }
  }
  // iOS doesn't have a direct way to open Health settings from the app
}

/**
 * Format distance for display
 */
export function formatDistance(meters: number | null, useImperial: boolean = false): string {
  if (meters === null) return '--';

  if (useImperial) {
    const miles = meters / 1609.34;
    return `${miles.toFixed(1)} mi`;
  }

  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(1)} km`;
  }
  return `${Math.round(meters)} m`;
}

/**
 * Format sleep hours for display
 */
export function formatSleepHours(hours: number | null): string {
  if (hours === null) return '--';

  const wholeHours = Math.floor(hours);
  const minutes = Math.round((hours - wholeHours) * 60);

  if (minutes === 0) {
    return `${wholeHours}h`;
  }
  return `${wholeHours}h ${minutes}m`;
}
