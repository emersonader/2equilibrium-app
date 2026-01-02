import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { Typography } from '@/constants/typography';
import { Spacing } from '@/constants/spacing';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { getReviewContent } from '@/hooks/useQuiz';
import lessonsData from '@/data/content/lessons.json';

export default function QuizReviewScreen() {
  const { topics, chapterId } = useLocalSearchParams<{ topics: string; chapterId: string }>();

  const missedTopics = topics ? topics.split(',') : [];
  const reviewContent = getReviewContent(missedTopics);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Review Topics</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Intro */}
        <View style={styles.intro}>
          <Ionicons name="book-outline" size={48} color={Colors.primary.orange} />
          <Text style={styles.introTitle}>Let's strengthen your understanding</Text>
          <Text style={styles.introText}>
            Review these topics before retaking the quiz. Take your time to absorb the key
            concepts.
          </Text>
        </View>

        {/* Review Cards */}
        {reviewContent.map((item, index) => {
          const lesson = lessonsData.lessons.find((l) => l.dayNumber === item.lessonDay);

          return (
            <Card key={item.topic} style={styles.reviewCard}>
              <View style={styles.cardHeader}>
                <View style={styles.dayBadge}>
                  <Text style={styles.dayBadgeText}>Day {item.lessonDay}</Text>
                </View>
                <Text style={styles.cardTitle}>{item.reviewTitle}</Text>
              </View>

              <View style={styles.keyPoints}>
                <Text style={styles.keyPointsLabel}>Key Points:</Text>
                {item.keyPoints?.map((point, pointIndex) => (
                  <View key={pointIndex} style={styles.keyPoint}>
                    <Ionicons
                      name="checkmark-circle"
                      size={18}
                      color={Colors.primary.tiffanyBlue}
                    />
                    <Text style={styles.keyPointText}>{point}</Text>
                  </View>
                ))}
              </View>

              {lesson && (
                <TouchableOpacity
                  style={styles.lessonLink}
                  onPress={() =>
                    router.push({
                      pathname: '/lesson/[id]',
                      params: { id: lesson.id },
                    })
                  }
                >
                  <Text style={styles.lessonLinkText}>Review full lesson</Text>
                  <Ionicons
                    name="arrow-forward"
                    size={16}
                    color={Colors.primary.orange}
                  />
                </TouchableOpacity>
              )}
            </Card>
          );
        })}

        {/* Empty state */}
        {reviewContent.length === 0 && (
          <Card style={styles.emptyCard}>
            <Ionicons
              name="checkmark-circle-outline"
              size={48}
              color={Colors.status.success}
            />
            <Text style={styles.emptyTitle}>All topics covered!</Text>
            <Text style={styles.emptyText}>
              You've reviewed all the key concepts. Ready to try the quiz again?
            </Text>
          </Card>
        )}
      </ScrollView>

      {/* Bottom Action */}
      <View style={styles.bottomAction}>
        <Button
          title="Retake Quiz"
          onPress={() =>
            router.replace({
              pathname: '/quiz/[chapterId]',
              params: { chapterId },
            })
          }
          style={styles.retakeButton}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.layout.screenPadding,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.background.tertiary,
  },
  backButton: {
    padding: Spacing.xs,
  },
  headerTitle: {
    ...Typography.textStyles.h5,
    color: Colors.text.primary,
  },
  headerSpacer: {
    width: 32,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: Spacing.layout.screenPadding,
    paddingBottom: Spacing.xxxl,
  },
  intro: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  introTitle: {
    ...Typography.textStyles.h4,
    color: Colors.text.primary,
    marginTop: Spacing.md,
    textAlign: 'center',
  },
  introText: {
    ...Typography.textStyles.body,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginTop: Spacing.xs,
  },
  reviewCard: {
    marginBottom: Spacing.md,
  },
  cardHeader: {
    marginBottom: Spacing.md,
  },
  dayBadge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.primary.orangeLight,
    paddingVertical: Spacing.xxs,
    paddingHorizontal: Spacing.sm,
    borderRadius: Spacing.borderRadius.full,
    marginBottom: Spacing.xs,
  },
  dayBadgeText: {
    ...Typography.textStyles.caption,
    color: Colors.primary.orange,
    fontWeight: '600',
  },
  cardTitle: {
    ...Typography.textStyles.h5,
    color: Colors.text.primary,
  },
  keyPoints: {
    marginBottom: Spacing.md,
  },
  keyPointsLabel: {
    ...Typography.textStyles.caption,
    color: Colors.text.secondary,
    marginBottom: Spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  keyPoint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.xs,
  },
  keyPointText: {
    ...Typography.textStyles.body,
    color: Colors.text.primary,
    marginLeft: Spacing.xs,
    flex: 1,
  },
  lessonLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.background.tertiary,
  },
  lessonLinkText: {
    ...Typography.textStyles.body,
    color: Colors.primary.orange,
    fontWeight: '600',
    marginRight: Spacing.xs,
  },
  emptyCard: {
    alignItems: 'center',
    padding: Spacing.xl,
  },
  emptyTitle: {
    ...Typography.textStyles.h5,
    color: Colors.text.primary,
    marginTop: Spacing.md,
  },
  emptyText: {
    ...Typography.textStyles.body,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginTop: Spacing.xs,
  },
  bottomAction: {
    padding: Spacing.layout.screenPadding,
    borderTopWidth: 1,
    borderTopColor: Colors.background.tertiary,
  },
  retakeButton: {
    width: '100%',
  },
});
