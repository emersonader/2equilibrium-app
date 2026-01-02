/**
 * Holistic Wellness Journey - Design System Colors
 *
 * Primary Background: White (#FFFFFF)
 * Accent 1 - Luxury Orange: #E67E22 (warmth, energy, CTAs)
 * Accent 2 - Tiffany Blue: #0ABAB5 (calm, progress, success)
 */

export const Colors = {
  // Primary brand colors
  primary: {
    orange: '#E67E22',
    orangeLight: '#FEF3E6',
    orangeDark: '#C96A10',
    tiffanyBlue: '#0ABAB5',
    tiffanyBlueLight: '#E6F9F8',
    tiffanyBlueDark: '#089994',
  },

  // Neutral colors
  neutral: {
    white: '#FFFFFF',
    gray50: '#F8F9FA',
    gray100: '#F0F4F5',
    gray200: '#E5E7EB',
    gray300: '#D1D5DB',
    gray400: '#9CA3AF',
    gray500: '#6B7280',
    gray600: '#4B5563',
    gray700: '#374151',
    gray800: '#1F2937',
    gray900: '#1A1A2E',
    black: '#000000',
  },

  // Background colors
  background: {
    primary: '#FFFFFF',
    secondary: '#F8F9FA',
    tertiary: '#F0F4F5',
  },

  // Text colors
  text: {
    primary: '#1A1A2E',
    secondary: '#4A4A68',
    tertiary: '#6A6A8A',
    muted: '#8A8AA3',
    inverse: '#FFFFFF',
  },

  // Status colors
  status: {
    success: '#0ABAB5',
    successLight: '#E6F9F8',
    warning: '#E67E22',
    warningLight: '#FEF3E6',
    error: '#E74C3C',
    errorLight: '#FDECEB',
    info: '#3498DB',
    infoLight: '#EBF5FB',
  },

  // Chapter colors
  chapter: {
    awakening: '#0ABAB5',
    nourishment: '#2ECC71',
    mindful: '#3498DB',
    meal: '#9B59B6',
    movement: '#E67E22',
    mindset: '#E74C3C',
  },

  // Mood colors (1-5 scale)
  mood: {
    1: '#E74C3C',
    2: '#E67E22',
    3: '#F1C40F',
    4: '#2ECC71',
    5: '#0ABAB5',
  },

  // Badge/achievement colors
  badge: {
    bronze: '#CD7F32',
    silver: '#C0C0C0',
    gold: '#FFD700',
    platinum: '#E5E4E2',
  },

  // UI elements
  ui: {
    border: '#E5E7EB',
    borderLight: '#F0F4F5',
    divider: '#E5E7EB',
    overlay: 'rgba(0, 0, 0, 0.5)',
  },
};

// Backwards compatibility - flat exports
export const ColorsDark = {
  background: {
    primary: '#1A1A2E',
    secondary: '#252542',
    tertiary: '#2F2F4A',
  },
  text: {
    primary: '#FFFFFF',
    secondary: '#B8B8D0',
    muted: '#6A6A8A',
    inverse: '#1A1A2E',
  },
};

export default Colors;
