import React, { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants';
import { Card, Button } from '@/components/ui';
import { useHealthStore } from '@/stores';
import * as healthConnectService from '@/services/healthConnectService';

interface HealthConnectSectionProps {
  useImperialUnits?: boolean;
}

export function HealthConnectSection({ useImperialUnits = false }: HealthConnectSectionProps) {
  const {
    healthConnectAvailable,
    healthConnectConnected,
    healthData,
    isSyncing,
    isLoading,
    checkHealthConnectAvailability,
    connectHealthService,
    disconnectHealthService,
    syncHealthData,
  } = useHealthStore();

  // Check availability on mount and focus
  useFocusEffect(
    useCallback(() => {
      checkHealthConnectAvailability();
    }, [])
  );

  // Auto-sync when connected and focused
  useFocusEffect(
    useCallback(() => {
      if (healthConnectConnected) {
        syncHealthData();
      }
    }, [healthConnectConnected])
  );

  const serviceName = healthConnectService.getHealthServiceName();
  const serviceIcon = Platform.OS === 'ios' ? 'heart' : 'fitness';

  const handleConnect = async () => {
    const success = await connectHealthService();
    if (!success) {
      Alert.alert(
        'Connection Failed',
        `Unable to connect to ${serviceName}. Please make sure ${serviceName} is installed and try again.`,
        [{ text: 'OK' }]
      );
    }
  };

  const handleDisconnect = () => {
    Alert.alert(
      `Disconnect ${serviceName}`,
      'Are you sure you want to disconnect? Your health data will no longer sync automatically.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: disconnectHealthService,
        },
      ]
    );
  };

  const formatLastSynced = (isoString: string | null) => {
    if (!isoString) return 'Never';
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return date.toLocaleDateString();
  };

  // Not available on this platform/device
  if (!healthConnectAvailable) {
    return (
      <Card variant="outlined" style={styles.unavailableCard}>
        <Ionicons name={serviceIcon as any} size={32} color={Colors.text.muted} />
        <Text style={styles.unavailableTitle}>{serviceName} Not Available</Text>
        <Text style={styles.unavailableText}>
          {Platform.OS === 'ios'
            ? 'Apple Health is not available on this device.'
            : 'Health Connect is not installed. Install it from the Play Store to sync your health data.'}
        </Text>
      </Card>
    );
  }

  // Not connected - show connect prompt
  if (!healthConnectConnected) {
    return (
      <Card variant="elevated" style={styles.connectCard}>
        <View style={styles.connectHeader}>
          <View style={styles.serviceIcon}>
            <Ionicons
              name={serviceIcon as any}
              size={28}
              color={Platform.OS === 'ios' ? '#FF2D55' : '#4CAF50'}
            />
          </View>
          <View style={styles.connectInfo}>
            <Text style={styles.connectTitle}>Connect to {serviceName}</Text>
            <Text style={styles.connectSubtitle}>
              Auto-sync steps, sleep, heart rate & more
            </Text>
          </View>
        </View>

        <View style={styles.benefitsList}>
          <BenefitItem icon="footsteps-outline" text="Track daily steps automatically" />
          <BenefitItem icon="moon-outline" text="Monitor sleep patterns" />
          <BenefitItem icon="heart-outline" text="View heart rate data" />
          <BenefitItem icon="flame-outline" text="See calories burned" />
        </View>

        <Button
          title={`Connect ${serviceName}`}
          onPress={handleConnect}
          loading={isLoading}
          fullWidth
          style={styles.connectButton}
        />
      </Card>
    );
  }

  // Connected - show health data
  return (
    <View style={styles.container}>
      {/* Connection Status Card */}
      <Card variant="default" style={styles.statusCard}>
        <View style={styles.statusHeader}>
          <View style={styles.statusLeft}>
            <View style={[styles.statusIcon, styles.statusIconConnected]}>
              <Ionicons
                name={serviceIcon as any}
                size={20}
                color={Platform.OS === 'ios' ? '#FF2D55' : '#4CAF50'}
              />
            </View>
            <View>
              <Text style={styles.statusTitle}>{serviceName}</Text>
              <Text style={styles.statusSubtitle}>
                Last synced: {formatLastSynced(healthData?.lastSynced || null)}
              </Text>
            </View>
          </View>
          <Pressable
            onPress={syncHealthData}
            disabled={isSyncing}
            style={styles.syncButton}
          >
            {isSyncing ? (
              <ActivityIndicator size="small" color={Colors.primary.tiffanyBlue} />
            ) : (
              <Ionicons name="refresh" size={20} color={Colors.primary.tiffanyBlue} />
            )}
          </Pressable>
        </View>
      </Card>

      {/* Health Metrics Grid */}
      <View style={styles.metricsGrid}>
        <HealthMetricCard
          icon="footsteps"
          label="Steps"
          value={healthData?.steps?.toLocaleString() || '--'}
          color="#FF9500"
        />
        <HealthMetricCard
          icon="moon"
          label="Sleep"
          value={healthConnectService.formatSleepHours(healthData?.sleepHours ?? null)}
          color="#5856D6"
        />
        <HealthMetricCard
          icon="heart"
          label="Heart Rate"
          value={healthData?.heartRate ? `${healthData.heartRate} bpm` : '--'}
          color="#FF2D55"
        />
        <HealthMetricCard
          icon="flame"
          label="Calories"
          value={healthData?.activeCalories?.toLocaleString() || '--'}
          suffix="kcal"
          color="#FF3B30"
        />
        <HealthMetricCard
          icon="walk"
          label="Distance"
          value={healthConnectService.formatDistance(healthData?.distance ?? null, useImperialUnits)}
          color="#34C759"
        />
        <HealthMetricCard
          icon="scale"
          label="Weight"
          value={healthData?.weight ? `${healthData.weight} kg` : '--'}
          color="#007AFF"
        />
      </View>

      {/* Disconnect Option */}
      <Pressable onPress={handleDisconnect} style={styles.disconnectButton}>
        <Ionicons name="unlink-outline" size={18} color={Colors.text.muted} />
        <Text style={styles.disconnectText}>Disconnect {serviceName}</Text>
      </Pressable>
    </View>
  );
}

