import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  SafeAreaView,
  Dimensions,
  PanResponder,
  Animated,
} from 'react-native';
import { COLORS, SPACING, BORDER_RADIUS } from '../styles/theme';

const { width, height } = Dimensions.get('window');

export default function PaintFightGame({ navigation }) {
  const [scores, setScores] = useState({ player1: 0, player2: 0 });
  const [round, setRound] = useState(1);
  const [gameActive, setGameActive] = useState(true);
  const [gameTime, setGameTime] = useState(60);

  // Canvas coverage tracking (0-100%)
  const [player1Coverage, setPlayer1Coverage] = useState(0);
  const [player2Coverage, setPlayer2Coverage] = useState(0);

  // Paint trails for each player
  const [paintTrails1, setPaintTrails1] = useState([]);
  const [paintTrails2, setPaintTrails2] = useState([]);

  // Ammo/Paint remaining
  const [player1Paint, setPlayer1Paint] = useState(100);
  const [player2Paint, setPlayer2Paint] = useState(100);

  // Position on canvas
  const [player1Pos, setPlayer1Pos] = useState({
    x: width * 0.25,
    y: height * 0.4,
  });
  const [player2Pos, setPlayer2Pos] = useState({
    x: width * 0.75,
    y: height * 0.4,
  });

  // Power ups
  const [powerUps, setPowerUps] = useState([]);
  const [player1Powerup, setPlayer1Powerup] = useState(null);
  const [player2Powerup, setPlayer2Powerup] = useState(null);

  // Animations
  const player1Scale = useRef(new Animated.Value(1)).current;
  const player2Scale = useRef(new Animated.Value(1)).current;

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

  // Regenerate paint over time
  useEffect(() => {
    if (!gameActive) return;

    const paintTimer = setInterval(() => {
      setPlayer1Paint((prev) => Math.min(100, prev + 2));
      setPlayer2Paint((prev) => Math.min(100, prev + 2));
    }, 1000);

    return () => clearInterval(paintTimer);
  }, [gameActive]);

  // Generate random power-ups
  useEffect(() => {
    if (!gameActive) return;

    const powerUpInterval = setInterval(() => {
      if (Math.random() < 0.3 && powerUps.length < 5) {
        const newPowerUp = {
          id: Date.now(),
          x: Math.random() * (width - 80) + 40,
          y: Math.random() * (height * 0.5 - 100) + 150,
          type: Math.random() > 0.5 ? 'speed' : 'paint', // 'speed' or 'paint'
        };
        setPowerUps((prev) => [...prev, newPowerUp]);
      }
    }, 3000);

    return () => clearInterval(powerUpInterval);
  }, [gameActive, powerUps.length]);

  // Paint with spray
  const handlePlayer1Paint = () => {
    if (!gameActive || player1Paint < 5) return;

    // Use paint
    setPlayer1Paint((prev) => Math.max(0, prev - 5));

    // Create paint splash
    const newTrail = {
      id: Date.now(),
      x: player1Pos.x,
      y: player1Pos.y,
      radius: 40,
      color: COLORS.player1,
      opacity: 1,
    };

    setPaintTrails1((prev) => [...prev, newTrail]);

    // Update coverage
    const areaInPixels = Math.PI * 40 * 40; // Circle area
    const canvasArea = width * height * 0.5; // Game area
    const coverage = (areaInPixels / canvasArea) * 100;
    setPlayer1Coverage((prev) => Math.min(100, prev + coverage / 10));

    // Animate spray
    Animated.sequence([
      Animated.timing(player1Scale, {
        toValue: 1.2,
        duration: 100,
        useNativeDriver: false,
      }),
      Animated.timing(player1Scale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: false,
      }),
    ]).start();

    // Remove old trails after animation
    setTimeout(() => {
      setPaintTrails1((prev) =>
        prev.filter((trail) => trail.id !== newTrail.id)
      );
    }, 2000);
  };

  const handlePlayer2Paint = () => {
    if (!gameActive || player2Paint < 5) return;

    // Use paint
    setPlayer2Paint((prev) => Math.max(0, prev - 5));

    // Create paint splash
    const newTrail = {
      id: Date.now() + Math.random(),
      x: player2Pos.x,
      y: player2Pos.y,
      radius: 40,
      color: COLORS.player2,
      opacity: 1,
    };

    setPaintTrails2((prev) => [...prev, newTrail]);

    // Update coverage
    const areaInPixels = Math.PI * 40 * 40;
    const canvasArea = width * height * 0.5;
    const coverage = (areaInPixels / canvasArea) * 100;
    setPlayer2Coverage((prev) => Math.min(100, prev + coverage / 10));

    // Animate spray
    Animated.sequence([
      Animated.timing(player2Scale, {
        toValue: 1.2,
        duration: 100,
        useNativeDriver: false,
      }),
      Animated.timing(player2Scale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: false,
      }),
    ]).start();

    // Remove old trails after animation
    setTimeout(() => {
      setPaintTrails2((prev) =>
        prev.filter((trail) => trail.id !== newTrail.id)
      );
    }, 2000);
  };

  // Move player 1
  const handlePlayer1Move = (direction) => {
    if (!gameActive) return;

    const moveDistance = 40;
    setPlayer1Pos((prev) => {
      let newPos = { ...prev };

      switch (direction) {
        case 'up':
          newPos.y = Math.max(150, prev.y - moveDistance);
          break;
        case 'down':
          newPos.y = Math.min(height - 100, prev.y + moveDistance);
          break;
        case 'left':
          newPos.x = Math.max(40, prev.x - moveDistance);
          break;
        case 'right':
          newPos.x = Math.min(width * 0.5 - 40, prev.x + moveDistance);
          break;
      }

      return newPos;
    });
  };

  // Move player 2
  const handlePlayer2Move = (direction) => {
    if (!gameActive) return;

    const moveDistance = 40;
    setPlayer2Pos((prev) => {
      let newPos = { ...prev };

      switch (direction) {
        case 'up':
          newPos.y = Math.max(150, prev.y - moveDistance);
          break;
        case 'down':
          newPos.y = Math.min(height - 100, prev.y + moveDistance);
          break;
        case 'left':
          newPos.x = Math.max(width * 0.5 + 40, prev.x - moveDistance);
          break;
        case 'right':
          newPos.x = Math.min(width - 40, prev.x + moveDistance);
          break;
      }

      return newPos;
    });
  };

  // Power-up collision
  const checkPowerUpCollision = () => {
    powerUps.forEach((powerUp) => {
      // Check player 1
      const dist1 = Math.sqrt(
        Math.pow(player1Pos.x - powerUp.x, 2) +
          Math.pow(player1Pos.y - powerUp.y, 2)
      );

      if (dist1 < 50) {
        if (powerUp.type === 'paint') {
          setPlayer1Paint(100);
          setPlayer1Powerup('paint');
        } else {
          setPlayer1Powerup('speed');
        }
        setPowerUps((prev) => prev.filter((p) => p.id !== powerUp.id));

        setTimeout(() => setPlayer1Powerup(null), 3000);
      }

      // Check player 2
      const dist2 = Math.sqrt(
        Math.pow(player2Pos.x - powerUp.x, 2) +
          Math.pow(player2Pos.y - powerUp.y, 2)
      );

      if (dist2 < 50) {
        if (powerUp.type === 'paint') {
          setPlayer2Paint(100);
          setPlayer2Powerup('paint');
        } else {
          setPlayer2Powerup('speed');
        }
        setPowerUps((prev) => prev.filter((p) => p.id !== powerUp.id));

        setTimeout(() => setPlayer2Powerup(null), 3000);
      }
    });
  };

  useEffect(() => {
    checkPowerUpCollision();
  }, [player1Pos, player2Pos]);

  const endRound = () => {
    setGameActive(false);

    let winner = '';
    if (player1Coverage > player2Coverage) {
      winner = 'Player 1 (Red) 🎨';
      setScores((prev) => ({ ...prev, player1: prev.player1 + 50 }));
    } else if (player2Coverage > player1Coverage) {
      winner = 'Player 2 (Cyan) 🎨';
      setScores((prev) => ({ ...prev, player2: prev.player2 + 50 }));
    } else {
      winner = 'Draw 🤝';
    }

    Alert.alert(
      `Round ${round} Over!`,
      `${winner}\nP1 Coverage: ${Math.round(player1Coverage)}%\nP2 Coverage: ${Math.round(player2Coverage)}%`,
      [
        { text: 'Next Round', onPress: nextRound },
        { text: 'End Game', onPress: () => navigation.goBack() },
      ]
    );
  };

  const nextRound = () => {
    setRound(round + 1);
    setGameTime(60);
    setPlayer1Coverage(0);
    setPlayer2Coverage(0);
    setPlayer1Paint(100);
    setPlayer2Paint(100);
    setPlayer1Pos({ x: width * 0.25, y: height * 0.4 });
    setPlayer2Pos({ x: width * 0.75, y: height * 0.4 });
    setPaintTrails1([]);
    setPaintTrails2([]);
    setPowerUps([]);
    setPlayer1Powerup(null);
    setPlayer2Powerup(null);
    setGameActive(true);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backBtn}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Paint Fight</Text>
        <View style={{ width: 50 }} />
      </View>

      {/* Top Info Bar */}
      <View style={styles.topBar}>
        <View style={styles.playerInfo}>
          <Text style={styles.playerLabel}>Player 1</Text>
          <Text style={[styles.coverage, { color: COLORS.player1 }]}>
            {Math.round(player1Coverage)}%
          </Text>
        </View>

        <View style={styles.timerBox}>
          <Text style={styles.timer}>{gameTime}s</Text>
          <Text style={styles.round}>Round {round}</Text>
        </View>

        <View style={styles.playerInfo}>
          <Text style={styles.playerLabel}>Player 2</Text>
          <Text style={[styles.coverage, { color: COLORS.player2 }]}>
            {Math.round(player2Coverage)}%
          </Text>
        </View>
      </View>

      {/* Game Canvas */}
      <View style={styles.gameCanvas}>
        {/* Player 1 Side */}
        <View style={styles.playerSide}>
          {/* Paint trails */}
          {paintTrails1.map((trail) => (
            <View
              key={trail.id}
              style={[
                styles.paintSplash,
                {
                  left: trail.x - trail.radius,
                  top: trail.y - trail.radius,
                  width: trail.radius * 2,
                  height: trail.radius * 2,
                  backgroundColor: trail.color,
                  opacity: trail.opacity,
                },
              ]}
            />
          ))}

          {/* Player 1 */}
          <Animated.View
            style={[
              styles.player,
              {
                left: player1Pos.x - 25,
                top: player1Pos.y - 25,
                transform: [{ scale: player1Scale }],
              },
            ]}
          >
            <View style={[styles.playerBody, { backgroundColor: COLORS.player1 }]}>
              <Text style={styles.playerEmoji}>🎨</Text>
            </View>
            {player1Powerup && (
              <View style={styles.powerUpBadge}>
                <Text style={styles.powerUpText}>
                  {player1Powerup === 'paint' ? '🪣' : '⚡'}
                </Text>
              </View>
            )}
          </Animated.View>
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Player 2 Side */}
        <View style={styles.playerSide}>
          {/* Paint trails */}
          {paintTrails2.map((trail) => (
            <View
              key={trail.id}
              style={[
                styles.paintSplash,
                {
                  left: trail.x - trail.radius,
                  top: trail.y - trail.radius,
                  width: trail.radius * 2,
                  height: trail.radius * 2,
                  backgroundColor: trail.color,
                  opacity: trail.opacity,
                },
              ]}
            />
          ))}

          {/* Player 2 */}
          <Animated.View
            style={[
              styles.player,
              {
                left: player2Pos.x - 25,
                top: player2Pos.y - 25,
                transform: [{ scale: player2Scale }],
              },
            ]}
          >
            <View style={[styles.playerBody, { backgroundColor: COLORS.player2 }]}>
              <Text style={styles.playerEmoji}>🎨</Text>
            </View>
            {player2Powerup && (
              <View style={styles.powerUpBadge}>
                <Text style={styles.powerUpText}>
                  {player2Powerup === 'paint' ? '🪣' : '⚡'}
                </Text>
              </View>
            )}
          </Animated.View>
        </View>

        {/* Power ups */}
        {powerUps.map((powerUp) => (
          <View
            key={powerUp.id}
            style={[
              styles.powerUp,
              {
                left: powerUp.x - 15,
                top: powerUp.y - 15,
              },
            ]}
          >
            <Text style={styles.powerUpIcon}>
              {powerUp.type === 'paint' ? '🪣' : '⚡'}
            </Text>
          </View>
        ))}
      </View>

      {/* Paint Meters */}
      <View style={styles.paintMetersContainer}>
        <View style={styles.paintMeterBox}>
          <Text style={styles.meterLabel}>P1 Paint</Text>
          <View style={styles.paintMeter}>
            <View
              style={[
                styles.paintFill,
                {
                  width: `${player1Paint}%`,
                  backgroundColor: COLORS.player1,
                },
              ]}
            />
          </View>
          <Text style={styles.meterValue}>{Math.round(player1Paint)}%</Text>
        </View>

        <View style={styles.paintMeterBox}>
          <Text style={styles.meterLabel}>P2 Paint</Text>
          <View style={styles.paintMeter}>
            <View
              style={[
                styles.paintFill,
                {
                  width: `${player2Paint}%`,
                  backgroundColor: COLORS.player2,
                },
              ]}
            />
          </View>
          <Text style={styles.meterValue}>{Math.round(player2Paint)}%</Text>
        </View>
      </View>

      {/* Controls */}
      <View style={styles.controlsContainer}>
        <View style={styles.playerControls}>
          <TouchableOpacity
            style={styles.moveBtn}
            onPress={() => handlePlayer1Move('up')}
          >
            <Text style={styles.arrowText}>⬆️</Text>
          </TouchableOpacity>
          <View style={styles.rowControls}>
            <TouchableOpacity
              style={styles.moveBtn}
              onPress={() => handlePlayer1Move('left')}
            >
              <Text style={styles.arrowText}>⬅️</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.sprayBtn, { backgroundColor: COLORS.player1 }]}
              onPress={handlePlayer1Paint}
            >
              <Text style={styles.sprayText}>🎨</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.moveBtn}
              onPress={() => handlePlayer1Move('right')}
            >
              <Text style={styles.arrowText}>➡️</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={styles.moveBtn}
            onPress={() => handlePlayer1Move('down')}
          >
            <Text style={styles.arrowText}>⬇️</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.playerControls}>
          <TouchableOpacity
            style={styles.moveBtn}
            onPress={() => handlePlayer2Move('up')}
          >
            <Text style={styles.arrowText}>⬆️</Text>
          </TouchableOpacity>
          <View style={styles.rowControls}>
            <TouchableOpacity
              style={styles.moveBtn}
              onPress={() => handlePlayer2Move('left')}
            >
              <Text style={styles.arrowText}>⬅️</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.sprayBtn, { backgroundColor: COLORS.player2 }]}
              onPress={handlePlayer2Paint}
            >
              <Text style={styles.sprayText}>🎨</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.moveBtn}
              onPress={() => handlePlayer2Move('right')}
            >
              <Text style={styles.arrowText}>➡️</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={styles.moveBtn}
            onPress={() => handlePlayer2Move('down')}
          >
            <Text style={styles.arrowText}>⬇️</Text>
          </TouchableOpacity>
        </View>
      </View>

      {!gameActive && (
        <View style={styles.gameOverButtons}>
          <TouchableOpacity style={styles.nextRoundBtn} onPress={nextRound}>
            <Text style={styles.nextRoundText}>Next Round</Text>
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
  playerInfo: { alignItems: 'center' },
  playerLabel: { fontSize: 12, color: COLORS.textLight },
  coverage: { fontSize: 24, fontWeight: 'bold' },
  timerBox: { alignItems: 'center' },
  timer: { fontSize: 28, fontWeight: 'bold', color: COLORS.danger },
  round: { fontSize: 12, color: COLORS.textLight },

  gameCanvas: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#F0F0F0',
    marginVertical: SPACING.md,
    marginHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
  },

  playerSide: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
  },

  player: {
    position: 'absolute',
    width: 50,
    height: 50,
  },
  playerBody: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playerEmoji: { fontSize: 30 },

  powerUpBadge: {
    position: 'absolute',
    top: -10,
    right: -10,
    backgroundColor: COLORS.warning,
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  powerUpText: { fontSize: 16 },

  paintSplash: {
    position: 'absolute',
    borderRadius: 9999,
    opacity: 0.6,
  },

  divider: {
    width: 3,
    height: '100%',
    backgroundColor: COLORS.primary,
  },

  powerUp: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.warning,
    zIndex: 50,
  },
  powerUpIcon: { fontSize: 20 },

  paintMetersContainer: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  paintMeterBox: { flex: 1 },
  meterLabel: { fontSize: 12, fontWeight: 'bold', color: COLORS.text, marginBottom: SPACING.xs },
  paintMeter: {
    height: 20,
    backgroundColor: '#DDD',
    borderRadius: BORDER_RADIUS.sm,
    overflow: 'hidden',
    marginBottom: SPACING.xs,
  },
  paintFill: { height: '100%' },
  meterValue: { fontSize: 12, color: COLORS.textLight, textAlign: 'center' },

  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.lg,
    gap: SPACING.md,
  },
  playerControls: { alignItems: 'center', gap: SPACING.sm },
  moveBtn: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.cardBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  arrowText: { fontSize: 24 },
  rowControls: { flexDirection: 'row', gap: SPACING.sm },
  sprayBtn: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sprayText: { fontSize: 32 },

  gameOverButtons: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.lg,
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
});