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

export default function FrogFightGame({ navigation }) {
  const [scores, setScores] = useState({ player1: 0, player2: 0 });
  const [gameActive, setGameActive] = useState(true);
  const [round, setRound] = useState(1);
  const [gameTime, setGameTime] = useState(30);

  // Frog 1 (Player 1) - Left side
  const [frog1Pos, setFrog1Pos] = useState({ x: 50, y: height / 2 - 100 });
  const [frog1Health, setFrog1Health] = useState(100);
  const [frog1Defense, setFrog1Defense] = useState(false);

  // Frog 2 (Player 2) - Right side
  const [frog2Pos, setFrog2Pos] = useState({ x: width - 150, y: height / 2 - 100 });
  const [frog2Health, setFrog2Health] = useState(100);
  const [frog2Defense, setFrog2Defense] = useState(false);

  // Animation values
  const frog1Bounce = useRef(new Animated.Value(0)).current;
  const frog2Bounce = useRef(new Animated.Value(0)).current;
  const frog1Hit = useRef(new Animated.Value(0)).current;
  const frog2Hit = useRef(new Animated.Value(0)).current;

  // Game timer
  useEffect(() => {
    if (!gameActive) return;

    const timer = setInterval(() => {
      setGameTime((prev) => {
        if (prev <= 1) {
          endRound();
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameActive]);

  // Check for collisions and attacks
  const checkCollision = (pos1, pos2) => {
    const distance = Math.sqrt(
      Math.pow(pos1.x - pos2.x, 2) + Math.pow(pos1.y - pos2.y, 2)
    );
    return distance < 80;
  };

  const handleFrog1Attack = () => {
    if (!gameActive || frog1Defense) return;

    // Jump animation
    Animated.sequence([
      Animated.timing(frog1Bounce, {
        toValue: -30,
        duration: 200,
        useNativeDriver: false,
      }),
      Animated.timing(frog1Bounce, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }),
    ]).start();

    // Move frog forward
    const newPos = { ...frog1Pos, x: frog1Pos.x + 60 };

    // Check collision
    if (checkCollision(newPos, frog2Pos)) {
      // Hit animation
      Animated.sequence([
        Animated.timing(frog2Hit, {
          toValue: 10,
          duration: 100,
          useNativeDriver: false,
        }),
        Animated.timing(frog2Hit, {
          toValue: 0,
          duration: 100,
          useNativeDriver: false,
        }),
      ]).start();

      // Calculate damage
      const damage = frog2Defense ? 5 : 15;
      setFrog2Health((prev) => Math.max(0, prev - damage));
      setScores((prev) => ({ ...prev, player1: prev.player1 + (damage === 15 ? 10 : 5) }));

      // Push frog2 back
      setFrog2Pos((prev) => ({
        ...prev,
        x: Math.min(width - 100, prev.x + 30),
      }));
    } else {
      // Move frog1 forward temporarily
      setFrog1Pos(newPos);
      setTimeout(() => {
        setFrog1Pos((prev) => ({ ...prev, x: Math.max(50, prev.x - 30) }));
      }, 300);
    }
  };

  const handleFrog2Attack = () => {
    if (!gameActive || frog2Defense) return;

    // Jump animation
    Animated.sequence([
      Animated.timing(frog2Bounce, {
        toValue: -30,
        duration: 200,
        useNativeDriver: false,
      }),
      Animated.timing(frog2Bounce, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }),
    ]).start();

    // Move frog backward
    const newPos = { ...frog2Pos, x: frog2Pos.x - 60 };

    // Check collision
    if (checkCollision(newPos, frog1Pos)) {
      // Hit animation
      Animated.sequence([
        Animated.timing(frog1Hit, {
          toValue: -10,
          duration: 100,
          useNativeDriver: false,
        }),
        Animated.timing(frog1Hit, {
          toValue: 0,
          duration: 100,
          useNativeDriver: false,
        }),
      ]).start();

      // Calculate damage
      const damage = frog1Defense ? 5 : 15;
      setFrog1Health((prev) => Math.max(0, prev - damage));
      setScores((prev) => ({ ...prev, player2: prev.player2 + (damage === 15 ? 10 : 5) }));

      // Push frog1 back
      setFrog1Pos((prev) => ({
        ...prev,
        x: Math.max(50, prev.x - 30),
      }));
    } else {
      // Move frog2 backward temporarily
      setFrog2Pos(newPos);
      setTimeout(() => {
        setFrog2Pos((prev) => ({ ...prev, x: Math.min(width - 100, prev.x + 30) }));
      }, 300);
    }
  };

  const handleFrog1Defense = () => {
    if (!gameActive) return;
    setFrog1Defense(true);
    setTimeout(() => setFrog1Defense(false), 2000);
  };

  const handleFrog2Defense = () => {
    if (!gameActive) return;
    setFrog2Defense(true);
    setTimeout(() => setFrog2Defense(false), 2000);
  };

  const handleFrog1Jump = () => {
    if (!gameActive) return;

    // Jump up
    Animated.sequence([
      Animated.timing(frog1Bounce, {
        toValue: -50,
        duration: 300,
        useNativeDriver: false,
      }),
      Animated.timing(frog1Bounce, {
        toValue: 0,
        duration: 300,
        useNativeDriver: false,
      }),
    ]).start();

    // Move frog randomly
    setFrog1Pos((prev) => ({
      ...prev,
      y: Math.max(100, Math.min(height - 250, prev.y + (Math.random() * 100 - 50))),
    }));
  };

  const handleFrog2Jump = () => {
    if (!gameActive) return;

    // Jump up
    Animated.sequence([
      Animated.timing(frog2Bounce, {
        toValue: -50,
        duration: 300,
        useNativeDriver: false,
      }),
      Animated.timing(frog2Bounce, {
        toValue: 0,
        duration: 300,
        useNativeDriver: false,
      }),
    ]).start();

    // Move frog randomly
    setFrog2Pos((prev) => ({
      ...prev,
      y: Math.max(100, Math.min(height - 250, prev.y + (Math.random() * 100 - 50))),
    }));
  };

  useEffect(() => {
    if (frog1Health <= 0 || frog2Health <= 0) {
      endRound();
    }
  }, [frog1Health, frog2Health]);

  const endRound = () => {
    setGameActive(false);

    let winner = '';
    if (frog1Health > frog2Health) {
      winner = 'Player 1 (Green Frog) 🐸';
      setScores((prev) => ({ ...prev, player1: prev.player1 + 50 }));
    } else if (frog2Health > frog1Health) {
      winner = 'Player 2 (Red Frog) 🐸';
      setScores((prev) => ({ ...prev, player2: prev.player2 + 50 }));
    } else {
      winner = 'Draw!';
    }

    Alert.alert(`Round ${round} Over!`, `${winner}`, [
      { text: 'Next Round', onPress: nextRound },
      { text: 'End Game', onPress: resetGame },
    ]);
  };

  const nextRound = () => {
    setRound(round + 1);
    setFrog1Health(100);
    setFrog2Health(100);
    setFrog1Pos({ x: 50, y: height / 2 - 100 });
    setFrog2Pos({ x: width - 150, y: height / 2 - 100 });
    setFrog1Defense(false);
    setFrog2Defense(false);
    setGameTime(30);
    setGameActive(true);
  };

  const resetGame = () => {
    setScores({ player1: 0, player2: 0 });
    setRound(1);
    setFrog1Health(100);
    setFrog2Health(100);
    setFrog1Pos({ x: 50, y: height / 2 - 100 });
    setFrog2Pos({ x: width - 150, y: height / 2 - 100 });
    setFrog1Defense(false);
    setFrog2Defense(false);
    setGameTime(30);
    setGameActive(true);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backBtn}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Frog Fight</Text>
        <View style={{ width: 50 }} />
      </View>

      {/* Scores and Time */}
      <View style={styles.topBar}>
        <View style={styles.scoreItem}>
          <Text style={styles.playerName}>🐸 Frog 1</Text>
          <Text style={[styles.scoreValue, { color: COLORS.player1 }]}>
            {scores.player1}
          </Text>
        </View>
        <View style={styles.timerBox}>
          <Text style={styles.timer}>{gameTime}s</Text>
          <Text style={styles.round}>Round {round}</Text>
        </View>
        <View style={styles.scoreItem}>
          <Text style={styles.playerName}>Frog 2 🐸</Text>
          <Text style={[styles.scoreValue, { color: COLORS.player2 }]}>
            {scores.player2}
          </Text>
        </View>
      </View>

      {/* Health Bars */}
      <View style={styles.healthContainer}>
        <View style={styles.healthBar}>
          <View style={styles.healthLabel}>
            <Text style={styles.healthText}>❤️ {frog1Health}</Text>
          </View>
          <View style={[styles.health, { width: `${frog1Health}%`, backgroundColor: COLORS.player1 }]} />
        </View>
        <View style={styles.healthBar}>
          <View style={[styles.health, { width: `${frog2Health}%`, backgroundColor: COLORS.player2 }]} />
          <View style={[styles.healthLabel, { marginLeft: 'auto' }]}>
            <Text style={styles.healthText}>{frog2Health} ❤️</Text>
          </View>
        </View>
      </View>

      {/* Game Area */}
      <View style={styles.gameArea}>
        {/* Frog 1 */}
        <Animated.View
          style={[
            styles.frog,
            {
              left: frog1Pos.x,
              top: frog1Pos.y,
              transform: [{ translateY: frog1Bounce }, { translateX: frog1Hit }],
            },
          ]}
        >
          <View style={[styles.frogBody, { backgroundColor: '#4ECDC4' }]}>
            <Text style={styles.frogEmoji}>🐸</Text>
          </View>
          {frog1Defense && <View style={styles.shield}>🛡️</View>}
        </Animated.View>

        {/* Frog 2 */}
        <Animated.View
          style={[
            styles.frog,
            {
              left: frog2Pos.x,
              top: frog2Pos.y,
              transform: [{ translateY: frog2Bounce }, { translateX: frog2Hit }],
            },
          ]}
        >
          <View style={[styles.frogBody, { backgroundColor: '#FF6B6B' }]}>
            <Text style={styles.frogEmoji}>🐸</Text>
          </View>
          {frog2Defense && <View style={styles.shield}>🛡️</View>}
        </Animated.View>

        {/* Center divider */}
        <View style={styles.divider} />
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        {/* Player 1 Controls */}
        <View style={styles.playerControls}>
          <TouchableOpacity
            style={[styles.btn, styles.attackBtn]}
            onPress={handleFrog1Attack}
            disabled={!gameActive}
          >
            <Text style={styles.btnText}>⚔️ Attack</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.btn, frog1Defense ? styles.defenseActiveBtn : styles.defenseBtn]}
            onPress={handleFrog1Defense}
            disabled={!gameActive}
          >
            <Text style={styles.btnText}>🛡️ Defend</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.btn, styles.jumpBtn]}
            onPress={handleFrog1Jump}
            disabled={!gameActive}
          >
            <Text style={styles.btnText}>🚀 Jump</Text>
          </TouchableOpacity>
        </View>

        {/* Player 2 Controls */}
        <View style={styles.playerControls}>
          <TouchableOpacity
            style={[styles.btn, styles.jumpBtn]}
            onPress={handleFrog2Jump}
            disabled={!gameActive}
          >
            <Text style={styles.btnText}>🚀 Jump</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.btn, frog2Defense ? styles.defenseActiveBtn : styles.defenseBtn]}
            onPress={handleFrog2Defense}
            disabled={!gameActive}
          >
            <Text style={styles.btnText}>🛡️ Defend</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.btn, styles.attackBtn]}
            onPress={handleFrog2Attack}
            disabled={!gameActive}
          >
            <Text style={styles.btnText}>⚔️ Attack</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Reset Button */}
      {!gameActive && (
        <TouchableOpacity style={styles.newGameBtn} onPress={resetGame}>
          <Text style={styles.newGameText}>New Game</Text>
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
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.cardBg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.shadow,
  },
  scoreItem: { alignItems: 'center', flex: 1 },
  playerName: { fontSize: 12, color: COLORS.textLight, marginBottom: SPACING.xs },
  scoreValue: { fontSize: 24, fontWeight: 'bold' },
  timerBox: { alignItems: 'center', paddingHorizontal: SPACING.lg },
  timer: { fontSize: 28, fontWeight: 'bold', color: COLORS.danger },
  round: { fontSize: 12, color: COLORS.textLight },
  healthContainer: { paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md, gap: SPACING.sm },
  healthBar: {
    height: 30,
    backgroundColor: '#DDD',
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
    position: 'relative',
  },
  health: { height: '100%' },
  healthLabel: { position: 'absolute', justifyContent: 'center', alignItems: 'center', height: 30 },
  healthText: { fontSize: 12, fontWeight: 'bold', color: '#FFF', paddingHorizontal: SPACING.sm },
  gameArea: {
    flex: 1,
    backgroundColor: '#E8F8F5',
    position: 'relative',
    overflow: 'hidden',
    marginHorizontal: SPACING.lg,
    marginVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
  },
  frog: { position: 'absolute', width: 80, height: 80 },
  frogBody: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center' },
  frogEmoji: { fontSize: 50 },
  shield: { position: 'absolute', fontSize: 40, top: -10, left: 15 },
  divider: { position: 'absolute', left: '50%', width: 2, height: '100%', backgroundColor: '#CCC' },
  controls: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    gap: SPACING.md,
  },
  playerControls: { flex: 1, gap: SPACING.sm },
  btn: { padding: SPACING.sm, borderRadius: BORDER_RADIUS.md, alignItems: 'center', paddingVertical: SPACING.md },
  attackBtn: { backgroundColor: COLORS.danger },
  defenseBtn: { backgroundColor: COLORS.accent },
  defenseActiveBtn: { backgroundColor: COLORS.success },
  jumpBtn: { backgroundColor: COLORS.warning },
  btnText: { fontSize: 12, fontWeight: 'bold', color: '#FFF' },
  newGameBtn: {
    backgroundColor: COLORS.primary,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
  },
  newGameText: { fontSize: 16, fontWeight: 'bold', color: '#FFF', textAlign: 'center' },
});