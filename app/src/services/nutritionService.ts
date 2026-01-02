import { getSupabase } from './supabase';
import { ensureProfileExists } from './authService';
import type {
  FoodEntry,
  FoodEntryInsert,
  FoodProduct,
  NutritionInfo,
  DailyNutritionSummary,
  MealType,
} from './database.types';

// Open Food Facts API (for barcode scanning)
const OPEN_FOOD_FACTS_API = 'https://world.openfoodfacts.org/api/v2/product';

// USDA FoodData Central API (for generic food search)
// Free API - get your own key at https://fdc.nal.usda.gov/api-key-signup.html
const USDA_API_KEY = process.env.EXPO_PUBLIC_USDA_API_KEY || 'DEMO_KEY';
const USDA_API_URL = 'https://api.nal.usda.gov/fdc/v1/foods/search';

/**
 * Look up a food product by barcode using Open Food Facts API
 */
export async function lookupBarcode(barcode: string): Promise<FoodProduct | null> {
  try {
    const response = await fetch(`${OPEN_FOOD_FACTS_API}/${barcode}.json`);
    const data = await response.json();

    if (data.status !== 1 || !data.product) {
      return null;
    }

    const product = data.product;
    const nutriments = product.nutriments || {};

    return {
      barcode,
      name: product.product_name || product.product_name_en || 'Unknown Product',
      brand: product.brands || null,
      servingSize: product.serving_quantity || 100,
      servingUnit: product.serving_quantity_unit || 'g',
      nutrition: {
        calories: nutriments['energy-kcal_100g'] || nutriments['energy-kcal'] || null,
        protein: nutriments.proteins_100g || nutriments.proteins || null,
        carbs: nutriments.carbohydrates_100g || nutriments.carbohydrates || null,
        fat: nutriments.fat_100g || nutriments.fat || null,
        fiber: nutriments.fiber_100g || nutriments.fiber || null,
        sugar: nutriments.sugars_100g || nutriments.sugars || null,
        sodium: nutriments.sodium_100g || nutriments.sodium || null,
      },
      imageUrl: product.image_url || product.image_front_url || null,
    };
  } catch (error) {
    console.warn('Barcode lookup failed:', error);
    return null;
  }
}

/**
 * Search for foods using USDA API with fallback to Open Food Facts
 */
export async function searchFoods(query: string, page: number = 1): Promise<FoodProduct[]> {
  // Try USDA API first for generic foods
  try {
    const response = await fetch(
      `${USDA_API_URL}?query=${encodeURIComponent(query)}&dataType=Foundation,SR%20Legacy&pageSize=25&pageNumber=${page}&api_key=${USDA_API_KEY}`,
      {
        headers: {
          'Accept': 'application/json',
        },
      }
    );

    // Check if response is OK
    if (!response.ok) {
      console.warn('USDA API error:', response.status, '- falling back to Open Food Facts');
      return searchFoodsOpenFoodFacts(query, page);
    }

    // Check content type
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      console.warn('USDA API returned non-JSON response, falling back to Open Food Facts');
      return searchFoodsOpenFoodFacts(query, page);
    }

    const data = await response.json();

    // If rate limited or error, fall back to Open Food Facts
    if (data.error || !data.foods) {
      console.log('USDA API unavailable, falling back to Open Food Facts');
      return searchFoodsOpenFoodFacts(query, page);
    }

    if (data.foods.length === 0) {
      // Try Open Food Facts as backup
      return searchFoodsOpenFoodFacts(query, page);
    }

    return data.foods.map((food: any) => {
      const nutrients = food.foodNutrients || [];

      const getNutrientByNumber = (number: string): number | null => {
        const nutrient = nutrients.find((n: any) => n.nutrientNumber === number);
        return nutrient?.value ?? null;
      };

      // USDA nutrient numbers: 208/957/958 = kcal, 203 = protein, 205 = carbs, 204 = fat
      const calories = getNutrientByNumber('208') || getNutrientByNumber('957') || getNutrientByNumber('958');
      const protein = getNutrientByNumber('203');
      const carbs = getNutrientByNumber('205');
      const fat = getNutrientByNumber('204');
      const fiber = getNutrientByNumber('291');
      const sugar = getNutrientByNumber('269');
      const sodium = getNutrientByNumber('307');

      return {
        barcode: food.fdcId?.toString() || '',
        name: food.description || 'Unknown Food',
        brand: null,
        servingSize: 100,
        servingUnit: 'g',
        nutrition: { calories, protein, carbs, fat, fiber, sugar, sodium },
        imageUrl: null,
      };
    }).filter((p: FoodProduct) => p.name !== 'Unknown Food' && p.nutrition.calories !== null);
  } catch (error) {
    console.warn('USDA search unavailable, trying Open Food Facts:', error);
    return searchFoodsOpenFoodFacts(query, page);
  }
}

