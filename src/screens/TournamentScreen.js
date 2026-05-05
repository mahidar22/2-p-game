import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import BackButton from '../components/BackButton';
import { COLORS, SPACING } from '../styles/theme';

export default function TournamentScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.container}>
      <BackButton onPress={() => navigation.goBack()} />
      <View style={styles.content}>
        <Text style={styles.title}>🏆 Tournament Mode</Text>
        <Text style={styles.subtitle}>Coming Soon!</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 32, fontWeight: 'bold', color: COLORS.text },
  subtitle: { fontSize: 18, color: COLORS.textLight, marginTop: SPACING.md },
});