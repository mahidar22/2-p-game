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

export default function ShurikenBambooGame({ navigation }) {
  const [scores, setScores] = useState({ player1: 0, player2: 0 });
  const [round, setRound] = useState(1);
  const [gameActive, setGameActive] = useState(true);
  const [gameTime, setGameTime] = useState(60);
  const [currentPlayer, setCurrentPlayer] = useState(1);

  // Bamboo targets
  const [bamboos, setBamboos] = useState([
    { id: 1, x: width * 0.15, y: height * 0.3, hits: 0, maxHits: 3, destroyed: false },
    { id: 2, x: width * 0.35, y: height * 0.2, hits: 0, maxHits: 3, destroyed: false },
    { id: 3, x: width * 0.5, y: height * 0.35, hits: 0, maxHits: 3, destroyed: false },
    { id: 4, x: width * 0.65, y: height * 0.25, hits: 0, maxHits: 3, destroyed: false },
    { id: 5, x: width * 0.85, y: height * 0.3, hits: 0, maxHits: 3, destroyed: false },
  ]);

  // Shurikens thrown
  const [shurikens, setShurikens] = useState([]);
  const [thrownCount, setThrownCount] = useState(0);

  // Power meter
  const [powerLevel, setPowerLevel] = useState(50);
  const [powerIncreasing, setPowerIncreasing] = useState(true);

  // Accuracy tracker
  const [accuracyStats, setAccuracyStats] = useState({
    player1: { hits: 0, misses: 0 },
    player2: { hits: 0, misses: 0 },
  });

  // Animations
  const powerBarAnim = useRef(new Animated.Value(0)).current;
  const bambooScale = useRef(new Animated.Value(1)).current;
  const shurikenSpin = useRef(new Animated.Value(0)).current; // ✅ Fixed: removed space

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

  // Power meter animation
  useEffect(() => {
    const powerInterval = setInterval(() => {
      setPowerLevel((prev) => {
        if (powerIncreasing) {
          if (prev >= 100) {
            setPowerIncreasing(false);
            return 100;
          }
          return prev + 3;
        } else {
          if (prev <= 0) {
            setPowerIncreasing(true);
            return 0;
          }
          return prev - 3;
        }
      });
    }, 50);

    return () => clearInterval(powerInterval);
  }, [powerIncreasing]);

  // Shuriken physics
  useEffect(() => {
    if (!gameActive || shurikens.length === 0) return;

    const projectileInterval = setInterval(() => {
      setShurikens((prevShurikens) => {
        const updated = prevShurikens
          .map((shuriken) => ({
            ...shuriken,
            x: shuriken.x + shuriken.vx,
            y: shuriken.y + shuriken.vy,
            rotation: (shuriken.rotation + 15) % 360,
          }))
          .filter((shuriken) => {
            // Remove shurikens out of bounds
            return shuriken.x > 0 && shuriken.x < width && shuriken.y > 0 && shuriken.y < height;
          });

        // Check collisions with bamboos
        updated.forEach((shuriken) => {
          bamboos.forEach((bamboo) => {
            if (bamboo.destroyed) return;

            const dist = Math.sqrt(
              Math.pow(shuriken.x - bamboo.x, 2) +
                Math.pow(shuriken.y - bamboo.y, 2)
            );

            if (dist < 40) {
              // Hit detected
              setBamboos((prev) =>
                prev.map((b) => {
                  if (b.id === bamboo.id) {
                    const newHits = b.hits + 1;
                    const isDestroyed = newHits >= b.maxHits;

                    if (isDestroyed) {
                      // Bamboo destroyed animation
                      Animated.sequence([
                        Animated.timing(bambooScale, {
                          toValue: 1.3,
                          duration: 150,
                          useNativeDriver: false,
                        }),
                        Animated.timing(bambooScale, {
                          toValue: 0,
                          duration: 150,
                          useNativeDriver: false,
                        }),
                      ]).start();

                      // Award points
                      const points = 50 + powerLevel;
                      if (currentPlayer === 1) {
                        setScores((prev) => ({
                          ...prev,
                          player1: prev.player1 + points,
                        }));
                      } else {
                        setScores((prev) => ({
                          ...prev,
                          player2: prev.player2 + points,
                        }));
                      }

                      Alert.alert(
                        '🎋 Bamboo Destroyed!',
                        `${points} points!`,
                        [{ text: 'Continue', onPress: () => {} }]
                      );
                    } else {
                      // Just a hit
                      const hitPoints = 10 + Math.round(powerLevel / 2);
                      if (currentPlayer === 1) {
                        setScores((prev) => ({
                          ...prev,
                          player1: prev.player1 + hitPoints,
                        }));
                        setAccuracyStats((prev) => ({
                          ...prev,
                          player1: {
                            ...prev.player1,
                            hits: prev.player1.hits + 1,
                          },
                        }));
                      } else {
                        setScores((prev) => ({
                          ...prev,
                          player2: prev.player2 + hitPoints,
                        }));
                        setAccuracyStats((prev) => ({
                          ...prev,
                          player2: {
                            ...prev.player2,
                            hits: prev.player2.hits + 1,
                          },
                        }));
                      }

                      Alert.alert('🔪 Hit!', `${hitPoints} points!`, [
                        { text: 'Continue', onPress: () => {} },
                      ]);
                    }

                    return { ...b, hits: newHits, destroyed: isDestroyed };
                  }
                  return b;
                })
              );

              // Remove shuriken on hit
              return -1;
            }
          });
        });

        return updated.filter((_, i) => i !== -1);
      });
    }, 30);

    return () => clearInterval(projectileInterval);
  }, [gameActive, shurikens, bamboos, currentPlayer, powerLevel]);

  // Throw shuriken
  const handleThrow = (angle) => {
    if (!gameActive || thrownCount >= 5) {
      Alert.alert('⚠️ No throws left!', 'End of turn', [
        { text: 'Next Player', onPress: switchPlayer },
      ]);
      return;
    }

    // Spin animation
    Animated.timing(shurikenSpin, { // ✅ Fixed: removed space
      toValue: 360,
      duration: 500,
      useNativeDriver: false,
    }).start();

    // Create shuriken
    const speed = 6 + (powerLevel / 100) * 4;
    const radians = (angle * Math.PI) / 180;

    const shuriken = {
      id: Date.now() + Math.random(),
      x: width / 2,
      y: height * 0.7,
      vx: Math.cos(radians) * speed,
      vy: -Math.sin(radians) * speed,
      rotation: 0,
      power: powerLevel,
    };

    setShurikens((prev) => [...prev, shuriken]);
    setThrownCount((prev) => prev + 1);

    Alert.alert(
      '🔪 Shuriken Thrown!',
      `Power: ${Math.round(powerLevel)}% | Angle: ${angle}°`,
      [{ text: 'OK', onPress: () => {} }]
    );
  };

  const switchPlayer = () => {
    if (currentPlayer === 1) {
      setCurrentPlayer(2);
    } else {
      setCurrentPlayer(1);
    }
    setThrownCount(0);
    setShurikens([]);
  };

  const endRound = () => {
    setGameActive(false);

    let winner = '';
    if (scores.player1 > scores.player2) {
      winner = 'Player 1 🥷';
      setScores((prev) => ({ ...prev, player1: prev.player1 + 100 }));
    } else if (scores.player2 > scores.player1) {
      winner = 'Player 2 🥷';
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
    setCurrentPlayer(1);
    setThrownCount(0);
    setShurikens([]);
    setBamboos([
      { id: 1, x: width * 0.15, y: height * 0.3, hits: 0, maxHits: 3, destroyed: false },
      { id: 2, x: width * 0.35, y: height * 0.2, hits: 0, maxHits: 3, destroyed: false },
      { id: 3, x: width * 0.5, y: height * 0.35, hits: 0, maxHits: 3, destroyed: false },
      { id: 4, x: width * 0.65, y: height * 0.25, hits: 0, maxHits: 3, destroyed: false },
      { id: 5, x: width * 0.85, y: height * 0.3, hits: 0, maxHits: 3, destroyed: false },
    ]);
    setAccuracyStats({
      player1: { hits: 0, misses: 0 },
      player2: { hits: 0, misses: 0 },
    });
    setGameActive(true);
  };

  const resetGame = () => {
    navigation.goBack();
  };

  const currentStats =
    currentPlayer === 1 ? accuracyStats.player1 : accuracyStats.player2;
  const totalAttempts = currentStats.hits + currentStats.misses;
  const accuracy = totalAttempts > 0 ? Math.round((currentStats.hits / totalAttempts) * 100) : 0;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backBtn}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Shuriken Bamboo</Text>
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

      {/* Current Player Info */}
      <View style={styles.playerInfoBar}>
        <Text style={styles.playerTurn}>
          🥷 Player {currentPlayer}'s Turn
        </Text>
        <Text style={styles.throwsLeft}>
          Throws: {thrownCount}/5
        </Text>
      </View>

      {/* Game Arena */}
      <View style={styles.arena}>
        {/* Bamboo targets */}
        {bamboos.map((bamboo) => (
          !bamboo.destroyed && (
            <Animated.View
              key={bamboo.id}
              style={[
                styles.bamboo,
                {
                  left: bamboo.x - 25,
                  top: bamboo.y - 40,
                  transform: [{ scale: bambooScale }],
                },
              ]}
            >
              <View style={[styles.bambooBody]}>
                <Text style={styles.bambooEmoji}>🎋</Text>
              </View>
              <View style={styles.hitIndicator}>
                <Text style={styles.hitText}>
                  {bamboo.hits}/{bamboo.maxHits}
                </Text>
              </View>
            </Animated.View>
          )
        ))}

        {/* Shurikens in flight */}
        {shurikens.map((shuriken) => (
          <Animated.View
            key={shuriken.id}
            style={[
              styles.shuriken,
              {
                left: shuriken.x - 12,
                top: shuriken.y - 12,
                transform: [{ rotate: `${shuriken.rotation}deg` }],
              },
            ]}
          >
            <Text style={styles.shurikenEmoji}>🔪</Text>
          </Animated.View>
        ))}

        {/* Ninja silhouette at bottom */}
        <View style={styles.ninjaPosition}>
          <Text style={styles.ninjaEmoji}>🥷</Text>
        </View>
      </View>

      {/* Power Meter */}
      <View style={styles.powerMeterContainer}>
        <Text style={styles.powerLabel}>Power: {Math.round(powerLevel)}%</Text>
        <View style={styles.powerBar}>
          <View
            style={[
              styles.powerFill,
              {
                width: `${powerLevel}%`,
              },
            ]}
          />
        </View>
        <Text style={styles.powerHint}>⬆️ Auto-Charging</Text>
      </View>

      {/* Angle Controls */}
      <View style={styles.angleContainer}>
        <TouchableOpacity
          style={[styles.angleBtn, { backgroundColor: '#FF6B6B' }]}
          onPress={() => handleThrow(30)}
          disabled={!gameActive || thrownCount >= 5}
        >
          <Text style={styles.angleBtnText}>30°</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.angleBtn, { backgroundColor: '#FFD700' }]}
          onPress={() => handleThrow(45)}
          disabled={!gameActive || thrownCount >= 5}
        >
          <Text style={styles.angleBtnText}>45°</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.angleBtn, { backgroundColor: '#4ECDC4' }]}
          onPress={() => handleThrow(60)}
          disabled={!gameActive || thrownCount >= 5}
        >
          <Text style={styles.angleBtnText}>60°</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.angleBtn, { backgroundColor: '#90EE90' }]}
          onPress={() => handleThrow(90)}
          disabled={!gameActive || thrownCount >= 5}
        >
          <Text style={styles.angleBtnText}>90°</Text>
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Hits</Text>
          <Text style={styles.statValue}>{currentStats.hits}</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Accuracy</Text>
          <Text style={styles.statValue}>{accuracy}%</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Bamboo Left</Text>
          <Text style={styles.statValue}>
            {bamboos.filter((b) => !b.destroyed).length}
          </Text>
        </View>
      </View>

      {/* Switch Player Button */}
      {thrownCount >= 5 && (
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
  throwsLeft: { fontSize: 14, color: COLORS.textLight },

  arena: {
    flex: 1,
    backgroundColor: '#2D5016',
    marginHorizontal: SPACING.lg,
    marginVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    position: 'relative',
    overflow: 'hidden',
  },

  bamboo: {
    position: 'absolute',
    alignItems: 'center',
  },
  bambooBody: {
    backgroundColor: '#4CAF50',
    width: 40,
    height: 80,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#2D5016',
  },
  bambooEmoji: { fontSize: 40 },
  hitIndicator: {
    marginTop: SPACING.xs,
    backgroundColor: COLORS.danger,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
  },
  hitText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFF',
  },

  shuriken: {
    position: 'absolute',
    width: 24,
    height: 24,
  },
  shurikenEmoji: { fontSize: 24 },

  ninjaPosition: {
    position: 'absolute',
    bottom: 20,
    left: '50%',
    marginLeft: -20,
  },
  ninjaEmoji: { fontSize: 40 },

  powerMeterContainer: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.cardBg,
  },
  powerLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  powerBar: {
    height: 20,
    backgroundColor: '#DDD',
    borderRadius: BORDER_RADIUS.sm,
    overflow: 'hidden',
    marginBottom: SPACING.xs,
  },
  powerFill: {
    height: '100%',
    backgroundColor: COLORS.warning,
  },
  powerHint: {
    fontSize: 12,
    color: COLORS.textLight,
    textAlign: 'center',
  },

  angleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    gap: SPACING.sm,
  },
  angleBtn: {
    flex: 1,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  angleBtnText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFF',
  },

  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.cardBg,
  },
  statBox: { alignItems: 'center' },
  statLabel: { fontSize: 12, color: COLORS.textLight, marginBottom: SPACING.xs },
  statValue: { fontSize: 20, fontWeight: 'bold', color: COLORS.primary },

  actionContainer: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  switchPlayerBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
  },
  switchPlayerText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
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
