import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS, SPACING } from '../styles/theme';

export default function Header({ title, onSettingsPress, onLanguagePress }) {
  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={onSettingsPress}>
        <Text style={styles.icon}>⚙️</Text>
      </TouchableOpacity>
      <Text style={styles.title}>{title}</Text>
      <TouchableOpacity onPress={onLanguagePress}>
        <Text style={styles.icon}>🌐</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', 
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.lg, backgroundColor: COLORS.primary },
  title: { fontSize: 24, fontWeight: 'bold', color: '#FFF' },
  icon: { fontSize: 24 },
});