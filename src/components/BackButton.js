import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { COLORS, SPACING } from '../styles/theme';

export default function BackButton({ onPress }) {
  return (
    <TouchableOpacity style={styles.button} onPress={onPress}>
      <Text style={styles.text}>← Back</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: { padding: SPACING.md },
  text: { fontSize: 16, color: COLORS.primary, fontWeight: '600' },
});