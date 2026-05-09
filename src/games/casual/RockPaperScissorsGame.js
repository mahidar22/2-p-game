import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, SafeAreaView } from 'react-native';
import { COLORS, SPACING, BORDER_RADIUS } from '../../../styles/theme';

const CHOICES = ['Rock', 'Paper', 'Scissors'];
const EMOJIS = ['✊', '✋', '✌️'];

export default function RockPaperScissorsGame({ navigation }) {
  const [scores, setScores] = useState({ player1: 0, player2: 0 });
  const [round, setRound] = useState(0);
  const [p1Choice, setP1Choice] = useState(null);
  const [p2Choice, setP2Choice] = useState(null);
  const [result, setResult] = useState('');

  const determineWinner = (c1, c2) => {
    if (c1 === c2) return 'Draw!';
    if (
      (c1 === 'Rock' && c2 === 'Scissors') ||
      (c1 === 'Paper' && c2 === 'Rock') ||
      (c1 === 'Scissors' && c2 === 'Paper')
    ) return 'Player 1';
    return 'Player 2';
  };

  const handleChoice = (choiceIndex) => {
    const choice = CHOICES[choiceIndex];

    if (p1Choice === null) {
      setP1Choice(choice);
    } else if (p2Choice === null) {
      setP2Choice(choice);
      const winner = determineWinner(p1Choice, choice);
      
      setResult(winner);
      if (winner === 'Player 1') setScores(prev => ({ ...prev, player1: prev.player1 + 1 }));
      else if (winner === 'Player 2') setScores(prev => ({ ...prev, player2: prev.player2 + 1 }));

      setRound(round + 1);
      
      setTimeout(() => {
        if (round + 1 >= 5) {
          const finalWinner = scores.player1 > scores.player2 ? 'Player 1' : 'Player 2';
          Alert.alert('🏆 Game Over!', `${finalWinner} Wins the Match!`, [
            { text: 'Play Again', onPress: resetGame },
          ]);
        } else {
          resetRound();
        }
      }, 2000);
    }
  };

  const resetRound = () => {
    setP1Choice(null);
    setP2Choice(null);
    setResult('');
  };

  const resetGame = () => {
    setScores({ player1: 0, player2: 0 });
    setRound(0);
    resetRound();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backBtn}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Rock Paper Scissors</Text>
        <View style={{ width: 50 }} />
      </View>

      <View style={styles.scores}>
        <View style={styles.scoreItem}>
          <Text style={styles.label}>Player 1</Text>
          <Text style={[styles.score, { color: COLORS.player1 }]}>{scores.player1}</Text>
        </View>
        <View style={styles.scoreItem}>
          <Text style={styles.label}>Player 2</Text>
          <Text style={[styles.score, { color: COLORS.player2 }]}>{scores.player2}</Text>
        </View>
      </View>

      <Text style={styles.round}>Round {round + 1}/5</Text>

      {result ? (
        <View style={styles.resultContainer}>
          <Text style={styles.resultText}>{result}</Text>
          <View style={styles.choicesDisplay}>
            <View style={styles.choiceBox}>
              <Text style={styles.choiceEmoji}>{EMOJIS[CHOICES.indexOf(p1Choice)]}</Text>
              <Text style={styles.choiceName}>{p1Choice}</Text>
            </View>
            <Text style={styles.vs}>VS</Text>
            <View style={styles.choiceBox}>
              <Text style={styles.choiceEmoji}>{EMOJIS[CHOICES.indexOf(p2Choice)]}</Text>
              <Text style={styles.choiceName}>{p2Choice}</Text>
            </View>
          </View>
        </View>
      ) : (
        <View style={styles.promptContainer}>
          <Text style={styles.prompt}>
            {p1Choice === null ? 'Player 1: Choose' : 'Player 2: Choose'}
          </Text>
        </View>
      )}

      <View style={styles.choicesContainer}>
        {CHOICES.map((choice, i) => (
          <TouchableOpacity
            key={i}
            style={[
              styles.choiceBtn,
              (p1Choice === choice || p2Choice === choice) && styles.selectedChoice,
            ]}
            onPress={() => handleChoice(i)}
            disabled={result !== ''}
          >
            <Text style={styles.btnEmoji}>{EMOJIS[i]}</Text>
            <Text style={styles.btnText}>{choice}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {round > 0 && (
        <TouchableOpacity style={styles.newGameBtn} onPress={resetGame}>
          <Text style={styles.newGameText}>New Match</Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.primary,
  },
  backBtn: { fontSize: 18, color: '#FFF', fontWeight: 'bold' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#FFF' },
  scores: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: SPACING.lg,
    backgroundColor: COLORS.cardBg,
  },
  scoreItem: { alignItems: 'center' },
  label: { fontSize: 14, color: COLORS.textLight },
  score: { fontSize: 32, fontWeight: 'bold' },
  round: { textAlign: 'center', fontSize: 16, color: COLORS.textLight, marginTop: SPACING.md },
  resultContainer: { marginVertical: SPACING.xl, alignItems: 'center' },
  resultText: { fontSize: 28, fontWeight: 'bold', color: COLORS.primary, marginBottom: SPACING.md },
  choicesDisplay: { flexDirection: 'row', alignItems: 'center', gap: SPACING.lg },
  choiceBox: { alignItems: 'center' },
  choiceEmoji: { fontSize: 60, marginBottom: SPACING.sm },
  choiceName: { fontSize: 14, fontWeight: 'bold', color: COLORS.text },
  vs: { fontSize: 20, fontWeight: 'bold', color: COLORS.textLight },
  promptContainer: { marginVertical: SPACING.xl, alignItems: 'center' },
  prompt: { fontSize: 20, fontWeight: 'bold', color: COLORS.text },
  choicesContainer: { flexDirection: 'row', justifyContent: 'space-around', marginVertical: SPACING.xl },
  choiceBtn: {
    backgroundColor: COLORS.cardBg,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
    minWidth: 80,
  },
  selectedChoice: { backgroundColor: COLORS.primary },
  btnEmoji: { fontSize: 48, marginBottom: SPACING.sm },
  btnText: { fontSize: 14, fontWeight: 'bold', color: COLORS.text },
  newGameBtn: {
    backgroundColor: COLORS.accent,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
  },
  newGameText: { fontSize: 18, fontWeight: 'bold', color: '#FFF', textAlign: 'center' },
});
