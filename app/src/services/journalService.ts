import { getSupabase } from './supabase';
import { ensureProfileExists } from './authService';
import type {
  JournalEntry,
  JournalEntryInsert,
  JournalEntryUpdate,
  JournalEntryType,
} from './database.types';

export interface JournalEntryData {
  lessonId?: string;
  entryDate: string; // YYYY-MM-DD
  entryType: JournalEntryType;
  promptResponse?: string;
  reflectionResponse?: string;
  gratitudeResponse?: string;
  freeformNotes?: string;
  mood?: number;
  energy?: number;
  nourishmentQuality?: number;
  movementCompleted?: boolean;
  waterIntake?: number;
}

/**
 * Save or update a journal entry
 * Merges new data with existing entry to preserve all fields
 */
export async function saveJournalEntry(entryData: JournalEntryData): Promise<JournalEntry> {
  const sb = getSupabase();
  const { data: { user } } = await sb.auth.getUser();

  if (!user) throw new Error('Not authenticated');

  // Ensure profile exists before saving (required by foreign key constraint)
  await ensureProfileExists();

  // First, try to get existing entry to merge data
  const existingEntry = await getEntryByDate(entryData.entryDate, entryData.entryType);

  // Merge new data with existing data (new values override existing, but undefined preserves existing)
  const entry: JournalEntryInsert = {
    user_id: user.id,
    lesson_id: entryData.lessonId ?? existingEntry?.lesson_id,
    entry_date: entryData.entryDate,
    entry_type: entryData.entryType,
    // Text responses - only update if provided, otherwise keep existing
    prompt_response: entryData.promptResponse !== undefined
      ? entryData.promptResponse
      : existingEntry?.prompt_response,
    reflection_response: entryData.reflectionResponse !== undefined
      ? entryData.reflectionResponse
      : existingEntry?.reflection_response,
    gratitude_response: entryData.gratitudeResponse !== undefined
      ? entryData.gratitudeResponse
      : existingEntry?.gratitude_response,
    freeform_notes: entryData.freeformNotes !== undefined
      ? entryData.freeformNotes
      : existingEntry?.freeform_notes,
    // Numeric values - only update if provided, otherwise keep existing
    mood: entryData.mood !== undefined
      ? entryData.mood
      : existingEntry?.mood,
    energy: entryData.energy !== undefined
      ? entryData.energy
      : existingEntry?.energy,
    nourishment_quality: entryData.nourishmentQuality !== undefined
      ? entryData.nourishmentQuality
      : existingEntry?.nourishment_quality,
    water_intake: entryData.waterIntake !== undefined
      ? entryData.waterIntake
      : existingEntry?.water_intake,
    // Boolean - only update if provided, otherwise keep existing
    movement_completed: entryData.movementCompleted !== undefined
      ? entryData.movementCompleted
      : existingEntry?.movement_completed,
  };

  // Use upsert to handle both create and update
  const { data, error } = await sb
    .from('journal_entries')
    .upsert(entry, {
      onConflict: 'user_id,entry_date,entry_type',
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Get local date string in YYYY-MM-DD format
 */
function getLocalDateString(date: Date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

/**
 * Get today's journal entry
 */
export async function getTodayEntry(entryType: JournalEntryType = 'daily'): Promise<JournalEntry | null> {
  const today = getLocalDateString();
  return getEntryByDate(today, entryType);
}

/**
 * Get journal entry by date
 */
export async function getEntryByDate(
  date: string,
  entryType: JournalEntryType = 'daily'
): Promise<JournalEntry | null> {
  const sb = getSupabase();
  const { data: { user } } = await sb.auth.getUser();

  if (!user) return null;

  const { data, error } = await sb
    .from('journal_entries')
    .select('*')
    .eq('user_id', user.id)
    .eq('entry_date', date)
    .eq('entry_type', entryType)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

/**
 * Get journal entries for a date range
 */
export async function getEntriesForDateRange(
  startDate: string,
  endDate: string
): Promise<JournalEntry[]> {
  const sb = getSupabase();
  const { data: { user } } = await sb.auth.getUser();

  if (!user) return [];

  const { data, error } = await sb
    .from('journal_entries')
    .select('*')
    .eq('user_id', user.id)
    .gte('entry_date', startDate)
    .lte('entry_date', endDate)
    .order('entry_date', { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Get recent journal entries
 */
export async function getRecentEntries(limit: number = 10): Promise<JournalEntry[]> {
  const sb = getSupabase();
  const { data: { user } } = await sb.auth.getUser();

  if (!user) return [];

  const { data, error } = await sb
    .from('journal_entries')
    .select('*')
    .eq('user_id', user.id)
    .order('entry_date', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
}

/**
 * Get all journal entries
 */
export async function getAllEntries(): Promise<JournalEntry[]> {
  const sb = getSupabase();
  const { data: { user } } = await sb.auth.getUser();

  if (!user) return [];

  const { data, error } = await sb
    .from('journal_entries')
    .select('*')
    .eq('user_id', user.id)
    .order('entry_date', { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Delete a journal entry
 */
export async function deleteEntry(entryId: string): Promise<void> {
  const sb = getSupabase();
  const { error } = await sb
    .from('journal_entries')
    .delete()
    .eq('id', entryId);

  if (error) throw error;
}

/**
 * Get weekly summary statistics
 */
export async function getWeeklySummary(weekStartDate: string): Promise<{
  totalEntries: number;
  averageMood: number | null;
  averageEnergy: number | null;
  movementDays: number;
  totalWaterIntake: number;
}> {
  const sb = getSupabase();
  const { data: { user } } = await sb.auth.getUser();

  if (!user) {
    return {
      totalEntries: 0,
      averageMood: null,
      averageEnergy: null,
      movementDays: 0,
      totalWaterIntake: 0,
    };
  }

  // Calculate week end date (7 days from start)
  const startDate = new Date(weekStartDate);
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 6);
  const weekEndDate = endDate.toISOString().split('T')[0];

  const entries = await getEntriesForDateRange(weekStartDate, weekEndDate);

  if (entries.length === 0) {
    return {
      totalEntries: 0,
      averageMood: null,
      averageEnergy: null,
      movementDays: 0,
      totalWaterIntake: 0,
    };
  }

  // Calculate averages
  const moodEntries = entries.filter((e) => e.mood !== null);
  const energyEntries = entries.filter((e) => e.energy !== null);
  const movementDays = entries.filter((e) => e.movement_completed === true).length;
  const totalWaterIntake = entries.reduce((sum, e) => sum + (e.water_intake || 0), 0);

  return {
    totalEntries: entries.length,
    averageMood: moodEntries.length > 0
      ? moodEntries.reduce((sum, e) => sum + (e.mood || 0), 0) / moodEntries.length
      : null,
    averageEnergy: energyEntries.length > 0
      ? energyEntries.reduce((sum, e) => sum + (e.energy || 0), 0) / energyEntries.length
      : null,
    movementDays,
    totalWaterIntake,
  };
}

/**
 * Get mood trend for the last N days
 */
export async function getMoodTrend(days: number = 7): Promise<Array<{
  date: string;
  mood: number | null;
}>> {
  const sb = getSupabase();
  const { data: { user } } = await sb.auth.getUser();

  if (!user) return [];

  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days + 1);

  const entries = await getEntriesForDateRange(
    startDate.toISOString().split('T')[0],
    endDate.toISOString().split('T')[0]
  );

  // Create a map of dates to moods
  const moodMap = new Map<string, number | null>();
  entries.forEach((entry) => {
    if (entry.mood !== null) {
      moodMap.set(entry.entry_date, entry.mood);
    }
  });

  // Generate array for all days
  const trend: Array<{ date: string; mood: number | null }> = [];
  for (let i = 0; i < days; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    const dateStr = date.toISOString().split('T')[0];
    trend.push({
      date: dateStr,
      mood: moodMap.get(dateStr) || null,
    });
  }

  return trend;
}

/**
 * Export journal entries as JSON
 */
export async function exportJournalAsJson(): Promise<string> {
  const entries = await getAllEntries();
  return JSON.stringify(entries, null, 2);
}

/**
 * Get journal entry for a specific lesson
 */
export async function getJournalEntryForLesson(lessonId: string): Promise<JournalEntry | null> {
  const sb = getSupabase();
  const { data: { user } } = await sb.auth.getUser();

  if (!user) return null;

  // Use limit(1) instead of maybeSingle() to handle duplicate entries gracefully
  const { data, error } = await sb
    .from('journal_entries')
    .select('*')
    .eq('user_id', user.id)
    .eq('lesson_id', lessonId)
    .order('created_at', { ascending: false })
    .limit(1);

  if (error) throw error;
  return data && data.length > 0 ? data[0] : null;
}

/**
 * Check if journal entry for a lesson has all prompts completed
 */
export async function isJournalCompleteForLesson(lessonId: string): Promise<boolean> {
  const sb = getSupabase();
  const { data: { user } } = await sb.auth.getUser();

  if (!user) return false;

  // Use limit(1) instead of maybeSingle() to handle duplicate entries gracefully
  const { data, error } = await sb
    .from('journal_entries')
    .select('prompt_response, reflection_response, gratitude_response')
    .eq('user_id', user.id)
    .eq('lesson_id', lessonId)
    .order('created_at', { ascending: false })
    .limit(1);

  if (error) throw error;
  if (!data || data.length === 0) return false;

  const entry = data[0];

  // Check if all three prompts have responses
  return !!(
    entry.prompt_response && entry.prompt_response.trim() &&
    entry.reflection_response && entry.reflection_response.trim() &&
    entry.gratitude_response && entry.gratitude_response.trim()
  );
}

/**
 * Check if movement is completed for a lesson
 */
export async function isMovementCompleteForLesson(lessonId: string): Promise<boolean> {
  const sb = getSupabase();
  const { data: { user } } = await sb.auth.getUser();

  if (!user) return false;

  // Use limit(1) instead of maybeSingle() to handle duplicate entries gracefully
  const { data, error } = await sb
    .from('journal_entries')
    .select('movement_completed')
    .eq('user_id', user.id)
    .eq('lesson_id', lessonId)
    .order('created_at', { ascending: false })
    .limit(1);

  if (error) throw error;
  if (!data || data.length === 0) return false;

  return data[0].movement_completed === true;
}

/**
 * Check if a lesson is fully complete (journal + movement)
 */
export async function isLessonFullyComplete(lessonId: string): Promise<{
  isComplete: boolean;
  journalComplete: boolean;
  movementComplete: boolean;
}> {
  const [journalComplete, movementComplete] = await Promise.all([
    isJournalCompleteForLesson(lessonId),
    isMovementCompleteForLesson(lessonId),
  ]);

  return {
    isComplete: journalComplete && movementComplete,
    journalComplete,
    movementComplete,
  };
}

/**
 * Export journal entries as CSV
 */
export async function exportJournalAsCsv(): Promise<string> {
  const entries = await getAllEntries();

  const headers = [
    'Date',
    'Type',
    'Mood',
    'Energy',
    'Nourishment',
    'Water Intake',
    'Movement',
    'Prompt Response',
    'Reflection',
    'Gratitude',
    'Notes',
  ];

  const rows = entries.map((entry) => [
    entry.entry_date,
    entry.entry_type,
    entry.mood || '',
    entry.energy || '',
    entry.nourishment_quality || '',
    entry.water_intake || '',
    entry.movement_completed ? 'Yes' : 'No',
    `"${(entry.prompt_response || '').replace(/"/g, '""')}"`,
    `"${(entry.reflection_response || '').replace(/"/g, '""')}"`,
    `"${(entry.gratitude_response || '').replace(/"/g, '""')}"`,
    `"${(entry.freeform_notes || '').replace(/"/g, '""')}"`,
  ]);

  return [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
}
