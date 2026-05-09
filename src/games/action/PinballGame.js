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

export default function PinballGame({ navigation }) {
  const [scores, setScores] = useState({ player1: 0, player2: 0 });
  const [round, setRound] = useState(1);
  const [gameActive, setGameActive] = useState(true);
  const [currentPlayer, setCurrentPlayer] = useState(1);
  const [ballsLeft, setBallsLeft] = useState(3);

  // Ball physics
  const [ballPos, setBallPos] = useState({
    x: width / 2,
    y: 100,
  });
  const [ballVelocity, setBallVelocity] = useState({
    x: 0,
    y: 3,
  });
  const ballRadius = 10;

  // Flippers
  const [leftFlipperAngle, setLeftFlipperAngle] = useState(0);
  const [rightFlipperAngle, setRightFlipperAngle] = useState(0);
  const [leftFlipperActive, setLeftFlipperActive] = useState(false);
  const [rightFlipperActive, setRightFlipperActive] = useState(false);

  // Bumpers
  const [bumpers, setBumpers] = useState([
    { id: 1, x: width / 2 - 80, y: 200, radius: 25, points: 100 },
    { id: 2, x: width / 2 + 80, y: 200, radius: 25, points: 100 },
    { id: 3, x: width / 2 - 50, y: 300, radius: 25, points: 50 },
    { id: 4, x: width / 2 + 50, y: 300, radius: 25, points: 50 },
    { id: 5, x: width / 2, y: 400, radius: 25, points: 75 },
  ]);

  // Targets
  const [targets, setTargets] = useState([
    { id: 1, x: 50, y: 250, width: 30, height: 60, hit: false, points: 200 },
    { id: 2, x: width - 50, y: 250, width: 30, height: 60, hit: false, points: 200 },
    { id: 3, x: 50, y: 350, width: 30, height: 60, hit: false, points: 200 },
    { id: 4, x: width - 50, y: 350, width: 30, height: 60, hit: false, points: 200 },
  ]);

  // Ramps
  const [ramps, setRamps] = useState([
    { id: 1, x: 30, y: 150, width: 40, height: 100, points: 300 },
    { id: 2, x: width - 70, y: 150, width: 40, height: 100, points: 300 },
  ]);

  // Game state
  const [combo, setCombo] = useState(0);
  const [lastBounceTime, setLastBounceTime] = useState(0);

  // Animations
  const ballScale = useRef(new Animated.Value(1)).current;
  const bumperScale = useRef(new Animated.Value(1)).current;

  // Physics simulation
  useEffect(() => {
    if (!gameActive) return;

    const physicsInterval = setInterval(() => {
      setBallPos((prevPos) => {
        let newX = prevPos.x + ballVelocity.x;
        let newY = prevPos.y + ballVelocity.y;
        let newVelX = ballVelocity.x;
        let newVelY = ballVelocity.y + 0.3; // Gravity

        // Wall collisions
        if (newX - ballRadius < 0) {
          newX = ballRadius;
          newVelX = Math.abs(newVelX);
        }
        if (newX + ballRadius > width) {
          newX = width - ballRadius;
          newVelX = -Math.abs(newVelX);
        }

        // Ceiling collision
        if (newY - ballRadius < 100) {
          newY = 100 + ballRadius;
          newVelY = Math.abs(newVelY);
        }

        // Bumper collisions
        bumpers.forEach((bumper) => {
          const distX = newX - bumper.x;
          const distY = newY - bumper.y;
          const distance = Math.sqrt(distX * distX + distY * distY);

          if (distance < ballRadius + bumper.radius) {
            // Bounce off bumper
            const angle = Math.atan2(distY, distX);
            newVelX = Math.cos(angle) * 8;
            newVelY = Math.sin(angle) * 8;

            // Move ball out of bumper
            newX = bumper.x + Math.cos(angle) * (bumper.radius + ballRadius);
            newY = bumper.y + Math.sin(angle) * (bumper.radius + ballRadius);

            // Award points
            setScores((prev) => ({
              ...prev,
              [currentPlayer === 1 ? 'player1' : 'player2']:
                prev[currentPlayer === 1 ? 'player1' : 'player2'] + bumper.points + combo * 10,
            }));

            setCombo((prev) => prev + 1);

            // Bumper animation
            Animated.sequence([
              Animated.timing(bumperScale, {
                toValue: 1.3,
                duration: 100,
                useNativeDriver: false,
              }),
              Animated.timing(bumperScale, {
                toValue: 1,
                duration: 100,
                useNativeDriver: false,
              }),
            ]).start();

            setLastBounceTime(Date.now());
          }
        });

        // Target collisions
        targets.forEach((target) => {
          if (
            newX > target.x &&
            newX < target.x + target.width &&
            newY > target.y &&
            newY < target.y + target.height
          ) {
            if (!target.hit) {
              setTargets((prev) =>
                prev.map((t) =>
                  t.id === target.id ? { ...t, hit: true } : t
                )
              );

              setScores((prev) => ({
                ...prev,
                [currentPlayer === 1 ? 'player1' : 'player2']:
                  prev[currentPlayer === 1 ? 'player1' : 'player2'] + target.points,
              }));

              setCombo((prev) => prev + 2);
            }

            // Bounce ball
            newVelY = -Math.abs(newVelY);
            newY = target.y - ballRadius;
          }
        });

        // Ramp collisions
        ramps.forEach((ramp) => {
          if (
            newX > ramp.x &&
            newX < ramp.x + ramp.width &&
            newY > ramp.y &&
            newY < ramp.y + ramp.height
          ) {
            // Boost on ramp
            setScores((prev) => ({
              ...prev,
              [currentPlayer === 1 ? 'player1' : 'player2']:
                prev[currentPlayer === 1 ? 'player1' : 'player2'] + ramp.points,
            }));

            setCombo((prev) => prev + 3);

            newVelY = -12; // Strong upward boost
            newVelX *= 0.5;
          }
        });

        // Flipper collisions
        if (leftFlipperActive) {
          const flipperX = 60;
          const flipperY = height - 150;
          const dist = Math.sqrt(
            Math.pow(newX - flipperX, 2) + Math.pow(newY - flipperY, 2)
          );

          if (dist < ballRadius + 40) {
            newVelX = -10;
            newVelY = -10;
            newY = flipperY - ballRadius;
            setCombo((prev) => prev + 1);
          }
        }

        if (rightFlipperActive) {
          const flipperX = width - 60;
          const flipperY = height - 150;
          const dist = Math.sqrt(
            Math.pow(newX - flipperX, 2) + Math.pow(newY - flipperY, 2)
          );

          if (dist < ballRadius + 40) {
            newVelX = 10;
            newVelY = -10;
            newY = flipperY - ballRadius;
            setCombo((prev) => prev + 1);
          }
        }

        // Ball lost (out of bounds)
        if (newY > height) {
          setBallsLeft((prev) => prev - 1);

          if (ballsLeft <= 1) {
            endTurn();
          } else {
            // Reset ball
            newX = width / 2;
            newY = 100;
            newVelX = 0;
            newVelY = 0;
            setCombo(0);
          }
        }

        // Friction
        newVelX *= 0.98;
        newVelY *= 0.98;

        setBallVelocity({ x: newVelX, y: newVelY });

        return { x: newX, y: newY };
      });
    }, 50);

    return () => clearInterval(physicsInterval);
  }, [gameActive, ballVelocity, bumpers, targets, ramps, leftFlipperActive, rightFlipperActive, ballsLeft]);

  // Reset combo after 2 seconds of no hits
  useEffect(() => {
    if (combo === 0) return;

    const timeout = setTimeout(() => {
      if (Date.now() - lastBounceTime > 2000) {
        setCombo(0);
      }
    }, 2000);

    return () => clearTimeout(timeout);
  }, [combo, lastBounceTime]);

  const handleLeftFlipperPress = () => {
    setLeftFlipperActive(true);
  };

  const handleLeftFlipperRelease = () => {
    setLeftFlipperActive(false);
  };

  const handleRightFlipperPress = () => {
    setRightFlipperActive(true);
  };

  const handleRightFlipperRelease = () => {
    setRightFlipperActive(false);
  };

  const endTurn = () => {
    if (currentPlayer === 1) {
      setCurrentPlayer(2);
    } else {
      setCurrentPlayer(1);
      setRound((prev) => prev + 1);
    }

    setBallsLeft(3);
    setBallPos({ x: width / 2, y: 100 });
    setBallVelocity({ x: 0, y: 0 });
    setTargets((prev) => prev.map((t) => ({ ...t, hit: false })));
    setCombo(0);

    if (round >= 3) {
      endGame();
    }
  };

  const endGame = () => {
    setGameActive(false);

    let winner = '';
    if (scores.player1 > scores.player2) {
      winner = 'Player 1 🎉';
    } else if (scores.player2 > scores.player1) {
      winner = 'Player 2 🎉';
    } else {
      winner = 'Draw 🤝';
    }

    Alert.alert(
      'Game Over!',
      `${winner}\nP1: ${scores.player1} | P2: ${scores.player2}`,
      [
        { text: 'Play Again', onPress: resetGame },
        { text: 'End Game', onPress: () => navigation.goBack() },
      ]
    );
  };

  const resetGame = () => {
    setScores({ player1: 0, player2: 0 });
    setRound(1);
    setCurrentPlayer(1);
    setBallsLeft(3);
    setBallPos({ x: width / 2, y: 100 });
    setBallVelocity({ x: 0, y: 0 });
    setTargets((prev) => prev.map((t) => ({ ...t, hit: false })));
    setCombo(0);
    setGameActive(true);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backBtn}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Pinball</Text>
        <View style={{ width: 50 }} />
      </View>

      {/* Scores */}
      <View style={styles.scoreBar}>
        <View style={styles.playerScore}>
          <Text style={styles.playerLabel}>Player 1</Text>
          <Text style={[styles.scoreValue, { color: COLORS.player1 }]}>
            {scores.player1}
          </Text>
        </View>

        <View style={styles.centerInfo}>
          <Text style={styles.currentPlayer}>P{currentPlayer}</Text>
          <Text style={styles.ballsLeft}>Balls: {ballsLeft}</Text>
          <Text style={styles.comboText}>Combo: {combo}x</Text>
        </View>

        <View style={styles.playerScore}>
          <Text style={styles.playerLabel}>Player 2</Text>
          <Text style={[styles.scoreValue, { color: COLORS.player2 }]}>
            {scores.player2}
          </Text>
        </View>
      </View>

      {/* Pinball Machine */}
      <View style={styles.machine}>
        {/* Bumpers */}
        {bumpers.map((bumper) => (
          <Animated.View
            key={bumper.id}
            style={[
              styles.bumper,
              {
                left: bumper.x - bumper.radius,
                top: bumper.y - bumper.radius,
                width: bumper.radius * 2,
                height: bumper.radius * 2,
                transform: [{ scale: bumperScale }],
              },
            ]}
          >
            <Text style={styles.bumperText}>{bumper.points}</Text>
          </Animated.View>
        ))}

        {/* Targets */}
        {targets.map((target) => (
          <View
            key={target.id}
            style={[
              styles.target,
              {
                left: target.x,
                top: target.y,
                width: target.width,
                height: target.height,
                backgroundColor: target.hit ? '#FFD700' : '#FF6B6B',
              },
            ]}
          >
            <Text style={styles.targetText}>{target.points}</Text>
          </View>
        ))}

        {/* Ramps */}
        {ramps.map((ramp) => (
          <View
            key={ramp.id}
            style={[
              styles.ramp,
              {
                left: ramp.x,
                top: ramp.y,
                width: ramp.width,
                height: ramp.height,
              },
            ]}
          >
            <Text style={styles.rampText}>↑ {ramp.points}</Text>
          </View>
        ))}

        {/* Ball */}
        <Animated.View
          style={[
            styles.ball,
            {
              left: ballPos.x - ballRadius,
              top: ballPos.y - ballRadius,
              transform: [{ scale: ballScale }],
            },
          ]}
        />

        {/* Left Flipper */}
        <TouchableOpacity
          style={[
            styles.flipper,
            styles.leftFlipper,
            leftFlipperActive && styles.flipperActive,
          ]}
          onPressIn={handleLeftFlipperPress}
          onPressOut={handleLeftFlipperRelease}
        >
          <Text style={styles.flipperText}>◄━━</Text>
        </TouchableOpacity>

        {/* Right Flipper */}
        <TouchableOpacity
          style={[
            styles.flipper,
            styles.rightFlipper,
            rightFlipperActive && styles.flipperActive,
          ]}
          onPressIn={handleRightFlipperPress}
          onPressOut={handleRightFlipperRelease}
        >
          <Text style={styles.flipperText}>━━►</Text>
        </TouchableOpacity>
      </View>

      {/* Instructions */}
      <View style={styles.instructionsBox}>
        <Text style={styles.instructionText}>
          👆 Press & hold flippers to bounce ball{'\n'}
          🎯 Hit bumpers for points{'\n'}
          ⭐ Complete targets for bonus
        </Text>
      </View>

      {!gameActive && (
        <View style={styles.gameOverButtons}>
          <TouchableOpacity style={styles.playAgainBtn} onPress={resetGame}>
            <Text style={styles.playAgainText}>Play Again</Text>
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

  scoreBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.cardBg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.shadow,
  },
  playerScore: { alignItems: 'center' },
  playerLabel: { fontSize: 12, color: COLORS.textLight },
  scoreValue: { fontSize: 20, fontWeight: 'bold' },
  centerInfo: { alignItems: 'center' },
  currentPlayer: { fontSize: 16, fontWeight: 'bold', color: COLORS.primary },
  ballsLeft: { fontSize: 12, color: COLORS.textLight },
  comboText: { fontSize: 14, fontWeight: 'bold', color: COLORS.warning },

  machine: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    marginHorizontal: SPACING.lg,
    marginVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: '#333',
  },

  ball: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 5,
  },

  bumper: {
    position: 'absolute',
    borderRadius: 9999,
    backgroundColor: '#FF6B6B',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  bumperText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFF',
  },

  target: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.sm,
  },
  targetText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFF',
  },

  ramp: {
    position: 'absolute',
    backgroundColor: '#4ECDC4',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 2,
    borderColor: '#FFF',
  },
  rampText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFF',
  },

  flipper: {
    position: 'absolute',
    bottom: 20,
    width: 80,
    height: 15,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  leftFlipper: {
    left: 30,
  },
  rightFlipper: {
    right: 30,
  },
  flipperActive: {
    backgroundColor: COLORS.warning,
  },
  flipperText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFF',
  },

  instructionsBox: {
    backgroundColor: COLORS.cardBg,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
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
  },
  playAgainBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
  },
  playAgainText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
    textAlign: 'center',
  },
});
