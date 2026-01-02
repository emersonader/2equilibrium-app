import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { Typography } from '@/constants/typography';
import { Spacing } from '@/constants/spacing';
import { Card } from '@/components/ui/Card';
import type { QuizQuestion } from '@/data/schema/types';

interface QuestionCardProps {
  question: QuizQuestion;
  selectedAnswer: string | number | boolean | null;
  onAnswer: (answer: string | number | boolean) => void;
  showCorrect?: boolean;
}

export function QuestionCard({
  question,
  selectedAnswer,
  onAnswer,
  showCorrect = false,
}: QuestionCardProps) {
  const renderMultipleChoice = () => (
    <View style={styles.optionsContainer}>
      {question.options?.map((option, index) => {
        const isSelected = selectedAnswer === index;
        const isCorrect = showCorrect && question.correctAnswer === index;
        const isWrong = showCorrect && isSelected && question.correctAnswer !== index;

        return (
          <TouchableOpacity
            key={index}
            style={[
              styles.optionButton,
              isSelected && styles.optionSelected,
              isCorrect && styles.optionCorrect,
              isWrong && styles.optionWrong,
            ]}
            onPress={() => !showCorrect && onAnswer(index)}
            disabled={showCorrect}
          >
            <View
              style={[
                styles.optionIndicator,
                isSelected && styles.optionIndicatorSelected,
                isCorrect && styles.optionIndicatorCorrect,
                isWrong && styles.optionIndicatorWrong,
              ]}
            >
              {isSelected && (
                <Ionicons
                  name={isWrong ? 'close' : 'checkmark'}
                  size={16}
                  color={Colors.neutral.white}
                />
              )}
            </View>
            <Text
              style={[
                styles.optionText,
                isSelected && styles.optionTextSelected,
                isCorrect && styles.optionTextCorrect,
              ]}
            >
              {option}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  const renderTrueFalse = () => (
    <View style={styles.trueFalseContainer}>
      {[true, false].map((value) => {
        const isSelected = selectedAnswer === value;
        const isCorrect = showCorrect && question.correctAnswer === value;
        const isWrong = showCorrect && isSelected && question.correctAnswer !== value;

        return (
          <TouchableOpacity
            key={String(value)}
            style={[
              styles.trueFalseButton,
              isSelected && styles.trueFalseSelected,
              isCorrect && styles.trueFalseCorrect,
              isWrong && styles.trueFalseWrong,
            ]}
            onPress={() => !showCorrect && onAnswer(value)}
            disabled={showCorrect}
          >
            <Ionicons
              name={value ? 'checkmark-circle' : 'close-circle'}
              size={32}
              color={
                isSelected
                  ? Colors.neutral.white
                  : isCorrect
                  ? Colors.status.success
                  : Colors.text.secondary
              }
            />
            <Text
              style={[
                styles.trueFalseText,
                isSelected && styles.trueFalseTextSelected,
                isCorrect && !isSelected && styles.trueFalseTextCorrect,
              ]}
            >
              {value ? 'True' : 'False'}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  const renderReflection = () => (
    <Card style={styles.reflectionCard}>
      <Ionicons
        name="heart-outline"
        size={24}
        color={Colors.primary.orange}
        style={styles.reflectionIcon}
      />
      <Text style={styles.reflectionHint}>
        This is a reflection question. Take a moment to consider your answer. All reflection
        responses are honored.
      </Text>
      <TouchableOpacity
        style={[styles.reflectionButton, selectedAnswer ? styles.reflectionButtonSelected : undefined]}
        onPress={() => onAnswer('reflected')}
        disabled={showCorrect}
      >
        <Text
          style={[
            styles.reflectionButtonText,
            selectedAnswer ? styles.reflectionButtonTextSelected : undefined,
          ]}
        >
          {selectedAnswer ? "I've reflected on this" : 'Mark as reflected'}
        </Text>
      </TouchableOpacity>
    </Card>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.questionText}>{question.question}</Text>

      {question.type === 'multiple_choice' && renderMultipleChoice()}
      {question.type === 'true_false' && renderTrueFalse()}
      {question.type === 'reflection' && renderReflection()}

      {showCorrect && question.explanation && (
        <View style={styles.explanationContainer}>
          <Ionicons name="information-circle" size={20} color={Colors.primary.tiffanyBlue} />
          <Text style={styles.explanationText}>{question.explanation}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
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
  optionCorrect: {
    borderColor: Colors.status.success,
    backgroundColor: Colors.status.successLight,
  },
  optionWrong: {
    borderColor: Colors.status.error,
    backgroundColor: Colors.status.errorLight,
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
  optionIndicatorCorrect: {
    borderColor: Colors.status.success,
    backgroundColor: Colors.status.success,
  },
  optionIndicatorWrong: {
    borderColor: Colors.status.error,
    backgroundColor: Colors.status.error,
  },
  optionText: {
    ...Typography.textStyles.body,
    color: Colors.text.primary,
    flex: 1,
  },
  optionTextSelected: {
    fontWeight: '600',
  },
  optionTextCorrect: {
    fontWeight: '600',
    color: Colors.status.success,
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
  trueFalseCorrect: {
    borderColor: Colors.status.success,
  },
  trueFalseWrong: {
    borderColor: Colors.status.error,
    backgroundColor: Colors.status.error,
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
  trueFalseTextCorrect: {
    color: Colors.status.success,
    fontWeight: '600',
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
  explanationContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.background.secondary,
    padding: Spacing.md,
    borderRadius: Spacing.borderRadius.md,
    marginTop: Spacing.lg,
  },
  explanationText: {
    ...Typography.textStyles.bodySmall,
    color: Colors.text.secondary,
    marginLeft: Spacing.sm,
    flex: 1,
  },
});

export default QuestionCard;
