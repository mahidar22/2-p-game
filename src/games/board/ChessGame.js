import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import GameCanvas from '../../components/GameCanvas';
import { COLORS, SPACING } from '../../../styles/theme';

export default function ChessGame({ navigation, route }) {
  const { mode } = route.params || {};
  const [player1Score, setPlayer1Score] = useState(0);
  const [player2Score, setPlayer2Score] = useState(0);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.scoreBoard}>
        <Text style={styles.score}>P1: {player1Score}</Text>
        <Text style={styles.score}>P2: {player2Score}</Text>
      </View>

      <GameCanvas>
        <Text style={styles.gameTitle}>{gameName.replace('Game', '')}</Text>
        <Text style={styles.comingSoon}>Game implementation coming soon!</Text>
      </GameCanvas>

      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scoreBoard: { flexDirection: 'row', justifyContent: 'space-between', padding: SPACING.md, backgroundColor: COLORS.primary },
  score: { fontSize: 20, fontWeight: 'bold', color: '#FFF' },
  gameTitle: { fontSize: 32, fontWeight: 'bold', color: '#FFF', marginBottom: SPACING.lg },
  comingSoon: { fontSize: 18, color: '#FFF' },
  backButton: { padding: SPACING.md, backgroundColor: COLORS.danger },
  backText: { fontSize: 16, color: '#FFF', textAlign: 'center' },
});
