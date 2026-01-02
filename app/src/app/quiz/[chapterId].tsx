import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { Typography } from '@/constants/typography';
import { Spacing } from '@/constants/spacing';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { useQuiz } from '@/hooks/useQuiz';
import phasesData from '@/data/content/chapters.json';

// Extract all chapters from all phases
const allChapters = phasesData.phases.flatMap((phase) => phase.chapters);

export default function QuizScreen() {
  const { chapterId } = useLocalSearchParams<{ chapterId: string }>();
  const [showResults, setShowResults] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    quiz,
    state,
    currentQuestion,
    progress,
    allAnswered,
    hasPassed,
    bestScore,
    answerQuestion,
    nextQuestion,
    previousQuestion,
    completeQuiz,
    resetQuiz,
    checkCanRetry,
  } = useQuiz(chapterId);

  // Get chapter info
  const chapter = allChapters.find((c) => c.id === chapterId);

  // Handle quiz submission
  const handleSubmit = async () => {
    if (!allAnswered) return;

    setIsSubmitting(true);
    try {
      await completeQuiz();
      setShowResults(true);
    } catch (error) {
      console.error('Failed to submit quiz:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle retry
  const handleRetry = async () => {
    const { canRetry, waitTime } = await checkCanRetry();
    if (canRetry) {
      resetQuiz();
      setShowResults(false);
    } else if (waitTime) {
      const hours = Math.ceil(waitTime / (1000 * 60 * 60));
      alert(`You can retry in ${hours} hours`);
    }
  };

  if (!quiz || !chapter) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Text style={styles.errorText}>Quiz not found</Text>
          <Button title="Go Back" onPress={() => router.back()} />
        </View>
      </SafeAreaView>
    );
  }

  // Show results screen
  if (showResults && state.isComplete) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.resultsContainer}>
          <View style={styles.resultsContent}>
            {/* Score Display */}
            <View style={styles.scoreSection}>
              <ProgressRing
                progress={state.score || 0}
                size={160}
                strokeWidth={12}
                color={state.passed ? Colors.status.success : Colors.status.warning}
              />
              <Text style={styles.scoreLabel}>Your Score</Text>
            </View>

            {/* Result Message */}
            <View style={styles.resultMessage}>
              {state.passed ? (
                <>
                  <Ionicons
                    name="checkmark-circle"
                    size={48}
                    color={Colors.status.success}
                  />
                  <Text style={styles.resultTitle}>Congratulations!</Text>
                  <Text style={styles.resultSubtitle}>
                    You've mastered the concepts in {chapter.title}
                  </Text>
                </>
              ) : (
                <>
                  <Ionicons
                    name="refresh-circle"
                    size={48}
                    color={Colors.status.warning}
                  />
                  <Text style={styles.resultTitle}>Almost There!</Text>
                  <Text style={styles.resultSubtitle}>
                    Let's strengthen your understanding of some topics
                  </Text>
                </>
              )}
            </View>

            {/* Missed Topics */}
            {!state.passed && state.missedTopics.length > 0 && (
              <Card style={styles.reviewCard}>
                <Text style={styles.reviewTitle}>Topics to Review</Text>
                {state.missedTopics.map((topic, index) => (
                  <View key={topic} style={styles.reviewItem}>
                    <Ionicons
                      name="book-outline"
                      size={20}
                      color={Colors.primary.orange}
                    />
                    <Text style={styles.reviewText}>
                      {topic.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                    </Text>
                  </View>
                ))}
                <Button
                  title="Review Topics"
                  variant="outline"
                  onPress={() =>
                    router.push({
                      pathname: '/quiz/review',
                      params: { topics: state.missedTopics.join(','), chapterId },
                    })
                  }
                  style={styles.reviewButton}
                />
              </Card>
            )}

            {/* Actions */}
            <View style={styles.resultActions}>
              {state.passed ? (
                <Button
                  title="Continue Journey"
                  onPress={() => router.replace('/(tabs)/journey')}
                  style={styles.actionButton}
                />
              ) : (
                <>
                  <Button
                    title="Try Again"
                    onPress={handleRetry}
                    style={styles.actionButton}
                  />
                  <Button
                    title="Review Lessons"
                    variant="outline"
                    onPress={() => router.back()}
                    style={styles.actionButton}
                  />
                </>
              )}
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Quiz question screen
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
          <Ionicons name="close" size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.chapterTitle}>{chapter.title}</Text>
          <Text style={styles.questionCount}>
            Question {progress.current} of {progress.total}
          </Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      {/* Progress Bar */}
      <View style={styles.progressBar}>
        <View
          style={[
            styles.progressFill,
            { width: `${(progress.current / progress.total) * 100}%` },
          ]}
        />
      </View>

      {/* Question Content */}
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {currentQuestion && (
          <View style={styles.questionSection}>
            <Text style={styles.questionText}>{currentQuestion.question}</Text>

            {/* Options */}
            {currentQuestion.type === 'multiple_choice' && currentQuestion.options && (
              <View style={styles.optionsContainer}>
                {currentQuestion.options.map((option, index) => {
                  const isSelected = state.answers[currentQuestion.id] === index;
                  return (
                    <TouchableOpacity
                      key={index}
                      style={[styles.optionButton, isSelected && styles.optionSelected]}
                      onPress={() => answerQuestion(currentQuestion.id, index)}
                    >
                      <View
                        style={[
                          styles.optionIndicator,
                          isSelected && styles.optionIndicatorSelected,
                        ]}
                      >
                        {isSelected && (
                          <Ionicons name="checkmark" size={16} color={Colors.neutral.white} />
                        )}
                      </View>
                      <Text
                        style={[styles.optionText, isSelected && styles.optionTextSelected]}
                      >
                        {option}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {/* True/False */}
            {currentQuestion.type === 'true_false' && (
              <View style={styles.trueFalseContainer}>
                {['True', 'False'].map((option) => {
                  const value = option.toLowerCase(); // Store as 'true' or 'false' string
                  const isSelected = state.answers[currentQuestion.id] === value;
                  return (
                    <TouchableOpacity
                      key={option}
                      style={[styles.trueFalseButton, isSelected ? styles.trueFalseSelected : undefined]}
                      onPress={() => answerQuestion(currentQuestion.id, value)}
                    >
                      <Ionicons
                        name={option === 'True' ? 'checkmark-circle' : 'close-circle'}
                        size={32}
                        color={isSelected ? Colors.neutral.white : Colors.text.secondary}
                      />
                      <Text
                        style={[
                          styles.trueFalseText,
                          isSelected ? styles.trueFalseTextSelected : undefined,
                        ]}
                      >
                        {option}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {/* Reflection (always passes) */}
            {currentQuestion.type === 'reflection' && (
              <View style={styles.reflectionContainer}>
                <Card style={styles.reflectionCard}>
                  <Ionicons
                    name="heart-outline"
                    size={24}
                    color={Colors.primary.orange}
                    style={styles.reflectionIcon}
                  />
                  <Text style={styles.reflectionHint}>
                    This is a reflection question. Take a moment to consider your answer.
                    All reflection responses are valid.
                  </Text>
                  <TouchableOpacity
                    style={[
                      styles.reflectionButton,
                      state.answers[currentQuestion.id] ? styles.reflectionButtonSelected : undefined,
                    ]}
                    onPress={() => answerQuestion(currentQuestion.id, 'reflected')}
                  >
                    <Text
                      style={[
                        styles.reflectionButtonText,
                        state.answers[currentQuestion.id] ? styles.reflectionButtonTextSelected : undefined,
                      ]}
                    >
                      {state.answers[currentQuestion.id]
                        ? "I've reflected on this"
                        : 'Mark as reflected'}
                    </Text>
                  </TouchableOpacity>
                </Card>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Navigation */}
      <View style={styles.navigation}>
        <TouchableOpacity
          onPress={previousQuestion}
          disabled={progress.current === 1}
          style={[styles.navButton, progress.current === 1 && styles.navButtonDisabled]}
        >
          <Ionicons
            name="chevron-back"
            size={24}
            color={progress.current === 1 ? Colors.text.muted : Colors.text.primary}
          />
          <Text
            style={[styles.navText, progress.current === 1 && styles.navTextDisabled]}
          >
            Previous
          </Text>
        </TouchableOpacity>

        {progress.current === progress.total ? (
          <Button
            title={isSubmitting ? 'Submitting...' : 'Submit Quiz'}
            onPress={handleSubmit}
            disabled={!allAnswered || isSubmitting}
            style={styles.submitButton}
          />
        ) : (
          <TouchableOpacity
            onPress={nextQuestion}
            style={styles.navButton}
          >
            <Text style={styles.navText}>Next</Text>
            <Ionicons name="chevron-forward" size={24} color={Colors.text.primary} />
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.layout.screenPadding,
  },
  errorText: {
    ...Typography.textStyles.body,
    color: Colors.text.secondary,
    marginBottom: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.layout.screenPadding,
    paddingVertical: Spacing.md,
  },
  closeButton: {
    padding: Spacing.xs,
  },
  headerInfo: {
    alignItems: 'center',
  },
  headerSpacer: {
    width: 32,
  },
  chapterTitle: {
    ...Typography.textStyles.caption,
    color: Colors.text.secondary,
  },
  questionCount: {
    ...Typography.textStyles.bodySmall,
    color: Colors.text.primary,
    fontWeight: '600',
  },
  progressBar: {
    height: 4,
    backgroundColor: Colors.background.tertiary,
    marginHorizontal: Spacing.layout.screenPadding,
    borderRadius: Spacing.borderRadius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary.orange,
    borderRadius: Spacing.borderRadius.full,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: Spacing.layout.screenPadding,
  },
  questionSection: {
    flex: 1,
  },
  questionText: {
    ...Typography.textStyles.h4,
    color: Colors.text.primary,
    marginBottom: Spacing.xl,
  },
  optionsContainer: {
    gap: Spacing.sm,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    backgroundColor: Colors.background.secondary,
    borderRadius: Spacing.borderRadius.md,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionSelected: {
    borderColor: Colors.primary.orange,
    backgroundColor: Colors.primary.orangeLight,
  },
  optionIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.text.muted,
    marginRight: Spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionIndicatorSelected: {
    borderColor: Colors.primary.orange,
    backgroundColor: Colors.primary.orange,
  },
  optionText: {
    ...Typography.textStyles.body,
    color: Colors.text.primary,
    flex: 1,
  },
  optionTextSelected: {
    fontWeight: '600',
  },
  trueFalseContainer: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  trueFalseButton: {
    flex: 1,
    alignItems: 'center',
    padding: Spacing.lg,
    backgroundColor: Colors.background.secondary,
    borderRadius: Spacing.borderRadius.md,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  trueFalseSelected: {
    borderColor: Colors.primary.orange,
    backgroundColor: Colors.primary.orange,
  },
  trueFalseText: {
    ...Typography.textStyles.body,
    color: Colors.text.primary,
    marginTop: Spacing.xs,
  },
  trueFalseTextSelected: {
    color: Colors.neutral.white,
    fontWeight: '600',
  },
  reflectionContainer: {
    flex: 1,
  },
  reflectionCard: {
    alignItems: 'center',
    padding: Spacing.xl,
  },
  reflectionIcon: {
    marginBottom: Spacing.md,
  },
  reflectionHint: {
    ...Typography.textStyles.body,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  reflectionButton: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: Spacing.borderRadius.full,
    borderWidth: 2,
    borderColor: Colors.primary.orange,
  },
  reflectionButtonSelected: {
    backgroundColor: Colors.primary.orange,
  },
  reflectionButtonText: {
    ...Typography.textStyles.body,
    color: Colors.primary.orange,
    fontWeight: '600',
  },
  reflectionButtonTextSelected: {
    color: Colors.neutral.white,
  },
  navigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.layout.screenPadding,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.background.tertiary,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.sm,
  },
  navButtonDisabled: {
    opacity: 0.5,
  },
  navText: {
    ...Typography.textStyles.body,
    color: Colors.text.primary,
    fontWeight: '600',
  },
  navTextDisabled: {
    color: Colors.text.muted,
  },
  submitButton: {
    minWidth: 140,
  },
  // Results styles
  resultsContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: Spacing.layout.screenPadding,
  },
  resultsContent: {
    alignItems: 'center',
  },
  scoreSection: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  scoreLabel: {
    ...Typography.textStyles.caption,
    color: Colors.text.secondary,
    marginTop: Spacing.sm,
  },
  resultMessage: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  resultTitle: {
    ...Typography.textStyles.h3,
    color: Colors.text.primary,
    marginTop: Spacing.md,
  },
  resultSubtitle: {
    ...Typography.textStyles.body,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginTop: Spacing.xs,
  },
  reviewCard: {
    width: '100%',
    marginBottom: Spacing.xl,
  },
  reviewTitle: {
    ...Typography.textStyles.h5,
    color: Colors.text.primary,
    marginBottom: Spacing.md,
  },
  reviewItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  reviewText: {
    ...Typography.textStyles.body,
    color: Colors.text.primary,
    marginLeft: Spacing.sm,
  },
  reviewButton: {
    marginTop: Spacing.md,
  },
  resultActions: {
    width: '100%',
    gap: Spacing.sm,
  },
  actionButton: {
    width: '100%',
  },
});
