/**
 * Holistic Wellness Journey - Typography System
 *
 * Clean, readable typography with generous spacing
 * Optimized for wellness/lifestyle content
 */

import { TextStyle } from 'react-native';

export const FontFamilies = {
  // Using system fonts for now, can be swapped with custom fonts
  regular: 'System',
  medium: 'System',
  semibold: 'System',
  bold: 'System',
};

export const FontSizes = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
  '4xl': 36,
  '5xl': 48,
};

export const LineHeights = {
  tight: 1.25,
  normal: 1.5,
  relaxed: 1.75,
  loose: 2,
};

export const LetterSpacing = {
  tighter: -0.5,
  tight: -0.25,
  normal: 0,
  wide: 0.25,
  wider: 0.5,
};

// Define specific text style keys for proper typing
interface TextStyles {
  h1: TextStyle;
  h2: TextStyle;
  h3: TextStyle;
  h4: TextStyle;
  h5: TextStyle;
  bodyLarge: TextStyle;
  body: TextStyle;
  bodySmall: TextStyle;
  label: TextStyle;
  caption: TextStyle;
  buttonLarge: TextStyle;
  button: TextStyle;
  buttonSmall: TextStyle;
  quote: TextStyle;
  affirmation: TextStyle;
}

// Pre-defined text styles (flat structure)
const textStyles: TextStyles = {
  // Headings
  h1: {
    fontSize: FontSizes['4xl'],
    fontWeight: '700',
    lineHeight: FontSizes['4xl'] * LineHeights.tight,
    letterSpacing: LetterSpacing.tight,
  },
  h2: {
    fontSize: FontSizes['3xl'],
    fontWeight: '700',
    lineHeight: FontSizes['3xl'] * LineHeights.tight,
    letterSpacing: LetterSpacing.tight,
  },
  h3: {
    fontSize: FontSizes['2xl'],
    fontWeight: '600',
    lineHeight: FontSizes['2xl'] * LineHeights.normal,
    letterSpacing: LetterSpacing.normal,
  },
  h4: {
    fontSize: FontSizes.xl,
    fontWeight: '600',
    lineHeight: FontSizes.xl * LineHeights.normal,
    letterSpacing: LetterSpacing.normal,
  },
  h5: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
    lineHeight: FontSizes.lg * LineHeights.normal,
    letterSpacing: LetterSpacing.normal,
  },

  // Body text
  bodyLarge: {
    fontSize: FontSizes.lg,
    fontWeight: '400',
    lineHeight: FontSizes.lg * LineHeights.relaxed,
    letterSpacing: LetterSpacing.normal,
  },
  body: {
    fontSize: FontSizes.base,
    fontWeight: '400',
    lineHeight: FontSizes.base * LineHeights.relaxed,
    letterSpacing: LetterSpacing.normal,
  },
  bodySmall: {
    fontSize: FontSizes.sm,
    fontWeight: '400',
    lineHeight: FontSizes.sm * LineHeights.relaxed,
    letterSpacing: LetterSpacing.normal,
  },

  // Labels and captions
  label: {
    fontSize: FontSizes.sm,
    fontWeight: '500',
    lineHeight: FontSizes.sm * LineHeights.normal,
    letterSpacing: LetterSpacing.wide,
    textTransform: 'uppercase',
  },
  caption: {
    fontSize: FontSizes.xs,
    fontWeight: '400',
    lineHeight: FontSizes.xs * LineHeights.normal,
    letterSpacing: LetterSpacing.normal,
  },

  // Button text
  buttonLarge: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
    lineHeight: FontSizes.lg * LineHeights.tight,
    letterSpacing: LetterSpacing.wide,
  },
  button: {
    fontSize: FontSizes.base,
    fontWeight: '600',
    lineHeight: FontSizes.base * LineHeights.tight,
    letterSpacing: LetterSpacing.wide,
  },
  buttonSmall: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    lineHeight: FontSizes.sm * LineHeights.tight,
    letterSpacing: LetterSpacing.wide,
  },

  // Special styles
  quote: {
    fontSize: FontSizes.xl,
    fontWeight: '400',
    fontStyle: 'italic',
    lineHeight: FontSizes.xl * LineHeights.relaxed,
    letterSpacing: LetterSpacing.normal,
  },
  affirmation: {
    fontSize: FontSizes['2xl'],
    fontWeight: '500',
    fontStyle: 'italic',
    lineHeight: FontSizes['2xl'] * LineHeights.relaxed,
    letterSpacing: LetterSpacing.normal,
    textAlign: 'center',
  },
};

// Export type for external use
export type { TextStyles };

// Export both flat and nested for compatibility
export const Typography: TextStyles & { textStyles: TextStyles } = {
  ...textStyles,
  textStyles, // nested reference for components that expect it
};

export default Typography;
