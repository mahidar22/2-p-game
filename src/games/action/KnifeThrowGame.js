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

export default function KnifeThrowGame({ navigation }) {
  const [scores, setScores] = useState({ player1: 0, player2: 0 });
  const [round, setRound] = useState(1);
  const [gameActive, setGameActive] = useState(true);
  const [gameTime, setGameTime] = useState(45);
  const [currentPlayer, setCurrentPlayer] = useState(1);

  // Target rotation
  const [targetRotation, setTargetRotation] = useState(0);
  const [targetRPM] = useState(2); // Rotations per minute

  // Knives thrown
  const [knives, setKnives] = useState([]);
  const [thrownThisRound, setThrownThisRound] = useState(0);

  // Power meter
  const [powerLevel, setPowerLevel] = useState(50);
  const [powerIncreasing, setPowerIncreasing] = useState(true);

  // Rotation animation
  const targetRotateAnim = useRef(new Animated.Value(0)).current;
  const powerBarAnim = useRef(new Animated.Value(0)).current;

  // Game timer
  useEffect(() => {
    if (!gameActive) return;

    const timer = setInterval(() => {
      setGameTime((prev) => {
        if (prev <= 1) {
          endRound();
          return 45;
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
          return prev + 2;
        } else {
          if (prev <= 0) {
            setPowerIncreasing(true);
            return 0;
          }
          return prev - 2;
        }
      });
    }, 50);

    return () => clearInterval(powerInterval);
  }, [powerIncreasing]);

  // Target rotation
  useEffect(() => {
    const rotationInterval = setInterval(() => {
      setTargetRotation((prev) => (prev + 6) % 360); // 360 degrees per 60 updates = 60 rotations per minute
    }, 100);

    return () => clearInterval(rotationInterval);
  }, []);

  // Calculate hit detection
  const calculateHit = (throwAngle, throwPower) => {
    // Normalize angle to 0-360
    let normalizedAngle = ((throwAngle % 360) + 360) % 360;
    let normalizedTarget = ((targetRotation % 360) + 360) % 360;

    // Check if knife hits the segments (each segment is 45 degrees)
    const segmentSize = 45;
    const tolerance = 15; // ±15 degrees tolerance for hit

    const throwSegment = Math.floor(normalizedAngle / segmentSize);
    const targetSegment = Math.floor(normalizedTarget / segmentSize);

    // Calculate distance from center (0-100 power scale)
    const distanceFromCenter = Math.abs(normalizedAngle - normalizedTarget);
    const adjustedDistance = Math.min(distanceFromCenter, 360 - distanceFromCenter);

    // Hit if within tolerance
    const isHit = adjustedDistance <= tolerance;

    if (isHit) {
      // Calculate score based on position
      let baseScore = 10;

      // Bonus for center hits
      if (adjustedDistance <= 5) {
        baseScore = 50; // Bullseye!
      } else if (adjustedDistance <= 10) {
        baseScore = 30; // Center zone
      }

      // Power bonus
      const powerBonus = Math.floor((throwPower / 100) * 20);

      return baseScore + powerBonus;
    }

    return 0;
  };

  // Handle throw
  const handleThrow = () => {
    if (!gameActive || thrownThisRound >= 3) return;

    // Generate throw angle (player aim)
    const throwAngle = Math.random() * 360; // Random for demo, could be based on touch position
    const power = powerLevel;

    // Calculate points
    const points = calculateHit(throwAngle, power);

    // Create knife object
    const newKnife = {
      id: Date.now(),
      angle: throwAngle,
      power: power,
      points: points,
      x: width / 2,
      y: height / 2,
      rotation: throwAngle,
    };

    setKnives([...knives, newKnife]);

    // Award points
    if (points > 0) {
      if (currentPlayer === 1) {
        setScores((prev) => ({ ...prev, player1: prev.player1 + points }));
      } else {
        setScores((prev) => ({ ...prev, player2: prev.player2 + points }));
      }

      // Show hit animation
      Alert.alert('🎯 HIT!', `${points} points!`, [
        { text: 'Continue', onPress: () => {} },
      ]);
    } else {
      Alert.alert('❌ MISS!', 'Try again!', [
        { text: 'Continue', onPress: () => {} },
      ]);
    }

    setThrownThisRound((prev) => prev + 1);

    // Switch player after 3 throws
    if (thrownThisRound + 1 >= 3) {
      setCurrentPlayer(currentPlayer === 1 ? 2 : 1);
      setThrownThisRound(0);
      setKnives([]); // Clear knives for next player
    }
  };

  const endRound = () => {
    setGameActive(false);

    let winner = '';
    if (scores.player1 > scores.player2) {
      winner = 'Player 1 🎉';
    } else if (scores.player2 > scores.player1) {
      winner = 'Player 2 🎉';
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
    setScores({ player1: 0, player2: 0 });
    setGameTime(45);
    setCurrentPlayer(1);
    setKnives([]);
    setThrownThisRound(0);
    setGameActive(true);
  };

  const resetGame = () => {
    navigation.goBack();
  };

  // Get knife positions on target
  const getKnifePositions = () => {
    return knives.map((knife) => {
      const angleRad = (knife.angle * Math.PI) / 180;
      const radius = 80; // Distance from center

      const x = width / 2 + radius * Math.cos(angleRad);
      const y = height / 2 - 150 + radius * Math.sin(angleRad);

      return {
        ...knife,
        x,
        y,
      };
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backBtn}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Knife Throw</Text>
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
          🎮 Player {currentPlayer}'s Turn
        </Text>
        <Text style={styles.throwsLeft}>
          Throws: {thrownThisRound}/3
        </Text>
      </View>

      {/* Target Game Area */}
      <View style={styles.gameContainer}>
        {/* Rotating Target */}
        <View
          style={[
            styles.targetContainer,
            {
              transform: [{ rotate: `${targetRotation}deg` }],
            },
          ]}
        >
          {/* Target circles */}
          <View style={styles.targetOuter} />
          <View style={styles.targetMiddle} />
          <View style={styles.targetCenter} />

          {/* Target segments */}
          {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
            <View
              key={i}
              style={[
                styles.segment,
                {
                  transform: [{ rotate: `${i * 45}deg` }],
                },
              ]}
            >
              <Text style={styles.segmentNumber}>{i + 1}</Text>
            </View>
          ))}
        </View>

        {/* Thrown knives */}
        {getKnifePositions().map((knife) => (
          <View
            key={knife.id}
            style={[
              styles.knife,
              {
                left: knife.x - 15,
                top: knife.y - 15,
                transform: [{ rotate: `${knife.rotation}deg` }],
              },
            ]}
          >
            <Text style={styles.knifeEmoji}>🔪</Text>
          </View>
        ))}

        {/* Score popup for last throw */}
        {knives.length > 0 && knives[knives.length - 1].points > 0 && (
          <View
            style={[
              styles.scorePopup,
              {
                left: getKnifePositions()[getKnifePositions().length - 1]?.x - 25,
                top: getKnifePositions()[getKnifePositions().length - 1]?.y - 60,
              },
            ]}
          >
            <Text style={styles.popupText}>
              +{knives[knives.length - 1].points}
            </Text>
          </View>
        )}
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
        <Text style={styles.powerHint}>⬆️ Dynamic</Text>
      </View>

      {/* Controls */}
      <View style={styles.controlsContainer}>
        <TouchableOpacity
          style={styles.throwBtn}
          onPress={handleThrow}
          disabled={!gameActive || thrownThisRound >= 3}
        >
          <Text style={styles.throwBtnText}>🔪 THROW!</Text>
          <Text style={styles.throwBtnSubtext}>
            {thrownThisRound}/3 throws used
          </Text>
        </TouchableOpacity>

        <View style={styles.instructionsBox}>
          <Text style={styles.instructionText}>
            💡 Time your throw with the power meter!{'\n'}
            🎯 Hit the target for points{'\n'}
            ⭐ Center hits = 50 pts!
          </Text>
        </View>
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
    borderBottomWidth: 1,
    borderBottomColor: COLORS.shadow,
  },
  scoreItem: { alignItems: 'center' },
  playerLabel: { fontSize: 12, color: COLORS.textLight },
  scoreValue: { fontSize: 28, fontWeight: 'bold' },
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

  gameContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF8DC',
    marginHorizontal: SPACING.lg,
    marginVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    position: 'relative',
    overflow: 'hidden',
  },

  targetContainer: {
    width: 250,
    height: 250,
    justifyContent: 'center',
    alignItems: 'center',
  },

  targetOuter: {
    position: 'absolute',
    width: 250,
    height: 250,
    borderRadius: 125,
    borderWidth: 3,
    borderColor: '#333',
  },
  targetMiddle: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 3,
    borderColor: '#333',
  },
  targetCenter: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#FF6B6B',
    backgroundColor: '#FFE5E5',
  },

  segment: {
    position: 'absolute',
    width: 250,
    height: 250,
  },
  segmentNumber: {
    position: 'absolute',
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    top: 10,
    left: '50%',
    marginLeft: -8,
  },

  knife: {
    position: 'absolute',
    width: 30,
    height: 30,
  },
  knifeEmoji: { fontSize: 30 },

  scorePopup: {
    position: 'absolute',
    backgroundColor: COLORS.success,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    zIndex: 100,
  },
  popupText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
  },

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

  controlsContainer: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.lg,
  },
  throwBtn: {
    backgroundColor: COLORS.danger,
    paddingVertical: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  throwBtnText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
  },
  throwBtnSubtext: {
    fontSize: 12,
    color: '#FFF',
    marginTop: SPACING.xs,
    opacity: 0.9,
  },

  instructionsBox: {
    backgroundColor: COLORS.cardBg,
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
