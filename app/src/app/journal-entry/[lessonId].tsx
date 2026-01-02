import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Layout, BorderRadius } from '@/constants';
import { Button, Card } from '@/components/ui';
import * as journalService from '@/services/journalService';

// Import lesson data
import lessonsData from '@/data/content/lessons.json';
import { Lesson } from '@/data/schema/types';

export default function JournalEntryScreen() {
  const { lessonId } = useLocalSearchParams<{ lessonId: string }>();
  const router = useRouter();

  // Find the lesson
  const lesson = lessonsData.lessons.find((l) => l.id === lessonId) as Lesson | undefined;

  const [primaryResponse, setPrimaryResponse] = useState('');
  const [reflectionResponse, setReflectionResponse] = useState('');
  const [gratitudeResponse, setGratitudeResponse] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasExistingEntry, setHasExistingEntry] = useState(false);

  // Load existing journal entry if it exists
  useEffect(() => {
    const loadExistingEntry = async () => {
      if (!lessonId) return;

      try {
        const existingEntry = await journalService.getJournalEntryForLesson(lessonId);
        if (existingEntry) {
          setHasExistingEntry(true);
          setPrimaryResponse(existingEntry.prompt_response || '');
          setReflectionResponse(existingEntry.reflection_response || '');
          setGratitudeResponse(existingEntry.gratitude_response || '');
        }
      } catch (error) {
        console.error('Failed to load existing entry:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadExistingEntry();
  }, [lessonId]);

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

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <ActivityIndicator size="large" color={Colors.primary.orange} />
        </View>
      </SafeAreaView>
    );
  }

  const handleSave = async () => {
    if (!primaryResponse.trim() && !reflectionResponse.trim() && !gratitudeResponse.trim()) {
      Alert.alert('Empty Entry', 'Please write at least one response before saving.');
      return;
    }

    setIsSaving(true);
    try {
      // Use local date instead of UTC
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
      router.back();
    } catch (error: any) {
      console.error('Failed to save journal entry:', error);
      Alert.alert(
        'Error',
        error.message || 'Failed to save. Please try again.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={Colors.text.primary} />
          </Pressable>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>Journal Entry</Text>
            <Text style={styles.headerSubtitle}>Day {lesson.dayNumber}: {lesson.title}</Text>
          </View>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {hasExistingEntry && (
            <View style={styles.completedBanner}>
              <Ionicons name="checkmark-circle" size={20} color={Colors.primary.tiffanyBlue} />
              <Text style={styles.completedText}>Journal entry completed</Text>
            </View>
          )}

          {/* Primary Prompt */}
          <Card variant="elevated" style={styles.promptCard}>
            <View style={styles.promptHeader}>
              <Ionicons name="sunny-outline" size={20} color={Colors.primary.orange} />
              <Text style={styles.promptLabel}>Today's Reflection</Text>
            </View>
            <Text style={styles.promptText}>{lesson.journalPrompt.primary}</Text>
            {hasExistingEntry ? (
              <Text style={styles.savedResponse}>{primaryResponse || '—'}</Text>
            ) : (
              <TextInput
                style={styles.input}
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
              <Text style={styles.promptLabel}>Deeper Reflection</Text>
            </View>
            <Text style={styles.promptText}>{lesson.journalPrompt.reflection}</Text>
            {hasExistingEntry ? (
              <Text style={styles.savedResponse}>{reflectionResponse || '—'}</Text>
            ) : (
              <TextInput
                style={styles.input}
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
          {lesson.journalPrompt.gratitude && (
            <Card variant="outlined" style={styles.promptCard}>
              <View style={styles.promptHeader}>
                <Ionicons name="heart-outline" size={20} color={Colors.status.error} />
                <Text style={styles.promptLabel}>Gratitude</Text>
              </View>
              <Text style={styles.promptText}>{lesson.journalPrompt.gratitude}</Text>
              {hasExistingEntry ? (
                <Text style={styles.savedResponse}>{gratitudeResponse || '—'}</Text>
              ) : (
                <TextInput
                  style={styles.input}
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
          )}

          {/* Save Button - only show if no existing entry */}
          {!hasExistingEntry && (
            <Button
              title="Save Journal Entry"
              onPress={handleSave}
              loading={isSaving}
              fullWidth
              style={styles.saveButton}
            />
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  keyboardView: {
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  errorText: {
    ...Typography.h4,
    color: Colors.text.secondary,
    marginBottom: Spacing.lg,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Layout.screenPaddingHorizontal,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.ui.border,
  },
  backButton: {
    padding: Spacing.sm,
    marginLeft: -Spacing.sm,
  },
  headerText: {
    flex: 1,
    marginLeft: Spacing.sm,
  },
  headerTitle: {
    ...Typography.h4,
    color: Colors.text.primary,
  },
  headerSubtitle: {
    ...Typography.bodySmall,
    color: Colors.text.secondary,
  },

  // Content
  scrollView: {
    flex: 1,
  },
  content: {
    padding: Layout.screenPaddingHorizontal,
    paddingBottom: Spacing['4xl'],
  },

  // Prompt cards
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
  input: {
    ...Typography.body,
    color: Colors.text.primary,
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    minHeight: 100,
    borderWidth: 1,
    borderColor: Colors.ui.border,
  },

  // Save button
  saveButton: {
    marginTop: Spacing.lg,
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
  savedResponse: {
    ...Typography.body,
    color: Colors.text.primary,
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    minHeight: 60,
  },
});
