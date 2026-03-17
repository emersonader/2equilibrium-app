/**
 * Content Loader for localized content
 * 
 * Provides functions to load lessons, chapters, and quizzes
 * in the current language. Falls back to English if a translation
 * is not available.
 */
import i18n from './index';

// English content (always available as fallback)
import en_lessons from './locales/en/lessons.json';
import en_chapters from './locales/en/chapters.json';
import en_quizzes from './locales/en/quizzes.json';

// Spanish content
import es_lessons from './locales/es/lessons.json';
import es_chapters from './locales/es/chapters.json';
import es_quizzes from './locales/es/quizzes.json';

// Portuguese content
import pt_lessons from './locales/pt/lessons.json';
import pt_chapters from './locales/pt/chapters.json';
import pt_quizzes from './locales/pt/quizzes.json';

type LessonsData = typeof en_lessons;
type ChaptersData = typeof en_chapters;
type QuizzesData = typeof en_quizzes;

const lessonsMap: Record<string, LessonsData> = {
  en: en_lessons,
  es: es_lessons,
  pt: pt_lessons,
};

const chaptersMap: Record<string, ChaptersData> = {
  en: en_chapters,
  es: es_chapters,
  pt: pt_chapters,
};

const quizzesMap: Record<string, QuizzesData> = {
  en: en_quizzes,
  es: es_quizzes,
  pt: pt_quizzes,
};

/**
 * Get the current language code (2-letter)
 */
export function getCurrentLanguage(): string {
  return i18n.language || 'en';
}

/**
 * Get localized lessons data
 */
export function getLocalizedLessons(lang?: string): LessonsData {
  const language = lang || getCurrentLanguage();
  return lessonsMap[language] || en_lessons;
}

/**
 * Get localized chapters data
 */
export function getLocalizedChapters(lang?: string): ChaptersData {
  const language = lang || getCurrentLanguage();
  return chaptersMap[language] || en_chapters;
}

/**
 * Get localized quizzes data
 */
export function getLocalizedQuizzes(lang?: string): QuizzesData {
  const language = lang || getCurrentLanguage();
  return quizzesMap[language] || en_quizzes;
}

/**
 * Get a specific lesson by ID in the current language
 */
export function getLocalizedLesson(lessonId: string, lang?: string) {
  const data = getLocalizedLessons(lang);
  return data.lessons.find((l: any) => l.id === lessonId);
}

/**
 * Get a specific quiz by ID in the current language
 */
export function getLocalizedQuiz(quizId: string, lang?: string) {
  const data = getLocalizedQuizzes(lang);
  return data.quizzes.find((q: any) => q.id === quizId);
}
