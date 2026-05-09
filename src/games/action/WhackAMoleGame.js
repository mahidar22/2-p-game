import React, { useState, useEffect, useRef } from 'react';
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
import { COLORS, SPACING, BORDER_RADIUS } from '../../styles/theme';

const { width, height } = Dimensions.get('window');

const GRID_SIZE = 9; // 3x3 grid
const MOLE_TYPES = [
  { type: 'normal', emoji: '🐭', points: 10, speed: 1500, label: 'Normal' },
  { type: 'bonus', emoji: '🐹', points: 30, speed: 1000, label: 'Bonus' },
  { type: 'special', emoji: '⭐', points: 50, speed: 700, label: 'Special' },
  { type: 'bomb', emoji: '💣', points: -20, speed: 1200, label: 'Bomb' },
  { type: 'golden', emoji: '👑', points: 100, speed: 600, label: 'Golden' },
];

export default function WhackAMoleGame({ navigation }) {
  const [scores, setScores] = useState({ player1: 0, player2: 0 });
  const [round, setRound] = useState(1);
  const [gameActive, setGameActive] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameTime, setGameTime] = useState(60);
  const [currentPlayer, setCurrentPlayer] = useState(1);

  // Mole holes grid
  const [holes, setHoles] = useState(
    Array.from({ length: GRID_SIZE }, (_, i) => ({
      id: i,
      hasMole: false,
      moleType: null,
      emoji: '',
      points: 0,
      isWhacked: false,
    }))
  );

  // Game stats
  const [whackCount, setWhackCount] = useState(0);
  const [missCount, setMissCount] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [lastWhackTime, setLastWhackTime] = useState(null);
  const [totalMolesWhacked, setTotalMolesWhacked] = useState(0);

  // Accuracy tracker
  const [accuracyStats, setAccuracyStats] = useState({
    player1: { hits: 0, misses: 0, combo: 0 },
    player2: { hits: 0, misses: 0, combo: 0 },
  });

  // Difficulty
  const [difficulty, setDifficulty] = useState('medium');
  const difficultySettings = {
    easy: { moleInterval: 1800, maxMoles: 2, timeLimit: 90 },
    medium: { moleInterval: 1200, maxMoles: 3, timeLimit: 60 },
    hard: { moleInterval: 800, maxMoles: 4, timeLimit: 45 },
  };

  // Animations
  const moleAnims = useRef(
    Array.from({ length: GRID_SIZE }, () => new Animated.Value(0))
  ).current;
  const comboAnim = useRef(new Animated.Value(1)).current;
  const hammerAnim = useRef(new Animated.Value(0)).current;
  const scorePopAnim = useRef(new Animated.Value(0)).current;
  const timerAnim = useRef(new Animated.Value(1)).current;

  const moleTimers = useRef([]);
  const gameTimerRef = useRef(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearAllTimers();
    };
  }, []);

  const clearAllTimers = () => {
    moleTimers.current.forEach((t) => clearTimeout(t));
    moleTimers.current = [];
    if (gameTimerRef.current) clearInterval(gameTimerRef.current);
  };

  // Game Timer
  useEffect(() => {
    if (!gameActive) return;

    gameTimerRef.current = setInterval(() => {
      setGameTime((prev) => {
        if (prev <= 1) {
          endTurn();
          return 0;
        }
        // Flash timer when low
        if (prev <= 10) {
          Animated.sequence([
            Animated.timing(timerAnim, {
              toValue: 1.3,
              duration: 200,
              useNativeDriver: false,
            }),
            Animated.timing(timerAnim, {
              toValue: 1,
              duration: 200,
              useNativeDriver: false,
            }),
          ]).start();
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (gameTimerRef.current) clearInterval(gameTimerRef.current);
    };
  }, [gameActive]);

  // Mole spawning
  useEffect(() => {
    if (!gameActive) return;

    const settings = difficultySettings[difficulty];

    const spawnMole = () => {
      setHoles((prevHoles) => {
        const activeMoles = prevHoles.filter((h) => h.hasMole).length;
        if (activeMoles >= settings.maxMoles) return prevHoles;

        // Find empty holes
        const emptyHoles = prevHoles
          .map((h, i) => ({ ...h, index: i }))
          .filter((h) => !h.hasMole && !h.isWhacked);

        if (emptyHoles.length === 0) return prevHoles;

        // Pick random empty hole
        const randomHole =
          emptyHoles[Math.floor(Math.random() * emptyHoles.length)];

        // Pick random mole type with weighted probability
        const rand = Math.random();
        let moleType;
        if (rand < 0.05) moleType = MOLE_TYPES[4]; // golden 5%
        else if (rand < 0.15) moleType = MOLE_TYPES[3]; // bomb 10%
        else if (rand < 0.30) moleType = MOLE_TYPES[2]; // special 15%
        else if (rand < 0.50) moleType = MOLE_TYPES[1]; // bonus 20%
        else moleType = MOLE_TYPES[0]; // normal 50%

        // Animate mole popping up
        moleAnims[randomHole.index].setValue(0);
        Animated.spring(moleAnims[randomHole.index], {
          toValue: 1,
          friction: 4,
          tension: 100,
          useNativeDriver: false,
        }).start();

        // Auto-hide mole after speed duration
        const hideTimer = setTimeout(() => {
          setHoles((prev) =>
            prev.map((h) =>
              h.id === randomHole.id
                ? { ...h, hasMole: false, moleType: null, emoji: '', points: 0 }
                : h
            )
          );
          Animated.timing(moleAnims[randomHole.index], {
            toValue: 0,
            duration: 200,
            useNativeDriver: false,
          }).start();
        }, moleType.speed);

        moleTimers.current.push(hideTimer);

        return prevHoles.map((h) =>
          h.id === randomHole.id
            ? {
                ...h,
                hasMole: true,
                moleType: moleType.type,
                emoji: moleType.emoji,
                points: moleType.points,
                isWhacked: false,
              }
            : h
        );
      });
    };

    const spawnInterval = setInterval(spawnMole, settings.moleInterval);
    return () => clearInterval(spawnInterval);
  }, [gameActive, difficulty]);

  // Combo reset
  useEffect(() => {
    if (!lastWhackTime) return;
    const comboTimer = setTimeout(() => {
      setCombo(0);
    }, 2000);
    return () => clearTimeout(comboTimer);
  }, [lastWhackTime]);

  // Animate combo text
  const animateCombo = () => {
    comboAnim.setValue(0.5);
    Animated.spring(comboAnim, {
      toValue: 1,
      friction: 3,
      tension: 200,
      useNativeDriver: false,
    }).start();
  };

  // Animate hammer
  const animateHammer = () => {
    Animated.sequence([
      Animated.timing(hammerAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: false,
      }),
      Animated.timing(hammerAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: false,
      }),
    ]).start();
  };

  // Start game
  const startGame = () => {
    const settings = difficultySettings[difficulty];
    setGameTime(settings.timeLimit);
    setGameActive(true);
    setGameStarted(true);
    setWhackCount(0);
    setMissCount(0);
    setCombo(0);
    setMaxCombo(0);
    setHoles(
      Array.from({ length: GRID_SIZE }, (_, i) => ({
        id: i,
        hasMole: false,
        moleType: null,
        emoji: '',
        points: 0,
        isWhacked: false,
      }))
    );
  };

  // Whack a mole
  const handleWhack = (hole) => {
    if (!gameActive) return;

    animateHammer();

    if (!hole.hasMole || hole.isWhacked) {
      // Miss
      setMissCount((prev) => prev + 1);
      setCombo(0);

      const playerKey = currentPlayer === 1 ? 'player1' : 'player2';
      setAccuracyStats((prev) => ({
        ...prev,
        [playerKey]: {
          ...prev[playerKey],
          misses: prev[playerKey].misses + 1,
        },
      }));
      return;
    }

    // Hit!
    const now = Date.now();
    const newCombo =
      lastWhackTime && now - lastWhackTime < 2000 ? combo + 1 : 1;
    setCombo(newCombo);
    setLastWhackTime(now);
    if (newCombo > maxCombo) setMaxCombo(newCombo);
    animateCombo();

    // Calculate points
    const comboBonus = (newCombo - 1) * 5;
    const basePoints = hole.points;
    const totalPoints =
      basePoints > 0 ? basePoints + comboBonus : basePoints;

    // Mark as whacked
    setHoles((prev) =>
      prev.map((h) =>
        h.id === hole.id ? { ...h, isWhacked: true, hasMole: false } : h
      )
    );

    // Animate mole going down
    Animated.timing(moleAnims[hole.id], {
      toValue: 0,
      duration: 150,
      useNativeDriver: false,
    }).start(() => {
      setHoles((prev) =>
        prev.map((h) =>
          h.id === hole.id
            ? {
                ...h,
                isWhacked: false,
                moleType: null,
                emoji: '',
                points: 0,
              }
            : h
        )
      );
    });

    // Update score
    const playerKey = currentPlayer === 1 ? 'player1' : 'player2';
    setScores((prev) => ({
      ...prev,
      [playerKey]: Math.max(0, prev[playerKey] + totalPoints),
    }));

    setWhackCount((prev) => prev + 1);
    setTotalMolesWhacked((prev) => prev + 1);

    setAccuracyStats((prev) => ({
      ...prev,
      [playerKey]: {
        ...prev[playerKey],
        hits: prev[playerKey].hits + 1,
        combo: Math.max(prev[playerKey].combo, newCombo),
      },
    }));
  };

  const endTurn = () => {
    clearAllTimers();
    setGameActive(false);

    // Hide all moles
    setHoles(
      Array.from({ length: GRID_SIZE }, (_, i) => ({
        id: i,
        hasMole: false,
        moleType: null,
        emoji: '',
        points: 0,
        isWhacked: false,
      }))
    );

    if (currentPlayer === 1) {
      Alert.alert(
        '⏱️ Turn Over!',
        `Player 1 scored: ${scores.player1}\nMax Combo: x${maxCombo}\nMoles Whacked: ${whackCount}`,
        [{ text: "Player 2's Turn!", onPress: switchPlayer }]
      );
    } else {
      endRound();
    }
  };

  const switchPlayer = () => {
    setCurrentPlayer(2);
    setWhackCount(0);
    setMissCount(0);
    setCombo(0);
    setMaxCombo(0);
    setHoles(
      Array.from({ length: GRID_SIZE }, (_, i) => ({
        id: i,
        hasMole: false,
        moleType: null,
        emoji: '',
        points: 0,
        isWhacked: false,
      }))
    );

    const settings = difficultySettings[difficulty];
    setGameTime(settings.timeLimit);

    setTimeout(() => {
      setGameActive(true);
    }, 500);
  };

  const endRound = () => {
    setGameActive(false);

    let winner = '';
    let bonusMsg = '';

    if (scores.player1 > scores.player2) {
      winner = '🏆 Player 1 Wins!';
      setScores((prev) => ({ ...prev, player1: prev.player1 + 150 }));
      bonusMsg = 'Player 1 gets +150 bonus!';
    } else if (scores.player2 > scores.player1) {
      winner = '🏆 Player 2 Wins!';
      setScores((prev) => ({ ...prev, player2: prev.player2 + 150 }));
      bonusMsg = 'Player 2 gets +150 bonus!';
    } else {
      winner = '🤝 It\'s a Draw!';
      bonusMsg = 'Both get +75 bonus!';
      setScores((prev) => ({
        player1: prev.player1 + 75,
        player2: prev.player2 + 75,
      }));
    }

    Alert.alert(
      `Round ${round} Complete!`,
      `${winner}\n${bonusMsg}\n\nP1: ${scores.player1} | P2: ${scores.player2}`,
      [
        { text: '🔄 Next Round', onPress: nextRound },
        { text: '🚪 End Game', onPress: () => navigation.goBack() },
      ]
    );
  };

  const nextRound = () => {
    setRound((prev) => prev + 1);
    setCurrentPlayer(1);
    setGameStarted(false);
    setGameActive(false);
    setWhackCount(0);
    setMissCount(0);
    setCombo(0);
    setMaxCombo(0);
    setTotalMolesWhacked(0);
    setAccuracyStats({
      player1: { hits: 0, misses: 0, combo: 0 },
      player2: { hits: 0, misses: 0, combo: 0 },
    });
    const settings = difficultySettings[difficulty];
    setGameTime(settings.timeLimit);
    setHoles(
      Array.from({ length: GRID_SIZE }, (_, i) => ({
        id: i,
        hasMole: false,
        moleType: null,
        emoji: '',
        points: 0,
        isWhacked: false,
      }))
    );
  };

  const currentStats =
    currentPlayer === 1 ? accuracyStats.player1 : accuracyStats.player2;
  const totalAttempts = currentStats.hits + currentStats.misses;
  const accuracy =
    totalAttempts > 0
      ? Math.round((currentStats.hits / totalAttempts) * 100)
      : 0;

  const hammerRotation = hammerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '-30deg'],
  });

  const getTimerColor = () => {
    if (gameTime > 30) return '#4ECDC4';
    if (gameTime > 10) return '#FFD700';
    return '#FF6B6B';
  };

  const getHoleBackground = (hole) => {
    if (hole.isWhacked) return '#FF6B6B33';
    if (!hole.hasMole) return '#3D2B1F';
    switch (hole.moleType) {
      case 'golden': return '#FFD70033';
      case 'special': return '#9B59B633';
      case 'bonus': return '#2ECC7133';
      case 'bomb': return '#FF000033';
      default: return '#8B4513';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backBtn}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>🔨 Whack-A-Mole</Text>
        <View style={{ width: 50 }} />
      </View>

      {/* Score Bar */}
      <View style={styles.topBar}>
        <View style={styles.scoreItem}>
          <Text style={styles.playerLabel}>Player 1</Text>
          <Text style={[styles.scoreValue, { color: '#FF6B6B' }]}>
            {scores.player1}
          </Text>
          {currentPlayer === 1 && gameActive && (
            <View style={styles.activeDot} />
          )}
        </View>

        <View style={styles.timerBox}>
          <Animated.Text
            style={[
              styles.timer,
              {
                color: getTimerColor(),
                transform: [{ scale: timerAnim }],
              },
            ]}
          >
            {gameTime}s
          </Animated.Text>
          <Text style={styles.roundText}>Round {round}</Text>
        </View>

        <View style={styles.scoreItem}>
          <Text style={styles.playerLabel}>Player 2</Text>
          <Text style={[styles.scoreValue, { color: '#4ECDC4' }]}>
            {scores.player2}
          </Text>
          {currentPlayer === 2 && gameActive && (
            <View style={[styles.activeDot, { backgroundColor: '#4ECDC4' }]} />
          )}
        </View>
      </View>

      {/* Player Info */}
      <View style={styles.playerInfoBar}>
        <Text style={styles.playerTurn}>
          🥊 Player {currentPlayer}'s Turn
        </Text>
        {combo > 1 && (
          <Animated.Text
            style={[
              styles.comboText,
              { transform: [{ scale: comboAnim }] },
            ]}
          >
            🔥 x{combo} COMBO!
          </Animated.Text>
        )}
        <Animated.View style={{ transform: [{ rotate: hammerRotation }] }}>
          <Text style={styles.hammerEmoji}>🔨</Text>
        </Animated.View>
      </View>

      {/* Difficulty Selector - only before game starts */}
      {!gameStarted && (
        <View style={styles.difficultyContainer}>
          <Text style={styles.difficultyLabel}>Select Difficulty:</Text>
          <View style={styles.difficultyButtons}>
            {['easy', 'medium', 'hard'].map((d) => (
              <TouchableOpacity
                key={d}
                style={[
                  styles.diffBtn,
                  difficulty === d && styles.diffBtnActive,
                  d === 'easy' && { borderColor: '#4ECDC4' },
                  d === 'medium' && { borderColor: '#FFD700' },
                  d === 'hard' && { borderColor: '#FF6B6B' },
                  difficulty === d && d === 'easy' && { backgroundColor: '#4ECDC4' },
                  difficulty === d && d === 'medium' && { backgroundColor: '#FFD700' },
                  difficulty === d && d === 'hard' && { backgroundColor: '#FF6B6B' },
                ]}
                onPress={() => setDifficulty(d)}
              >
                <Text style={styles.diffBtnText}>
                  {d === 'easy' ? '😊 Easy' : d === 'medium' ? '😤 Medium' : '😈 Hard'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Game Grid */}
      <View style={styles.gridContainer}>
        <View style={styles.grid}>
          {holes.map((hole) => (
            <TouchableOpacity
              key={hole.id}
              style={[
                styles.hole,
                { backgroundColor: getHoleBackground(hole) },
              ]}
              onPress={() => handleWhack(hole)}
              activeOpacity={0.7}
              disabled={!gameActive}
            >
              {hole.hasMole && !hole.isWhacked ? (
                <Animated.View
                  style={[
                    styles.moleContainer,
                    {
                      transform: [
                        {
                          translateY: moleAnims[hole.id].interpolate({
                            inputRange: [0, 1],
                            outputRange: [40, 0],
                          }),
                        },
                        {
                          scale: moleAnims[hole.id],
                        },
                      ],
                    },
                  ]}
                >
                  <Text style={styles.moleEmoji}>{hole.emoji}</Text>
                  <Text style={styles.molePoints}>
                    {hole.points > 0 ? `+${hole.points}` : hole.points}
                  </Text>
                </Animated.View>
              ) : hole.isWhacked ? (
                <Text style={styles.whackedEmoji}>💥</Text>
              ) : (
                <Text style={styles.emptyHole}>⬤</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Legend */}
      <View style={styles.legendContainer}>
        {MOLE_TYPES.map((m) => (
          <View key={m.type} style={styles.legendItem}>
            <Text style={styles.legendEmoji}>{m.emoji}</Text>
            <Text style={styles.legendText}>
              {m.points > 0 ? `+${m.points}` : m.points}
            </Text>
          </View>
        ))}
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Whacked</Text>
          <Text style={styles.statValue}>{whackCount}</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Missed</Text>
          <Text style={[styles.statValue, { color: '#FF6B6B' }]}>
            {missCount}
          </Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Accuracy</Text>
          <Text style={styles.statValue}>{accuracy}%</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Max Combo</Text>
          <Text style={[styles.statValue, { color: '#FFD700' }]}>
            x{maxCombo}
          </Text>
        </View>
      </View>

      {/* Start Button */}
      {!gameActive && !gameStarted && (
        <View style={styles.actionContainer}>
          <TouchableOpacity style={styles.startBtn} onPress={startGame}>
            <Text style={styles.startBtnText}>
              🎮 Start Game - Player {currentPlayer}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Game Over Buttons */}
      {!gameActive && gameStarted && currentPlayer === 1 && (
        <View style={styles.actionContainer}>
          <TouchableOpacity
            style={styles.startBtn}
            onPress={switchPlayer}
          >
            <Text style={styles.startBtnText}>
              ⏭️ Player 2's Turn
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {!gameActive && gameStarted && currentPlayer === 2 && (
        <View style={styles.gameOverButtons}>
          <TouchableOpacity style={styles.nextRoundBtn} onPress={nextRound}>
            <Text style={styles.nextRoundText}>🔄 Next Round</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.endGameBtn}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.endGameText}>🚪 End Game</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background || '#1A1A2E',
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg || 20,
    paddingVertical: SPACING.md || 12,
    backgroundColor: COLORS.primary || '#16213E',
  },
  backBtn: {
    fontSize: 18,
    color: '#FFF',
    fontWeight: 'bold',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFF',
  },

  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: SPACING.md || 12,
    backgroundColor: COLORS.cardBg || '#16213E',
  },
  scoreItem: {
    alignItems: 'center',
    position: 'relative',
  },
  playerLabel: {
    fontSize: 12,
    color: COLORS.textLight || '#AAA',
  },
  scoreValue: {
    fontSize: 26,
    fontWeight: 'bold',
  },
  activeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF6B6B',
    marginTop: 4,
  },
  timerBox: { alignItems: 'center' },
  timer: {
    fontSize: 30,
    fontWeight: 'bold',
  },
  roundText: {
    fontSize: 12,
    color: COLORS.textLight || '#AAA',
  },

  playerInfoBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg || 20,
    paddingVertical: SPACING.sm || 8,
    backgroundColor: '#0F3460',
  },
  playerTurn: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#FFF',
  },
  comboText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFD700',
  },
  hammerEmoji: {
    fontSize: 24,
  },

  difficultyContainer: {
    paddingHorizontal: SPACING.lg || 20,
    paddingVertical: SPACING.sm || 8,
    backgroundColor: '#1B2A4A',
  },
  difficultyLabel: {
    fontSize: 13,
    color: COLORS.textLight || '#AAA',
    marginBottom: 6,
    textAlign: 'center',
  },
  difficultyButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 8,
  },
  diffBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: BORDER_RADIUS.md || 10,
    borderWidth: 2,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  diffBtnActive: {},
  diffBtnText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#FFF',
  },

  gridContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.md || 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: width - 40,
    justifyContent: 'center',
    gap: 10,
  },
  hole: {
    width: (width - 80) / 3,
    height: (width - 80) / 3,
    borderRadius: BORDER_RADIUS.lg || 16,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: '#5D3A1A',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  moleContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  moleEmoji: {
    fontSize: 40,
  },
  molePoints: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#FFF',
    backgroundColor: '#00000066',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  whackedEmoji: {
    fontSize: 36,
  },
  emptyHole: {
    fontSize: 24,
    color: '#2C1810',
  },

  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: SPACING.sm || 8,
    paddingHorizontal: SPACING.lg || 20,
    backgroundColor: '#0F3460',
  },
  legendItem: {
    alignItems: 'center',
  },
  legendEmoji: {
    fontSize: 20,
  },
  legendText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#FFF',
    marginTop: 2,
  },

  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: SPACING.sm || 8,
    paddingHorizontal: SPACING.lg || 20,
    backgroundColor: COLORS.cardBg || '#16213E',
  },
  statBox: { alignItems: 'center' },
  statLabel: {
    fontSize: 11,
    color: COLORS.textLight || '#AAA',
    marginBottom: 2,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4ECDC4',
  },

  actionContainer: {
    paddingHorizontal: SPACING.lg || 20,
    paddingVertical: SPACING.sm || 8,
  },
  startBtn: {
    backgroundColor: COLORS.primary || '#E94560',
    paddingVertical: SPACING.md || 12,
    borderRadius: BORDER_RADIUS.md || 10,
    alignItems: 'center',
  },
  startBtnText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
  },

  gameOverButtons: {
    paddingHorizontal: SPACING.lg || 20,
    paddingBottom: SPACING.md || 12,
    gap: 8,
  },
  nextRoundBtn: {
    backgroundColor: COLORS.primary || '#E94560',
    paddingVertical: SPACING.md || 12,
    borderRadius: BORDER_RADIUS.md || 10,
    alignItems: 'center',
  },
  nextRoundText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
  },
  endGameBtn: {
    backgroundColor: COLORS.secondary || '#533483',
    paddingVertical: SPACING.md || 12,
    borderRadius: BORDER_RADIUS.md || 10,
    alignItems: 'center',
  },
  endGameText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
  },
});
