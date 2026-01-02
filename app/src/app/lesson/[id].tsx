import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Pressable,
  Alert,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Layout, BorderRadius } from '@/constants';
import { Button, Card, Badge } from '@/components/ui';
import { useProgressStore } from '@/stores/progressStore';
import * as journalService from '@/services/journalService';

// Import lesson data
import lessonsData from '@/data/content/lessons.json';
import { Lesson } from '@/data/schema/types';

export default function LessonScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'content' | 'journal' | 'movement'>('content');
  const [isCompleting, setIsCompleting] = useState(false);
  const [isJournalComplete, setIsJournalComplete] = useState(false);
  const [isMovementComplete, setIsMovementComplete] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(true);
  const { markLessonComplete, completedLessons } = useProgressStore();

  // Check if journal prompts and movement are completed
  useFocusEffect(
    useCallback(() => {
      const checkStatus = async () => {
        if (!id) return;
        setIsCheckingStatus(true);
        try {
          const status = await journalService.isLessonFullyComplete(id);
          setIsJournalComplete(status.journalComplete);
          setIsMovementComplete(status.movementComplete);
        } catch (error) {
          console.error('Failed to check lesson status:', error);
        } finally {
          setIsCheckingStatus(false);
        }
      };
      checkStatus();
    }, [id])
  );

  // Derived state: both journal and movement must be complete
  const isLessonReady = isJournalComplete && isMovementComplete;

  // Find the lesson
  const lesson = lessonsData.lessons.find((l) => l.id === id) as Lesson | undefined;

  if (!lesson) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Lesson not found</Text>
          <Button title="Go Back" onPress={() => router.back()} />
        </View>
      </SafeAreaView>
    );
  }

  const isAlreadyCompleted = lesson ? completedLessons.includes(lesson.id) : false;

  const handleComplete = async () => {
    if (!lesson || isCompleting) return;

    // Check if both journal AND movement are complete before allowing lesson completion
    if (!isJournalComplete && !isMovementComplete) {
      Alert.alert(
        'Complete Requirements First',
        'Please complete your journal entry (all 3 prompts) and daily movement before completing this lesson.',
        [
          { text: 'Go to Journal', onPress: () => setActiveTab('journal') },
          { text: 'Go to Movement', onPress: () => setActiveTab('movement') },
        ]
      );
      return;
    }

    if (!isJournalComplete) {
      Alert.alert(
        'Complete Your Journal First',
        'Please answer all journal prompts (Today\'s Reflection, Deeper Reflection, and Gratitude) before completing this lesson.',
        [{ text: 'Go to Journal', onPress: () => setActiveTab('journal') }]
      );
      return;
    }

    if (!isMovementComplete) {
      Alert.alert(
        'Complete Your Movement First',
        'Please complete and log your daily movement before completing this lesson.',
        [{ text: 'Go to Movement', onPress: () => setActiveTab('movement') }]
      );
      return;
    }

    setIsCompleting(true);
    try {
      await markLessonComplete(lesson.id);
      router.back();
    } catch (error: any) {
      console.error('Failed to complete lesson:', error);
      Alert.alert('Error', error.message || 'Failed to mark lesson as complete.');
    } finally {
      setIsCompleting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.text.primary} />
        </Pressable>
        <Badge label={`Day ${lesson.dayNumber}`} variant="secondary" size="sm" />
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TabButton
          title="Content"
          isActive={activeTab === 'content'}
          onPress={() => setActiveTab('content')}
        />
        <TabButton
          title="Journal"
          isActive={activeTab === 'journal'}
          onPress={() => setActiveTab('journal')}
        />
        <TabButton
          title="Movement"
          isActive={activeTab === 'movement'}
          onPress={() => setActiveTab('movement')}
        />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'content' && (
          <ContentTab lesson={lesson} />
        )}
        {activeTab === 'journal' && (
          <JournalTab
            lesson={lesson}
            onJournalSaved={() => setIsJournalComplete(true)}
          />
        )}
        {activeTab === 'movement' && (
          <MovementTab
            lesson={lesson}
            onMovementCompleted={() => setIsMovementComplete(true)}
          />
        )}
      </ScrollView>

      {/* Complete Button */}
      <View style={styles.footer}>
        {!isAlreadyCompleted && !isLessonReady && !isCheckingStatus && (
          <View style={styles.requirementsContainer}>
            <Text style={styles.requirementsTitle}>Complete to unlock:</Text>
            <View style={styles.requirementRow}>
              <Ionicons
                name={isJournalComplete ? "checkmark-circle" : "ellipse-outline"}
                size={18}
                color={isJournalComplete ? Colors.status.success : Colors.text.tertiary}
              />
              <Text style={[
                styles.requirementLabel,
                isJournalComplete && styles.requirementComplete
              ]}>
                Journal entry (all 3 prompts)
              </Text>
            </View>
            <View style={styles.requirementRow}>
              <Ionicons
                name={isMovementComplete ? "checkmark-circle" : "ellipse-outline"}
                size={18}
                color={isMovementComplete ? Colors.status.success : Colors.text.tertiary}
              />
              <Text style={[
                styles.requirementLabel,
                isMovementComplete && styles.requirementComplete
              ]}>
                Daily movement completed
              </Text>
            </View>
          </View>
        )}
        <Button
          title={
            isAlreadyCompleted
              ? "Completed"
              : isLessonReady
              ? "Complete Lesson"
              : !isJournalComplete && !isMovementComplete
              ? "Complete Requirements"
              : !isJournalComplete
              ? "Complete Journal"
              : "Complete Movement"
          }
          onPress={handleComplete}
          fullWidth
          loading={isCompleting || isCheckingStatus}
          variant={isAlreadyCompleted ? "outline" : isLessonReady ? "primary" : "secondary"}
          disabled={!isAlreadyCompleted && !isLessonReady}
        />
      </View>
    </SafeAreaView>
  );
}

