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
  PanResponder,
} from 'react-native';
import { COLORS, SPACING, BORDER_RADIUS } from '../styles/theme';

const { width, height } = Dimensions.get('window');

export default function SumoGame({ navigation }) {
  const [scores, setScores] = useState({ player1: 0, player2: 0 });
  const [round, setRound] = useState(1);
  const [gameActive, setGameActive] = useState(true);
  const [gameTime, setGameTime] = useState(60);

  // Sumo wrestlers
  const RING_CENTER_X = width / 2;
  const RING_CENTER_Y = height / 2 - 50;
  const RING_RADIUS = 120;

  const [sumo1Pos, setSumo1Pos] = useState({
    x: RING_CENTER_X - 100,
    y: RING_CENTER_Y,
  });

  const [sumo2Pos, setSumo2Pos] = useState({
    x: RING_CENTER_X + 100,
    y: RING_CENTER_Y,
  });

  const [sumo1Health, setSumo1Health] = useState(100);
  const [sumo2Health, setSumo2Health] = useState(100);
  const [sumo1Power, setSumo1Power] = useState(0);
  const [sumo2Power, setSumo2Power] = useState(0);

  // Tap counters for power building
  const [sumo1TapCount, setSumo1TapCount] = useState(0);
  const [sumo2TapCount, setSumo2TapCount] = useState(0);
  const tapTimeoutRef = useRef(null);

  // Animations
  const sumo1Scale = useRef(new Animated.Value(1)).current;
  const sumo2Scale = useRef(new Animated.Value(1)).current;
  const sumo1Shake = useRef(new Animated.Value(0)).current;
  const sumo2Shake = useRef(new Animated.Value(0)).current;
  const sumo1Glow = useRef(new Animated.Value(0)).current;
  const sumo2Glow = useRef(new Animated.Value(0)).current;

  // Game timer
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

  // Power decay
  useEffect(() => {
    if (!gameActive) return;

    const powerInterval = setInterval(() => {
      setSumo1Power((prev) => Math.max(0, prev - 0.5));
      setSumo2Power((prev) => Math.max(0, prev - 0.5));
    }, 100);

    return () => clearInterval(powerInterval);
  }, [gameActive]);

  // Check if wrestler is out of ring
  const isOutOfRing = (x, y) => {
    const distFromCenter = Math.sqrt(
      Math.pow(x - RING_CENTER_X, 2) + Math.pow(y - RING_CENTER_Y, 2)
    );
    return distFromCenter > RING_RADIUS;
  };

  // Sumo 1 charge
  const handleSumo1Charge = () => {
    if (!gameActive) return;

    setSumo1TapCount((prev) => prev + 1);

    // Glow animation
    Animated.sequence([
      Animated.timing(sumo1Glow, {
        toValue: 1,
        duration: 100,
        useNativeDriver: false,
      }),
      Animated.timing(sumo1Glow, {
        toValue: 0,
        duration: 100,
        useNativeDriver: false,
      }),
    ]).start();

    // Build power
    setSumo1Power((prev) => Math.min(100, prev + 10));

    // Clear previous timeout
    if (tapTimeoutRef.current) {
      clearTimeout(tapTimeoutRef.current);
    }

    // Reset count after 1 second of no taps
    tapTimeoutRef.current = setTimeout(() => {
      setSumo1TapCount(0);
    }, 1000);
  };

  // Sumo 2 charge
  const handleSumo2Charge = () => {
    if (!gameActive) return;

    setSumo2TapCount((prev) => prev + 1);

    // Glow animation
    Animated.sequence([
      Animated.timing(sumo2Glow, {
        toValue: 1,
        duration: 100,
        useNativeDriver: false,
      }),
      Animated.timing(sumo2Glow, {
        toValue: 0,
        duration: 100,
        useNativeDriver: false,
      }),
    ]).start();

    // Build power
    setSumo2Power((prev) => Math.min(100, prev + 10));

    // Clear previous timeout
    if (tapTimeoutRef.current) {
      clearTimeout(tapTimeoutRef.current);
    }

    // Reset count after 1 second of no taps
    tapTimeoutRef.current = setTimeout(() => {
      setSumo2TapCount(0);
    }, 1000);
  };

  // Sumo 1 attack
  const handleSumo1Attack = () => {
    if (!gameActive || sumo1Power < 30) {
      Alert.alert('⚠️ Not Enough Power!', 'Keep tapping to build power', [
        { text: 'OK', onPress: () => {} },
      ]);
      return;
    }

    // Attack animation
    Animated.sequence([
      Animated.timing(sumo1Scale, {
        toValue: 1.2,
        duration: 150,
        useNativeDriver: false,
      }),
      Animated.timing(sumo1Scale, {
        toValue: 1,
        duration: 150,
        useNativeDriver: false,
      }),
    ]).start();

    // Calculate push distance based on power
    const pushDistance = (sumo1Power / 100) * 80;
    const pushAngle = Math.atan2(
      sumo2Pos.y - sumo1Pos.y,
      sumo2Pos.x - sumo1Pos.x
    );

    // New position for sumo 2
    const newX = sumo2Pos.x + Math.cos(pushAngle) * pushDistance;
    const newY = sumo2Pos.y + Math.sin(pushAngle) * pushDistance;

    // Shake animation for sumo 2
    Animated.sequence([
      Animated.timing(sumo2Shake, {
        toValue: 20,
        duration: 100,
        useNativeDriver: false,
      }),
      Animated.timing(sumo2Shake, {
        toValue: -20,
        duration: 100,
        useNativeDriver: false,
      }),
      Animated.timing(sumo2Shake, {
        toValue: 0,
        duration: 100,
        useNativeDriver: false,
      }),
    ]).start();

    // Check if out of ring
    if (isOutOfRing(newX, newY)) {
      setSumo2Health(0);
      setScores((prev) => ({
        ...prev,
        player1: prev.player1 + 100 + Math.round(sumo1Power),
      }));
      Alert.alert(
        '🤼 Player 1 Wins!',
        `Sumo 2 was pushed out!\nDamage: ${Math.round(sumo1Power)}`,
        [{ text: 'Continue', onPress: endRound }]
      );
    } else {
      // Normal push
      setSumo2Pos({ x: newX, y: newY });

      const damage = Math.round(sumo1Power / 2);
      setSumo2Health((prev) => Math.max(0, prev - damage));

      setScores((prev) => ({
        ...prev,
        player1: prev.player1 + 10 + Math.round(sumo1Power / 5),
      }));

      Alert.alert('💥 Hit!', `Damage: ${damage} HP`, [
        { text: 'OK', onPress: () => {} },
      ]);
    }

    setSumo1Power(0);
    setSumo1TapCount(0);
  };

  // Sumo 2 attack
  const handleSumo2Attack = () => {
    if (!gameActive || sumo2Power < 30) {
      Alert.alert('⚠️ Not Enough Power!', 'Keep tapping to build power', [
        { text: 'OK', onPress: () => {} },
      ]);
      return;
    }

    // Attack animation
    Animated.sequence([
      Animated.timing(sumo2Scale, {
        toValue: 1.2,
        duration: 150,
        useNativeDriver: false,
      }),
      Animated.timing(sumo2Scale, {
        toValue: 1,
        duration: 150,
        useNativeDriver: false,
      }),
    ]).start();

    // Calculate push distance based on power
    const pushDistance = (sumo2Power / 100) * 80;
    const pushAngle = Math.atan2(
      sumo1Pos.y - sumo2Pos.y,
      sumo1Pos.x - sumo2Pos.x
    );

    // New position for sumo 1
    const newX = sumo1Pos.x + Math.cos(pushAngle) * pushDistance;
    const newY = sumo1Pos.y + Math.sin(pushAngle) * pushDistance;

    // Shake animation for sumo 1
    Animated.sequence([
      Animated.timing(sumo1Shake, {
        toValue: 20,
        duration: 100,
        useNativeDriver: false,
      }),
      Animated.timing(sumo1Shake, {
        toValue: -20,
        duration: 100,
        useNativeDriver: false,
      }),
      Animated.timing(sumo1Shake, {
        toValue: 0,
        duration: 100,
        useNativeDriver: false,
      }),
    ]).start();

    // Check if out of ring
    if (isOutOfRing(newX, newY)) {
      setSumo1Health(0);
      setScores((prev) => ({
        ...prev,
        player2: prev.player2 + 100 + Math.round(sumo2Power),
      }));
      Alert.alert(
        '🤼 Player 2 Wins!',
        `Sumo 1 was pushed out!\nDamage: ${Math.round(sumo2Power)}`,
        [{ text: 'Continue', onPress: endRound }]
      );
    } else {
      // Normal push
      setSumo1Pos({ x: newX, y: newY });

      const damage = Math.round(sumo2Power / 2);
      setSumo1Health((prev) => Math.max(0, prev - damage));

      setScores((prev) => ({
        ...prev,
        player2: prev.player2 + 10 + Math.round(sumo2Power / 5),
      }));

      Alert.alert('💥 Hit!', `Damage: ${damage} HP`, [
        { text: 'OK', onPress: () => {} },
      ]);
    }

    setSumo2Power(0);
    setSumo2TapCount(0);
  };

  // Check win conditions
  useEffect(() => {
    if (sumo1Health <= 0 || sumo2Health <= 0) {
      endRound();
    }
  }, [sumo1Health, sumo2Health]);

  const endRound = () => {
    setGameActive(false);

    let winner = '';
    if (sumo1Health > sumo2Health) {
      winner = 'Player 1 (Red Sumo) 🤼';
      setScores((prev) => ({ ...prev, player1: prev.player1 + 100 }));
    } else if (sumo2Health > sumo1Health) {
      winner = 'Player 2 (Blue Sumo) 🤼';
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
    setGameTime(60);
    setSumo1Pos({ x: RING_CENTER_X - 100, y: RING_CENTER_Y });
    setSumo2Pos({ x: RING_CENTER_X + 100, y: RING_CENTER_Y });
    setSumo1Health(100);
    setSumo2Health(100);
    setSumo1Power(0);
    setSumo2Power(0);
    setSumo1TapCount(0);
    setSumo2TapCount(0);
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
        <Text style={styles.title}>Sumo Battle</Text>
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
          <Text style={styles.timer}>{gameTime}s</Text>
          <Text style={styles.round}>Round {round}</Text>
        </View>

        <View style={styles.scoreItem}>
          <Text style={styles.playerLabel}>Player 2</Text>
          <Text style={[styles.scoreValue, { color: COLORS.player2 }]}>
            {scores.player2}
          </Text>
        </View>
      </View>

      {/* Health Bars */}
      <View style={styles.healthBarsContainer}>
        <View style={styles.healthBar}>
          <View
            style={[
              styles.healthFill,
              {
                width: `${sumo1Health}%`,
                backgroundColor: COLORS.player1,
              },
            ]}
          />
        </View>
        <View style={styles.healthBar}>
          <View
            style={[
              styles.healthFill,
              {
                width: `${sumo2Health}%`,
                backgroundColor: COLORS.player2,
              },
            ]}
          />
        </View>
      </View>

      {/* Sumo Ring */}
      <View style={styles.ringContainer}>
        {/* Ring border */}
        <View style={styles.ring} />

        {/* Sumo 1 (Red) */}
        <Animated.View
          style={[
            styles.sumo,
            styles.sumo1,
            {
              left: sumo1Pos.x - 40,
              top: sumo1Pos.y - 40,
              transform: [
                { scale: sumo1Scale },
                { translateX: sumo1Shake },
              ],
              opacity: sumo1Glow.interpolate({
                inputRange: [0, 1],
                outputRange: [1, 0.7],
              }),
            },
          ]}
        >
          <Text style={styles.sumoEmoji}>🤼</Text>
        </Animated.View>

        {/* Sumo 2 (Blue) */}
        <Animated.View
          style={[
            styles.sumo,
            styles.sumo2,
            {
              left: sumo2Pos.x - 40,
              top: sumo2Pos.y - 40,
              transform: [
                { scale: sumo2Scale },
                { translateX: sumo2Shake },
              ],
              opacity: sumo2Glow.interpolate({
                inputRange: [0, 1],
                outputRange: [1, 0.7],
              }),
            },
          ]}
        >
          <Text style={styles.sumoEmoji}>🤼</Text>
        </Animated.View>
      </View>

      {/* Power Meters */}
      <View style={styles.powerMetersContainer}>
        <View style={styles.powerMeterBox}>
          <Text style={styles.powerLabel}>P1 Power</Text>
          <View style={styles.powerMeter}>
            <View
              style={[
                styles.powerFill,
                {
                  width: `${sumo1Power}%`,
                  backgroundColor: COLORS.player1,
                },
              ]}
            />
          </View>
          <Text style={styles.powerValue}>{Math.round(sumo1Power)}%</Text>
        </View>

        <View style={styles.powerMeterBox}>
          <Text style={styles.powerLabel}>P2 Power</Text>
          <View style={styles.powerMeter}>
            <View
              style={[
                styles.powerFill,
                {
                  width: `${sumo2Power}%`,
                  backgroundColor: COLORS.player2,
                },
              ]}
            />
          </View>
          <Text style={styles.powerValue}>{Math.round(sumo2Power)}%</Text>
        </View>
      </View>

      {/* Controls */}
      <View style={styles.controlsContainer}>
        {/* Player 1 Controls */}
        <View style={styles.playerControls}>
          <TouchableOpacity
            style={[styles.tapBtn, { backgroundColor: COLORS.player1 }]}
            onPress={handleSumo1Charge}
            disabled={!gameActive}
          >
            <Text style={styles.tapBtnText}>💪 TAP</Text>
            <Text style={styles.tapCount}>{sumo1TapCount}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.attackBtn, { backgroundColor: COLORS.danger }]}
            onPress={handleSumo1Attack}
            disabled={!gameActive || sumo1Power < 30}
          >
            <Text style={styles.attackBtnText}>💥 ATTACK!</Text>
            <Text style={styles.powerRequired}>
              {sumo1Power >= 30 ? '✓ Ready' : `Need ${Math.round(30 - sumo1Power)}%`}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Player 2 Controls */}
        <View style={styles.playerControls}>
          <TouchableOpacity
            style={[styles.tapBtn, { backgroundColor: COLORS.player2 }]}
            onPress={handleSumo2Charge}
            disabled={!gameActive}
          >
            <Text style={styles.tapBtnText}>💪 TAP</Text>
            <Text style={styles.tapCount}>{sumo2TapCount}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.attackBtn, { backgroundColor: COLORS.danger }]}
            onPress={handleSumo2Attack}
            disabled={!gameActive || sumo2Power < 30}
          >
            <Text style={styles.attackBtnText}>💥 ATTACK!</Text>
            <Text style={styles.powerRequired}>
              {sumo2Power >= 30 ? '✓ Ready' : `Need ${Math.round(30 - sumo2Power)}%`}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <Text style={styles.statsText}>
          P1 Health: {Math.round(sumo1Health)}/100 | P2 Health: {Math.round(sumo2Health)}/100
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

  healthBarsContainer: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    gap: SPACING.sm,
  },
  healthBar: {
    height: 16,
    backgroundColor: '#E0E0E0',
    borderRadius: 8,
    overflow: 'hidden',
  },
  healthFill: { height: '100%' },

  ringContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginVertical: SPACING.lg,
    marginHorizontal: SPACING.lg,
  },

  ring: {
    width: 260,
    height: 260,
    borderRadius: 130,
    borderWidth: 4,
    borderColor: COLORS.primary,
    backgroundColor: '#FFFACD',
    position: 'absolute',
  },

  sumo: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
  },

  sumo1: {
    borderColor: COLORS.player1,
    backgroundColor: '#FFE5E5',
  },

  sumo2: {
    borderColor: COLORS.player2,
    backgroundColor: '#E5F5F7',
  },

  sumoEmoji: { fontSize: 50 },

  powerMetersContainer: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    gap: SPACING.md,
  },

  powerMeterBox: { flex: 1 },
  powerLabel: { fontSize: 12, fontWeight: 'bold', color: COLORS.text, marginBottom: SPACING.xs },
  powerMeter: {
    height: 20,
    backgroundColor: '#DDD',
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: SPACING.xs,
  },
  powerFill: { height: '100%' },
  powerValue: { fontSize: 12, fontWeight: 'bold', color: COLORS.primary, textAlign: 'center' },

  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    gap: SPACING.md,
  },

  playerControls: { flex: 1, gap: SPACING.sm },

  tapBtn: {
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
  },

  tapBtnText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
  },

  tapCount: {
    fontSize: 12,
    color: '#FFF',
    marginTop: SPACING.xs,
  },

  attackBtn: {
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
  },

  attackBtnText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
  },

  powerRequired: {
    fontSize: 11,
    color: '#FFF',
    marginTop: SPACING.xs,
  },

  statsContainer: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.cardBg,
  },

  statsText: {
    fontSize: 12,
    color: COLORS.textLight,
    textAlign: 'center',
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