/**
 * Search foods using Open Food Facts API (fallback)
 */
async function searchFoodsOpenFoodFacts(query: string, page: number = 1): Promise<FoodProduct[]> {
  try {
    const response = await fetch(
      `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page=${page}&page_size=25`,
      {
        headers: {
          'Accept': 'application/json',
          'User-Agent': '2Equilibrium App - iOS - Version 1.0',
        },
      }
    );

    // Check if response is OK
    if (!response.ok) {
      console.warn('Open Food Facts API error:', response.status);
      return [];
    }

    // Check content type to avoid parsing HTML as JSON
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      console.warn('Open Food Facts returned non-JSON response');
      return [];
    }

    const data = await response.json();

    if (!data.products || data.products.length === 0) {
      return [];
    }

    return data.products.map((product: any) => {
      const nutriments = product.nutriments || {};
      return {
        barcode: product.code || '',
        name: product.product_name || product.product_name_en || 'Unknown Product',
        brand: product.brands || null,
        servingSize: 100, // Always use 100g as base for consistency
        servingUnit: 'g',
        nutrition: {
          calories: nutriments['energy-kcal_100g'] || null,
          protein: nutriments.proteins_100g || null,
          carbs: nutriments.carbohydrates_100g || null,
          fat: nutriments.fat_100g || null,
          fiber: nutriments.fiber_100g || null,
          sugar: nutriments.sugars_100g || null,
          sodium: nutriments.sodium_100g || null,
        },
        imageUrl: product.image_url || null,
      };
    }).filter((p: FoodProduct) =>
      p.name !== 'Unknown Product' &&
      p.nutrition.calories !== null
    );
  } catch (error) {
    // Use console.warn instead of console.error to avoid red toast in dev mode
    console.warn('Open Food Facts search unavailable:', error);
    return [];
  }
}

/**
 * Get local date string in YYYY-MM-DD format
 */
