import React, { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Pressable,
  Alert,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { Colors, Typography, Spacing, Layout, BorderRadius } from '@/constants';
import { Card, Button } from '@/components/ui';
import { useNutritionStore } from '@/stores/nutritionStore';
import type { MealType, FoodEntry } from '@/services/database.types';

const MEAL_CONFIG: Record<MealType, { icon: string; label: string; emoji: string }> = {
  breakfast: { icon: 'sunny-outline', label: 'Breakfast', emoji: '🌅' },
  lunch: { icon: 'restaurant-outline', label: 'Lunch', emoji: '🌞' },
  dinner: { icon: 'moon-outline', label: 'Dinner', emoji: '🌙' },
  snack: { icon: 'nutrition-outline', label: 'Snacks', emoji: '🍎' },
};

const CALORIE_GOAL = 2000; // Default daily calorie goal

export default function NutritionScreen() {
  const router = useRouter();
  const {
    entriesByMeal,
    dailySummary,
    isLoading,
    loadTodayData,
    deleteFoodEntry,
  } = useNutritionStore();

  useFocusEffect(
    useCallback(() => {
      loadTodayData();
    }, [])
  );

  const handleDeleteEntry = (entry: FoodEntry) => {
    Alert.alert(
      'Delete Entry',
      `Remove ${entry.food_name} from your log?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteFoodEntry(entry.id),
        },
      ]
    );
  };

  const calorieProgress = dailySummary
    ? Math.min((dailySummary.totalCalories / CALORIE_GOAL) * 100, 100)
    : 0;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={loadTodayData} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Nutrition</Text>
          <Text style={styles.date}>
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
            })}
          </Text>
        </View>

        {/* Daily Summary Card */}
        <Card variant="elevated" style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Today's Nutrition</Text>

          {/* Calorie Progress */}
          <View style={styles.calorieSection}>
            <View style={styles.calorieHeader}>
              <Text style={styles.calorieValue}>
                {dailySummary?.totalCalories || 0}
              </Text>
              <Text style={styles.calorieGoal}>/ {CALORIE_GOAL} cal</Text>
            </View>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${calorieProgress}%` },
                  calorieProgress >= 100 && styles.progressFillComplete,
                ]}
              />
            </View>
          </View>

          {/* Macro Summary */}
          <View style={styles.macroRow}>
            <View style={styles.macroItem}>
              <Text style={styles.macroValue}>
                {dailySummary?.totalProtein || 0}g
              </Text>
              <Text style={styles.macroLabel}>Protein</Text>
            </View>
            <View style={styles.macroDivider} />
            <View style={styles.macroItem}>
              <Text style={styles.macroValue}>
                {dailySummary?.totalCarbs || 0}g
              </Text>
              <Text style={styles.macroLabel}>Carbs</Text>
            </View>
            <View style={styles.macroDivider} />
            <View style={styles.macroItem}>
              <Text style={styles.macroValue}>
                {dailySummary?.totalFat || 0}g
              </Text>
              <Text style={styles.macroLabel}>Fat</Text>
            </View>
          </View>
        </Card>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <Pressable
            style={styles.actionButton}
            onPress={() => router.push('/nutrition/barcode-scanner' as any)}
          >
            <Ionicons name="barcode-outline" size={28} color={Colors.primary.orange} />
            <Text style={styles.actionButtonText}>Scan Barcode</Text>
          </Pressable>
          <Pressable
            style={styles.actionButton}
            onPress={() => router.push('/nutrition/food-search' as any)}
          >
            <Ionicons name="search-outline" size={28} color={Colors.primary.tiffanyBlue} />
            <Text style={styles.actionButtonText}>Add Manually</Text>
          </Pressable>
        </View>

        {/* Meal Sections */}
        {(Object.keys(MEAL_CONFIG) as MealType[]).map((mealType) => (
          <MealSection
            key={mealType}
            mealType={mealType}
            entries={entriesByMeal[mealType]}
            onDeleteEntry={handleDeleteEntry}
            onAddFood={() =>
              router.push({
                pathname: '/nutrition/food-search' as any,
                params: { mealType },
              })
            }
          />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

// Meal Section Component
interface MealSectionProps {
  mealType: MealType;
  entries: FoodEntry[];
  onDeleteEntry: (entry: FoodEntry) => void;
  onAddFood: () => void;
}

function MealSection({ mealType, entries, onDeleteEntry, onAddFood }: MealSectionProps) {
  const config = MEAL_CONFIG[mealType];
  const totalCalories = entries.reduce((sum, e) => sum + (e.calories || 0), 0);

  return (
    <View style={styles.mealSection}>
      <View style={styles.mealHeader}>
        <View style={styles.mealTitleRow}>
          <Text style={styles.mealEmoji}>{config.emoji}</Text>
          <Text style={styles.mealTitle}>{config.label}</Text>
        </View>
        <Text style={styles.mealCalories}>{totalCalories} cal</Text>
      </View>

      {entries.length === 0 ? (
        <Pressable style={styles.emptyMeal} onPress={onAddFood}>
          <Ionicons name="add-circle-outline" size={24} color={Colors.text.tertiary} />
          <Text style={styles.emptyMealText}>Add food</Text>
        </Pressable>
      ) : (
        <View style={styles.foodList}>
          {entries.map((entry) => (
            <Pressable
              key={entry.id}
              style={styles.foodItem}
              onLongPress={() => onDeleteEntry(entry)}
            >
              <View style={styles.foodInfo}>
                <Text style={styles.foodName} numberOfLines={1}>
                  {entry.food_name}
                </Text>
                {entry.brand && (
                  <Text style={styles.foodBrand} numberOfLines={1}>
                    {entry.brand}
                  </Text>
                )}
                {entry.serving_size && (
                  <Text style={styles.foodServing}>
                    {entry.serving_size} {entry.serving_unit}
                  </Text>
                )}
              </View>
              <Text style={styles.foodCalories}>{entry.calories || 0} cal</Text>
            </Pressable>
          ))}
          <Pressable style={styles.addMoreButton} onPress={onAddFood}>
            <Ionicons name="add" size={18} color={Colors.primary.orange} />
            <Text style={styles.addMoreText}>Add more</Text>
          </Pressable>
        </View>
      )}
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

  // Summary Card
  summaryCard: {
    marginBottom: Spacing.lg,
    backgroundColor: Colors.primary.orangeLight + '15',
  },
  summaryTitle: {
    ...Typography.h5,
    color: Colors.text.primary,
    marginBottom: Spacing.md,
  },
  calorieSection: {
    marginBottom: Spacing.lg,
  },
  calorieHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: Spacing.sm,
  },
  calorieValue: {
    ...Typography.h2,
    color: Colors.primary.orange,
  },
  calorieGoal: {
    ...Typography.body,
    color: Colors.text.secondary,
    marginLeft: Spacing.xs,
  },
  progressBar: {
    height: 8,
    backgroundColor: Colors.background.tertiary,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary.orange,
    borderRadius: 4,
  },
  progressFillComplete: {
    backgroundColor: Colors.primary.tiffanyBlue,
  },
  macroRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  macroItem: {
    alignItems: 'center',
    flex: 1,
  },
  macroValue: {
    ...Typography.bodyLarge,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  macroLabel: {
    ...Typography.caption,
    color: Colors.text.secondary,
  },
  macroDivider: {
    width: 1,
    height: 30,
    backgroundColor: Colors.ui.border,
  },

  // Action Buttons
  actionButtons: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.ui.border,
  },
  actionButtonText: {
    ...Typography.body,
    fontWeight: '600',
    color: Colors.text.primary,
  },

  // Meal Section
  mealSection: {
    marginBottom: Spacing.lg,
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  mealTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  mealEmoji: {
    fontSize: 20,
  },
  mealTitle: {
    ...Typography.h5,
    color: Colors.text.primary,
  },
  mealCalories: {
    ...Typography.body,
    color: Colors.text.secondary,
  },
  emptyMeal: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.lg,
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: Colors.ui.border,
  },
  emptyMealText: {
    ...Typography.body,
    color: Colors.text.tertiary,
  },
  foodList: {
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  foodItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.ui.border,
  },
  foodInfo: {
    flex: 1,
    marginRight: Spacing.md,
  },
  foodName: {
    ...Typography.body,
    fontWeight: '500',
    color: Colors.text.primary,
  },
  foodBrand: {
    ...Typography.caption,
    color: Colors.text.tertiary,
  },
  foodServing: {
    ...Typography.caption,
    color: Colors.text.secondary,
  },
  foodCalories: {
    ...Typography.body,
    fontWeight: '600',
    color: Colors.primary.orange,
  },
  addMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    padding: Spacing.sm,
  },
  addMoreText: {
    ...Typography.bodySmall,
    color: Colors.primary.orange,
    fontWeight: '600',
  },
});
