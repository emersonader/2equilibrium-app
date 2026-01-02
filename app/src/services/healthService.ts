import { getSupabase } from './supabase';
import { ensureProfileExists } from './authService';
import type {
  HealthProfile,
  HealthProfileInsert,
  HealthProfileUpdate,
  WeightHistory,
  WeightHistoryInsert,
  UnitSystem,
  Gender,
} from './database.types';

// Unit conversion constants
const LBS_TO_KG = 0.453592;
const KG_TO_LBS = 2.20462;
const INCHES_TO_CM = 2.54;
const CM_TO_INCHES = 0.393701;
const FEET_TO_INCHES = 12;

/**
 * Convert weight based on unit system
 */
export function convertWeight(value: number, from: UnitSystem, to: UnitSystem): number {
  if (from === to) return value;
  return from === 'imperial' ? value * LBS_TO_KG : value * KG_TO_LBS;
}

/**
 * Convert height based on unit system
 */
export function convertHeight(value: number, from: UnitSystem, to: UnitSystem): number {
  if (from === to) return value;
  return from === 'imperial' ? value * INCHES_TO_CM : value * CM_TO_INCHES;
}

/**
 * Convert feet and inches to total inches
 */
export function feetInchesToInches(feet: number, inches: number): number {
  return feet * FEET_TO_INCHES + inches;
}

/**
 * Convert total inches to feet and inches
 */
export function inchesToFeetInches(totalInches: number): { feet: number; inches: number } {
  const feet = Math.floor(totalInches / FEET_TO_INCHES);
  const inches = Math.round(totalInches % FEET_TO_INCHES);
  return { feet, inches };
}

/**
 * Calculate BMI from weight (kg) and height (cm)
 * Formula: BMI = weight(kg) / height(m)²
 */
export function calculateBMI(weightKg: number, heightCm: number): number {
  if (heightCm <= 0 || weightKg <= 0) return 0;
  const heightM = heightCm / 100;
  return weightKg / (heightM * heightM);
}

/**
 * Get BMI category based on value
 */
export function getBMICategory(bmi: number): {
  category: string;
  color: string;
  description: string;
} {
  if (bmi < 18.5) {
    return {
      category: 'Underweight',
      color: '#3498DB', // info blue
      description: 'BMI below 18.5',
    };
  } else if (bmi < 25) {
    return {
      category: 'Normal',
      color: '#0ABAB5', // tiffany blue (success)
      description: 'BMI 18.5 - 24.9',
    };
  } else if (bmi < 30) {
    return {
      category: 'Overweight',
      color: '#E67E22', // orange (warning)
      description: 'BMI 25 - 29.9',
    };
  } else {
    return {
      category: 'Obese',
      color: '#E74C3C', // red (error)
      description: 'BMI 30 or higher',
    };
  }
}

/**
 * Calculate age from birth date
 */
export function calculateAge(birthDate: string): number {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

/**
 * Format weight for display with unit
 */
export function formatWeight(weightKg: number, unitSystem: UnitSystem): string {
  if (unitSystem === 'imperial') {
    const lbs = weightKg * KG_TO_LBS;
    return `${lbs.toFixed(1)} lbs`;
  }
  return `${weightKg.toFixed(1)} kg`;
}

/**
 * Format height for display with unit
 */
export function formatHeight(heightCm: number, unitSystem: UnitSystem): string {
  if (unitSystem === 'imperial') {
    const totalInches = heightCm * CM_TO_INCHES;
    const { feet, inches } = inchesToFeetInches(totalInches);
    return `${feet}'${inches}"`;
  }
  return `${heightCm.toFixed(0)} cm`;
}

/**
 * Get user's health profile
 */
export async function getHealthProfile(): Promise<HealthProfile | null> {
  const sb = getSupabase();
  const { data: { user } } = await sb.auth.getUser();

  if (!user) return null;

  const { data, error } = await sb
    .from('health_profiles')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) throw error;
  return data;
}

/**
 * Create or update health profile
 */
