import React from 'react';
import { View, StyleSheet, type ViewStyle, type ViewProps } from 'react-native';
import { colors } from '@/theme/colors';
import { spacing, borderRadius } from '@/theme/spacing';

interface CardProps extends ViewProps {
  children: React.ReactNode;
  variant?: 'elevated' | 'outlined' | 'filled';
  padding?: keyof typeof spacing;
}

export function Card({
  children,
  variant = 'elevated',
  padding = 4,
  style,
  ...props
}: CardProps) {
  const cardStyle: ViewStyle[] = [
    styles.base,
    styles[variant],
    { padding: spacing[padding] },
    style as ViewStyle,
  ].filter(Boolean) as ViewStyle[];

  return (
    <View style={cardStyle} {...props}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: borderRadius.xl,
    backgroundColor: colors.white,
  },
  elevated: {
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  outlined: {
    borderWidth: 1,
    borderColor: colors.border,
  },
  filled: {
    backgroundColor: colors.gray[50],
  },
});
