import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  SafeAreaView,
  Dimensions,
  Animated,
} from 'react-native';
import { COLORS, SPACING, BORDER_RADIUS } from '../styles/theme';

const { width, height } = Dimensions.get('window');

const MOVES = ['🕺', '💃', '🪩', '✨', '🎵'];
const MOVE_NAMES = ['Spin', 'Wiggle', 'Flip', 'Sparkle', 'Groove'];

export default function DiscoBattleGame({ navigation }) {
  const [scores, setScores] = useState({ player1: 0, player2: 0 });
  const [currentPlayer, setCurrentPlayer] = useState(1);
  const [round, setRound] = useState(1);
  const [gameState, setGameState] = useState('waiting'); // waiting, p1_choosing, p2_choosing, results, game_over
  const [p1Move, setP1Move] = useState(null);
  const [p2Move, setP2Move] = useState(null);
  const [roundResult, setRoundResult] = useState('');
  const [combo, setCombo] = useState(0);

  // Beat patterns for determining winner
  const beatPatterns = {
    0: { beats: [1, 3], beatenBy: [2, 4] }, // Spin
    1: { beats: [2, 4], beatenBy: [0, 3] }, // Wiggle
    2: { beats: [3, 0], beatenBy: [1, 4] }, // Flip
    3: { beats: [4, 1], beatenBy: [2, 0] }, // Sparkle
    4: { beats: [0, 2], beatenBy: [3, 1] }, // Groove
  };

  const determineWinner = (move1, move2) => {
    if (move1 === move2) {
      return 'tie';
    }
    if (beatPatterns[move1].beats.includes(move2)) {
      return 'player1';
    }
    return 'player2';
  };

  const handleP1MoveSelect = (moveIndex) => {
    setP1Move(moveIndex);
    setGameState('p2_choosing');
  };

  const handleP2MoveSelect = (moveIndex) => {
    setP2Move(moveIndex);

    // Determine winner
    const winner = determineWinner(p1Move, moveIndex);

    let result = '';
    if (winner === 'tie') {
      result = 'Tie! 🤝';
      setCombo(0);
    } else if (winner === 'player1') {
      result = 'Player 1 Wins! 🎉';
      setScores(prev => ({ ...prev, player1: prev.player1 + 1 }));
      setCombo(combo + 1);
    } else {
      result = 'Player 2 Wins! 🎉';
      setScores(prev => ({ ...prev, player2: prev.player2 + 1 }));
      setCombo(combo + 1);
    }

    setRoundResult(result);
    setGameState('results');

    // Check if game is over (First to 5)
    setTimeout(() => {
      const p1Total = winner === 'player1' ? scores.player1 + 1 : scores.player1;
      const p2Total = winner === 'player2' ? scores.player2 + 1 : scores.player2;

      if (p1Total >= 5 || p2Total >= 5) {
        const finalWinner = p1Total >= 5 ? 'Player 1' : 'Player 2';
        Alert.alert('🕺 Dance Battle Over!', `${finalWinner} is the Disco King! 👑`, [
          { text: 'Play Again', onPress: resetGame },
        ]);
        setGameState('game_over');
      } else {
        // Next round
        setTimeout(() => {
          setRound(round + 1);
          setP1Move(null);
          setP2Move(null);
          setRoundResult('');
          setGameState('waiting');
        }, 2000);
      }
    }, 1500);
  };

  const resetGame = () => {
    setScores({ player1: 0, player2: 0 });
    setRound(1);
    setGameState('waiting');
    setP1Move(null);
    setP2Move(null);
    setRoundResult('');
    setCombo(0);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backBtn}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>🕺 Disco Battle 💃</Text>
        <View style={{ width: 50 }} />
      </View>

      {/* Scores */}
      <View style={styles.scores}>
        <View style={styles.scoreItem}>
          <Text style={styles.label}>Player 1</Text>
          <Text style={[styles.score, { color: COLORS.player1 }]}>
            {scores.player1}
          </Text>
        </View>
        <View style={styles.comboBox}>
          <Text style={styles.label}>Round</Text>
          <Text style={[styles.combo, { color: COLORS.primary }]}>
            {round}/5
          </Text>
        </View>
        <View style={styles.scoreItem}>
          <Text style={styles.label}>Player 2</Text>
          <Text style={[styles.score, { color: COLORS.player2 }]}>
            {scores.player2}
          </Text>
        </View>
      </View>

      {/* Music/Disco Background */}
      <View style={styles.discoZone}>
        <Text style={styles.disco}>🎵 ♪ ♫ ♪ ♫ ♪ 🎵</Text>
      </View>

      {/* Game Messages */}
      {gameState === 'waiting' && (
        <View style={styles.messageBox}>
          <Text style={styles.message}>Let the dance battle begin!</Text>
          <Text style={styles.subMessage}>Player 1: Choose your move!</Text>
        </View>
      )}

      {gameState === 'p2_choosing' && (
        <View style={styles.messageBox}>
          <Text style={styles.message}>🕺 {MOVE_NAMES[p1Move]}</Text>
          <Text style={styles.subMessage}>Player 2: Choose your move!</Text>
        </View>
      )}

      {gameState === 'results' && (
        <View style={styles.resultBox}>
          <Text style={styles.resultTitle}>{roundResult}</Text>
          <View style={styles.movesDisplay}>
            <View style={styles.moveDisplay}>
              <Text style={styles.moveEmoji}>{MOVES[p1Move]}</Text>
              <Text style={styles.moveName}>{MOVE_NAMES[p1Move]}</Text>
              <Text style={styles.label}>P1</Text>
            </View>
            <Text style={styles.vs}>VS</Text>
            <View style={styles.moveDisplay}>
              <Text style={styles.moveEmoji}>{MOVES[p2Move]}</Text>
              <Text style={styles.moveName}>{MOVE_NAMES[p2Move]}</Text>
              <Text style={styles.label}>P2</Text>
            </View>
          </View>
        </View>
      )}

      {/* Move Selection - Player 1 */}
      {gameState === 'waiting' && (
        <View style={styles.movesContainer}>
          <Text style={styles.selectText}>Player 1 - Select Move:</Text>
          <View style={styles.moveButtons}>
            {MOVES.map((move, index) => (
              <TouchableOpacity
                key={index}
                style={styles.moveBtn}
                onPress={() => handleP1MoveSelect(index)}
              >
                <Text style={styles.moveBtnEmoji}>{move}</Text>
                <Text style={styles.moveBtnName}>{MOVE_NAMES[index]}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Move Selection - Player 2 */}
      {gameState === 'p2_choosing' && (
        <View style={styles.movesContainer}>
          <Text style={styles.selectText}>Player 2 - Select Move:</Text>
          <View style={styles.moveButtons}>
            {MOVES.map((move, index) => (
              <TouchableOpacity
                key={index}
                style={styles.moveBtn}
                onPress={() => handleP2MoveSelect(index)}
              >
                <Text style={styles.moveBtnEmoji}>{move}</Text>
                <Text style={styles.moveBtnName}>{MOVE_NAMES[index]}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* How It Works */}
      {gameState === 'waiting' && (
        <View style={styles.rulesBox}>
          <Text style={styles.rulesTitle}>Beat System:</Text>
          <Text style={styles.rulesText}>🕺 Spin > Wiggle & Sparkle</Text>
          <Text style={styles.rulesText}>💃 Wiggle > Flip & Groove</Text>
          <Text style={styles.rulesText}>🪩 Flip > Sparkle & Spin</Text>
          <Text style={styles.rulesText}>✨ Sparkle > Groove & Wiggle</Text>
          <Text style={styles.rulesText}>🎵 Groove > Spin & Flip</Text>
        </View>
      )}

      {/* New Game Button */}
      {gameState === 'game_over' && (
        <TouchableOpacity style={styles.newGameBtn} onPress={resetGame}>
          <Text style={styles.newGameText}>🕺 New Dance Battle 💃</Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e' },
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
    backgroundColor: COLORS.secondary,
  },
  scoreItem: { alignItems: 'center' },
  comboBox: { alignItems: 'center' },
  label: { fontSize: 12, color: '#FFF' },
  score: { fontSize: 36, fontWeight: 'bold' },
  combo: { fontSize: 28, fontWeight: 'bold' },
  discoZone: {
    paddingVertical: SPACING.lg,
    alignItems: 'center',
    backgroundColor: '#FF6EC7',
  },
  disco: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    letterSpacing: 2,
  },
  messageBox: {
    alignItems: 'center',
    paddingVertical: SPACING.lg,
    backgroundColor: 'rgba(255, 110, 199, 0.3)',
  },
  message: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: SPACING.sm,
  },
  subMessage: {
    fontSize: 16,
    color: '#FFF',
  },
  resultBox: {
    alignItems: 'center',
    paddingVertical: SPACING.lg,
    backgroundColor: 'rgba(255, 110, 199, 0.3)',
  },
  resultTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: SPACING.md,
  },
  movesDisplay: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    width: '100%',
  },
  moveDisplay: {
    alignItems: 'center',
  },
  moveEmoji: { fontSize: 64, marginBottom: SPACING.sm },
  moveName: { fontSize: 16, fontWeight: 'bold', color: '#FFF', marginBottom: SPACING.xs },
  vs: { fontSize: 20, fontWeight: 'bold', color: '#FFD700', marginHorizontal: SPACING.lg },
  movesContainer: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
  },
  selectText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  moveButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    marginBottom: SPACING.lg,
  },
  moveBtn: {
    width: '30%',
    aspectRatio: 1,
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: SPACING.sm,
    borderWidth: 3,
    borderColor: '#FFD700',
  },
  moveBtnEmoji: { fontSize: 48, marginBottom: SPACING.sm },
  moveBtnName: { fontSize: 12, fontWeight: 'bold', color: '#FFF', textAlign: 'center' },
  rulesBox: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    marginHorizontal: SPACING.lg,
  },
  rulesTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: SPACING.sm,
  },
  rulesText: {
    fontSize: 13,
    color: '#FFF',
    marginBottom: SPACING.xs,
  },
  newGameBtn: {
    backgroundColor: COLORS.success,
    marginHorizontal: SPACING.lg,
    marginVertical: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
  },
  newGameText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
    textAlign: 'center',
  },
});