// Tab Button Component
interface TabButtonProps {
  title: string;
  isActive: boolean;
  onPress: () => void;
}

function TabButton({ title, isActive, onPress }: TabButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.tabButton, isActive && styles.tabButtonActive]}
    >
      <Text style={[styles.tabButtonText, isActive && styles.tabButtonTextActive]}>
        {title}
      </Text>
    </Pressable>
  );
}

// Helper function to render formatted content
function renderFormattedContent(text: string) {
  // Split by double newlines to get paragraphs/sections
  const sections = text.split('\n\n');

  return sections.map((section, sectionIndex) => {
    const trimmedSection = section.trim();

    // Check if it's a heading (wrapped in **)
    if (trimmedSection.startsWith('**') && trimmedSection.endsWith('**')) {
      const headingText = trimmedSection.slice(2, -2);
      return (
        <Text key={sectionIndex} style={styles.contentHeading}>
          {headingText}
        </Text>
      );
    }

    // Check if it starts with a heading followed by content
    const headingMatch = trimmedSection.match(/^\*\*(.+?)\*\*\n?([\s\S]*)/);
    if (headingMatch) {
      const [, heading, content] = headingMatch;
      return (
        <View key={sectionIndex} style={styles.contentSection}>
          <Text style={styles.contentHeading}>{heading}</Text>
          {content && renderParagraphOrList(content.trim(), `${sectionIndex}-content`)}
        </View>
      );
    }

    // Regular paragraph or list
    return renderParagraphOrList(trimmedSection, sectionIndex.toString());
  });
}

function renderParagraphOrList(text: string, key: string) {
  const lines = text.split('\n');

  // Check if it's a bullet list
  const isBulletList = lines.every(line => line.trim().startsWith('- ') || line.trim() === '');

  if (isBulletList) {
    return (
      <View key={key} style={styles.bulletList}>
        {lines.filter(line => line.trim().startsWith('- ')).map((line, i) => {
          const bulletText = line.trim().slice(2);
          // Check for bold text within bullet
          const boldMatch = bulletText.match(/^\*\*(.+?)\*\*:?\s*(.*)/);

          return (
            <View key={i} style={styles.bulletItem}>
              <View style={styles.bulletDot} />
              <Text style={styles.bulletText}>
                {boldMatch ? (
                  <>
                    <Text style={styles.bulletBold}>{boldMatch[1]}</Text>
                    {boldMatch[2] ? `: ${boldMatch[2]}` : ''}
                  </>
                ) : (
                  bulletText
                )}
              </Text>
            </View>
          );
        })}
      </View>
    );
  }

  // Regular paragraph - handle inline bold
  return (
    <Text key={key} style={styles.contentParagraph}>
      {renderInlineBold(text)}
    </Text>
  );
}

