import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING, BORDER_RADIUS } from '../styles/theme';

export default function GameButton({ title, icon, onPress, colors }) {
  const buttonColors = colors || [COLORS.primary, COLORS.secondary];

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <LinearGradient colors={buttonColors} style={styles.gradient}>
        {icon && <Text style={styles.icon}>{icon}</Text>}
        <Text style={styles.title}>{title}</Text>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { borderRadius: BORDER_RADIUS.md, marginVertical: SPACING.sm },
  gradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', 
    paddingVertical: SPACING.md, borderRadius: BORDER_RADIUS.md },
  icon: { fontSize: 24, marginRight: SPACING.sm },
  title: { fontSize: 16, fontWeight: 'bold', color: '#FFF' },
});