export async function saveHealthProfile(profileData: {
  birthDate?: string;
  gender?: Gender;
  height?: number; // in user's unit system
  currentWeight?: number; // in user's unit system
  goalWeight?: number; // in user's unit system
  unitSystem?: UnitSystem;
  trackingEnabled?: boolean;
}): Promise<HealthProfile> {
  const sb = getSupabase();
  const { data: { user } } = await sb.auth.getUser();

  if (!user) throw new Error('Not authenticated');

  await ensureProfileExists();

  // Get existing profile to preserve values
  const existing = await getHealthProfile();
  const unitSystem = profileData.unitSystem || existing?.unit_system || 'metric';

  // Convert measurements to metric for storage
  let heightCm = existing?.height || null;
  let weightKg = existing?.current_weight || null;
  let goalWeightKg = existing?.goal_weight || null;

  if (profileData.height !== undefined) {
    heightCm = unitSystem === 'imperial'
      ? profileData.height * INCHES_TO_CM
      : profileData.height;
  }

  if (profileData.currentWeight !== undefined) {
    weightKg = unitSystem === 'imperial'
      ? profileData.currentWeight * LBS_TO_KG
      : profileData.currentWeight;
  }

  if (profileData.goalWeight !== undefined) {
    goalWeightKg = unitSystem === 'imperial'
      ? profileData.goalWeight * LBS_TO_KG
      : profileData.goalWeight;
  }

  // Calculate BMI if we have height and weight
  let currentBmi: number | null = null;
  if (heightCm && weightKg) {
    currentBmi = calculateBMI(weightKg, heightCm);
  }

  // Set starting weight if this is the first weight entry
  const startingWeight = existing?.starting_weight || weightKg;
  const startingBmi = existing?.starting_bmi || currentBmi;

  const profileUpdate: HealthProfileInsert = {
    user_id: user.id,
    birth_date: profileData.birthDate ?? existing?.birth_date ?? null,
    gender: profileData.gender ?? existing?.gender ?? null,
    height: heightCm,
    current_weight: weightKg,
    goal_weight: goalWeightKg,
    starting_weight: startingWeight,
    unit_system: unitSystem,
    tracking_enabled: profileData.trackingEnabled ?? existing?.tracking_enabled ?? false,
    current_bmi: currentBmi,
    starting_bmi: startingBmi,
  };

  const { data, error } = await sb
    .from('health_profiles')
    .upsert(profileUpdate, {
      onConflict: 'user_id',
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Log a weight entry
 */
export async function logWeight(weight: number, unitSystem: UnitSystem, notes?: string): Promise<WeightHistory> {
  const sb = getSupabase();
  const { data: { user } } = await sb.auth.getUser();

  if (!user) throw new Error('Not authenticated');

  await ensureProfileExists();

  // Convert to metric for storage
  const weightKg = unitSystem === 'imperial' ? weight * LBS_TO_KG : weight;

  // Get height from profile to calculate BMI
  const profile = await getHealthProfile();
  let bmi: number | null = null;
  if (profile?.height) {
    bmi = calculateBMI(weightKg, profile.height);
  }

  // Insert weight history entry
  const entry: WeightHistoryInsert = {
    user_id: user.id,
    weight: weightKg,
    bmi,
    notes: notes || null,
  };

  const { data, error } = await sb
    .from('weight_history')
    .insert(entry)
    .select()
    .single();

  if (error) throw error;

  // Update profile with new current weight and BMI
  await saveHealthProfile({
    currentWeight: unitSystem === 'imperial' ? weight : weightKg,
    unitSystem,
  });

  return data;
}

/**
 * Get weight history
 */
export async function getWeightHistory(limit?: number): Promise<WeightHistory[]> {
  const sb = getSupabase();
  const { data: { user } } = await sb.auth.getUser();

  if (!user) return [];

  let query = sb
    .from('weight_history')
    .select('*')
    .eq('user_id', user.id)
    .order('recorded_at', { ascending: false });

  if (limit) {
    query = query.limit(limit);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data || [];
}

/**
 * Delete a weight entry
 */
export async function deleteWeightEntry(entryId: string): Promise<void> {
  const sb = getSupabase();
  const { error } = await sb
    .from('weight_history')
    .delete()
    .eq('id', entryId);

  if (error) throw error;
}

/**
 * Get weight progress stats
 */
export async function getWeightProgress(): Promise<{
  startingWeight: number | null;
  currentWeight: number | null;
  goalWeight: number | null;
  totalLost: number | null;
  toGoal: number | null;
  percentToGoal: number | null;
  startingBmi: number | null;
  currentBmi: number | null;
}> {
  const profile = await getHealthProfile();

  if (!profile) {
    return {
      startingWeight: null,
      currentWeight: null,
      goalWeight: null,
      totalLost: null,
      toGoal: null,
      percentToGoal: null,
      startingBmi: null,
      currentBmi: null,
    };
  }

  const { starting_weight, current_weight, goal_weight, starting_bmi, current_bmi } = profile;

  let totalLost: number | null = null;
  let toGoal: number | null = null;
  let percentToGoal: number | null = null;

  if (starting_weight && current_weight) {
    totalLost = starting_weight - current_weight;
  }

  if (current_weight && goal_weight) {
    toGoal = current_weight - goal_weight;
  }

  if (starting_weight && goal_weight && current_weight) {
    const totalToLose = starting_weight - goal_weight;
    if (totalToLose > 0 && totalLost !== null) {
      percentToGoal = Math.min(100, Math.max(0, (totalLost / totalToLose) * 100));
    }
  }

  return {
    startingWeight: starting_weight,
    currentWeight: current_weight,
    goalWeight: goal_weight,
    totalLost,
    toGoal,
    percentToGoal,
    startingBmi: starting_bmi,
    currentBmi: current_bmi,
  };
}

/**
 * Reset health profile tracking data
 */
export async function resetHealthProfile(): Promise<void> {
  const sb = getSupabase();
  const { data: { user } } = await sb.auth.getUser();

  if (!user) throw new Error('Not authenticated');

  // Delete weight history
  const { error: historyError } = await sb
    .from('weight_history')
    .delete()
    .eq('user_id', user.id);

  if (historyError) throw historyError;

  // Reset profile measurements
  const { error: profileError } = await sb
    .from('health_profiles')
    .update({
      current_weight: null,
      starting_weight: null,
      goal_weight: null,
      current_bmi: null,
      starting_bmi: null,
      tracking_enabled: false,
    })
    .eq('user_id', user.id);

  if (profileError) throw profileError;
}
