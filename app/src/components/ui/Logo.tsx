import React from 'react';
import { View, Text, StyleSheet, TextStyle, ViewStyle } from 'react-native';
import { Colors, Typography } from '@/constants';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function Logo({ size = 'md', style, textStyle }: LogoProps) {
  const logoStyles = [
    styles.container,
    style,
  ];

  const textStyles = [
    styles.text,
    styles[`text_${size}`],
    textStyle,
  ];

  return (
    <View style={logoStyles}>
      <Text style={[textStyles, { color: Colors.primary.orange }]}>2</Text>
      <Text style={[textStyles, { color: Colors.text.primary }]}>Equilibrium</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  text: {
    fontFamily: 'PlayfairDisplay_700Bold',
  },
  text_sm: {
    ...Typography.h4,
  },
  text_md: {
    ...Typography.h3,
  },
  text_lg: {
    ...Typography.h2,
  },
});

export default Logo;