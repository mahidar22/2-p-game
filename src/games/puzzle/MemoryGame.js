import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, SafeAreaView } from 'react-native';
import { COLORS, SPACING, BORDER_RADIUS } from '../../styles/theme';

const EMOJIS = ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼'];

export default function MemoryGame({ navigation }) {
  const [cards, setCards] = useState([]);
  const [flipped, setFlipped] = useState([]);
  const [matched, setMatched] = useState([]);
  const [moves, setMoves] = useState(0);
  const [scores, setScores] = useState({ player1: 0, player2: 0 });
  const [currentPlayer, setCurrentPlayer] = useState(1);

  useEffect(() => {
    initializeGame();
  }, []);

  useEffect(() => {
    if (flipped.length === 2) {
      setTimeout(() => checkMatch(), 800);
    }
  }, [flipped]);

  useEffect(() => {
    if (matched.length === cards.length && cards.length > 0) {
      const winner = scores.player1 > scores.player2 ? 'Player 1' : scores.player2 > scores.player1 ? 'Player 2' : 'Draw';
      Alert.alert('🎉 Game Over!', `${winner} Wins!\n\nP1: ${scores.player1} | P2: ${scores.player2}`, [
        { text: 'Play Again', onPress: initializeGame },
      ]);
    }
  }, [matched]);

  const initializeGame = () => {
    const shuffled = [...EMOJIS, ...EMOJIS]
      .sort(() => Math.random() - 0.5)
      .map((emoji, i) => ({ id: i, emoji }));
    setCards(shuffled);
    setFlipped([]);
    setMatched([]);
    setMoves(0);
    setScores({ player1: 0, player2: 0 });
    setCurrentPlayer(1);
  };

  const handleCardPress = (id) => {
    if (flipped.includes(id) || matched.includes(id) || flipped.length === 2) return;

    setFlipped([...flipped, id]);
  };

  const checkMatch = () => {
    const [first, second] = flipped;
    if (cards[first].emoji === cards[second].emoji) {
      setMatched([...matched, first, second]);
      setScores(prev =>
        currentPlayer === 1
          ? { ...prev, player1: prev.player1 + 1 }
          : { ...prev, player2: prev.player2 + 1 }
      );
    } else {
      setCurrentPlayer(currentPlayer === 1 ? 2 : 1);
    }
    setMoves(moves + 1);
    setFlipped([]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backBtn}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Memory Game</Text>
        <View style={{ width: 50 }} />
      </View>

      <View style={styles.stats}>
        <View style={styles.statItem}>
          <Text style={styles.label}>P1</Text>
          <Text style={[styles.stat, { color: COLORS.player1 }]}>{scores.player1}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.label}>Moves</Text>
          <Text style={[styles.stat, { color: COLORS.text }]}>{moves}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.label}>P2</Text>
          <Text style={[styles.stat, { color: COLORS.player2 }]}>{scores.player2}</Text>
        </View>
      </View>

      <Text style={styles.turn}>Player {currentPlayer}'s Turn</Text>

      <View style={styles.grid}>
        {cards.map((card) => (
          <TouchableOpacity
            key={card.id}
            style={[
              styles.card,
              (flipped.includes(card.id) || matched.includes(card.id)) && styles.flipped,
            ]}
            onPress={() => handleCardPress(card.id)}
            disabled={flipped.length === 2}
          >
            <Text style={styles.cardText}>
              {flipped.includes(card.id) || matched.includes(card.id) ? card.emoji : '?'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.newGameBtn} onPress={initializeGame}>
        <Text style={styles.newGameText}>New Game</Text>
      </TouchableOpacity>
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
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: SPACING.lg,
    backgroundColor: COLORS.cardBg,
  },
  statItem: { alignItems: 'center' },
  label: { fontSize: 12, color: COLORS.textLight },
  stat: { fontSize: 24, fontWeight: 'bold' },
  turn: { textAlign: 'center', fontSize: 16, fontWeight: 'bold', marginVertical: SPACING.md, color: COLORS.text },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    paddingHorizontal: SPACING.lg,
    marginVertical: SPACING.lg,
  },
  card: {
    width: '22%',
    aspectRatio: 1,
    margin: '2%',
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  flipped: { backgroundColor: COLORS.accent },
  cardText: { fontSize: 28, fontWeight: 'bold' },
  newGameBtn: {
    backgroundColor: COLORS.success,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
  },
  newGameText: { fontSize: 18, fontWeight: 'bold', color: '#FFF', textAlign: 'center' },
});