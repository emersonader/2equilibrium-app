import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  FlatList,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Modal,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Colors, Typography, Spacing, Layout, BorderRadius } from '@/constants';
import { Card, Button } from '@/components/ui';
import { useNutritionStore } from '@/stores/nutritionStore';
import type { MealType, FoodProduct } from '@/services/database.types';

const MEAL_OPTIONS: { value: MealType; label: string; emoji: string }[] = [
  { value: 'breakfast', label: 'Breakfast', emoji: '🌅' },
  { value: 'lunch', label: 'Lunch', emoji: '🌞' },
  { value: 'dinner', label: 'Dinner', emoji: '🌙' },
  { value: 'snack', label: 'Snack', emoji: '🍎' },
];

export default function FoodSearchScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ mealType?: MealType }>();
  const [searchQuery, setSearchQuery] = useState('');
  const [showProductModal, setShowProductModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<FoodProduct | null>(null);
  const [selectedMeal, setSelectedMeal] = useState<MealType>(params.mealType || 'snack');
  const [quantity, setQuantity] = useState(1);
  const [customGrams, setCustomGrams] = useState('100');

  const {
    searchResults,
    isSearching,
    isLoading,
    searchFoods,
    addFoodEntry,
    clearSearchResults,
  } = useNutritionStore();

  useEffect(() => {
    return () => {
      clearSearchResults();
    };
  }, []);

  useEffect(() => {
    const delaySearch = setTimeout(() => {
      if (searchQuery.trim().length >= 2) {
        searchFoods(searchQuery);
      } else {
        clearSearchResults();
      }
    }, 300);

    return () => clearTimeout(delaySearch);
  }, [searchQuery]);

  const handleSelectProduct = (product: FoodProduct) => {
    setSelectedProduct(product);
    setQuantity(1);
    setCustomGrams(String(product.servingSize || 100));
    setShowProductModal(true);
  };

  // Calculate nutrition based on quantity
  const getCalculatedNutrition = () => {
    if (!selectedProduct) return null;

    const grams = parseFloat(customGrams) || 100;
    const multiplier = grams / 100; // Nutrition is per 100g

    return {
      calories: Math.round((selectedProduct.nutrition.calories || 0) * multiplier),
      protein: Math.round((selectedProduct.nutrition.protein || 0) * multiplier * 10) / 10,
      carbs: Math.round((selectedProduct.nutrition.carbs || 0) * multiplier * 10) / 10,
      fat: Math.round((selectedProduct.nutrition.fat || 0) * multiplier * 10) / 10,
      fiber: Math.round((selectedProduct.nutrition.fiber || 0) * multiplier * 10) / 10,
      sugar: Math.round((selectedProduct.nutrition.sugar || 0) * multiplier * 10) / 10,
    };
  };

  const handleAddToLog = async () => {
    if (!selectedProduct) return;

    const grams = parseFloat(customGrams) || 100;

    try {
      // Pass the actual quantity in grams - nutrition is calculated per 100g internally
      await addFoodEntry(selectedProduct, selectedMeal, grams);
      setShowProductModal(false);
      setSelectedProduct(null);
      router.back();
    } catch (error) {
      Alert.alert('Error', 'Failed to add food to log. Please try again.');
    }
  };

  const adjustQuantity = (delta: number) => {
    const currentGrams = parseFloat(customGrams) || 100;
    const newGrams = Math.max(10, currentGrams + delta);
    setCustomGrams(String(newGrams));
  };

  const calculatedNutrition = getCalculatedNutrition();

  const renderFoodItem = ({ item }: { item: FoodProduct }) => (
    <Pressable style={styles.foodItem} onPress={() => handleSelectProduct(item)}>
      <View style={styles.foodInfo}>
        <Text style={styles.foodName} numberOfLines={1}>
          {item.name}
        </Text>
        {item.brand && (
          <Text style={styles.foodBrand} numberOfLines={1}>
            {item.brand}
          </Text>
        )}
      </View>
      <View style={styles.foodNutrition}>
        <Text style={styles.foodCalories}>{item.nutrition.calories || 0} cal</Text>
        <Text style={styles.foodServing}>per 100g</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={Colors.text.tertiary} />
    </Pressable>
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={Colors.text.primary} />
          </Pressable>
          <Text style={styles.headerTitle}>Add Food</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color={Colors.text.tertiary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search food (e.g., apple, chicken, rice)"
              placeholderTextColor={Colors.text.muted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color={Colors.text.tertiary} />
              </Pressable>
            )}
          </View>
        </View>

        {/* Meal Selection */}
        <View style={styles.mealSelector}>
          <Text style={styles.mealSelectorLabel}>Adding to:</Text>
          <View style={styles.mealChips}>
            {MEAL_OPTIONS.map((meal) => (
              <Pressable
                key={meal.value}
                style={[
                  styles.mealChip,
                  selectedMeal === meal.value && styles.mealChipSelected,
                ]}
                onPress={() => setSelectedMeal(meal.value)}
              >
                <Text style={styles.mealChipEmoji}>{meal.emoji}</Text>
                <Text
                  style={[
                    styles.mealChipText,
                    selectedMeal === meal.value && styles.mealChipTextSelected,
                  ]}
                >
                  {meal.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Search Results */}
        {searchQuery.length < 2 ? (
          <View style={styles.emptyState}>
            <Ionicons name="nutrition-outline" size={48} color={Colors.text.tertiary} />
            <Text style={styles.emptyStateText}>
              Search for any food
            </Text>
            <Text style={styles.emptyStateSubtext}>
              Try "apple", "chicken breast", "brown rice", "egg"
            </Text>
          </View>
        ) : isSearching ? (
          <View style={styles.loadingState}>
            <Text style={styles.loadingText}>Searching for "{searchQuery}"...</Text>
          </View>
        ) : searchResults.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="restaurant-outline" size={48} color={Colors.text.tertiary} />
            <Text style={styles.emptyStateText}>No foods found for "{searchQuery}"</Text>
            <Text style={styles.emptyStateSubtext}>
              Try a different name or check spelling
            </Text>
          </View>
        ) : (
          <FlatList
            data={searchResults}
            keyExtractor={(item, index) => `${item.barcode || item.name}-${index}`}
            renderItem={renderFoodItem}
            style={styles.resultsList}
            contentContainerStyle={styles.resultsContent}
            showsVerticalScrollIndicator={false}
          />
        )}

        {/* Product Detail Modal - Simplified with just quantity */}
        <Modal
          visible={showProductModal}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowProductModal(false)}
        >
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Food</Text>
              <Pressable onPress={() => setShowProductModal(false)} style={styles.closeButton}>
                <Ionicons name="close" size={24} color={Colors.text.primary} />
              </Pressable>
            </View>

            {selectedProduct && calculatedNutrition && (
              <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
                {/* Product Info */}
                <Card variant="elevated" style={styles.productCard}>
                  <Text style={styles.productName}>{selectedProduct.name}</Text>
                  {selectedProduct.brand && (
                    <Text style={styles.productBrand}>{selectedProduct.brand}</Text>
                  )}

                  {/* Quantity Input - Simple! */}
                  <View style={styles.quantitySection}>
                    <Text style={styles.quantityLabel}>Quantity (grams):</Text>
                    <View style={styles.quantityControls}>
                      <Pressable
                        style={styles.quantityButton}
                        onPress={() => adjustQuantity(-25)}
                      >
                        <Ionicons name="remove" size={24} color={Colors.text.primary} />
                      </Pressable>

                      <TextInput
                        style={styles.quantityInput}
                        value={customGrams}
                        onChangeText={setCustomGrams}
                        keyboardType="numeric"
                        selectTextOnFocus
                      />
                      <Text style={styles.quantityUnit}>g</Text>

                      <Pressable
                        style={styles.quantityButton}
                        onPress={() => adjustQuantity(25)}
                      >
                        <Ionicons name="add" size={24} color={Colors.text.primary} />
                      </Pressable>
                    </View>

                    {/* Quick quantity buttons */}
                    <View style={styles.quickQuantities}>
                      {[50, 100, 150, 200, 250].map((g) => (
                        <Pressable
                          key={g}
                          style={[
                            styles.quickQuantityButton,
                            customGrams === String(g) && styles.quickQuantityButtonActive,
                          ]}
                          onPress={() => setCustomGrams(String(g))}
                        >
                          <Text
                            style={[
                              styles.quickQuantityText,
                              customGrams === String(g) && styles.quickQuantityTextActive,
                            ]}
                          >
                            {g}g
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  </View>

                  {/* Calculated Nutrition - Auto calculated! */}
                  <View style={styles.nutritionSection}>
                    <Text style={styles.nutritionTitle}>Nutrition for {customGrams}g:</Text>
                    <View style={styles.nutritionGrid}>
                      <View style={styles.nutritionItem}>
                        <Text style={styles.nutritionValue}>{calculatedNutrition.calories}</Text>
                        <Text style={styles.nutritionLabel}>Calories</Text>
                      </View>
                      <View style={styles.nutritionItem}>
                        <Text style={styles.nutritionValue}>{calculatedNutrition.protein}g</Text>
                        <Text style={styles.nutritionLabel}>Protein</Text>
                      </View>
                      <View style={styles.nutritionItem}>
                        <Text style={styles.nutritionValue}>{calculatedNutrition.carbs}g</Text>
                        <Text style={styles.nutritionLabel}>Carbs</Text>
                      </View>
                      <View style={styles.nutritionItem}>
                        <Text style={styles.nutritionValue}>{calculatedNutrition.fat}g</Text>
                        <Text style={styles.nutritionLabel}>Fat</Text>
                      </View>
                    </View>
                  </View>
                </Card>

                {/* Add Button */}
                <Button
                  title={`Add to ${MEAL_OPTIONS.find(m => m.value === selectedMeal)?.label}`}
                  onPress={handleAddToLog}
                  fullWidth
                  loading={isLoading}
                  style={styles.addButton}
                />
              </ScrollView>
            )}
          </SafeAreaView>
        </Modal>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Layout.screenPaddingHorizontal,
    paddingVertical: Spacing.md,
  },
  backButton: {
    padding: Spacing.sm,
  },
  headerTitle: {
    ...Typography.h4,
    color: Colors.text.primary,
  },
  headerSpacer: {
    width: 40,
  },

  // Search
  searchContainer: {
    paddingHorizontal: Layout.screenPaddingHorizontal,
    marginBottom: Spacing.md,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    minHeight: 48,
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.ui.border,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.text.primary,
    paddingVertical: 4,
  },

  // Meal Selector
  mealSelector: {
    paddingHorizontal: Layout.screenPaddingHorizontal,
    marginBottom: Spacing.md,
  },
  mealSelectorLabel: {
    ...Typography.bodySmall,
    color: Colors.text.secondary,
    marginBottom: Spacing.sm,
  },
  mealChips: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  mealChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.ui.border,
  },
  mealChipSelected: {
    backgroundColor: Colors.primary.orangeLight + '30',
    borderColor: Colors.primary.orange,
  },
  mealChipEmoji: {
    fontSize: 14,
  },
  mealChipText: {
    ...Typography.bodySmall,
    color: Colors.text.secondary,
  },
  mealChipTextSelected: {
    color: Colors.primary.orange,
    fontWeight: '600',
  },

  // Results List
  resultsList: {
    flex: 1,
  },
  resultsContent: {
    paddingHorizontal: Layout.screenPaddingHorizontal,
  },
  foodItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
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
  foodNutrition: {
    alignItems: 'flex-end',
    marginRight: Spacing.sm,
  },
  foodCalories: {
    ...Typography.body,
    fontWeight: '600',
    color: Colors.primary.orange,
  },
  foodServing: {
    ...Typography.caption,
    color: Colors.text.tertiary,
  },

  // Empty/Loading States
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
    gap: Spacing.md,
  },
  emptyStateText: {
    ...Typography.body,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    ...Typography.bodySmall,
    color: Colors.text.tertiary,
    textAlign: 'center',
  },
  loadingState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    ...Typography.body,
    color: Colors.text.secondary,
  },

  // Modal
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
  modalContent: {
    flex: 1,
    padding: Layout.screenPaddingHorizontal,
  },

  // Product Card
  productCard: {
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
  },
  productName: {
    ...Typography.h4,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  productBrand: {
    ...Typography.body,
    color: Colors.text.secondary,
    marginBottom: Spacing.lg,
  },

  // Quantity Section
  quantitySection: {
    marginBottom: Spacing.lg,
    paddingBottom: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.ui.border,
  },
  quantityLabel: {
    ...Typography.body,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: Spacing.md,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  quantityButton: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.ui.border,
  },
  quantityInput: {
    ...Typography.h3,
    color: Colors.text.primary,
    textAlign: 'center',
    minWidth: 80,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.ui.border,
  },
  quantityUnit: {
    ...Typography.body,
    color: Colors.text.secondary,
  },
  quickQuantities: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  quickQuantityButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.ui.border,
  },
  quickQuantityButtonActive: {
    backgroundColor: Colors.primary.orangeLight + '30',
    borderColor: Colors.primary.orange,
  },
  quickQuantityText: {
    ...Typography.bodySmall,
    color: Colors.text.secondary,
  },
  quickQuantityTextActive: {
    color: Colors.primary.orange,
    fontWeight: '600',
  },

  // Nutrition Section
  nutritionSection: {
    marginTop: Spacing.md,
  },
  nutritionTitle: {
    ...Typography.bodySmall,
    color: Colors.text.secondary,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  nutritionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  nutritionItem: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    padding: Spacing.md,
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.md,
  },
  nutritionValue: {
    ...Typography.h4,
    color: Colors.primary.orange,
  },
  nutritionLabel: {
    ...Typography.caption,
    color: Colors.text.secondary,
  },

  addButton: {
    marginTop: Spacing.lg,
    marginBottom: Spacing['2xl'],
  },
});