// Helper components
function BenefitItem({ icon, text }: { icon: string; text: string }) {
  return (
    <View style={styles.benefitItem}>
      <Ionicons name={icon as any} size={18} color={Colors.primary.tiffanyBlue} />
      <Text style={styles.benefitText}>{text}</Text>
    </View>
  );
}

function HealthMetricCard({
  icon,
  label,
  value,
  suffix,
  color,
}: {
  icon: string;
  label: string;
  value: string;
  suffix?: string;
  color: string;
}) {
  return (
    <View style={styles.metricCard}>
      <View style={[styles.metricIcon, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon as any} size={20} color={color} />
      </View>
      <Text style={styles.metricValue}>
        {value}
        {suffix && <Text style={styles.metricSuffix}> {suffix}</Text>}
      </Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.md,
  },

  // Unavailable state
  unavailableCard: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    gap: Spacing.sm,
  },
  unavailableTitle: {
    ...Typography.h5,
    color: Colors.text.secondary,
  },
  unavailableText: {
    ...Typography.bodySmall,
    color: Colors.text.muted,
    textAlign: 'center',
    paddingHorizontal: Spacing.lg,
  },

  // Connect card
  connectCard: {
    gap: Spacing.lg,
  },
  connectHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  serviceIcon: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: Colors.background.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  connectInfo: {
    flex: 1,
  },
  connectTitle: {
    ...Typography.h5,
    color: Colors.text.primary,
  },
  connectSubtitle: {
    ...Typography.bodySmall,
    color: Colors.text.secondary,
  },
  benefitsList: {
    gap: Spacing.sm,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  benefitText: {
    ...Typography.bodySmall,
    color: Colors.text.secondary,
  },
  connectButton: {
    marginTop: Spacing.sm,
  },

  // Status card
  statusCard: {
    padding: Spacing.md,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  statusIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusIconConnected: {
    backgroundColor: Colors.background.secondary,
  },
  statusTitle: {
    ...Typography.body,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  statusSubtitle: {
    ...Typography.caption,
    color: Colors.text.secondary,
  },
  syncButton: {
    padding: Spacing.sm,
  },

  // Metrics grid
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  metricCard: {
    flex: 1,
    minWidth: '30%',
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    alignItems: 'center',
    gap: Spacing.xs,
  },
  metricIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  metricValue: {
    ...Typography.h5,
    color: Colors.text.primary,
  },
  metricSuffix: {
    ...Typography.caption,
    color: Colors.text.secondary,
    fontWeight: 'normal',
  },
  metricLabel: {
    ...Typography.caption,
    color: Colors.text.secondary,
  },

  // Disconnect
  disconnectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.md,
  },
  disconnectText: {
    ...Typography.bodySmall,
    color: Colors.text.muted,
  },
});

export default HealthConnectSection;
