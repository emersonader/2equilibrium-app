import { create } from 'zustand';
import * as nutritionService from '@/services/nutritionService';
import type { FoodEntry, FoodProduct, DailyNutritionSummary, MealType } from '@/services/database.types';

interface NutritionState {
  // Today's data
  todayEntries: FoodEntry[];
  entriesByMeal: Record<MealType, FoodEntry[]>;
  dailySummary: DailyNutritionSummary | null;
  isLoading: boolean;

  // Scanned/searched product
  scannedProduct: FoodProduct | null;
  searchResults: FoodProduct[];
  isSearching: boolean;

  // Recent foods for quick-add
  recentFoods: FoodEntry[];

  // Actions
  loadTodayData: () => Promise<void>;
  addFoodEntry: (product: FoodProduct, mealType: MealType, quantityInGrams?: number) => Promise<void>;
  addManualEntry: (
    foodName: string,
    mealType: MealType,
    nutrition: Partial<{ calories: number; protein: number; carbs: number; fat: number }>,
    servingSize?: number,
    servingUnit?: string
  ) => Promise<void>;
  deleteFoodEntry: (entryId: string) => Promise<void>;
  scanBarcode: (barcode: string) => Promise<FoodProduct | null>;
  searchFoods: (query: string) => Promise<void>;
  clearScannedProduct: () => void;
  clearSearchResults: () => void;
  loadRecentFoods: () => Promise<void>;
}

export const useNutritionStore = create<NutritionState>((set, get) => ({
  // Initial state
  todayEntries: [],
  entriesByMeal: {
    breakfast: [],
    lunch: [],
    dinner: [],
    snack: [],
  },
  dailySummary: null,
  isLoading: false,
  scannedProduct: null,
  searchResults: [],
  isSearching: false,
  recentFoods: [],

  // Load today's data
  loadTodayData: async () => {
    try {
      set({ isLoading: true });
      const [entriesByMeal, summary] = await Promise.all([
        nutritionService.getEntriesByMeal(),
        nutritionService.getDailySummary(),
      ]);

      const allEntries = [
        ...entriesByMeal.breakfast,
        ...entriesByMeal.lunch,
        ...entriesByMeal.dinner,
        ...entriesByMeal.snack,
      ];

      set({
        todayEntries: allEntries,
        entriesByMeal,
        dailySummary: summary,
      });
    } catch (error) {
      console.error('Failed to load today data:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  // Add food entry from scanned/searched product
  // quantityInGrams is the actual amount being consumed (nutrition is calculated per 100g)
  addFoodEntry: async (product, mealType, quantityInGrams = 100) => {
    try {
      set({ isLoading: true });
      await nutritionService.saveFoodEntry(product, mealType, quantityInGrams);
      // Reload today's data
      await get().loadTodayData();
    } catch (error) {
      console.error('Failed to add food entry:', error);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  // Add manual food entry
  addManualEntry: async (foodName, mealType, nutrition, servingSize, servingUnit) => {
    try {
      set({ isLoading: true });
      await nutritionService.saveManualFoodEntry(
        foodName,
        mealType,
        nutrition,
        servingSize,
        servingUnit
      );
      // Reload today's data
      await get().loadTodayData();
    } catch (error) {
      console.error('Failed to add manual entry:', error);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  // Delete food entry
  deleteFoodEntry: async (entryId) => {
    try {
      await nutritionService.deleteFoodEntry(entryId);
      // Reload today's data
      await get().loadTodayData();
    } catch (error) {
      console.error('Failed to delete food entry:', error);
      throw error;
    }
  },

  // Scan barcode
  scanBarcode: async (barcode) => {
    try {
      set({ isLoading: true });
      const product = await nutritionService.lookupBarcode(barcode);
      set({ scannedProduct: product });
      return product;
    } catch (error) {
      console.error('Failed to scan barcode:', error);
      return null;
    } finally {
      set({ isLoading: false });
    }
  },

  // Search foods
  searchFoods: async (query) => {
    if (!query.trim()) {
      set({ searchResults: [] });
      return;
    }

    try {
      set({ isSearching: true });
      const results = await nutritionService.searchFoods(query);
      set({ searchResults: results });
    } catch (error) {
      console.error('Failed to search foods:', error);
      set({ searchResults: [] });
    } finally {
      set({ isSearching: false });
    }
  },

  // Clear scanned product
  clearScannedProduct: () => {
    set({ scannedProduct: null });
  },

  // Clear search results
  clearSearchResults: () => {
    set({ searchResults: [] });
  },

  // Load recent foods
  loadRecentFoods: async () => {
    try {
      const recentFoods = await nutritionService.getRecentFoods(20);
      set({ recentFoods });
    } catch (error) {
      console.error('Failed to load recent foods:', error);
    }
  },
}));

export default useNutritionStore;
