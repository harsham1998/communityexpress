import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { theme } from '../../theme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  padding?: keyof typeof theme.spacing;
  margin?: keyof typeof theme.spacing;
  variant?: 'default' | 'elevated' | 'outlined';
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  padding = 4,
  margin = 0,
  variant = 'default',
}) => {
  const cardStyle = [
    styles.base,
    styles[variant],
    { 
      padding: theme.spacing[padding],
      margin: theme.spacing[margin],
    },
    style,
  ];

  return <View style={cardStyle}>{children}</View>;
};

const styles = StyleSheet.create({
  base: {
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.white,
  },
  
  default: {
    ...theme.shadows.sm,
  },
  
  elevated: {
    ...theme.shadows.lg,
  },
  
  outlined: {
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
});