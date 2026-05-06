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
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { COLORS, SPACING, BORDER_RADIUS } from '../styles/theme';

const { width, height } = Dimensions.get('window');

const MOVES = ['🕺', '💃', '🪩', '✨', '🎵'];
const MOVE_NAMES = ['Spin', 'Wiggle', 'Flip', 'Sparkle', 'Groove'];
const MOVE_DESCRIPTIONS = [
  'Spin around like a disco ball',
  'Wiggle those hips',
  'Flip your moves',
  'Sparkle and shine',
  'Groove to the beat',
];

export default function DiscoBattleGame({ navigation, route }) {
  const { mode = 'pvp' } = route.params || {};

  // Game State
  const [scores, setScores] = useState({ player1: 0, player2: 0 });
  const [round, setRound] = useState(1);
  const [gameState, setGameState] = useState('waiting');
  const [p1Move, setP1Move] = useState(null);
  const [p2Move, setP2Move] = useState(null);
  const [roundResult, setRoundResult] = useState('');
  const [combo, setCombo] = useState(0);
  const [totalGames, setTotalGames] = useState(0);

  // Animations
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const spinAnim = useRef(new Animated.Value(0)).current;

  // Beat patterns - Rock Paper Scissors style with 5 moves
  const beatPatterns = {
    0: { beats: [1, 3], name: 'Spin', beats_desc: 'Wiggle & Sparkle' },      // Spin beats Wiggle & Sparkle
    1: { beats: [2, 4], name: 'Wiggle', beats_desc: 'Flip & Groove' },        // Wiggle beats Flip & Groove
    2: { beats: [3, 0], name: 'Flip', beats_desc: 'Sparkle & Spin' },         // Flip beats Sparkle & Spin
    3: { beats: [4, 1], name: 'Sparkle', beats_desc: 'Groove & Wiggle' },     // Sparkle beats Groove & Wiggle
    4: { beats: [0, 2], name: 'Groove', beats_desc: 'Spin & Flip' },          // Groove beats Spin & Flip
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

  const playHapticFeedback = (type = 'impact') => {
    if (type === 'success') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else if (type === 'warning') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  };

  const animateMoveSelection = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1.1,
        duration: 100,
        useNativeDriver: false,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: false,
      }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(spinAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: false,
        }),
        Animated.timing(spinAnim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: false,
        }),
      ])
    ).start();
  };

  const handleP1MoveSelect = (moveIndex) => {
    playHapticFeedback('impact');
    setP1Move(moveIndex);
    setGameState('p2_choosing');
    animateMoveSelection();
  };

  const handleP2MoveSelect = (moveIndex) => {
    playHapticFeedback('success');
    setP2Move(moveIndex);

    // Determine winner
    const winner = determineWinner(p1Move, moveIndex);

    let result = '';
    let newP1Score = scores.player1;
    let newP2Score = scores.player2;
    let newCombo = combo;

    if (winner === 'tie') {
      result = 'It\'s a TIE! 🤝';
      newCombo = 0;
    } else if (winner === 'player1') {
      result = 'Player 1 WINS! 🎉';
      newP1Score = scores.player1 + 1;
      newCombo = combo + 1;
    } else {
      result = 'Player 2 WINS! 🎉';
      newP2Score = scores.player2 + 1;
      newCombo = combo + 1;
    }

    setRoundResult(result);
    setScores({ player1: newP1Score, player2: newP2Score });
    setCombo(newCombo);
    setGameState('results');

    // Check if game is over (First to 5)
    const timeout1 = setTimeout(() => {
      if (newP1Score >= 5 || newP2Score >= 5) {
        const finalWinner = newP1Score >= 5 ? 'Player 1' : 'Player 2';
        const totalWins = newP1Score + newP2Score;
        
        Alert.alert(
          '🕺 DISCO KING CROWNED! 👑',
          `${finalWinner} is the ultimate dancer!\n\nTotal Rounds: ${totalWins}`,
          [
            { text: 'Play Again', onPress: resetGame },
            { text: 'Back to Menu', onPress: () => navigation.goBack() },
          ]
        );
        setGameState('game_over');
      } else {
        // Next round
        const timeout2 = setTimeout(() => {
          setRound(round + 1);
          setP1Move(null);
          setP2Move(null);
          setRoundResult('');
          setGameState('waiting');
          setTotalGames(totalGames + 1);
        }, 2000);

        return () => clearTimeout(timeout2);
      }
    }, 1500);

    return () => clearTimeout(timeout1);
  };

  const resetGame = () => {
    setScores({ player1: 0, player2: 0 });
    setRound(1);
    setGameState('waiting');
    setP1Move(null);
    setP2Move(null);
    setRoundResult('');
    setCombo(0);
    setTotalGames(0);
  };

  const goBack = () => {
    if (gameState !== 'waiting' && gameState !== 'game_over') {
      Alert.alert(
        'Leave Game?',
        'Are you sure you want to leave? Progress will be lost.',
        [
          { text: 'Cancel', onPress: () => {} },
          { text: 'Leave', onPress: () => navigation.goBack() },
        ]
      );
    } else {
      navigation.goBack();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={[COLORS.primary, COLORS.secondary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <TouchableOpacity onPress={goBack} style={styles.backButton}>
          <Text style={styles.backBtn}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>🕺 Disco Battle 💃</Text>
        <View style={{ width: 50 }} />
      </LinearGradient>

      {/* Scores */}
      <LinearGradient
        colors={['#FF6EC7', '#FF85B2']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.scores}
      >
        <View style={styles.scoreItem}>
          <Text style={styles.label}>Player 1</Text>
          <Text style={[styles.score, { color: COLORS.player1 }]}>
            {scores.player1}
          </Text>
        </View>
        <View style={styles.comboBox}>
          <Text style={styles.label}>Round</Text>
          <Text style={[styles.combo, { color: '#FFD700' }]}>
            {round}/5
          </Text>
        </View>
        <View style={styles.scoreItem}>
          <Text style={styles.label}>Player 2</Text>
          <Text style={[styles.score, { color: COLORS.player2 }]}>
            {scores.player2}
          </Text>
        </View>
      </LinearGradient>

      {/* Music/Disco Background */}
      <LinearGradient
        colors={['#FF6EC7', '#FF85B2', '#FF9FCC']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.discoZone}
      >
        <Text style={styles.disco}>🎵 ♪ ♫ ♪ ♫ ♪ 🎵</Text>
      </LinearGradient>

      {/* Main Content */}
      <ScrollView style={styles.contentContainer} showsVerticalScrollIndicator={false}>
        {/* Game Messages */}
        {gameState === 'waiting' && (
          <View style={styles.messageBox}>
            <Text style={styles.message}>🎉 Let the dance battle begin!</Text>
            <Text style={styles.subMessage}>Player 1: Choose your move!</Text>
          </View>
        )}

        {gameState === 'p2_choosing' && (
          <View style={styles.messageBox}>
            <Animated.Text
              style={[
                styles.selectedMoveDisplay,
                {
                  transform: [
                    {
                      rotate: spinAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0deg', '360deg'],
                      }),
                    },
                  ],
                },
              ]}
            >
              {MOVES[p1Move]}
            </Animated.Text>
            <Text style={styles.message}>{MOVE_NAMES[p1Move]}</Text>
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
            <Text style={styles.selectText}>🕺 Player 1 - Select Move:</Text>
            <View style={styles.moveButtons}>
              {MOVES.map((move, index) => (
                <Animated.View
                  key={index}
                  style={{
                    transform: [
                      {
                        scale:
                          p1Move === index
                            ? scaleAnim
                            : new Animated.Value(1),
                      },
                    ],
                  }}
                >
                  <TouchableOpacity
                    style={[
                      styles.moveBtn,
                      p1Move === index && styles.selectedMoveBtn,
                    ]}
                    onPress={() => handleP1MoveSelect(index)}
                  >
                    <Text style={styles.moveBtnEmoji}>{move}</Text>
                    <Text style={styles.moveBtnName}>{MOVE_NAMES[index]}</Text>
                    <Text style={styles.moveBtnDesc} numberOfLines={1}>
                      {MOVE_DESCRIPTIONS[index]}
                    </Text>
                  </TouchableOpacity>
                </Animated.View>
              ))}
            </View>
          </View>
        )}

        {/* Move Selection - Player 2 */}
        {gameState === 'p2_choosing' && (
          <View style={styles.movesContainer}>
            <Text style={styles.selectText}>💃 Player 2 - Select Move:</Text>
            <View style={styles.moveButtons}>
              {MOVES.map((move, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.moveBtn}
                  onPress={() => handleP2MoveSelect(index)}
                >
                  <Text style={styles.moveBtnEmoji}>{move}</Text>
                  <Text style={styles.moveBtnName}>{MOVE_NAMES[index]}</Text>
                  <Text style={styles.moveBtnDesc} numberOfLines={1}>
                    {MOVE_DESCRIPTIONS[index]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* How It Works - Beat System */}
        {gameState === 'waiting' && (
          <View style={styles.rulesBox}>
            <Text style={styles.rulesTitle}>🎵 Beat System:</Text>
            <View style={styles.ruleItem}>
              <Text style={styles.ruleMove}>🕺 Spin</Text>
              <Text style={styles.ruleBeats}>beats</Text>
              <Text style={styles.ruleLoses}>Wiggle & Sparkle</Text>
            </View>
            <View style={styles.ruleItem}>
              <Text style={styles.ruleMove}>💃 Wiggle</Text>
              <Text style={styles.ruleBeats}>beats</Text>
              <Text style={styles.ruleLoses}>Flip & Groove</Text>
            </View>
            <View style={styles.ruleItem}>
              <Text style={styles.ruleMove}>🪩 Flip</Text>
              <Text style={styles.ruleBeats}>beats</Text>
              <Text style={styles.ruleLoses}>Sparkle & Spin</Text>
            </View>
            <View style={styles.ruleItem}>
              <Text style={styles.ruleMove}>✨ Sparkle</Text>
              <Text style={styles.ruleBeats}>beats</Text>
              <Text style={styles.ruleLoses}>Groove & Wiggle</Text>
            </View>
            <View style={styles.ruleItem}>
              <Text style={styles.ruleMove}>🎵 Groove</Text>
              <Text style={styles.ruleBeats}>beats</Text>
              <Text style={styles.ruleLoses}>Spin & Flip</Text>
            </View>
          </View>
        )}

        {/* Game Over Stats */}
        {gameState === 'game_over' && (
          <View style={styles.statsContainer}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Total Rounds</Text>
              <Text style={styles.statValue}>{totalGames + 1}</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Best Combo</Text>
              <Text style={styles.statValue}>{combo} 🔥</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Winner</Text>
              <Text style={[
                styles.statValue,
                { color: scores.player1 > scores.player2 ? COLORS.player1 : COLORS.player2 }
              ]}>
                {scores.player1 > scores.player2 ? 'P1' : 'P2'}
              </Text>
            </View>
          </View>
        )}

        {/* New Game Button */}
        {gameState === 'game_over' && (
          <View style={styles.gameOverButtons}>
            <TouchableOpacity
              style={[styles.actionBtn, styles.playAgainBtn]}
              onPress={resetGame}
            >
              <Text style={styles.actionBtnText}>🕺 New Dance Battle 💃</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionBtn, styles.menuBtn]}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.actionBtnText}>← Back to Menu</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Results Next Round Button */}
      {gameState === 'results' && (
        <TouchableOpacity
          style={styles.nextRoundBtn}
          onPress={() => {
            setP1Move(null);
            setP2Move(null);
            setRoundResult('');
            setGameState('waiting');
            setRound(round + 1);
            setTotalGames(totalGames + 1);
          }}
        >
          <Text style={styles.nextRoundText}>Continue to Next Round →</Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  backButton: {
    padding: SPACING.sm,
  },
  backBtn: {
    fontSize: 18,
    color: '#FFF',
    fontWeight: 'bold',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
  },
  scores: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.md,
  },
  scoreItem: {
    alignItems: 'center',
    minWidth: 70,
  },
  comboBox: {
    alignItems: 'center',
    minWidth: 70,
  },
  label: {
    fontSize: 12,
    color: '#FFF',
    marginBottom: SPACING.xs,
  },
  score: {
    fontSize: 36,
    fontWeight: 'bold',
  },
  combo: {
    fontSize: 28,
    fontWeight: 'bold',
  },
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
  contentContainer: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
  },
  messageBox: {
    alignItems: 'center',
    paddingVertical: SPACING.lg,
    marginTop: SPACING.md,
  },
  message: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  subMessage: {
    fontSize: 16,
    color: '#FFB6D9',
    textAlign: 'center',
  },
  selectedMoveDisplay: {
    fontSize: 72,
    marginBottom: SPACING.md,
  },
  resultBox: {
    alignItems: 'center',
    paddingVertical: SPACING.lg,
    marginTop: SPACING.md,
    backgroundColor: 'rgba(255, 110, 199, 0.2)',
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 2,
    borderColor: '#FF6EC7',
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
    paddingHorizontal: SPACING.md,
  },
  moveDisplay: {
    alignItems: 'center',
    flex: 1,
  },
  moveEmoji: {
    fontSize: 64,
    marginBottom: SPACING.sm,
  },
  moveName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: SPACING.xs,
  },
  vs: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFD700',
    marginHorizontal: SPACING.lg,
  },
  movesContainer: {
    marginVertical: SPACING.lg,
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
    justifyContent: 'space-between',
    marginBottom: SPACING.lg,
  },
  moveBtn: {
    width: '31%',
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    marginVertical: SPACING.sm,
    borderWidth: 3,
    borderColor: '#FFD700',
  },
  selectedMoveBtn: {
    backgroundColor: COLORS.secondary,
    borderColor: '#FFF',
    borderWidth: 4,
  },
  moveBtnEmoji: {
    fontSize: 40,
    marginBottom: SPACING.xs,
  },
  moveBtnName: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFF',
    textAlign: 'center',
  },
  moveBtnDesc: {
    fontSize: 10,
    color: '#FFB6D9',
    textAlign: 'center',
    marginTop: SPACING.xs,
  },
  rulesBox: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.lg,
    borderWidth: 2,
    borderColor: '#FF6EC7',
  },
  rulesTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  ruleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  ruleMove: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFF',
    minWidth: 100,
  },
  ruleBeats: {
    fontSize: 12,
    color: '#FFD700',
    fontWeight: 'bold',
    marginHorizontal: SPACING.sm,
  },
  ruleLoses: {
    fontSize: 12,
    color: '#FFB6D9',
    flex: 1,
    textAlign: 'right',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: SPACING.lg,
    paddingHorizontal: SPACING.md,
  },
  statBox: {
    backgroundColor: 'rgba(255, 110, 199, 0.2)',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    minWidth: 90,
    borderWidth: 1,
    borderColor: '#FF6EC7',
  },
  statLabel: {
    fontSize: 12,
    color: '#FFB6D9',
    marginBottom: SPACING.xs,
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFD700',
  },
  gameOverButtons: {
    marginVertical: SPACING.lg,
  },
  actionBtn: {
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playAgainBtn: {
    backgroundColor: '#00B894',
  },
  menuBtn: {
    backgroundColor: COLORS.primary,
  },
  actionBtnText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
  },
  nextRoundBtn: {
    backgroundColor: COLORS.secondary,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    margin: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
  },
  nextRoundText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
  },
  backButton: {
    padding: SPACING.sm,
  },
});