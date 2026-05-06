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
import { COLORS, SPACING, BORDER_RADIUS } from '../styles/theme';

const { width, height } = Dimensions.get('window');

export default function BatSmashGame({ navigation }) {
  const [scores, setScores] = useState({ player1: 0, player2: 0 });
  const [round, setRound] = useState(1);
  const [gameActive, setGameActive] = useState(true);
  const [gameTime, setGameTime] = useState(60);
  const [currentPlayer, setCurrentPlayer] = useState(1);

  // Targets (balls/objects to smash)
  const [targets, setTargets] = useState([
    { id: 1, x: width * 0.15, y: height * 0.25, type: 'normal', points: 10, smashed: false, emoji: '⚾' },
    { id: 2, x: width * 0.35, y: height * 0.18, type: 'bonus', points: 30, smashed: false, emoji: '🎯' },
    { id: 3, x: width * 0.5, y: height * 0.30, type: 'normal', points: 10, smashed: false, emoji: '⚾' },
    { id: 4, x: width * 0.65, y: height * 0.20, type: 'bonus', points: 30, smashed: false, emoji: '🎯' },
    { id: 5, x: width * 0.85, y: height * 0.25, type: 'normal', points: 10, smashed: false, emoji: '⚾' },
    { id: 6, x: width * 0.25, y: height * 0.40, type: 'special', points: 50, smashed: false, emoji: '💎' },
    { id: 7, x: width * 0.75, y: height * 0.38, type: 'special', points: 50, smashed: false, emoji: '💎' },
    { id: 8, x: width * 0.50, y: height * 0.45, type: 'bomb', points: -20, smashed: false, emoji: '💣' },
  ]);

  // Bat swing
  const [swingCount, setSwingCount] = useState(0);
  const [maxSwings] = useState(5);

  // Power meter
  const [powerLevel, setPowerLevel] = useState(50);
  const [powerIncreasing, setPowerIncreasing] = useState(true);

  // Combo tracker
  const [combo, setCombo] = useState(0);
  const [lastHitTime, setLastHitTime] = useState(null);

  // Accuracy tracker
  const [accuracyStats, setAccuracyStats] = useState({
    player1: { hits: 0, misses: 0 },
    player2: { hits: 0, misses: 0 },
  });

  // Animations
  const batSwingAnim = useRef(new Animated.Value(0)).current;
  const targetScale = useRef(new Animated.Value(1)).current;
  const comboAnim = useRef(new Animated.Value(0)).current;
  const screenShake = useRef(new Animated.Value(0)).current;

  // Game Timer
  useEffect(() => {
    if (!gameActive) return;

    const timer = setInterval(() => {
      setGameTime((prev) => {
        if (prev <= 1) {
          endRound();
          return 60;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameActive]);

  // Power meter oscillation
  useEffect(() => {
    const powerInterval = setInterval(() => {
      setPowerLevel((prev) => {
        if (powerIncreasing) {
          if (prev >= 100) {
            setPowerIncreasing(false);
            return 100;
          }
          return prev + 2;
        } else {
          if (prev <= 0) {
            setPowerIncreasing(true);
            return 0;
          }
          return prev - 2;
        }
      });
    }, 40);

    return () => clearInterval(powerInterval);
  }, [powerIncreasing]);

  // Combo reset after 3 seconds
  useEffect(() => {
    if (lastHitTime) {
      const comboTimer = setTimeout(() => {
        setCombo(0);
      }, 3000);
      return () => clearTimeout(comboTimer);
    }
  }, [lastHitTime]);

  // Bat swing animation
  const animateBatSwing = () => {
    Animated.sequence([
      Animated.timing(batSwingAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: false,
      }),
      Animated.timing(batSwingAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }),
    ]).start();
  };

  // Screen shake animation
  const animateScreenShake = () => {
    Animated.sequence([
      Animated.timing(screenShake, {
        toValue: 10,
        duration: 50,
        useNativeDriver: false,
      }),
      Animated.timing(screenShake, {
        toValue: -10,
        duration: 50,
        useNativeDriver: false,
      }),
      Animated.timing(screenShake, {
        toValue: 5,
        duration: 50,
        useNativeDriver: false,
      }),
      Animated.timing(screenShake, {
        toValue: 0,
        duration: 50,
        useNativeDriver: false,
      }),
    ]).start();
  };

  // Target smash animation
  const animateTargetSmash = () => {
    Animated.sequence([
      Animated.timing(targetScale, {
        toValue: 1.5,
        duration: 100,
        useNativeDriver: false,
      }),
      Animated.timing(targetScale, {
        toValue: 0,
        duration: 150,
        useNativeDriver: false,
      }),
      Animated.timing(targetScale, {
        toValue: 1,
        duration: 50,
        useNativeDriver: false,
      }),
    ]).start();
  };

  // Smash a target
  const handleSmash = (targetId) => {
    if (!gameActive || swingCount >= maxSwings) {
      Alert.alert('⚠️ No Swings Left!', 'End of turn!', [
        { text: 'Next Player', onPress: switchPlayer },
      ]);
      return;
    }

    animateBatSwing();
    setSwingCount((prev) => prev + 1);

    const target = targets.find((t) => t.id === targetId);
    if (!target || target.smashed) return;

    animateTargetSmash();
    animateScreenShake();

    const now = Date.now();
    const newCombo = lastHitTime && now - lastHitTime < 3000 ? combo + 1 : 1;
    setCombo(newCombo);
    setLastHitTime(now);

    // Calculate points with power and combo bonus
    const powerBonus = Math.round((powerLevel / 100) * 20);
    const comboBonus = (newCombo - 1) * 5;
    const basePoints = target.points;
    const totalPoints = basePoints > 0 ? basePoints + powerBonus + comboBonus : basePoints;

    // Mark target as smashed
    setTargets((prev) =>
      prev.map((t) => (t.id === targetId ? { ...t, smashed: true } : t))
    );

    // Award points
    const playerKey = currentPlayer === 1 ? 'player1' : 'player2';
    setScores((prev) => ({
      ...prev,
      [playerKey]: Math.max(0, prev[playerKey] + totalPoints),
    }));

    // Update accuracy
    setAccuracyStats((prev) => ({
      ...prev,
      [playerKey]: {
        ...prev[playerKey],
        hits: prev[playerKey].hits + 1,
      },
    }));

    // Alert based on target type
    if (target.type === 'bomb') {
      Alert.alert('💣 BOMB!', `Oops! -20 points!`, [
        { text: 'Continue', onPress: () => {} },
      ]);
    } else if (target.type === 'special') {
      Alert.alert(
        '💎 SPECIAL HIT!',
        `+${totalPoints} points!\nCombo x${newCombo}!\nPower Bonus: +${powerBonus}`,
        [{ text: 'Awesome!', onPress: () => {} }]
      );
    } else if (target.type === 'bonus') {
      Alert.alert(
        '🎯 BONUS HIT!',
        `+${totalPoints} points!\nCombo x${newCombo}!`,
        [{ text: 'Great!', onPress: () => {} }]
      );
    } else {
      Alert.alert(
        '⚾ SMASH!',
        `+${totalPoints} points!\n${newCombo > 1 ? `Combo x${newCombo}! +${comboBonus}` : ''}`,
        [{ text: 'OK', onPress: () => {} }]
      );
    }

    // Check if all non-bomb targets smashed
    const remaining = targets.filter((t) => !t.smashed && t.type !== 'bomb');
    if (remaining.length === 1) {
      Alert.alert('🏆 All Targets Smashed!', 'Bonus +100 points!', [
        { text: 'Amazing!', onPress: () => {} },
      ]);
      setScores((prev) => ({
        ...prev,
        [playerKey]: prev[playerKey] + 100,
      }));
    }
  };

  // Miss swing (swing at empty area)
  const handleMiss = () => {
    if (!gameActive || swingCount >= maxSwings) return;

    animateBatSwing();
    setSwingCount((prev) => prev + 1);
    setCombo(0);

    const playerKey = currentPlayer === 1 ? 'player1' : 'player2';
    setAccuracyStats((prev) => ({
      ...prev,
      [playerKey]: {
        ...prev[playerKey],
        misses: prev[playerKey].misses + 1,
      },
    }));

    Alert.alert('💨 Miss!', 'Swung and missed!', [
      { text: 'Try Again', onPress: () => {} },
    ]);
  };

  const switchPlayer = () => {
    setCurrentPlayer((prev) => (prev === 1 ? 2 : 1));
    setSwingCount(0);
    setCombo(0);
  };

  const endRound = () => {
    setGameActive(false);

    let winner = '';
    if (scores.player1 > scores.player2) {
      winner = 'Player 1 🏏';
      setScores((prev) => ({ ...prev, player1: prev.player1 + 100 }));
    } else if (scores.player2 > scores.player1) {
      winner = 'Player 2 🏏';
      setScores((prev) => ({ ...prev, player2: prev.player2 + 100 }));
    } else {
      winner = 'Draw 🤝';
    }

    Alert.alert(`Round ${round} Over!`, `Winner: ${winner}`, [
      { text: 'Next Round', onPress: nextRound },
      { text: 'End Game', onPress: () => navigation.goBack() },
    ]);
  };

  const nextRound = () => {
    setRound((prev) => prev + 1);
    setGameTime(60);
    setCurrentPlayer(1);
    setSwingCount(0);
    setCombo(0);
    setTargets([
      { id: 1, x: width * 0.15, y: height * 0.25, type: 'normal', points: 10, smashed: false, emoji: '⚾' },
      { id: 2, x: width * 0.35, y: height * 0.18, type: 'bonus', points: 30, smashed: false, emoji: '🎯' },
      { id: 3, x: width * 0.5, y: height * 0.30, type: 'normal', points: 10, smashed: false, emoji: '⚾' },
      { id: 4, x: width * 0.65, y: height * 0.20, type: 'bonus', points: 30, smashed: false, emoji: '🎯' },
      { id: 5, x: width * 0.85, y: height * 0.25, type: 'normal', points: 10, smashed: false, emoji: '⚾' },
      { id: 6, x: width * 0.25, y: height * 0.40, type: 'special', points: 50, smashed: false, emoji: '💎' },
      { id: 7, x: width * 0.75, y: height * 0.38, type: 'special', points: 50, smashed: false, emoji: '💎' },
      { id: 8, x: width * 0.50, y: height * 0.45, type: 'bomb', points: -20, smashed: false, emoji: '💣' },
    ]);
    setAccuracyStats({
      player1: { hits: 0, misses: 0 },
      player2: { hits: 0, misses: 0 },
    });
    setGameActive(true);
  };

  const currentStats =
    currentPlayer === 1 ? accuracyStats.player1 : accuracyStats.player2;
  const totalAttempts = currentStats.hits + currentStats.misses;
  const accuracy =
    totalAttempts > 0
      ? Math.round((currentStats.hits / totalAttempts) * 100)
      : 0;

  const batRotation = batSwingAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '-45deg'],
  });

  const getPowerColor = () => {
    if (powerLevel < 33) return '#4ECDC4';
    if (powerLevel < 66) return '#FFD700';
    return '#FF6B6B';
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backBtn}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>🏏 Bat Smash</Text>
        <View style={{ width: 50 }} />
      </View>

      {/* Scores and Timer */}
      <View style={styles.topBar}>
        <View style={styles.scoreItem}>
          <Text style={styles.playerLabel}>Player 1</Text>
          <Text style={[styles.scoreValue, { color: COLORS.player1 || '#FF6B6B' }]}>
            {scores.player1}
          </Text>
        </View>

        <View style={styles.timerBox}>
          <Text style={styles.timer}>{gameTime}s</Text>
          <Text style={styles.roundText}>Round {round}</Text>
        </View>

        <View style={styles.scoreItem}>
          <Text style={styles.playerLabel}>Player 2</Text>
          <Text style={[styles.scoreValue, { color: COLORS.player2 || '#4ECDC4' }]}>
            {scores.player2}
          </Text>
        </View>
      </View>

      {/* Player Info Bar */}
      <View style={styles.playerInfoBar}>
        <Text style={styles.playerTurn}>
          🏏 Player {currentPlayer}'s Turn
        </Text>
        <View style={styles.comboContainer}>
          {combo > 1 && (
            <Text style={styles.comboText}>🔥 Combo x{combo}!</Text>
          )}
        </View>
        <Text style={styles.swingsLeft}>
          Swings: {swingCount}/{maxSwings}
        </Text>
      </View>

      {/* Game Arena */}
      <Animated.View
        style={[
          styles.arena,
          { transform: [{ translateX: screenShake }] },
        ]}
      >
        {/* Targets */}
        {targets.map((target) =>
          !target.smashed ? (
            <TouchableOpacity
              key={target.id}
              style={[
                styles.target,
                {
                  left: target.x - 30,
                  top: target.y - 30,
                  backgroundColor:
                    target.type === 'bomb'
                      ? '#FF000033'
                      : target.type === 'special'
                      ? '#FFD70033'
                      : target.type === 'bonus'
                      ? '#4ECDC433'
                      : '#FFFFFF33',
                  borderColor:
                    target.type === 'bomb'
                      ? '#FF0000'
                      : target.type === 'special'
                      ? '#FFD700'
                      : target.type === 'bonus'
                      ? '#4ECDC4'
                      : '#FFFFFF',
                },
              ]}
              onPress={() => handleSmash(target.id)}
              disabled={!gameActive || swingCount >= maxSwings}
            >
              <Text style={styles.targetEmoji}>{target.emoji}</Text>
              <Text style={styles.targetPoints}>
                {target.points > 0 ? `+${target.points}` : target.points}
              </Text>
            </TouchableOpacity>
          ) : (
            <View
              key={target.id}
              style={[
                styles.smashedTarget,
                { left: target.x - 30, top: target.y - 30 },
              ]}
            >
              <Text style={styles.smashedEmoji}>💥</Text>
            </View>
          )
        )}

        {/* Animated Bat */}
        <Animated.View
          style={[
            styles.batContainer,
            { transform: [{ rotate: batRotation }] },
          ]}
        >
          <Text style={styles.batEmoji}>🏏</Text>
        </Animated.View>

        {/* Miss Button */}
        <TouchableOpacity
          style={styles.missButton}
          onPress={handleMiss}
          disabled={!gameActive || swingCount >= maxSwings}
        >
          <Text style={styles.missButtonText}>💨 Swing & Miss</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Power Meter */}
      <View style={styles.powerMeterContainer}>
        <Text style={styles.powerLabel}>
          Power: {Math.round(powerLevel)}%
        </Text>
        <View style={styles.powerBar}>
          <View
            style={[
              styles.powerFill,
              {
                width: `${powerLevel}%`,
                backgroundColor: getPowerColor(),
              },
            ]}
          />
        </View>
        <View style={styles.powerLabels}>
          <Text style={styles.powerLabelSmall}>Weak</Text>
          <Text style={styles.powerLabelSmall}>Medium</Text>
          <Text style={styles.powerLabelSmall}>POWER!</Text>
        </View>
      </View>

      {/* Legend */}
      <View style={styles.legendContainer}>
        <View style={styles.legendItem}>
          <Text style={styles.legendEmoji}>⚾</Text>
          <Text style={styles.legendText}>+10</Text>
        </View>
        <View style={styles.legendItem}>
          <Text style={styles.legendEmoji}>🎯</Text>
          <Text style={styles.legendText}>+30</Text>
        </View>
        <View style={styles.legendItem}>
          <Text style={styles.legendEmoji}>💎</Text>
          <Text style={styles.legendText}>+50</Text>
        </View>
        <View style={styles.legendItem}>
          <Text style={styles.legendEmoji}>💣</Text>
          <Text style={styles.legendText}>-20</Text>
        </View>
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Hits</Text>
          <Text style={styles.statValue}>{currentStats.hits}</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Misses</Text>
          <Text style={styles.statValue}>{currentStats.misses}</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Accuracy</Text>
          <Text style={styles.statValue}>{accuracy}%</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Combo</Text>
          <Text style={[styles.statValue, { color: '#FF6B6B' }]}>
            x{combo}
          </Text>
        </View>
      </View>

      {/* Switch Player */}
      {swingCount >= maxSwings && gameActive && (
        <View style={styles.actionContainer}>
          <TouchableOpacity
            style={styles.switchPlayerBtn}
            onPress={switchPlayer}
          >
            <Text style={styles.switchPlayerText}>⏭️ Next Player</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Game Over Buttons */}
      {!gameActive && (
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
  scoreItem: { alignItems: 'center' },
  playerLabel: {
    fontSize: 12,
    color: COLORS.textLight || '#AAA',
  },
  scoreValue: {
    fontSize: 26,
    fontWeight: 'bold',
  },
  timerBox: { alignItems: 'center' },
  timer: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.danger || '#FF6B6B',
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
  comboContainer: {
    flex: 1,
    alignItems: 'center',
  },
  comboText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFD700',
  },
  swingsLeft: {
    fontSize: 13,
    color: COLORS.textLight || '#AAA',
  },

  arena: {
    flex: 1,
    backgroundColor: '#1B4332',
    marginHorizontal: SPACING.lg || 20,
    marginVertical: SPACING.sm || 8,
    borderRadius: BORDER_RADIUS.lg || 16,
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#2D6A4F',
  },

  target: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  targetEmoji: {
    fontSize: 28,
  },
  targetPoints: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFF',
  },

  smashedTarget: {
    position: 'absolute',
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  smashedEmoji: {
    fontSize: 30,
  },

  batContainer: {
    position: 'absolute',
    bottom: 60,
    left: '50%',
    marginLeft: -20,
  },
  batEmoji: {
    fontSize: 48,
  },

  missButton: {
    position: 'absolute',
    bottom: 10,
    alignSelf: 'center',
    left: '25%',
    backgroundColor: '#33333366',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#666',
  },
  missButtonText: {
    color: '#CCC',
    fontSize: 13,
    fontWeight: 'bold',
  },

  powerMeterContainer: {
    paddingHorizontal: SPACING.lg || 20,
    paddingVertical: SPACING.sm || 8,
    backgroundColor: COLORS.cardBg || '#16213E',
  },
  powerLabel: {
    fontSize: 13,
    fontWeight: 'bold',
    color: COLORS.text || '#FFF',
    marginBottom: 4,
  },
  powerBar: {
    height: 18,
    backgroundColor: '#333',
    borderRadius: BORDER_RADIUS.sm || 8,
    overflow: 'hidden',
    marginBottom: 4,
  },
  powerFill: {
    height: '100%',
    borderRadius: BORDER_RADIUS.sm || 8,
  },
  powerLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  powerLabelSmall: {
    fontSize: 10,
    color: COLORS.textLight || '#AAA',
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
    flexDirection: 'row',
    gap: 4,
  },
  legendEmoji: { fontSize: 16 },
  legendText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFF',
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
    color: COLORS.primary || '#E94560',
  },

  actionContainer: {
    paddingHorizontal: SPACING.lg || 20,
    paddingVertical: SPACING.sm || 8,
  },
  switchPlayerBtn: {
    backgroundColor: COLORS.primary || '#E94560',
    paddingVertical: SPACING.md || 12,
    borderRadius: BORDER_RADIUS.md || 10,
    alignItems: 'center',
  },
  switchPlayerText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
  },

  gameOverButtons: {
    paddingHorizontal: SPACING.lg || 20,
    paddingBottom: SPACING.lg || 20,
    gap: SPACING.sm || 8,
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