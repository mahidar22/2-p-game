import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import BackButton from '../components/BackButton';
import GameButton from '../components/GameButton';
import { COLORS, SPACING, BORDER_RADIUS } from '../styles/theme';

export default function GameDetailScreen({ route, navigation }) {
  const { game } = route.params;

  return (
    <SafeAreaView style={styles.container}>
      <BackButton onPress={() => navigation.goBack()} />

      <ScrollView>
        <LinearGradient colors={[game.color, game.color + 'AA']} style={styles.header}>
          <Text style={styles.icon}>{game.icon}</Text>
          <Text style={styles.title}>{game.name}</Text>
        </LinearGradient>

        <View style={styles.buttonsContainer}>
          <GameButton title="Play vs Friend" icon="👥" 
            onPress={() => navigation.navigate(game.name, { mode: 'pvp' })} />
          <GameButton title="Play vs Bot" icon="🤖" 
            onPress={() => navigation.navigate(game.name, { mode: 'bot' })} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { alignItems: 'center', padding: SPACING.xxl, margin: SPACING.lg, borderRadius: BORDER_RADIUS.lg },
  icon: { fontSize: 80, marginBottom: SPACING.md },
  title: { fontSize: 32, fontWeight: 'bold', color: '#FFF' },
  buttonsContainer: { padding: SPACING.lg },
});