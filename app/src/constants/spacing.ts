/**
 * Holistic Wellness Journey - Spacing System
 *
 * Generous whitespace for a clean, airy feel
 * Based on 4px grid system
 */

export const Spacing = {
  // Base unit: 4px
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 28,
  '2xl': 32,
  xxxl: 36,
  '3xl': 40,
  '4xl': 48,
  '5xl': 64,
  '6xl': 80,
  '7xl': 96,
  // Nested for convenience
  borderRadius: {
    none: 0,
    sm: 4,
    md: 8,
    base: 12,
    lg: 16,
    xl: 20,
    '2xl': 24,
    '3xl': 32,
    full: 9999,
  },
  layout: {
    screenPadding: 20,
    screenPaddingHorizontal: 20,
    screenPaddingVertical: 24,
    cardPadding: 16,
    cardGap: 12,
    sectionGap: 32,
    listItemGap: 12,
    inputHeight: 48,
    buttonHeight: 52,
    buttonHeightSmall: 40,
    tabBarHeight: 80,
    headerHeight: 56,
  },
};

export const BorderRadius = {
  none: 0,
  sm: 4,
  md: 8,
  base: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  full: 9999,
};

export const Shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
};

// Common layout dimensions
export const Layout = {
  screenPaddingHorizontal: Spacing.lg,
  screenPaddingVertical: Spacing.xl,
  cardPadding: Spacing.base,
  cardGap: Spacing.md,
  sectionGap: Spacing['2xl'],
  listItemGap: Spacing.md,
  inputHeight: 48,
  buttonHeight: 52,
  buttonHeightSmall: 40,
  tabBarHeight: 80,
  headerHeight: 56,
};

export default Spacing;