function renderInlineBold(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <Text key={i} style={styles.boldText}>
          {part.slice(2, -2)}
        </Text>
      );
    }
    return part;
  });
}

// Content Tab
function ContentTab({ lesson }: { lesson: Lesson }) {
  return (
    <View>
      {/* Title */}
      <Text style={styles.lessonTitle}>{lesson.title}</Text>

      {/* Introduction Card */}
      <Card variant="elevated" style={styles.introCard}>
        <View style={styles.introHeader}>
          <Ionicons name="sunny" size={24} color={Colors.primary.orange} />
          <Text style={styles.introLabel}>Welcome</Text>
        </View>
        <Text style={styles.introText}>{lesson.content.introduction}</Text>
      </Card>

      {/* Main Content */}
      <View style={styles.mainContentSection}>
        {renderFormattedContent(lesson.content.mainContent)}
      </View>

      {/* Key Takeaways */}
      <Card variant="outlined" style={styles.takeawaysCard}>
        <View style={styles.takeawaysHeader}>
          <Ionicons name="bulb" size={22} color={Colors.primary.tiffanyBlue} />
          <Text style={styles.takeawaysTitle}>Key Takeaways</Text>
        </View>
        {lesson.content.keyTakeaways.map((takeaway, index) => (
          <View key={index} style={styles.takeawayItem}>
            <Ionicons name="checkmark-circle" size={20} color={Colors.primary.tiffanyBlue} />
            <Text style={styles.takeawayText}>{takeaway}</Text>
          </View>
        ))}
      </Card>

      {/* Action Step */}
      <Card variant="elevated" style={styles.actionCard}>
        <View style={styles.actionHeader}>
          <Ionicons name="flash" size={24} color={Colors.primary.orange} />
          <Text style={styles.actionTitle}>Today's Action</Text>
        </View>
        <Text style={styles.actionText}>{lesson.content.actionStep}</Text>
      </Card>

      {/* Affirmation */}
      <Card variant="outlined" style={styles.affirmationCard}>
        <Ionicons name="heart" size={28} color={Colors.primary.orange} style={styles.affirmationIcon} />
        <Text style={styles.affirmationLabel}>Daily Affirmation</Text>
        <Text style={styles.affirmationText}>"{lesson.affirmation}"</Text>
      </Card>

      {/* Nourishment Tip */}
      <Card variant="default" style={styles.tipCard}>
        <View style={styles.tipHeader}>
          <Text style={styles.tipEmoji}>🌿</Text>
          <Text style={styles.tipLabel}>Nourishment Tip</Text>
        </View>
        <Text style={styles.tipText}>{lesson.nourishmentTip}</Text>
      </Card>
    </View>
  );
}

// Journal Tab
interface JournalTabProps {
  lesson: Lesson;
  onJournalSaved: () => void;
}

