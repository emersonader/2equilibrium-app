import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  Alert,
  Modal,
  ScrollView,
  Switch,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants';
import { Card, Button, Badge } from '@/components/ui';
import { useHealthStore } from '@/stores';
import * as healthService from '@/services/healthService';
import type { UnitSystem, Gender } from '@/services/database.types';

interface HealthMetricsSectionProps {
  onSetupPress?: () => void;
}

export function HealthMetricsSection({ onSetupPress }: HealthMetricsSectionProps) {
  const {
    profile,
    weightHistory,
    isLoading,
    error,
    loadHealthProfile,
    loadWeightHistory,
    saveProfile,
    logWeight,
  } = useHealthStore();

  const [showSetupModal, setShowSetupModal] = useState(false);
  const [showLogWeightModal, setShowLogWeightModal] = useState(false);

  // Load data when component mounts
  useFocusEffect(
    useCallback(() => {
      loadHealthProfile();
      loadWeightHistory(10);
    }, [])
  );

  // Show loading state
  if (isLoading && !profile) {
    return (
      <Card variant="outlined" style={styles.setupCard}>
        <Text style={styles.setupDescription}>Loading health profile...</Text>
      </Card>
    );
  }

  // If tracking not enabled, show setup prompt
  if (!profile?.tracking_enabled) {
    return (
      <Card variant="outlined" style={styles.setupCard}>
        <Ionicons name="body-outline" size={40} color={Colors.primary.tiffanyBlue} />
        <Text style={styles.setupTitle}>Track Your Progress</Text>
        <Text style={styles.setupDescription}>
          Optionally track your weight, BMI, and wellness journey progress.
        </Text>
        <Button
          title="Set Up Health Tracking"
          onPress={() => setShowSetupModal(true)}
          variant="primary"
          style={styles.setupButton}
        />

        <HealthSetupModal
          visible={showSetupModal}
          onClose={() => setShowSetupModal(false)}
          onSave={async (data) => {
            try {
              await saveProfile({ ...data, trackingEnabled: true });
              setShowSetupModal(false);
            } catch (err) {
              console.error('Failed to save profile:', err);
              Alert.alert('Error', 'Failed to save health profile. Please try again.');
            }
          }}
          isLoading={isLoading}
        />
      </Card>
    );
  }

  // Safety check - if profile is somehow null here, show setup
  if (!profile) {
    return (
      <Card variant="outlined" style={styles.setupCard}>
        <Text style={styles.setupDescription}>Loading...</Text>
      </Card>
    );
  }

  // Calculate progress safely
  const progress = {
    currentWeight: profile.current_weight,
    startingWeight: profile.starting_weight,
    goalWeight: profile.goal_weight,
    currentBmi: profile.current_bmi,
    startingBmi: profile.starting_bmi,
    totalLost: profile.starting_weight && profile.current_weight
      ? profile.starting_weight - profile.current_weight
      : null,
  };

  const bmiInfo = profile.current_bmi
    ? healthService.getBMICategory(profile.current_bmi)
    : null;

  const unitSystem: UnitSystem = profile.unit_system || 'metric';

  return (
    <View style={styles.container}>
      {/* BMI Card */}
      <Card variant="elevated" style={styles.bmiCard}>
        <View style={styles.bmiHeader}>
          <Text style={styles.bmiLabel}>Current BMI</Text>
          {bmiInfo && (
            <Badge
              label={bmiInfo.category}
              variant={bmiInfo.category === 'Normal' ? 'success' : 'secondary'}
              size="sm"
            />
          )}
        </View>
        <View style={styles.bmiContent}>
          <Text style={[styles.bmiValue, bmiInfo && { color: bmiInfo.color }]}>
            {profile?.current_bmi?.toFixed(1) || '--'}
          </Text>
          <View style={styles.bmiDetails}>
            <Text style={styles.bmiDetailText}>
              Weight: {profile?.current_weight
                ? healthService.formatWeight(profile.current_weight, unitSystem)
                : '--'}
            </Text>
            <Text style={styles.bmiDetailText}>
              Height: {profile?.height
                ? healthService.formatHeight(profile.height, unitSystem)
                : '--'}
            </Text>
          </View>
        </View>
      </Card>

      {/* Progress Card */}
      {progress && progress.totalLost !== null && progress.totalLost !== 0 && (
        <Card variant="outlined" style={styles.progressCard}>
          <Text style={styles.progressTitle}>Your Progress</Text>
          <View style={styles.progressStats}>
            <View style={styles.progressStat}>
              <Text style={[
                styles.progressValue,
                { color: progress.totalLost > 0 ? Colors.status.success : Colors.status.error }
              ]}>
                {progress.totalLost > 0 ? '-' : '+'}
                {healthService.formatWeight(Math.abs(progress.totalLost), unitSystem)}
              </Text>
              <Text style={styles.progressLabel}>Total Change</Text>
            </View>
            {progress.startingWeight !== null && progress.startingWeight !== undefined && (
              <View style={styles.progressStat}>
                <Text style={styles.progressValue}>
                  {healthService.formatWeight(progress.startingWeight, unitSystem)}
                </Text>
                <Text style={styles.progressLabel}>Starting</Text>
              </View>
            )}
            {progress.goalWeight !== null && progress.goalWeight !== undefined && (
              <View style={styles.progressStat}>
                <Text style={styles.progressValue}>
                  {healthService.formatWeight(progress.goalWeight, unitSystem)}
                </Text>
                <Text style={styles.progressLabel}>Goal</Text>
              </View>
            )}
          </View>
          {progress.startingBmi && profile?.current_bmi && (
            <View style={styles.bmiProgress}>
              <Text style={styles.bmiProgressText}>
                BMI: {progress.startingBmi.toFixed(1)} → {profile.current_bmi.toFixed(1)}
              </Text>
            </View>
          )}
        </Card>
      )}

      {/* Weight History */}
      {weightHistory.length > 0 && (
        <Card variant="default" style={styles.historyCard}>
          <Text style={styles.historyTitle}>Recent Entries</Text>
          {weightHistory.slice(0, 5).map((entry, index) => (
            <View key={entry.id} style={[
              styles.historyItem,
              index < Math.min(weightHistory.length - 1, 4) && styles.historyItemBorder
            ]}>
              <View>
                <Text style={styles.historyWeight}>
                  {healthService.formatWeight(entry.weight, unitSystem)}
                </Text>
                <Text style={styles.historyDate}>
                  {new Date(entry.recorded_at).toLocaleDateString()}
                </Text>
              </View>
              {entry.bmi && (
                <Text style={styles.historyBmi}>BMI: {entry.bmi.toFixed(1)}</Text>
              )}
            </View>
          ))}
        </Card>
      )}

      {/* Actions */}
      <View style={styles.actions}>
        <Button
          title="Log Weight"
          onPress={() => setShowLogWeightModal(true)}
          variant="primary"
          style={styles.actionButton}
        />
        <Button
          title="Edit Profile"
          onPress={() => setShowSetupModal(true)}
          variant="outline"
          style={styles.actionButton}
        />
      </View>

      {/* Modals */}
      <HealthSetupModal
        visible={showSetupModal}
        onClose={() => setShowSetupModal(false)}
        onSave={async (data) => {
          await saveProfile(data);
          setShowSetupModal(false);
        }}
        isLoading={isLoading}
        existingProfile={profile}
      />

      <LogWeightModal
        visible={showLogWeightModal}
        onClose={() => setShowLogWeightModal(false)}
        onSave={async (weight, notes) => {
          await logWeight(weight, notes);
          setShowLogWeightModal(false);
        }}
        isLoading={isLoading}
        unitSystem={unitSystem}
      />
    </View>
  );
}

