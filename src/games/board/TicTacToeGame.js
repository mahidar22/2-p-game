import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, SafeAreaView } from 'react-native';
import { COLORS, SPACING, BORDER_RADIUS } from '../../styles/theme';

export default function TicTacToeGame({ navigation }) {
  const [board, setBoard] = useState(Array(9).fill(null));
  const [isXNext, setIsXNext] = useState(true);
  const [scores, setScores] = useState({ X: 0, O: 0 });

  const calculateWinner = (squares) => {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8],
      [0, 3, 6], [1, 4, 7], [2, 5, 8],
      [0, 4, 8], [2, 4, 6],
    ];
    for (let [a, b, c] of lines) {
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return squares[a];
      }
    }
    return null;
  };

  const winner = calculateWinner(board);

  const handlePress = (index) => {
    if (board[index] || winner) return;

    const newBoard = [...board];
    newBoard[index] = isXNext ? 'X' : 'O';
    setBoard(newBoard);

    const newWinner = calculateWinner(newBoard);
    if (newWinner) {
      setScores(prev => ({ ...prev, [newWinner]: prev[newWinner] + 1 }));
      Alert.alert(`🎉 Player ${newWinner} Wins!`, '', [
        { text: 'Play Again', onPress: resetGame },
      ]);
      return;
    }

    if (newBoard.every(cell => cell !== null)) {
      Alert.alert('🤝 Draw!', '', [{ text: 'Play Again', onPress: resetGame }]);
      return;
    }

    setIsXNext(!isXNext);
  };

  const resetGame = () => {
    setBoard(Array(9).fill(null));
    setIsXNext(true);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backBtn}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Tic Tac Toe</Text>
        <View style={{ width: 50 }} />
      </View>

      <View style={styles.scores}>
        <View style={styles.scoreItem}>
          <Text style={styles.label}>X</Text>
          <Text style={[styles.score, { color: COLORS.player1 }]}>{scores.X}</Text>
        </View>
        <View style={styles.scoreItem}>
          <Text style={styles.label}>O</Text>
          <Text style={[styles.score, { color: COLORS.player2 }]}>{scores.O}</Text>
        </View>
      </View>

      <Text style={styles.turn}>
        {winner ? `🎉 ${winner} Wins!` : `Turn: ${isXNext ? 'X ❌' : 'O ⭕'}`}
      </Text>

      <View style={styles.board}>
        {[0, 1, 2, 3, 4, 5, 6, 7, 8].map(i => (
          <TouchableOpacity
            key={i}
            style={styles.cell}
            onPress={() => handlePress(i)}
          >
            <Text style={styles.cellText}>{board[i]}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.newGameBtn} onPress={resetGame}>
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
  scores: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: SPACING.lg,
    backgroundColor: COLORS.cardBg,
  },
  scoreItem: { alignItems: 'center' },
  label: { fontSize: 14, color: COLORS.textLight },
  score: { fontSize: 32, fontWeight: 'bold' },
  turn: { textAlign: 'center', fontSize: 18, fontWeight: 'bold', marginVertical: SPACING.lg, color: COLORS.text },
  board: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: 320,
    alignSelf: 'center',
    backgroundColor: COLORS.cardBg,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
  },
  cell: {
    width: '33.33%',
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  cellText: { fontSize: 48, fontWeight: 'bold', color: COLORS.primary },
  newGameBtn: {
    backgroundColor: COLORS.accent,
    marginHorizontal: SPACING.lg,
    marginVertical: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
  },
  newGameText: { fontSize: 18, fontWeight: 'bold', color: '#FFF', textAlign: 'center' },
});