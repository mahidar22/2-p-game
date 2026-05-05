import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, SPACING } from '../styles/theme';

export default function PlayerScore({ player, score, color }) {
  return (
    <View style={styles.container}>
      <View style={[styles.avatar, { backgroundColor: color }]}>
        <Text style={styles.avatarText}>{player}</Text>
      </View>
      <Text style={styles.label}>Player {player}</Text>
      <Text style={[styles.score, { color }]}>{score}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center' },
  avatar: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 24, fontWeight: 'bold', color: '#FFF' },
  label: { fontSize: 12, color: COLORS.textLight, marginTop: SPACING.xs },
  score: { fontSize: 28, fontWeight: 'bold', marginTop: SPACING.xs },
});