function JournalTab({ lesson, onJournalSaved }: JournalTabProps) {
  const [primaryResponse, setPrimaryResponse] = useState('');
  const [reflectionResponse, setReflectionResponse] = useState('');
  const [gratitudeResponse, setGratitudeResponse] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasExistingEntry, setHasExistingEntry] = useState(false);

  // Load existing journal entry if it exists
  useEffect(() => {
    const loadExistingEntry = async () => {
      try {
        const existingEntry = await journalService.getJournalEntryForLesson(lesson.id);
        if (existingEntry) {
          const hasResponses = existingEntry.prompt_response || existingEntry.reflection_response || existingEntry.gratitude_response;
          if (hasResponses) {
            setHasExistingEntry(true);
            setPrimaryResponse(existingEntry.prompt_response || '');
            setReflectionResponse(existingEntry.reflection_response || '');
            setGratitudeResponse(existingEntry.gratitude_response || '');
          }
        }
      } catch (error) {
        console.error('Failed to load existing entry:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadExistingEntry();
  }, [lesson.id]);

  const handleSave = async () => {
    if (!primaryResponse.trim() && !reflectionResponse.trim() && !gratitudeResponse.trim()) {
      Alert.alert('Empty Entry', 'Please write at least one response before saving.');
      return;
    }

    setIsSaving(true);
    try {
      const now = new Date();
      const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      await journalService.saveJournalEntry({
        lessonId: lesson.id,
        entryDate: today,
        entryType: 'daily',
        promptResponse: primaryResponse.trim() || undefined,
        reflectionResponse: reflectionResponse.trim() || undefined,
        gratitudeResponse: gratitudeResponse.trim() || undefined,
      });
      setHasExistingEntry(true);
      onJournalSaved();
      Alert.alert('Saved', 'Your journal entry has been saved.');
    } catch (error: any) {
      console.error('Failed to save journal entry:', error);
      Alert.alert('Error', error.message || 'Failed to save. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading journal...</Text>
      </View>
    );
  }

  return (
    <View>
      <Text style={styles.lessonTitle}>Journal Prompts</Text>

      {hasExistingEntry && (
        <View style={styles.completedBanner}>
          <Ionicons name="checkmark-circle" size={20} color={Colors.primary.tiffanyBlue} />
          <Text style={styles.completedBannerText}>Journal entry completed</Text>
        </View>
      )}

      {/* Primary Prompt */}
      <Card variant="elevated" style={styles.promptCard}>
        <View style={styles.promptHeader}>
          <Ionicons name="sunny-outline" size={20} color={Colors.primary.orange} />
          <Text style={styles.promptLabelWithIcon}>Today's Reflection</Text>
        </View>
        <Text style={styles.promptText}>{lesson.journalPrompt.primary}</Text>
        {hasExistingEntry ? (
          <Text style={styles.savedResponse}>{primaryResponse || '—'}</Text>
        ) : (
          <TextInput
            style={styles.journalInput}
            placeholder="Write your thoughts..."
            placeholderTextColor={Colors.text.muted}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            value={primaryResponse}
            onChangeText={setPrimaryResponse}
          />
        )}
      </Card>

      {/* Reflection Prompt */}
      <Card variant="outlined" style={styles.promptCard}>
        <View style={styles.promptHeader}>
          <Ionicons name="bulb-outline" size={20} color={Colors.primary.tiffanyBlue} />
          <Text style={styles.promptLabelWithIcon}>Deeper Reflection</Text>
        </View>
        <Text style={styles.promptText}>{lesson.journalPrompt.reflection}</Text>
        {hasExistingEntry ? (
          <Text style={styles.savedResponse}>{reflectionResponse || '—'}</Text>
        ) : (
          <TextInput
            style={styles.journalInput}
            placeholder="Explore deeper..."
            placeholderTextColor={Colors.text.muted}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            value={reflectionResponse}
            onChangeText={setReflectionResponse}
          />
        )}
      </Card>

      {/* Gratitude Prompt */}
      <Card variant="outlined" style={styles.promptCard}>
        <View style={styles.promptHeader}>
          <Ionicons name="heart-outline" size={20} color={Colors.status.error} />
          <Text style={styles.promptLabelWithIcon}>Gratitude</Text>
        </View>
        <Text style={styles.promptText}>
          {lesson.journalPrompt.gratitude || "What are you grateful for today on your wellness journey?"}
        </Text>
        {hasExistingEntry ? (
          <Text style={styles.savedResponse}>{gratitudeResponse || '—'}</Text>
        ) : (
          <TextInput
            style={styles.journalInput}
            placeholder="What are you grateful for..."
            placeholderTextColor={Colors.text.muted}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            value={gratitudeResponse}
            onChangeText={setGratitudeResponse}
          />
        )}
      </Card>

      {/* Save Button - only show if no existing entry */}
      {!hasExistingEntry && (
        <Button
          title="Save Journal Entry"
          onPress={handleSave}
          loading={isSaving}
          fullWidth
          style={styles.saveJournalButton}
        />
      )}
    </View>
  );
}

// Movement Tab
interface MovementTabProps {
  lesson: Lesson;
  onMovementCompleted: () => void;
}

function MovementTab({ lesson, onMovementCompleted }: MovementTabProps) {
  const [isMovementComplete, setIsMovementComplete] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Check if movement is already completed
  useEffect(() => {
    const checkMovementStatus = async () => {
      try {
        const entry = await journalService.getJournalEntryForLesson(lesson.id);
        if (entry?.movement_completed) {
          setIsMovementComplete(true);
        }
      } catch (error) {
        console.error('Failed to check movement status:', error);
      } finally {
        setIsLoading(false);
      }
    };
    checkMovementStatus();
  }, [lesson.id]);

  const handleMarkComplete = async () => {
    if (isSaving || isMovementComplete) return;

    setIsSaving(true);
    try {
      const now = new Date();
      const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      await journalService.saveJournalEntry({
        lessonId: lesson.id,
        entryDate: today,
        entryType: 'daily',
        movementCompleted: true,
      });
      setIsMovementComplete(true);
      onMovementCompleted();
    } catch (error: any) {
      console.error('Failed to save movement:', error);
      Alert.alert('Error', error.message || 'Failed to save. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View>
      <Text style={styles.lessonTitle}>Today's Movement</Text>

      {/* Basic Movement */}
      <Card variant="elevated" style={styles.movementCard}>
        <View style={styles.movementHeader}>
          <Badge label="Basic" variant="info" size="sm" />
        </View>
        <Text style={styles.movementText}>{lesson.movementSuggestion.basic}</Text>
      </Card>

      {/* Personalized Movement */}
      <Card variant="elevated" style={styles.movementCard}>
        <View style={styles.movementHeader}>
          <Badge label="Personalized" variant="secondary" size="sm" />
        </View>
        <Text style={styles.movementText}>{lesson.movementSuggestion.personalized}</Text>
      </Card>

      {/* Movement Tracking */}
      <Card variant="outlined" style={styles.trackingCard}>
        <Text style={styles.trackingTitle}>Track Your Movement</Text>
        <Text style={styles.trackingSubtitle}>
          {isMovementComplete
            ? "Great job! You've completed today's movement."
            : "Mark as complete when you've done today's movement"}
        </Text>
        <Button
          title={isMovementComplete ? "Completed" : "Mark Complete"}
          variant={isMovementComplete ? "outline" : "primary"}
          onPress={handleMarkComplete}
          loading={isSaving || isLoading}
          disabled={isMovementComplete}
          style={styles.trackingButton}
        />
      </Card>
    </View>
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

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Layout.screenPaddingHorizontal,
    paddingVertical: Spacing.md,
  },
  backButton: {
    padding: Spacing.sm,
    marginLeft: -Spacing.sm,
  },

  // Tabs
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: Layout.screenPaddingHorizontal,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  tabButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.background.secondary,
  },
  tabButtonActive: {
    backgroundColor: Colors.primary.orange,
  },
  tabButtonText: {
    ...Typography.bodySmall,
    fontWeight: '600',
    color: Colors.text.secondary,
  },
  tabButtonTextActive: {
    color: Colors.text.inverse,
  },

  // Content
  lessonTitle: {
    ...Typography.h2,
    color: Colors.text.primary,
    marginBottom: Spacing.lg,
  },

  // Introduction card
  introCard: {
    marginBottom: Spacing.xl,
    backgroundColor: Colors.primary.orangeLight + '15',
  },
  introHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  introLabel: {
    ...Typography.bodySmall,
    fontWeight: '600',
    color: Colors.primary.orange,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  introText: {
    ...Typography.bodyLarge,
    color: Colors.text.primary,
    fontStyle: 'italic',
    lineHeight: 28,
  },

  // Main content section
  mainContentSection: {
    marginBottom: Spacing.xl,
  },
  contentSection: {
    marginBottom: Spacing.lg,
  },
  contentHeading: {
    ...Typography.h4,
    color: Colors.primary.orange,
    marginBottom: Spacing.md,
    marginTop: Spacing.md,
  },
  contentParagraph: {
    ...Typography.body,
    color: Colors.text.primary,
    lineHeight: 26,
    marginBottom: Spacing.md,
  },
  boldText: {
    fontWeight: '600',
    color: Colors.text.primary,
  },

  // Bullet lists
  bulletList: {
    marginBottom: Spacing.md,
  },
  bulletItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
    paddingLeft: Spacing.sm,
  },
  bulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary.tiffanyBlue,
    marginTop: 8,
    marginRight: Spacing.md,
  },
  bulletText: {
    ...Typography.body,
    color: Colors.text.primary,
    flex: 1,
    lineHeight: 24,
  },
  bulletBold: {
    fontWeight: '600',
    color: Colors.primary.orange,
  },

  // Key takeaways card
  takeawaysCard: {
    marginBottom: Spacing.xl,
    borderColor: Colors.primary.tiffanyBlue,
    borderWidth: 2,
  },
  takeawaysHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  takeawaysTitle: {
    ...Typography.h5,
    color: Colors.primary.tiffanyBlue,
  },

  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    ...Typography.h5,
    color: Colors.text.primary,
    marginBottom: Spacing.md,
  },

  // Takeaways
  takeawayItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  takeawayText: {
    ...Typography.body,
    color: Colors.text.primary,
    flex: 1,
  },

  // Action Card
  actionCard: {
    marginBottom: Spacing.xl,
    backgroundColor: Colors.primary.orangeLight + '10',
    borderWidth: 1,
    borderColor: Colors.primary.orangeLight,
  },
  actionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  actionTitle: {
    ...Typography.h5,
    color: Colors.primary.orange,
  },
  actionText: {
    ...Typography.body,
    color: Colors.text.primary,
  },

  // Affirmation
  affirmationCard: {
    marginBottom: Spacing.xl,
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    backgroundColor: Colors.primary.orangeLight + '10',
  },
  affirmationIcon: {
    marginBottom: Spacing.sm,
  },
  affirmationLabel: {
    ...Typography.caption,
    color: Colors.text.muted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: Spacing.sm,
  },
  affirmationText: {
    ...Typography.affirmation,
    color: Colors.text.secondary,
    textAlign: 'center',
    paddingHorizontal: Spacing.md,
  },

  // Tip Card
  tipCard: {
    marginBottom: Spacing.xl,
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  tipEmoji: {
    fontSize: 20,
  },
  tipLabel: {
    ...Typography.bodySmall,
    fontWeight: '600',
    color: Colors.text.secondary,
  },
  tipText: {
    ...Typography.body,
    color: Colors.text.primary,
  },

  // Journal Tab
  promptCard: {
    marginBottom: Spacing.lg,
  },
  promptHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  promptLabel: {
    ...Typography.caption,
    color: Colors.text.muted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: Spacing.sm,
  },
  promptLabelWithIcon: {
    ...Typography.bodySmall,
    fontWeight: '600',
    color: Colors.text.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  promptText: {
    ...Typography.body,
    color: Colors.text.secondary,
    fontStyle: 'italic',
    marginBottom: Spacing.md,
  },
  journalInput: {
    ...Typography.body,
    color: Colors.text.primary,
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    minHeight: 100,
    borderWidth: 1,
    borderColor: Colors.ui.border,
  },
  savedResponse: {
    ...Typography.body,
    color: Colors.text.primary,
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    minHeight: 60,
  },
  saveJournalButton: {
    marginTop: Spacing.lg,
  },
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
  completedBannerText: {
    ...Typography.bodySmall,
    fontWeight: '600',
    color: Colors.primary.tiffanyBlue,
  },
  loadingContainer: {
    padding: Spacing.xl,
    alignItems: 'center',
  },
  loadingText: {
    ...Typography.body,
    color: Colors.text.secondary,
  },

  // Movement Tab
  movementCard: {
    marginBottom: Spacing.lg,
  },
  movementHeader: {
    marginBottom: Spacing.md,
  },
  movementText: {
    ...Typography.body,
    color: Colors.text.primary,
  },
  trackingCard: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  trackingTitle: {
    ...Typography.h5,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  trackingSubtitle: {
    ...Typography.bodySmall,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  trackingButton: {
    minWidth: 200,
  },

  // Footer
  footer: {
    padding: Layout.screenPaddingHorizontal,
    paddingBottom: Spacing.xl,
    borderTopWidth: 1,
    borderTopColor: Colors.ui.border,
  },
  requirementsContainer: {
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  requirementsTitle: {
    ...Typography.bodySmall,
    fontWeight: '600',
    color: Colors.text.secondary,
    marginBottom: Spacing.sm,
  },
  requirementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  requirementLabel: {
    ...Typography.bodySmall,
    color: Colors.text.secondary,
  },
  requirementComplete: {
    color: Colors.status.success,
    textDecorationLine: 'line-through',
  },

  // Error
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.lg,
  },
  errorText: {
    ...Typography.h4,
    color: Colors.text.secondary,
  },
});
