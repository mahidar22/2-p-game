import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SPACING, BORDER_RADIUS, SHADOWS } from '../styles/theme';

export default function GameCard({ game, onPress }) {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <LinearGradient colors={[game.color, game.color + 'CC']} style={styles.gradient}>
        <Text style={styles.icon}>{game.icon}</Text>
        <Text style={styles.title}>{game.name}</Text>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, margin: SPACING.sm, borderRadius: BORDER_RADIUS.lg, ...SHADOWS.medium },
  gradient: { padding: SPACING.md, borderRadius: BORDER_RADIUS.lg, minHeight: 140, justifyContent: 'space-between' },
  icon: { fontSize: 48, textAlign: 'center' },
  title: { fontSize: 14, fontWeight: 'bold', color: '#FFF', textAlign: 'center' },
});