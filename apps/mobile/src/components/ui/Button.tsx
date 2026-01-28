import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  type TouchableOpacityProps,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import { colors } from '@/theme/colors';
import { spacing, fontSize, borderRadius, fontWeight } from '@/theme/spacing';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
}

export function Button({
  title,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  style,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;

  const buttonStyle: ViewStyle[] = [
    styles.base,
    styles[`${variant}Button`],
    styles[`${size}Button`],
    fullWidth && styles.fullWidth,
    isDisabled && styles.disabled,
    style as ViewStyle,
  ].filter(Boolean) as ViewStyle[];

  const textStyle: TextStyle[] = [
    styles.text,
    styles[`${variant}Text`],
    styles[`${size}Text`],
    isDisabled && styles.disabledText,
  ].filter(Boolean) as TextStyle[];

  return (
    <TouchableOpacity
      style={buttonStyle}
      disabled={isDisabled}
      activeOpacity={0.7}
      {...props}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'primary' || variant === 'danger' ? colors.white : colors.primary[600]}
          size="small"
        />
      ) : (
        <Text style={textStyle}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.lg,
  },

  // Variants - Button
  primaryButton: {
    backgroundColor: colors.primary[600],
  },
  secondaryButton: {
    backgroundColor: colors.gray[100],
  },
  outlineButton: {
    backgroundColor: colors.transparent,
    borderWidth: 1,
    borderColor: colors.gray[300],
  },
  ghostButton: {
    backgroundColor: colors.transparent,
  },
  dangerButton: {
    backgroundColor: colors.error[600],
  },

  // Variants - Text
  primaryText: {
    color: colors.white,
  },
  secondaryText: {
    color: colors.gray[700],
  },
  outlineText: {
    color: colors.gray[700],
  },
  ghostText: {
    color: colors.primary[600],
  },
  dangerText: {
    color: colors.white,
  },

  // Sizes - Button
  smButton: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
  },
  mdButton: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
  },
  lgButton: {
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[4],
  },

  // Sizes - Text
  smText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  mdText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
  },
  lgText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
  },

  // States
  disabled: {
    opacity: 0.5,
  },
  disabledText: {
    opacity: 0.7,
  },

  fullWidth: {
    width: '100%',
  },

  text: {
    textAlign: 'center',
  },
});
