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

export default function StopCatcherGame({ navigation }) {
  const [scores, setScores] = useState({ player1: 0, player2: 0 });
  const [round, setRound] = useState(1);
  const [gameActive, setGameActive] = useState(true);
  const [roundTime, setRoundTime] = useState(30);
  const [currentPlayer, setCurrentPlayer] = useState(1);

  // Rotating indicator
  const [indicatorRotation, setIndicatorRotation] = useState(0);
  const [indicatorSpeed, setIndicatorSpeed] = useState(4);
  const [isSpinning, setIsSpinning] = useState(true);

  // Target zones
  const [targetZone, setTargetZone] = useState({
    start: 0,
    end: 45,
    color: '#FFD700',
  });

  // Zones
  const zones = [
    { id: 1, start: 0, end: 45, points: 100, emoji: '⭐', name: 'Perfect' },
    { id: 2, start: 45, end: 90, points: 50, emoji: '✓', name: 'Good' },
    { id: 3, start: 90, end: 135, points: 25, emoji: '◐', name: 'OK' },
    { id: 4, start: 135, end: 180, points: 10, emoji: '◑', name: 'Meh' },
    { id: 5, start: 180, end: 225, points: 0, emoji: '✗', name: 'Miss' },
    { id: 6, start: 225, end: 270, points: 10, emoji: '◑', name: 'Meh' },
    { id: 7, start: 270, end: 315, points: 25, emoji: '◐', name: 'OK' },
    { id: 8, start: 315, end: 360, points: 50, emoji: '✓', name: 'Good' },
  ];

  // Game state
  const [attempts, setAttempts] = useState(0);
  const [lastScore, setLastScore] = useState(null);
  const [successStreak, setSuccessStreak] = useState(0);

  // Animations
  const indicatorAnim = useRef(new Animated.Value(0)).current;
  const targetFlash = useRef(new Animated.Value(0)).current;
  const scorePopupAnim = useRef(new Animated.Value(0)).current;

  // Round timer
  useEffect(() => {
    if (!gameActive) return;

    const timer = setInterval(() => {
      setRoundTime((prev) => {
        if (prev <= 1) {
          endRound();
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameActive]);

  // Indicator rotation
  useEffect(() => {
    if (!gameActive || !isSpinning) return;

    const rotationInterval = setInterval(() => {
      setIndicatorRotation((prev) => (prev + indicatorSpeed) % 360);
    }, 50);

    return () => clearInterval(rotationInterval);
  }, [gameActive, isSpinning, indicatorSpeed]);

  // Slow down over time
  useEffect(() => {
    if (!gameActive || !isSpinning) return;

    const slowDownInterval = setInterval(() => {
      setIndicatorSpeed((prev) => Math.max(0.2, prev - 0.1));
    }, 2000);

    return () => clearInterval(slowDownInterval);
  }, [gameActive, isSpinning]);

  const getZoneAtAngle = (angle) => {
    const normalizedAngle = ((angle % 360) + 360) % 360;
    return zones.find(
      (zone) =>
        (zone.start <= normalizedAngle && normalizedAngle < zone.end) ||
        (zone.start > zone.end &&
          (normalizedAngle >= zone.start || normalizedAngle < zone.end))
    );
  };

  const handleStop = () => {
    if (!gameActive || !isSpinning) return;

    // Stop spinning
    setIsSpinning(false);

    // Get current zone
    const zone = getZoneAtAngle(indicatorRotation);

    // Flash animation
    Animated.sequence([
      Animated.timing(targetFlash, {
        toValue: 1,
        duration: 200,
        useNativeDriver: false,
      }),
      Animated.timing(targetFlash, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }),
    ]).start();

    // Show result
    let resultMessage = '';
    let emoji = zone.emoji;

    if (zone.points === 100) {
      resultMessage = `🎉 PERFECT! ${zone.points} points!`;
      setSuccessStreak((prev) => prev + 1);
    } else if (zone.points === 50) {
      resultMessage = `✓ Good! ${zone.points} points!`;
      setSuccessStreak((prev) => prev + 1);
    } else if (zone.points === 25) {
      resultMessage = `◐ OK! ${zone.points} points!`;
      setSuccessStreak((prev) => prev + 1);
    } else if (zone.points === 10) {
      resultMessage = `◑ Meh... ${zone.points} points!`;
      setSuccessStreak((prev) => prev + 1);
    } else {
      resultMessage = `✗ MISS! ${zone.points} points!`;
      setSuccessStreak(0);
    }

    setLastScore({
      points: zone.points,
      zone: zone.name,
      emoji: emoji,
    });

    // Award points
    if (currentPlayer === 1) {
      setScores((prev) => ({
        ...prev,
        player1: prev.player1 + zone.points,
      }));
    } else {
      setScores((prev) => ({
        ...prev,
        player2: prev.player2 + zone.points,
      }));
    }

    setAttempts((prev) => prev + 1);

    Alert.alert(zone.name, resultMessage, [
      { text: 'Next', onPress: nextAttempt },
    ]);
  };

  const nextAttempt = () => {
    setIsSpinning(true);
    setIndicatorSpeed(4 + Math.random() * 2); // Randomize starting speed
    setIndicatorRotation(Math.random() * 360); // Random starting rotation
    setLastScore(null);

    // Switch player after 3 attempts
    if (attempts + 1 >= 3) {
      switchPlayer();
    }
  };

  const switchPlayer = () => {
    if (currentPlayer === 1) {
      setCurrentPlayer(2);
    } else {
      setCurrentPlayer(1);
    }
    setAttempts(0);
    setSuccessStreak(0);
  };

  const endRound = () => {
    setGameActive(false);

    let winner = '';
    if (scores.player1 > scores.player2) {
      winner = 'Player 1 🏆';
      setScores((prev) => ({ ...prev, player1: prev.player1 + 100 }));
    } else if (scores.player2 > scores.player1) {
      winner = 'Player 2 🏆';
      setScores((prev) => ({ ...prev, player2: prev.player2 + 100 }));
    } else {
      winner = 'Draw 🤝';
    }

    Alert.alert(`Round ${round} Over!`, `${winner}`, [
      { text: 'Next Round', onPress: nextRound },
      { text: 'End Game', onPress: () => navigation.goBack() },
    ]);
  };

  const nextRound = () => {
    setRound(round + 1);
    setRoundTime(30);
    setCurrentPlayer(1);
    setAttempts(0);
    setSuccessStreak(0);
    setIndicatorRotation(0);
    setIndicatorSpeed(4);
    setIsSpinning(true);
    setLastScore(null);
    setGameActive(true);
  };

  const resetGame = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backBtn}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Stop Catcher</Text>
        <View style={{ width: 50 }} />
      </View>

      {/* Scores and Time */}
      <View style={styles.topBar}>
        <View style={styles.scoreItem}>
          <Text style={styles.playerLabel}>Player 1</Text>
          <Text style={[styles.scoreValue, { color: COLORS.player1 }]}>
            {scores.player1}
          </Text>
        </View>

        <View style={styles.timerBox}>
          <Text style={styles.timer}>{roundTime}s</Text>
          <Text style={styles.round}>Round {round}</Text>
        </View>

        <View style={styles.scoreItem}>
          <Text style={styles.playerLabel}>Player 2</Text>
          <Text style={[styles.scoreValue, { color: COLORS.player2 }]}>
            {scores.player2}
          </Text>
        </View>
      </View>

      {/* Player Info */}
      <View style={styles.playerInfoBar}>
        <Text style={styles.playerTurn}>🛑 Player {currentPlayer}'s Turn</Text>
        <Text style={styles.attemptsLeft}>Attempts: {attempts}/3</Text>
      </View>

      {/* Spinner Wheel */}
      <View style={styles.wheelContainer}>
        <Animated.View
          style={[
            styles.wheel,
            {
              transform: [{ rotate: `${indicatorRotation}deg` }],
              opacity: targetFlash.interpolate({
                inputRange: [0, 1],
                outputRange: [1, 0.5],
              }),
            },
          ]}
        >
          {/* Zone segments */}
          {zones.map((zone, index) => {
            const angle = (zone.start + zone.end) / 2;
            const isCurrentZone =
              Math.abs(((angle - indicatorRotation) % 360 + 360) % 360 - 180) <
              45;

            return (
              <View
                key={zone.id}
                style={[
                  styles.segment,
                  {
                    backgroundColor: isCurrentZone ? zone.color : '#E0E0E0',
                    opacity: isCurrentZone ? 0.9 : 0.6,
                    transform: [{ rotate: `${angle}deg` }],
                  },
                ]}
              >
                <Text style={styles.zoneEmoji}>{zone.emoji}</Text>
              </View>
            );
          })}

          {/* Center circle */}
          <View style={styles.center}>
            <Text style={styles.centerText}>
              {isSpinning ? '⏸️' : '⏹️'}
            </Text>
          </View>
        </Animated.View>

        {/* Indicator needle (static) */}
        <View style={styles.needle}>
          <View style={styles.needlePoint} />
        </View>
      </View>

      {/* Last Score Display */}
      {lastScore && (
        <View style={styles.scoreDisplayBox}>
          <Text style={styles.scoreDisplayEmoji}>{lastScore.emoji}</Text>
          <Text style={styles.scoreDisplayZone}>{lastScore.zone}</Text>
          <Text style={styles.scoreDisplayPoints}>+{lastScore.points}</Text>
        </View>
      )}

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Attempts</Text>
          <Text style={styles.statValue}>{attempts}/3</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Streak</Text>
          <Text style={styles.statValue}>{successStreak} 🔥</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Speed</Text>
          <Text style={styles.statValue}>
            {indicatorSpeed > 2 ? '🚀' : indicatorSpeed > 1 ? '💨' : '🐢'}
          </Text>
        </View>
      </View>

      {/* Action Button */}
      <View style={styles.buttonContainer}>
        {isSpinning && gameActive ? (
          <TouchableOpacity
            style={[styles.stopBtn, { backgroundColor: COLORS.danger }]}
            onPress={handleStop}
          >
            <Text style={styles.stopBtnText}>🛑 STOP!</Text>
          </TouchableOpacity>
        ) : !isSpinning && attempts < 3 ? (
          <TouchableOpacity
            style={[styles.nextBtn, { backgroundColor: COLORS.primary }]}
            onPress={nextAttempt}
          >
            <Text style={styles.nextBtnText}>⏭️ Next Attempt</Text>
          </TouchableOpacity>
        ) : attempts >= 3 ? (
          <TouchableOpacity
            style={[styles.switchBtn, { backgroundColor: COLORS.accent }]}
            onPress={() => {
              switchPlayer();
              setIsSpinning(true);
              setIndicatorSpeed(4 + Math.random() * 2);
              setIndicatorRotation(Math.random() * 360);
            }}
          >
            <Text style={styles.switchBtnText}>👤 Next Player</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Instructions */}
      <View style={styles.instructionsBox}>
        <Text style={styles.instructionText}>
          ⭐ Perfect Zone = 100pts | 🔴 Miss Zone = 0pts{'\n'}
          ⏱️ Wheel slows down! | 🔥 Build streaks!
        </Text>
      </View>

      {/* Game Over Buttons */}
      {!gameActive && (
        <View style={styles.gameOverButtons}>
          <TouchableOpacity style={styles.nextRoundBtn} onPress={nextRound}>
            <Text style={styles.nextRoundText}>Next Round</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.endGameBtn} onPress={resetGame}>
            <Text style={styles.endGameText}>End Game</Text>
          </TouchableOpacity>
        </View>
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

  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.cardBg,
  },
  scoreItem: { alignItems: 'center' },
  playerLabel: { fontSize: 12, color: COLORS.textLight },
  scoreValue: { fontSize: 24, fontWeight: 'bold' },
  timerBox: { alignItems: 'center' },
  timer: { fontSize: 28, fontWeight: 'bold', color: COLORS.danger },
  round: { fontSize: 12, color: COLORS.textLight },

  playerInfoBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: '#F5F5F5',
  },
  playerTurn: { fontSize: 16, fontWeight: 'bold', color: COLORS.text },
  attemptsLeft: { fontSize: 14, color: COLORS.textLight },

  wheelContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.lg,
    position: 'relative',
  },

  wheel: {
    width: 280,
    height: 280,
    borderRadius: 140,
    borderWidth: 8,
    borderColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF',
    overflow: 'hidden',
  },

  segment: {
    position: 'absolute',
    width: 280,
    height: 140,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: SPACING.lg,
  },

  zoneEmoji: {
    fontSize: 24,
    fontWeight: 'bold',
  },

  center: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },

  centerText: {
    fontSize: 40,
  },

  needle: {
    position: 'absolute',
    top: -20,
    alignItems: 'center',
    zIndex: 20,
  },

  needlePoint: {
    width: 0,
    height: 0,
    borderLeftWidth: 15,
    borderRightWidth: 15,
    borderTopWidth: 30,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: COLORS.danger,
  },

  scoreDisplayBox: {
    alignItems: 'center',
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.cardBg,
  },

  scoreDisplayEmoji: {
    fontSize: 40,
    marginBottom: SPACING.sm,
  },

  scoreDisplayZone: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },

  scoreDisplayPoints: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.success,
  },

  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.cardBg,
  },

  statBox: {
    alignItems: 'center',
  },

  statLabel: {
    fontSize: 12,
    color: COLORS.textLight,
    marginBottom: SPACING.xs,
  },

  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
  },

  buttonContainer: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },

  stopBtn: {
    paddingVertical: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },

  stopBtnText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
  },

  nextBtn: {
    paddingVertical: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },

  nextBtnText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
  },

  switchBtn: {
    paddingVertical: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },

  switchBtnText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
  },

  instructionsBox: {
    backgroundColor: COLORS.cardBg,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },

  instructionText: {
    fontSize: 12,
    color: COLORS.textLight,
    lineHeight: 18,
  },

  gameOverButtons: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.lg,
    gap: SPACING.sm,
  },

  nextRoundBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
  },

  nextRoundText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
    textAlign: 'center',
  },

  endGameBtn: {
    backgroundColor: COLORS.secondary,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
  },

  endGameText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
    textAlign: 'center',
  },
});
