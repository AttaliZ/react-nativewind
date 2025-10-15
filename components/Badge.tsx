import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface BadgeProps {
  label: string;
  variant?: 'danger' | 'warning' | 'success' | 'info';
}

export const Badge: React.FC<BadgeProps> = ({ label, variant = 'info' }) => {
  const variantStyles = {
    danger: styles.dangerBg,
    warning: styles.warningBg,
    success: styles.successBg,
    info: styles.infoBg,
  };
  
  const textStyles = {
    danger: styles.dangerText,
    warning: styles.warningText,
    success: styles.successText,
    info: styles.infoText,
  };
  
  return (
    <View style={[styles.badge, variantStyles[variant]]}>
      <Text style={[styles.text, textStyles[variant]]}>
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
  },
  dangerBg: {
    backgroundColor: '#FEE2E2',
    borderColor: '#FECACA',
  },
  dangerText: {
    color: '#B91C1C',
  },
  warningBg: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FDE68A',
  },
  warningText: {
    color: '#92400E',
  },
  successBg: {
    backgroundColor: '#D1FAE5',
    borderColor: '#A7F3D0',
  },
  successText: {
    color: '#065F46',
  },
  infoBg: {
    backgroundColor: '#DBEAFE',
    borderColor: '#BFDBFE',
  },
  infoText: {
    color: '#1E40AF',
  },
});