function getLocalDateString(date: Date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

/**
 * Save a food entry to the database
 * @param quantityInGrams - The actual quantity being consumed in grams/ml
 *                          Nutrition is calculated based on this (nutrition is per 100g)
 */
export async function saveFoodEntry(
  foodProduct: FoodProduct,
  mealType: MealType,
  quantityInGrams: number = 100,
  entryDate?: string
): Promise<FoodEntry> {
  const sb = getSupabase();
  const { data: { user } } = await sb.auth.getUser();

  if (!user) throw new Error('Not authenticated');

  await ensureProfileExists();

  // Nutrition data is per 100g, so calculate multiplier
  const nutritionMultiplier = quantityInGrams / 100;

  const entry: FoodEntryInsert = {
    user_id: user.id,
    entry_date: entryDate || getLocalDateString(),
    meal_type: mealType,
    food_name: foodProduct.name,
    brand: foodProduct.brand,
    barcode: foodProduct.barcode || null,
    serving_size: quantityInGrams,
    serving_unit: foodProduct.servingUnit || 'g',
    calories: foodProduct.nutrition.calories ? Math.round(foodProduct.nutrition.calories * nutritionMultiplier) : null,
    protein: foodProduct.nutrition.protein ? Math.round(foodProduct.nutrition.protein * nutritionMultiplier * 10) / 10 : null,
    carbs: foodProduct.nutrition.carbs ? Math.round(foodProduct.nutrition.carbs * nutritionMultiplier * 10) / 10 : null,
    fat: foodProduct.nutrition.fat ? Math.round(foodProduct.nutrition.fat * nutritionMultiplier * 10) / 10 : null,
    fiber: foodProduct.nutrition.fiber ? Math.round(foodProduct.nutrition.fiber * nutritionMultiplier * 10) / 10 : null,
    sugar: foodProduct.nutrition.sugar ? Math.round(foodProduct.nutrition.sugar * nutritionMultiplier * 10) / 10 : null,
    sodium: foodProduct.nutrition.sodium ? Math.round(foodProduct.nutrition.sodium * nutritionMultiplier * 10) / 10 : null,
  };

  const { data, error } = await sb
    .from('food_entries')
    .insert(entry)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Save a manually entered food
 */
export async function saveManualFoodEntry(
  foodName: string,
  mealType: MealType,
  nutrition: Partial<NutritionInfo>,
  servingSize?: number,
  servingUnit?: string,
  entryDate?: string
): Promise<FoodEntry> {
  const sb = getSupabase();
  const { data: { user } } = await sb.auth.getUser();

  if (!user) throw new Error('Not authenticated');

  await ensureProfileExists();

  const entry: FoodEntryInsert = {
    user_id: user.id,
    entry_date: entryDate || getLocalDateString(),
    meal_type: mealType,
    food_name: foodName,
    serving_size: servingSize || null,
    serving_unit: servingUnit || null,
    calories: nutrition.calories || null,
    protein: nutrition.protein || null,
    carbs: nutrition.carbs || null,
    fat: nutrition.fat || null,
    fiber: nutrition.fiber || null,
    sugar: nutrition.sugar || null,
    sodium: nutrition.sodium || null,
  };

  const { data, error } = await sb
    .from('food_entries')
    .insert(entry)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Get food entries for a specific date
 */
export async function getEntriesForDate(date?: string): Promise<FoodEntry[]> {
  const sb = getSupabase();
  const { data: { user } } = await sb.auth.getUser();

  if (!user) return [];

  const targetDate = date || getLocalDateString();

  const { data, error } = await sb
    .from('food_entries')
    .select('*')
    .eq('user_id', user.id)
    .eq('entry_date', targetDate)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data || [];
}

/**
 * Get today's food entries
 */
export async function getTodayEntries(): Promise<FoodEntry[]> {
  return getEntriesForDate(getLocalDateString());
}

/**
 * Get entries grouped by meal type
 */
export async function getEntriesByMeal(date?: string): Promise<Record<MealType, FoodEntry[]>> {
  const entries = await getEntriesForDate(date);

  const grouped: Record<MealType, FoodEntry[]> = {
    breakfast: [],
    lunch: [],
    dinner: [],
    snack: [],
  };

  entries.forEach(entry => {
    grouped[entry.meal_type].push(entry);
  });

  return grouped;
}

/**
 * Calculate daily nutrition summary
 */
export async function getDailySummary(date?: string): Promise<DailyNutritionSummary> {
  const entries = await getEntriesForDate(date);

  const summary: DailyNutritionSummary = {
    totalCalories: 0,
    totalProtein: 0,
    totalCarbs: 0,
    totalFat: 0,
    totalFiber: 0,
    totalSugar: 0,
    totalSodium: 0,
    entryCount: entries.length,
  };

  entries.forEach(entry => {
    summary.totalCalories += entry.calories || 0;
    summary.totalProtein += entry.protein || 0;
    summary.totalCarbs += entry.carbs || 0;
    summary.totalFat += entry.fat || 0;
    summary.totalFiber += entry.fiber || 0;
    summary.totalSugar += entry.sugar || 0;
    summary.totalSodium += entry.sodium || 0;
  });

  // Round values
  summary.totalProtein = Math.round(summary.totalProtein * 10) / 10;
  summary.totalCarbs = Math.round(summary.totalCarbs * 10) / 10;
  summary.totalFat = Math.round(summary.totalFat * 10) / 10;
  summary.totalFiber = Math.round(summary.totalFiber * 10) / 10;
  summary.totalSugar = Math.round(summary.totalSugar * 10) / 10;
  summary.totalSodium = Math.round(summary.totalSodium * 10) / 10;

  return summary;
}

/**
 * Delete a food entry
 */
export async function deleteFoodEntry(entryId: string): Promise<void> {
  const sb = getSupabase();
  const { error } = await sb
    .from('food_entries')
    .delete()
    .eq('id', entryId);

  if (error) throw error;
}

/**
 * Update a food entry
 */
export async function updateFoodEntry(
  entryId: string,
  updates: {
    mealType?: MealType;
    servingSize?: number;
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
  }
): Promise<FoodEntry> {
  const sb = getSupabase();

  const { data, error } = await sb
    .from('food_entries')
    .update({
      meal_type: updates.mealType,
      serving_size: updates.servingSize,
      calories: updates.calories,
      protein: updates.protein,
      carbs: updates.carbs,
      fat: updates.fat,
    })
    .eq('id', entryId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Get recent entries for quick-add feature
 */
export async function getRecentFoods(limit: number = 10): Promise<FoodEntry[]> {
  const sb = getSupabase();
  const { data: { user } } = await sb.auth.getUser();

  if (!user) return [];

  const { data, error } = await sb
    .from('food_entries')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
}
