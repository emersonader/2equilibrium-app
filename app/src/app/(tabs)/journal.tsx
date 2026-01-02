import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors, Typography, Spacing, Layout, BorderRadius } from '@/constants';
import { Card, Button, Badge } from '@/components/ui';
import * as journalService from '@/services/journalService';
import { supabase } from '@/services/supabase';

// Mood options
const MOODS = [
  { value: 1, emoji: '😔', label: 'Struggling' },
  { value: 2, emoji: '😐', label: 'Low' },
  { value: 3, emoji: '😊', label: 'Okay' },
  { value: 4, emoji: '😄', label: 'Good' },
  { value: 5, emoji: '🥰', label: 'Great' },
];

export default function JournalScreen() {
  const router = useRouter();
  const [mood, setMood] = useState<number | null>(null);
  const [energy, setEnergy] = useState<number | null>(null);
  const [waterIntake, setWaterIntake] = useState(0);
  const [movementCompleted, setMovementCompleted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [recentEntries, setRecentEntries] = useState<any[]>([]);
  const [isLoadingEntries, setIsLoadingEntries] = useState(false);
  const [hasTodayEntry, setHasTodayEntry] = useState(false);
  const [isCheckingToday, setIsCheckingToday] = useState(true);

  // Entry detail modal state
  const [selectedEntry, setSelectedEntry] = useState<any | null>(null);
  const [showEntryDetail, setShowEntryDetail] = useState(false);

  // Get today's date string
  const getTodayString = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  };

  // Check authentication status and load entries
  useEffect(() => {
    const checkAuthAndLoadEntries = async () => {
      if (!supabase) {
        setIsAuthenticated(false);
        setIsCheckingToday(false);
        return;
      }
      const { data: { user } } = await supabase.auth.getUser();
      setIsAuthenticated(!!user);

      if (user) {
        loadRecentEntries();
        checkTodayEntry();
      } else {
        setIsCheckingToday(false);
      }
    };
    checkAuthAndLoadEntries();
  }, []);

  const checkTodayEntry = async () => {
    try {
      const today = getTodayString();
      const entry = await journalService.getEntryByDate(today, 'daily');
      if (entry) {
        setHasTodayEntry(true);
        // Pre-fill form with existing entry data
        setMood(entry.mood);
        setEnergy(entry.energy);
        setWaterIntake(entry.water_intake || 0);
        setMovementCompleted(entry.movement_completed || false);
      }
    } catch (error) {
      console.error('Failed to check today entry:', error);
    } finally {
      setIsCheckingToday(false);
    }
  };

  const loadRecentEntries = async () => {
    setIsLoadingEntries(true);
    try {
      const entries = await journalService.getRecentEntries(30);
      setRecentEntries(entries);
    } catch (error) {
      console.error('Failed to load entries:', error);
    } finally {
      setIsLoadingEntries(false);
    }
  };

  const getMoodEmoji = (moodValue: number | null) => {
    if (!moodValue) return '—';
    const moodOption = MOODS.find(m => m.value === moodValue);
    return moodOption?.emoji || '—';
  };

  const getMoodLabel = (moodValue: number | null) => {
    if (!moodValue) return 'Not recorded';
    const moodOption = MOODS.find(m => m.value === moodValue);
    return moodOption?.label || 'Unknown';
  };

  const openEntryDetail = (entry: any) => {
    setSelectedEntry(entry);
    setShowEntryDetail(true);
  };

  const closeEntryDetail = () => {
    setShowEntryDetail(false);
    setSelectedEntry(null);
  };

  const formatDate = (dateStr: string) => {
    // Parse date string manually to avoid timezone issues
    // dateStr format: "YYYY-MM-DD"
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day); // month is 0-indexed
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatFullDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const handleSave = async () => {
    // Check if user is authenticated
    if (!isAuthenticated) {
      Alert.alert(
        'Sign In Required',
        'Please sign in to save your journal entries.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Sign In', onPress: () => router.push('/(auth)/login') },
        ]
      );
      return;
    }

    setIsSaving(true);
    try {
      // Use local date instead of UTC
      const now = new Date();
      const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      await journalService.saveJournalEntry({
        entryDate: today,
        entryType: 'daily',
        mood: mood || undefined,
        energy: energy || undefined,
        waterIntake: waterIntake || undefined,
        movementCompleted,
      });
      // Reload entries after saving
      setHasTodayEntry(true);
      loadRecentEntries();
    } catch (error: any) {
      console.error('Failed to save journal entry:', error);
      Alert.alert(
        'Error',
        error.message || 'Failed to save journal entry. Please try again.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Journal</Text>
          <Text style={styles.date}>
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
            })}
          </Text>
        </View>

        {/* Today's Entry Status */}
        {hasTodayEntry && (
          <View style={styles.completedBanner}>
            <Ionicons name="checkmark-circle" size={20} color={Colors.primary.tiffanyBlue} />
            <Text style={styles.completedText}>Today's entry completed</Text>
          </View>
        )}

        {/* Quick Tracking */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How are you feeling?</Text>

          {/* Mood */}
          <Card variant="default" style={styles.trackingCard}>
            <Text style={styles.trackingLabel}>Mood</Text>
            <View style={styles.moodContainer}>
              {MOODS.map((moodOption) => (
                <Pressable
                  key={moodOption.value}
                  onPress={() => !hasTodayEntry && setMood(moodOption.value)}
                  style={[
                    styles.moodButton,
                    mood === moodOption.value && styles.moodButtonSelected,
                    hasTodayEntry && styles.disabledButton,
                  ]}
                  disabled={hasTodayEntry}
                >
                  <Text style={styles.moodEmoji}>{moodOption.emoji}</Text>
                </Pressable>
              ))}
            </View>
          </Card>

          {/* Energy */}
          <Card variant="default" style={styles.trackingCard}>
            <Text style={styles.trackingLabel}>Energy Level</Text>
            <View style={styles.energyContainer}>
              {[1, 2, 3, 4, 5].map((level) => (
                <Pressable
                  key={level}
                  onPress={() => !hasTodayEntry && setEnergy(level)}
                  style={styles.energyButton}
                  disabled={hasTodayEntry}
                >
                  <View
                    style={[
                      styles.energyDot,
                      energy !== null && level <= energy && styles.energyDotFilled,
                    ]}
                  />
                </Pressable>
              ))}
              <Text style={styles.energyText}>
                {energy === null ? 'Tap to rate' : `${energy}/5`}
              </Text>
            </View>
          </Card>

          {/* Water Intake */}
          <Card variant="default" style={styles.trackingCard}>
            <View style={styles.trackingHeader}>
              <Text style={styles.trackingLabel}>Water Intake</Text>
              <Text style={styles.trackingValue}>{waterIntake} glasses</Text>
            </View>
            <View style={styles.waterContainer}>
              {[1, 2, 3, 4, 5, 6, 7, 8].map((glass) => (
                <Pressable
                  key={glass}
                  onPress={() =>
                    !hasTodayEntry && setWaterIntake(waterIntake === glass ? glass - 1 : glass)
                  }
                  style={styles.waterButton}
                  disabled={hasTodayEntry}
                >
                  <Text
                    style={[
                      styles.waterEmoji,
                      glass <= waterIntake && styles.waterEmojiFilled,
                    ]}
                  >
                    💧
                  </Text>
                </Pressable>
              ))}
            </View>
          </Card>

          {/* Movement */}
          <Card variant="default" style={styles.trackingCard}>
            <Pressable
              onPress={() => !hasTodayEntry && setMovementCompleted(!movementCompleted)}
              style={styles.movementContainer}
              disabled={hasTodayEntry}
            >
              <View
                style={[
                  styles.checkbox,
                  movementCompleted && styles.checkboxChecked,
                ]}
              >
                {movementCompleted && (
                  <Ionicons
                    name="checkmark"
                    size={16}
                    color={Colors.text.inverse}
                  />
                )}
              </View>
              <Text style={styles.movementLabel}>
                Completed today's movement
              </Text>
            </Pressable>
          </Card>
        </View>

        {/* Save Button - only show if no entry for today */}
        {!hasTodayEntry && (
          <Button
            title="Save Entry"
            onPress={handleSave}
            fullWidth
            loading={isSaving || isCheckingToday}
            style={styles.saveButton}
          />
        )}

        {/* Past Entries Preview */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Past Entries</Text>
            <Pressable onPress={loadRecentEntries}>
              <Text style={styles.viewAllText}>Refresh</Text>
            </Pressable>
          </View>
          {isLoadingEntries ? (
            <Card variant="outlined" style={styles.emptyState}>
              <Text style={styles.emptyStateText}>Loading entries...</Text>
            </Card>
          ) : recentEntries.length === 0 ? (
            <Card variant="outlined" style={styles.emptyState}>
              <Ionicons
                name="book-outline"
                size={40}
                color={Colors.text.tertiary}
              />
              <Text style={styles.emptyStateText}>
                Your journal entries will appear here
              </Text>
            </Card>
          ) : (
            <View style={styles.entriesList}>
              {recentEntries.map((entry) => {
                // Check what data is present
                const hasPrompts = entry.prompt_response || entry.reflection_response || entry.gratitude_response;
                const hasTracking = entry.mood || entry.energy || entry.water_intake > 0 || entry.movement_completed;
                const lessonDay = entry.lesson_id ? entry.lesson_id.replace('day-', '') : null;

                return (
                  <Pressable key={entry.id} onPress={() => openEntryDetail(entry)}>
                    <Card variant="outlined" style={styles.entryCard}>
                      <View style={styles.entryHeader}>
                        <View style={styles.entryDateRow}>
                          <Text style={styles.entryDate}>{formatDate(entry.entry_date)}</Text>
                          {lessonDay && (
                            <View style={styles.lessonBadge}>
                              <Text style={styles.lessonBadgeText}>Day {lessonDay}</Text>
                            </View>
                          )}
                        </View>
                        <View style={styles.entryHeaderRight}>
                          <Text style={styles.entryMood}>{getMoodEmoji(entry.mood)}</Text>
                          <Ionicons name="chevron-forward" size={16} color={Colors.text.tertiary} />
                        </View>
                      </View>

                      {/* Preview of content */}
                      {entry.prompt_response && (
                        <Text style={styles.entryText} numberOfLines={2}>
                          {entry.prompt_response}
                        </Text>
                      )}

                      {/* Data indicators */}
                      <View style={styles.entryIndicators}>
                        {hasTracking && (
                          <View style={styles.indicatorGroup}>
                            {entry.mood && <Text style={styles.indicatorEmoji}>{getMoodEmoji(entry.mood)}</Text>}
                            {entry.energy && (
                              <View style={styles.indicatorItem}>
                                <Ionicons name="flash" size={14} color={Colors.primary.orange} />
                                <Text style={styles.indicatorText}>{entry.energy}/5</Text>
                              </View>
                            )}
                            {entry.water_intake > 0 && (
                              <View style={styles.indicatorItem}>
                                <Text style={styles.indicatorEmoji}>💧</Text>
                                <Text style={styles.indicatorText}>{entry.water_intake}</Text>
                              </View>
                            )}
                            {entry.movement_completed && (
                              <Ionicons name="checkmark-circle" size={16} color={Colors.primary.tiffanyBlue} />
                            )}
                          </View>
                        )}
                        {hasPrompts && (
                          <View style={styles.indicatorGroup}>
                            {entry.prompt_response && (
                              <Ionicons name="sunny" size={14} color={Colors.primary.orange} />
                            )}
                            {entry.reflection_response && (
                              <Ionicons name="bulb" size={14} color={Colors.primary.tiffanyBlue} />
                            )}
                            {entry.gratitude_response && (
                              <Ionicons name="heart" size={14} color={Colors.status.error} />
                            )}
                          </View>
                        )}
                      </View>
                    </Card>
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Entry Detail Modal */}
      <Modal
        visible={showEntryDetail}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeEntryDetail}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Journal Entry</Text>
            <Pressable onPress={closeEntryDetail} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={Colors.text.primary} />
            </Pressable>
          </View>

          <ScrollView
            style={styles.modalScrollView}
            contentContainerStyle={styles.modalContent}
            showsVerticalScrollIndicator={false}
          >
            {selectedEntry && (
              <>
                {/* Date Header */}
                <View style={styles.modalDateHeader}>
                  <Text style={styles.modalDate}>
                    {formatFullDate(selectedEntry.entry_date)}
                  </Text>
                  {selectedEntry.lesson_id && (
                    <View style={styles.modalLessonBadge}>
                      <Text style={styles.modalLessonBadgeText}>
                        Day {selectedEntry.lesson_id.replace('day-', '')}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Mood & Energy Section */}
                <Card variant="default" style={styles.modalCard}>
                  <View style={styles.modalStatRow}>
                    <View style={styles.modalStat}>
                      <Text style={styles.modalStatLabel}>Mood</Text>
                      <View style={styles.modalStatValue}>
                        <Text style={styles.modalMoodEmoji}>
                          {getMoodEmoji(selectedEntry.mood)}
                        </Text>
                        <Text style={styles.modalMoodLabel}>
                          {getMoodLabel(selectedEntry.mood)}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.modalStatDivider} />
                    <View style={styles.modalStat}>
                      <Text style={styles.modalStatLabel}>Energy</Text>
                      <Text style={styles.modalStatValueText}>
                        {selectedEntry.energy ? `${selectedEntry.energy}/5` : 'Not recorded'}
                      </Text>
                    </View>
                  </View>
                </Card>

                {/* Tracking Stats */}
                <Card variant="default" style={styles.modalCard}>
                  <View style={styles.modalTrackingRow}>
                    <View style={styles.modalTrackingItem}>
                      <Text style={styles.modalTrackingEmoji}>💧</Text>
                      <Text style={styles.modalTrackingValue}>
                        {selectedEntry.water_intake || 0} glasses
                      </Text>
                      <Text style={styles.modalTrackingLabel}>Water</Text>
                    </View>
                    <View style={styles.modalTrackingItem}>
                      <Ionicons
                        name={selectedEntry.movement_completed ? 'checkmark-circle' : 'close-circle'}
                        size={28}
                        color={selectedEntry.movement_completed ? Colors.primary.tiffanyBlue : Colors.text.tertiary}
                      />
                      <Text style={styles.modalTrackingValue}>
                        {selectedEntry.movement_completed ? 'Yes' : 'No'}
                      </Text>
                      <Text style={styles.modalTrackingLabel}>Movement</Text>
                    </View>
                  </View>
                </Card>

                {/* Journal Prompts */}
                {selectedEntry.prompt_response && (
                  <Card variant="outlined" style={styles.modalPromptCard}>
                    <View style={styles.modalPromptHeader}>
                      <Ionicons name="journal-outline" size={18} color={Colors.primary.orange} />
                      <Text style={styles.modalPromptLabel}>Primary Reflection</Text>
                    </View>
                    <Text style={styles.modalPromptText}>{selectedEntry.prompt_response}</Text>
                  </Card>
                )}

                {selectedEntry.reflection_response && (
                  <Card variant="outlined" style={styles.modalPromptCard}>
                    <View style={styles.modalPromptHeader}>
                      <Ionicons name="bulb-outline" size={18} color={Colors.primary.tiffanyBlue} />
                      <Text style={styles.modalPromptLabel}>Deeper Reflection</Text>
                    </View>
                    <Text style={styles.modalPromptText}>{selectedEntry.reflection_response}</Text>
                  </Card>
                )}

                {selectedEntry.gratitude_response && (
                  <Card variant="outlined" style={styles.modalPromptCard}>
                    <View style={styles.modalPromptHeader}>
                      <Ionicons name="heart-outline" size={18} color={Colors.status.error} />
                      <Text style={styles.modalPromptLabel}>Gratitude</Text>
                    </View>
                    <Text style={styles.modalPromptText}>{selectedEntry.gratitude_response}</Text>
                  </Card>
                )}

                {/* Free Notes */}
                {selectedEntry.free_notes && (
                  <Card variant="outlined" style={styles.modalPromptCard}>
                    <View style={styles.modalPromptHeader}>
                      <Ionicons name="document-text-outline" size={18} color={Colors.text.secondary} />
                      <Text style={styles.modalPromptLabel}>Notes</Text>
                    </View>
                    <Text style={styles.modalPromptText}>{selectedEntry.free_notes}</Text>
                  </Card>
                )}

                {/* Empty state for no written content */}
                {!selectedEntry.prompt_response &&
                  !selectedEntry.reflection_response &&
                  !selectedEntry.gratitude_response &&
                  !selectedEntry.free_notes && (
                    <Card variant="outlined" style={styles.emptyPromptCard}>
                      <Ionicons name="document-outline" size={32} color={Colors.text.tertiary} />
                      <Text style={styles.emptyPromptText}>
                        No written reflections for this day
                      </Text>
                    </Card>
                  )}
              </>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: Layout.screenPaddingHorizontal,
    paddingBottom: Spacing['4xl'],
  },
  header: {
    marginBottom: Spacing.xl,
    marginTop: Spacing.base,
  },
  title: {
    ...Typography.h1,
    color: Colors.text.primary,
  },
  date: {
    ...Typography.bodyLarge,
    color: Colors.text.secondary,
  },

  // Sections
  section: {
    marginBottom: Spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    ...Typography.h5,
    color: Colors.text.primary,
    marginBottom: Spacing.md,
  },
  viewAllText: {
    ...Typography.bodySmall,
    color: Colors.primary.orange,
    fontWeight: '600',
  },

  // Tracking cards
  trackingCard: {
    marginBottom: Spacing.md,
  },
  trackingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  trackingLabel: {
    ...Typography.body,
    fontWeight: '500',
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
  },
  trackingValue: {
    ...Typography.body,
    color: Colors.primary.tiffanyBlue,
    fontWeight: '600',
  },

  // Mood
  moodContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  moodButton: {
    flex: 1,
    alignItems: 'center',
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.background.secondary,
  },
  moodButtonSelected: {
    backgroundColor: Colors.primary.tiffanyBlueLight + '50',
    borderWidth: 2,
    borderColor: Colors.primary.tiffanyBlue,
  },
  moodEmoji: {
    fontSize: 28,
  },

  // Energy
  energyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  energyButton: {
    padding: Spacing.sm,
  },
  energyDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.background.tertiary,
    borderWidth: 2,
    borderColor: Colors.ui.border,
  },
  energyDotFilled: {
    backgroundColor: Colors.primary.tiffanyBlue,
    borderColor: Colors.primary.tiffanyBlue,
  },
  energyText: {
    ...Typography.bodySmall,
    color: Colors.text.secondary,
    marginLeft: 'auto',
  },

  // Water
  waterContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  waterButton: {
    padding: Spacing.xs,
  },
  waterEmoji: {
    fontSize: 24,
    opacity: 0.3,
  },
  waterEmojiFilled: {
    opacity: 1,
  },

  // Movement
  movementContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: BorderRadius.sm,
    borderWidth: 2,
    borderColor: Colors.ui.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: Colors.primary.tiffanyBlue,
    borderColor: Colors.primary.tiffanyBlue,
  },
  movementLabel: {
    ...Typography.body,
    color: Colors.text.primary,
  },

  // Save button
  saveButton: {
    marginBottom: Spacing.xl,
  },

  // Completed state
  completedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.primary.tiffanyBlue + '15',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
  },
  completedText: {
    ...Typography.bodySmall,
    fontWeight: '600',
    color: Colors.primary.tiffanyBlue,
  },
  disabledButton: {
    opacity: 0.6,
  },

  // Empty state
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing['2xl'],
    gap: Spacing.md,
  },
  emptyStateText: {
    ...Typography.body,
    color: Colors.text.tertiary,
    textAlign: 'center',
  },

  // Past entries
  entriesList: {
    gap: Spacing.md,
  },
  entryCard: {
    padding: Spacing.md,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  entryDate: {
    ...Typography.bodySmall,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  entryMood: {
    fontSize: 20,
  },
  entryText: {
    ...Typography.bodySmall,
    color: Colors.text.secondary,
    marginBottom: Spacing.sm,
  },
  entryStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  entryStat: {
    ...Typography.caption,
    color: Colors.primary.tiffanyBlue,
    backgroundColor: Colors.primary.tiffanyBlueLight + '30',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  entryHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  entryDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  lessonBadge: {
    backgroundColor: Colors.primary.tiffanyBlue + '20',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  lessonBadgeText: {
    ...Typography.caption,
    color: Colors.primary.tiffanyBlue,
    fontWeight: '600',
  },
  entryIndicators: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.sm,
  },
  indicatorGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  indicatorItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  indicatorEmoji: {
    fontSize: 14,
  },
  indicatorText: {
    ...Typography.caption,
    color: Colors.text.secondary,
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
    paddingHorizontal: Layout.screenPaddingHorizontal,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.ui.border,
  },
  modalTitle: {
    ...Typography.h4,
    color: Colors.text.primary,
  },
  closeButton: {
    padding: Spacing.xs,
  },
  modalScrollView: {
    flex: 1,
  },
  modalContent: {
    padding: Layout.screenPaddingHorizontal,
    paddingBottom: Spacing['4xl'],
  },
  modalDateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  modalDate: {
    ...Typography.h5,
    color: Colors.text.primary,
  },
  modalLessonBadge: {
    backgroundColor: Colors.primary.orange,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  modalLessonBadgeText: {
    ...Typography.bodySmall,
    color: Colors.text.inverse,
    fontWeight: '600',
  },
  modalCard: {
    marginBottom: Spacing.md,
  },
  modalStatRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalStat: {
    flex: 1,
    alignItems: 'center',
  },
  modalStatLabel: {
    ...Typography.caption,
    color: Colors.text.secondary,
    marginBottom: Spacing.xs,
  },
  modalStatValue: {
    alignItems: 'center',
  },
  modalStatValueText: {
    ...Typography.bodyLarge,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  modalMoodEmoji: {
    fontSize: 32,
  },
  modalMoodLabel: {
    ...Typography.bodySmall,
    color: Colors.text.secondary,
    marginTop: Spacing.xs,
  },
  modalStatDivider: {
    width: 1,
    height: 40,
    backgroundColor: Colors.ui.border,
  },
  modalTrackingRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  modalTrackingItem: {
    alignItems: 'center',
    gap: Spacing.xs,
  },
  modalTrackingEmoji: {
    fontSize: 28,
  },
  modalTrackingValue: {
    ...Typography.body,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  modalTrackingLabel: {
    ...Typography.caption,
    color: Colors.text.secondary,
  },
  modalPromptCard: {
    marginBottom: Spacing.md,
    padding: Spacing.md,
  },
  modalPromptHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  modalPromptLabel: {
    ...Typography.bodySmall,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  modalPromptText: {
    ...Typography.body,
    color: Colors.text.secondary,
    lineHeight: 24,
  },
  emptyPromptCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing['2xl'],
    gap: Spacing.md,
  },
  emptyPromptText: {
    ...Typography.body,
    color: Colors.text.tertiary,
    textAlign: 'center',
  },
});