// Health Setup Modal
interface HealthSetupModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (data: {
    birthDate?: string;
    gender?: Gender;
    height?: number;
    currentWeight?: number;
    goalWeight?: number;
    unitSystem?: UnitSystem;
  }) => Promise<void>;
  isLoading: boolean;
  existingProfile?: any;
}

function HealthSetupModal({
  visible,
  onClose,
  onSave,
  isLoading,
  existingProfile,
}: HealthSetupModalProps) {
  const [unitSystem, setUnitSystem] = useState<UnitSystem>(
    existingProfile?.unit_system || 'metric'
  );
  const [gender, setGender] = useState<Gender | undefined>(existingProfile?.gender);
  const [birthMonth, setBirthMonth] = useState('');
  const [birthDay, setBirthDay] = useState('');
  const [birthYear, setBirthYear] = useState('');

  // Height - metric
  const [heightCm, setHeightCm] = useState(
    existingProfile?.height?.toString() || ''
  );
  // Height - imperial
  const [heightFeet, setHeightFeet] = useState('');
  const [heightInches, setHeightInches] = useState('');

  // Weight
  const [currentWeight, setCurrentWeight] = useState('');
  const [goalWeight, setGoalWeight] = useState('');

  // Initialize from existing profile
  useEffect(() => {
    if (existingProfile && visible) {
      setUnitSystem(existingProfile.unit_system || 'metric');
      setGender(existingProfile.gender);

      // Parse birth date directly from date string to avoid timezone issues
      if (existingProfile.birth_date) {
        const dateMatch = existingProfile.birth_date.match(/^(\d{4})-(\d{2})-(\d{2})/);
        if (dateMatch) {
          setBirthYear(dateMatch[1]);
          setBirthMonth(parseInt(dateMatch[2]).toString()); // Remove leading zero
          setBirthDay(parseInt(dateMatch[3]).toString()); // Remove leading zero
        }
      }

      if (existingProfile.height) {
        if (existingProfile.unit_system === 'imperial') {
          const totalInches = existingProfile.height * 0.393701;
          const { feet, inches } = healthService.inchesToFeetInches(totalInches);
          setHeightFeet(feet.toString());
          setHeightInches(inches.toString());
          setHeightCm('');
        } else {
          setHeightCm(Math.round(existingProfile.height).toString());
          setHeightFeet('');
          setHeightInches('');
        }
      }

      if (existingProfile.current_weight) {
        const weight = existingProfile.unit_system === 'imperial'
          ? existingProfile.current_weight * 2.20462
          : existingProfile.current_weight;
        setCurrentWeight(weight.toFixed(1));
      }

      if (existingProfile.goal_weight) {
        const weight = existingProfile.unit_system === 'imperial'
          ? existingProfile.goal_weight * 2.20462
          : existingProfile.goal_weight;
        setGoalWeight(weight.toFixed(1));
      }
    }
  }, [existingProfile, visible]);

  const handleSave = async () => {
    try {
      // Calculate height in user's units
      let height: number | undefined;
      if (unitSystem === 'imperial') {
        const feet = parseFloat(heightFeet) || 0;
        const inches = parseFloat(heightInches) || 0;
        height = healthService.feetInchesToInches(feet, inches);
      } else {
        height = parseFloat(heightCm) || undefined;
      }

      const weight = parseFloat(currentWeight) || undefined;
      const goal = parseFloat(goalWeight) || undefined;

      // Create birth date from month, day, year
      let birthDate: string | undefined;
      if (birthYear && birthMonth && birthDay) {
        const month = birthMonth.padStart(2, '0');
        const day = birthDay.padStart(2, '0');
        birthDate = `${birthYear}-${month}-${day}`;
      }

      await onSave({
        birthDate,
        gender,
        height,
        currentWeight: weight,
        goalWeight: goal,
        unitSystem,
      });
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save profile');
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Health Profile</Text>
          <Pressable onPress={onClose} style={styles.modalCloseButton}>
            <Ionicons name="close" size={24} color={Colors.text.primary} />
          </Pressable>
        </View>

        <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
          {/* Unit System Toggle */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Unit System</Text>
            <View style={styles.unitToggle}>
              <Pressable
                style={[
                  styles.unitOption,
                  unitSystem === 'metric' && styles.unitOptionActive
                ]}
                onPress={() => setUnitSystem('metric')}
              >
                <Text style={[
                  styles.unitOptionText,
                  unitSystem === 'metric' && styles.unitOptionTextActive
                ]}>Metric (kg/cm)</Text>
              </Pressable>
              <Pressable
                style={[
                  styles.unitOption,
                  unitSystem === 'imperial' && styles.unitOptionActive
                ]}
                onPress={() => setUnitSystem('imperial')}
              >
                <Text style={[
                  styles.unitOptionText,
                  unitSystem === 'imperial' && styles.unitOptionTextActive
                ]}>Imperial (lbs/ft)</Text>
              </Pressable>
            </View>
          </View>

          {/* Gender */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Gender</Text>
            <View style={styles.genderOptions}>
              {[
                { value: 'female' as Gender, label: 'Female' },
                { value: 'male' as Gender, label: 'Male' },
                { value: 'other' as Gender, label: 'Other' },
              ].map((option) => (
                <Pressable
                  key={option.value}
                  style={[
                    styles.genderOption,
                    gender === option.value && styles.genderOptionActive
                  ]}
                  onPress={() => setGender(option.value)}
                >
                  <Text style={[
                    styles.genderOptionText,
                    gender === option.value && styles.genderOptionTextActive
                  ]}>{option.label}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Birth Date */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Date of Birth</Text>
            <View style={styles.dateInputRow}>
              <View style={styles.dateInputGroup}>
                <TextInput
                  style={styles.dateInput}
                  value={birthMonth}
                  onChangeText={(text) => {
                    const cleaned = text.replace(/[^0-9]/g, '');
                    if (parseInt(cleaned) <= 12 || cleaned === '') {
                      setBirthMonth(cleaned);
                    }
                  }}
                  keyboardType="number-pad"
                  maxLength={2}
                />
                <Text style={styles.dateLabel}>Month</Text>
              </View>
              <Text style={styles.dateSeparator}>/</Text>
              <View style={styles.dateInputGroup}>
                <TextInput
                  style={styles.dateInput}
                  value={birthDay}
                  onChangeText={(text) => {
                    const cleaned = text.replace(/[^0-9]/g, '');
                    if (parseInt(cleaned) <= 31 || cleaned === '') {
                      setBirthDay(cleaned);
                    }
                  }}
                  keyboardType="number-pad"
                  maxLength={2}
                />
                <Text style={styles.dateLabel}>Day</Text>
              </View>
              <Text style={styles.dateSeparator}>/</Text>
              <View style={styles.dateInputGroup}>
                <TextInput
                  style={styles.yearInput}
                  value={birthYear}
                  onChangeText={(text) => {
                    const cleaned = text.replace(/[^0-9]/g, '');
                    setBirthYear(cleaned);
                  }}
                  keyboardType="number-pad"
                  maxLength={4}
                />
                <Text style={styles.dateLabel}>Year</Text>
              </View>
            </View>
            {birthYear.length === 4 && birthMonth && birthDay && (
              <View style={styles.ageContainer}>
                <Text style={styles.ageDisplay}>
                  Age: {healthService.calculateAge(`${birthYear}-${birthMonth.padStart(2, '0')}-${birthDay.padStart(2, '0')}`)}
                </Text>
              </View>
            )}
          </View>

          {/* Height */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Height {unitSystem === 'metric' ? '(cm)' : '(ft/in)'}</Text>
            {unitSystem === 'metric' ? (
              <View style={styles.inputRow}>
                <TextInput
                  style={[styles.textInput, styles.flexInput]}
                  value={heightCm}
                  onChangeText={(text) => setHeightCm(text.replace(/[^0-9.]/g, ''))}
                  placeholder="170"
                  placeholderTextColor={Colors.text.muted}
                  keyboardType="decimal-pad"
                />
                <Text style={styles.inputUnit}>cm</Text>
              </View>
            ) : (
              <View style={styles.inputRow}>
                <TextInput
                  style={[styles.textInput, styles.smallInput]}
                  value={heightFeet}
                  onChangeText={(text) => setHeightFeet(text.replace(/[^0-9]/g, ''))}
                  placeholder="5"
                  placeholderTextColor={Colors.text.muted}
                  keyboardType="number-pad"
                  maxLength={1}
                />
                <Text style={styles.inputUnit}>ft</Text>
                <TextInput
                  style={[styles.textInput, styles.smallInput]}
                  value={heightInches}
                  onChangeText={(text) => setHeightInches(text.replace(/[^0-9]/g, ''))}
                  placeholder="8"
                  placeholderTextColor={Colors.text.muted}
                  keyboardType="number-pad"
                  maxLength={2}
                />
                <Text style={styles.inputUnit}>in</Text>
              </View>
            )}
          </View>

          {/* Current Weight */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>
              Current Weight ({unitSystem === 'metric' ? 'kg' : 'lbs'})
            </Text>
            <View style={styles.inputRow}>
              <TextInput
                style={[styles.textInput, styles.flexInput]}
                value={currentWeight}
                onChangeText={(text) => setCurrentWeight(text.replace(/[^0-9.]/g, ''))}
                placeholder={unitSystem === 'metric' ? '70' : '154'}
                placeholderTextColor={Colors.text.muted}
                keyboardType="decimal-pad"
              />
              <Text style={styles.inputUnit}>
                {unitSystem === 'metric' ? 'kg' : 'lbs'}
              </Text>
            </View>
          </View>

          {/* Goal Weight */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>
              Goal Weight ({unitSystem === 'metric' ? 'kg' : 'lbs'}) - Optional
            </Text>
            <View style={styles.inputRow}>
              <TextInput
                style={[styles.textInput, styles.flexInput]}
                value={goalWeight}
                onChangeText={(text) => setGoalWeight(text.replace(/[^0-9.]/g, ''))}
                placeholder={unitSystem === 'metric' ? '65' : '143'}
                placeholderTextColor={Colors.text.muted}
                keyboardType="decimal-pad"
              />
              <Text style={styles.inputUnit}>
                {unitSystem === 'metric' ? 'kg' : 'lbs'}
              </Text>
            </View>
          </View>

          <View style={styles.modalActions}>
            <Button
              title="Save Profile"
              onPress={handleSave}
              loading={isLoading}
              fullWidth
            />
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

// Log Weight Modal
interface LogWeightModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (weight: number, notes?: string) => Promise<void>;
  isLoading: boolean;
  unitSystem: UnitSystem;
}

function LogWeightModal({
  visible,
  onClose,
  onSave,
  isLoading,
  unitSystem,
}: LogWeightModalProps) {
  const [weight, setWeight] = useState('');
  const [notes, setNotes] = useState('');

  const handleSave = async () => {
    const weightValue = parseFloat(weight);
    if (!weightValue || weightValue <= 0) {
      Alert.alert('Invalid Weight', 'Please enter a valid weight.');
      return;
    }

    try {
      await onSave(weightValue, notes.trim() || undefined);
      setWeight('');
      setNotes('');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to log weight');
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Log Weight</Text>
          <Pressable onPress={onClose} style={styles.modalCloseButton}>
            <Ionicons name="close" size={24} color={Colors.text.primary} />
          </Pressable>
        </View>

        <View style={styles.modalContent}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Weight</Text>
            <View style={styles.inputRow}>
              <TextInput
                style={[styles.textInput, styles.flexInput, styles.largeInput]}
                value={weight}
                onChangeText={setWeight}
                placeholder={unitSystem === 'metric' ? '70.0' : '154.0'}
                placeholderTextColor={Colors.text.muted}
                keyboardType="decimal-pad"
                autoFocus
              />
              <Text style={styles.inputUnit}>
                {unitSystem === 'metric' ? 'kg' : 'lbs'}
              </Text>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Notes (Optional)</Text>
            <TextInput
              style={[styles.textInput, styles.notesInput]}
              value={notes}
              onChangeText={setNotes}
              placeholder="How are you feeling today?"
              placeholderTextColor={Colors.text.muted}
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.modalActions}>
            <Button
              title="Log Weight"
              onPress={handleSave}
              loading={isLoading}
              fullWidth
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.md,
  },

  // Setup card
  setupCard: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    gap: Spacing.md,
  },
  setupTitle: {
    ...Typography.h4,
    color: Colors.text.primary,
    marginTop: Spacing.sm,
  },
  setupDescription: {
    ...Typography.body,
    color: Colors.text.secondary,
    textAlign: 'center',
    paddingHorizontal: Spacing.lg,
  },
  setupButton: {
    marginTop: Spacing.md,
  },

  // BMI Card
  bmiCard: {
    backgroundColor: Colors.primary.tiffanyBlueLight,
  },
  bmiHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  bmiLabel: {
    ...Typography.caption,
    color: Colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  bmiContent: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  bmiValue: {
    fontSize: 48,
    fontWeight: '700',
    color: Colors.primary.tiffanyBlue,
  },
  bmiDetails: {
    alignItems: 'flex-end',
  },
  bmiDetailText: {
    ...Typography.bodySmall,
    color: Colors.text.secondary,
  },

  // Progress Card
  progressCard: {
    gap: Spacing.md,
  },
  progressTitle: {
    ...Typography.h5,
    color: Colors.text.primary,
  },
  progressStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  progressStat: {
    alignItems: 'center',
  },
  progressValue: {
    ...Typography.h4,
    color: Colors.text.primary,
  },
  progressLabel: {
    ...Typography.caption,
    color: Colors.text.secondary,
  },
  bmiProgress: {
    alignItems: 'center',
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.ui.border,
  },
  bmiProgressText: {
    ...Typography.bodySmall,
    color: Colors.text.secondary,
  },

  // History Card
  historyCard: {
    gap: Spacing.sm,
  },
  historyTitle: {
    ...Typography.h5,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  historyItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.ui.border,
  },
  historyWeight: {
    ...Typography.body,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  historyDate: {
    ...Typography.caption,
    color: Colors.text.secondary,
  },
  historyBmi: {
    ...Typography.bodySmall,
    color: Colors.text.secondary,
  },

  // Actions
  actions: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.sm,
  },
  actionButton: {
    flex: 1,
  },

  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.ui.border,
  },
  modalTitle: {
    ...Typography.h3,
    color: Colors.text.primary,
  },
  modalCloseButton: {
    padding: Spacing.xs,
  },
  modalContent: {
    flex: 1,
    padding: Spacing.lg,
  },
  modalActions: {
    marginTop: Spacing.xl,
    paddingBottom: Spacing['4xl'],
  },

  // Input styles
  inputGroup: {
    marginBottom: Spacing.xl,
  },
  inputLabel: {
    ...Typography.bodySmall,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
  },
  textInput: {
    ...Typography.body,
    color: Colors.text.primary,
    backgroundColor: Colors.background.primary,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    paddingVertical: Spacing.base,
    borderWidth: 1.5,
    borderColor: Colors.ui.border,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  flexInput: {
    flex: 1,
  },
  smallInput: {
    width: 70,
    textAlign: 'center',
  },
  largeInput: {
    fontSize: 28,
    textAlign: 'center',
    paddingVertical: Spacing.lg,
    fontWeight: '600',
  },
  inputUnit: {
    ...Typography.body,
    color: Colors.text.secondary,
    fontWeight: '500',
    minWidth: 35,
  },
  // Date input styles
  dateInputRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
    gap: Spacing.xs,
  },
  dateInputGroup: {
    alignItems: 'center',
  },
  dateInput: {
    width: 65,
    height: 52,
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '600',
    color: Colors.text.primary,
    backgroundColor: Colors.background.primary,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: Colors.ui.border,
  },
  yearInput: {
    width: 90,
    height: 52,
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '600',
    color: Colors.text.primary,
    backgroundColor: Colors.background.primary,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: Colors.ui.border,
  },
  dateLabel: {
    ...Typography.caption,
    color: Colors.text.muted,
    marginTop: Spacing.xs,
  },
  dateSeparator: {
    ...Typography.h4,
    color: Colors.text.muted,
    marginTop: Spacing.md,
  },
  ageContainer: {
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  ageDisplay: {
    ...Typography.body,
    color: Colors.primary.tiffanyBlue,
    fontWeight: '600',
    backgroundColor: Colors.primary.tiffanyBlueLight,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  notesInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },

  // Unit toggle
  unitToggle: {
    flexDirection: 'row',
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.md,
    padding: Spacing.xs,
  },
  unitOption: {
    flex: 1,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
  },
  unitOptionActive: {
    backgroundColor: Colors.primary.tiffanyBlue,
  },
  unitOptionText: {
    ...Typography.bodySmall,
    color: Colors.text.secondary,
    fontWeight: '500',
  },
  unitOptionTextActive: {
    color: Colors.text.inverse,
  },

  // Gender options
  genderOptions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  genderOption: {
    flex: 1,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.background.secondary,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.ui.border,
  },
  genderOptionActive: {
    backgroundColor: Colors.primary.tiffanyBlueLight,
    borderColor: Colors.primary.tiffanyBlue,
  },
  genderOptionText: {
    ...Typography.bodySmall,
    color: Colors.text.secondary,
    fontWeight: '500',
  },
  genderOptionTextActive: {
    color: Colors.primary.tiffanyBlue,
  },
});

export default HealthMetricsSection;
