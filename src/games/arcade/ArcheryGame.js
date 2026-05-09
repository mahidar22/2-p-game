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
import { COLORS, SPACING, BORDER_RADIUS } from '../../styles/theme';

const { width, height } = Dimensions.get('window');

const TARGET_RINGS = [
  { ring: 'bullseye', radius: 15, points: 100, color: '#FFD700', label: "Bull's Eye" },
  { ring: 'inner', radius: 30, points: 80, color: '#FF6B6B', label: 'Inner Ring' },
  { ring: 'middle', radius: 50, points: 50, color: '#4ECDC4', label: 'Middle Ring' },
  { ring: 'outer', radius: 75, points: 30, color: '#45B7D1', label: 'Outer Ring' },
  { ring: 'edge', radius: 100, points: 10, color: '#96CEB4', label: 'Edge Ring' },
];

const WIND_DIRECTIONS = ['←', '→', '↑', '↓', '↗', '↘', '↙', '↖'];

export default function ArcheryGame({ navigation }) {
  const [scores, setScores] = useState({ player1: 0, player2: 0 });
  const [round, setRound] = useState(1);
  const [maxRounds] = useState(5);
  const [gameActive, setGameActive] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [currentPlayer, setCurrentPlayer] = useState(1);

  // Arrows
  const [arrowsLeft, setArrowsLeft] = useState(3);
  const [arrowsShot, setArrowsShot] = useState([]);
  const [totalArrowsShot, setTotalArrowsShot] = useState(0);

  // Aiming
  const [aimX, setAimX] = useState(0);
  const [aimY, setAimY] = useState(0);
  const [isAiming, setIsAiming] = useState(false);
  const [aimLocked, setAimLocked] = useState(false);

  // Power
  const [powerLevel, setPowerLevel] = useState(0);
  const [powerCharging, setPowerCharging] = useState(false);
  const [powerIncreasing, setPowerIncreasing] = useState(true);

  // Wind
  const [windSpeed, setWindSpeed] = useState(0);
  const [windDirection, setWindDirection] = useState('→');
  const [windEffect, setWindEffect] = useState({ x: 0, y: 0 });

  // Crosshair sway
  const [swayX, setSwayX] = useState(0);
  const [swayY, setSwayY] = useState(0);

  // Stats
  const [accuracyStats, setAccuracyStats] = useState({
    player1: { bullseyes: 0, hits: 0, misses: 0, totalScore: 0 },
    player2: { bullseyes: 0, hits: 0, misses: 0, totalScore: 0 },
  });

  // Round scores
  const [roundScores, setRoundScores] = useState({
    player1: [],
    player2: [],
  });

  // Animations
  const arrowFlyAnim = useRef(new Animated.Value(0)).current;
  const targetPulseAnim = useRef(new Animated.Value(1)).current;
  const crosshairAnim = useRef(new Animated.Value(1)).current;
  const windIndicatorAnim = useRef(new Animated.Value(0)).current;
  const scorePopAnim = useRef(new Animated.Value(0)).current;
  const bowStringAnim = useRef(new Animated.Value(0)).current;

  const swayInterval = useRef(null);
  const powerInterval = useRef(null);

  // Target center position
  const targetCenterX = (width - 40) / 2;
  const targetCenterY = 120;

  // Cleanup
  useEffect(() => {
    return () => {
      if (swayInterval.current) clearInterval(swayInterval.current);
      if (powerInterval.current) clearInterval(powerInterval.current);
    };
  }, []);

  // Target pulse animation
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(targetPulseAnim, {
          toValue: 1.03,
          duration: 1500,
          useNativeDriver: false,
        }),
        Animated.timing(targetPulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: false,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  // Wind indicator animation
  useEffect(() => {
    const windAnim = Animated.loop(
      Animated.sequence([
        Animated.timing(windIndicatorAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: false,
        }),
        Animated.timing(windIndicatorAnim, {
          toValue: 0,
          duration: 800,
          useNativeDriver: false,
        }),
      ])
    );
    windAnim.start();
    return () => windAnim.stop();
  }, []);

  // Crosshair sway when aiming
  useEffect(() => {
    if (!gameActive) return;

    swayInterval.current = setInterval(() => {
      const swayAmount = 3 + windSpeed * 0.5;
      setSwayX((prev) => prev + (Math.random() - 0.5) * swayAmount);
      setSwayY((prev) => prev + (Math.random() - 0.5) * swayAmount);
    }, 100);

    return () => {
      if (swayInterval.current) clearInterval(swayInterval.current);
    };
  }, [gameActive, windSpeed]);

  // Power meter charging
  useEffect(() => {
    if (!powerCharging) {
      if (powerInterval.current) clearInterval(powerInterval.current);
      return;
    }

    powerInterval.current = setInterval(() => {
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
    }, 30);

    return () => {
      if (powerInterval.current) clearInterval(powerInterval.current);
    };
  }, [powerCharging, powerIncreasing]);

  // Generate wind for each shot
  const generateWind = () => {
    const speed = Math.round(Math.random() * 15);
    const direction = WIND_DIRECTIONS[Math.floor(Math.random() * WIND_DIRECTIONS.length)];

    let effectX = 0;
    let effectY = 0;

    switch (direction) {
      case '←': effectX = -speed; break;
      case '→': effectX = speed; break;
      case '↑': effectY = -speed; break;
      case '↓': effectY = speed; break;
      case '↗': effectX = speed * 0.7; effectY = -speed * 0.7; break;
      case '↘': effectX = speed * 0.7; effectY = speed * 0.7; break;
      case '↙': effectX = -speed * 0.7; effectY = speed * 0.7; break;
      case '↖': effectX = -speed * 0.7; effectY = -speed * 0.7; break;
    }

    setWindSpeed(speed);
    setWindDirection(direction);
    setWindEffect({ x: effectX * 0.8, y: effectY * 0.8 });
  };

  // Start game
  const startGame = () => {
    setGameActive(true);
    setGameStarted(true);
    setArrowsLeft(3);
    setArrowsShot([]);
    setPowerLevel(0);
    setAimX(0);
    setAimY(0);
    generateWind();
  };

  // Start charging power
  const startCharging = () => {
    if (!gameActive || arrowsLeft <= 0 || aimLocked) return;
    setPowerCharging(true);
    setPowerLevel(0);
    setPowerIncreasing(true);

    // Bow string pull animation
    Animated.timing(bowStringAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  // Release arrow
  const releaseArrow = () => {
    if (!powerCharging) return;
    setPowerCharging(false);
    setAimLocked(true);

    // Bow string release
    Animated.timing(bowStringAnim, {
      toValue: 0,
      duration: 100,
      useNativeDriver: false,
    }).start();

    // Arrow fly animation
    arrowFlyAnim.setValue(0);
    Animated.timing(arrowFlyAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: false,
    }).start(() => {
      calculateHit();
    });
  };

  // Calculate where arrow lands
  const calculateHit = () => {
    // Power accuracy (best at 70-90%)
    const powerAccuracy = 1 - Math.abs(powerLevel - 80) / 100;

    // Wind effect on landing
    const windOffsetX = windEffect.x * (1 - powerAccuracy * 0.3);
    const windOffsetY = windEffect.y * (1 - powerAccuracy * 0.3);

    // Sway effect
    const swayOffset = (Math.random() - 0.5) * (20 - powerAccuracy * 15);

    // Final arrow position relative to target center
    const finalX = aimX + windOffsetX + swayX * 0.5 + swayOffset;
    const finalY = aimY + windOffsetY + swayY * 0.5 + swayOffset;

    // Distance from center
    const distance = Math.sqrt(finalX * finalX + finalY * finalY);

    // Determine which ring was hit
    let hitRing = null;
    let pointsScored = 0;

    for (const ring of TARGET_RINGS) {
      if (distance <= ring.radius) {
        hitRing = ring;
        pointsScored = ring.points;
        break;
      }
    }

    // Power bonus for good power control (70-90%)
    const powerBonus = powerLevel >= 70 && powerLevel <= 90 ? 10 : 0;
    pointsScored += powerBonus;

    // Record arrow
    const arrowData = {
      id: Date.now(),
      x: finalX,
      y: finalY,
      distance: Math.round(distance),
      ring: hitRing ? hitRing.ring : 'miss',
      points: hitRing ? pointsScored : 0,
      power: Math.round(powerLevel),
      windSpeed: windSpeed,
    };

    setArrowsShot((prev) => [...prev, arrowData]);
    setArrowsLeft((prev) => prev - 1);
    setTotalArrowsShot((prev) => prev + 1);

    // Update scores
    const playerKey = currentPlayer === 1 ? 'player1' : 'player2';

    if (hitRing) {
      setScores((prev) => ({
        ...prev,
        [playerKey]: prev[playerKey] + pointsScored,
      }));

      setAccuracyStats((prev) => ({
        ...prev,
        [playerKey]: {
          ...prev[playerKey],
          hits: prev[playerKey].hits + 1,
          bullseyes:
            hitRing.ring === 'bullseye'
              ? prev[playerKey].bullseyes + 1
              : prev[playerKey].bullseyes,
          totalScore: prev[playerKey].totalScore + pointsScored,
        },
      }));

      // Score pop animation
      scorePopAnim.setValue(0);
      Animated.sequence([
        Animated.spring(scorePopAnim, {
          toValue: 1,
          friction: 3,
          tension: 200,
          useNativeDriver: false,
        }),
        Animated.timing(scorePopAnim, {
          toValue: 0,
          duration: 800,
          delay: 500,
          useNativeDriver: false,
        }),
      ]).start();

      let message = '';
      if (hitRing.ring === 'bullseye') {
        message = `🎯 BULL'S EYE!\n+${pointsScored} points!${powerBonus > 0 ? '\n⚡ Power Bonus: +10' : ''}`;
      } else {
        message = `🏹 ${hitRing.label}!\n+${pointsScored} points!${powerBonus > 0 ? '\n⚡ Power Bonus: +10' : ''}`;
      }

      Alert.alert(
        hitRing.ring === 'bullseye' ? "🎯 Bull's Eye!" : '🏹 Hit!',
        message,
        [{ text: arrowsLeft > 1 ? 'Next Arrow' : 'Continue', onPress: prepareNextShot }]
      );
    } else {
      setAccuracyStats((prev) => ({
        ...prev,
        [playerKey]: {
          ...prev[playerKey],
          misses: prev[playerKey].misses + 1,
        },
      }));

      Alert.alert('💨 Miss!', 'Arrow missed the target!', [
        { text: arrowsLeft > 1 ? 'Try Again' : 'Continue', onPress: prepareNextShot },
      ]);
    }
  };

  // Prepare for next shot
  const prepareNextShot = () => {
    setAimLocked(false);
    setAimX(0);
    setAimY(0);
    setSwayX(0);
    setSwayY(0);
    setPowerLevel(0);

    if (arrowsLeft <= 1) {
      handleEndTurn();
    } else {
      generateWind();
    }
  };

  // End turn
  const handleEndTurn = () => {
    const playerKey = currentPlayer === 1 ? 'player1' : 'player2';
    const turnScore = arrowsShot.reduce((sum, a) => sum + a.points, 0);

    setRoundScores((prev) => ({
      ...prev,
      [playerKey]: [...prev[playerKey], turnScore],
    }));

    if (currentPlayer === 1) {
      Alert.alert(
        '🏹 Turn Over!',
        `Player 1 scored ${turnScore} this turn!\n\nPlayer 2, get ready!`,
        [{ text: "Player 2's Turn!", onPress: switchPlayer }]
      );
    } else {
      handleEndRound();
    }
  };

  const switchPlayer = () => {
    setCurrentPlayer(2);
    setArrowsLeft(3);
    setArrowsShot([]);
    setAimX(0);
    setAimY(0);
    setSwayX(0);
    setSwayY(0);
    setPowerLevel(0);
    setAimLocked(false);
    generateWind();
  };

  const handleEndRound = () => {
    setGameActive(false);

    const p1RoundScore = roundScores.player1.reduce((s, v) => s + v, 0) +
      arrowsShot.reduce((sum, a) => sum + a.points, 0);
    const p2RoundScore = arrowsShot.reduce((sum, a) => sum + a.points, 0);

    let roundWinner = '';
    if (scores.player1 > scores.player2) {
      roundWinner = '🏆 Player 1 wins this round!';
    } else if (scores.player2 > scores.player1) {
      roundWinner = '🏆 Player 2 wins this round!';
    } else {
      roundWinner = "🤝 It's a tie!";
    }

    if (round >= maxRounds) {
      handleGameOver();
    } else {
      Alert.alert(
        `📋 Round ${round} Complete!`,
        `${roundWinner}\n\nP1: ${scores.player1} | P2: ${scores.player2}\n\nRound ${round + 1} coming up!`,
        [
          { text: '🔄 Next Round', onPress: nextRound },
          { text: '🚪 End Game', onPress: () => navigation.goBack() },
        ]
      );
    }
  };

  const handleGameOver = () => {
    let gameWinner = '';
    const p1Stats = accuracyStats.player1;
    const p2Stats = accuracyStats.player2;

    if (scores.player1 > scores.player2) {
      gameWinner = '🏆🥇 Player 1 is the Champion!';
    } else if (scores.player2 > scores.player1) {
      gameWinner = '🏆🥇 Player 2 is the Champion!';
    } else {
      gameWinner = "🤝 It's a Perfect Tie!";
    }

    Alert.alert(
      '🎉 Game Over!',
      `${gameWinner}\n\nFinal Scores:\nP1: ${scores.player1} | P2: ${scores.player2}\n\nBull's Eyes:\nP1: ${p1Stats.bullseyes} | P2: ${p2Stats.bullseyes}`,
      [
        { text: '🔄 New Game', onPress: resetGame },
        { text: '🚪 Exit', onPress: () => navigation.goBack() },
      ]
    );
  };

  const nextRound = () => {
    setRound((prev) => prev + 1);
    setCurrentPlayer(1);
    setGameActive(false);
    setGameStarted(false);
    setArrowsLeft(3);
    setArrowsShot([]);
    setAimX(0);
    setAimY(0);
    setSwayX(0);
    setSwayY(0);
    setPowerLevel(0);
    setAimLocked(false);
    generateWind();
  };

  const resetGame = () => {
    setScores({ player1: 0, player2: 0 });
    setRound(1);
    setCurrentPlayer(1);
    setGameActive(false);
    setGameStarted(false);
    setArrowsLeft(3);
    setArrowsShot([]);
    setTotalArrowsShot(0);
    setAimX(0);
    setAimY(0);
    setSwayX(0);
    setSwayY(0);
    setPowerLevel(0);
    setPowerCharging(false);
    setAimLocked(false);
    setAccuracyStats({
      player1: { bullseyes: 0, hits: 0, misses: 0, totalScore: 0 },
      player2: { bullseyes: 0, hits: 0, misses: 0, totalScore: 0 },
    });
    setRoundScores({ player1: [], player2: [] });
    generateWind();
  };

  // Aim controls
  const adjustAim = (dx, dy) => {
    if (aimLocked || !gameActive) return;
    setAimX((prev) => Math.max(-90, Math.min(90, prev + dx)));
    setAimY((prev) => Math.max(-90, Math.min(90, prev + dy)));
  };

  const currentStats =
    currentPlayer === 1 ? accuracyStats.player1 : accuracyStats.player2;
  const totalAttempts = currentStats.hits + currentStats.misses;
  const accuracy =
    totalAttempts > 0
      ? Math.round((currentStats.hits / totalAttempts) * 100)
      : 0;

  const getPowerColor = () => {
    if (powerLevel >= 70 && powerLevel <= 90) return '#4ECDC4';
    if (powerLevel >= 50) return '#FFD700';
    return '#FF6B6B';
  };

  const getPowerLabel = () => {
    if (powerLevel >= 70 && powerLevel <= 90) return '✨ PERFECT';
    if (powerLevel >= 90) return '🔥 TOO STRONG';
    if (powerLevel >= 50) return '⚡ GOOD';
    return '💤 WEAK';
  };

  const getWindLabel = () => {
    if (windSpeed <= 3) return 'Calm';
    if (windSpeed <= 7) return 'Light';
    if (windSpeed <= 11) return 'Moderate';
    return 'Strong';
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backBtn}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>🏹 Archery</Text>
        <Text style={styles.roundInfo}>
          Rd {round}/{maxRounds}
        </Text>
      </View>

      {/* Score Bar */}
      <View style={styles.topBar}>
        <View style={styles.scoreItem}>
          <Text style={styles.playerLabel}>
            {currentPlayer === 1 ? '► ' : ''}Player 1
          </Text>
          <Text style={[styles.scoreValue, { color: '#FF6B6B' }]}>
            {scores.player1}
          </Text>
          <Text style={styles.bullseyeCount}>
            🎯 {accuracyStats.player1.bullseyes}
          </Text>
        </View>

        <View style={styles.arrowsBox}>
          <Text style={styles.arrowsLabel}>Arrows</Text>
          <View style={styles.arrowIcons}>
            {[...Array(3)].map((_, i) => (
              <Text
                key={i}
                style={[
                  styles.arrowIcon,
                  i >= arrowsLeft && styles.arrowUsed,
                ]}
              >
                {i < arrowsLeft ? '🏹' : '▫️'}
              </Text>
            ))}
          </View>
        </View>

        <View style={styles.scoreItem}>
          <Text style={styles.playerLabel}>
            {currentPlayer === 2 ? '► ' : ''}Player 2
          </Text>
          <Text style={[styles.scoreValue, { color: '#4ECDC4' }]}>
            {scores.player2}
          </Text>
          <Text style={styles.bullseyeCount}>
            🎯 {accuracyStats.player2.bullseyes}
          </Text>
        </View>
      </View>

      {/* Wind Indicator */}
      <Animated.View
        style={[
          styles.windBar,
          {
            opacity: windIndicatorAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0.7, 1],
            }),
          },
        ]}
      >
        <Text style={styles.windIcon}>🌬️</Text>
        <Text style={styles.windText}>
          Wind: {windDirection} {windSpeed} mph ({getWindLabel()})
        </Text>
        <View
          style={[
            styles.windStrength,
            {
              width: `${Math.min(windSpeed * 7, 100)}%`,
              backgroundColor:
                windSpeed <= 5
                  ? '#4ECDC4'
                  : windSpeed <= 10
                  ? '#FFD700'
                  : '#FF6B6B',
            },
          ]}
        />
      </Animated.View>

      {/* Target Area */}
      <View style={styles.targetArea}>
        <Animated.View
          style={[
            styles.targetContainer,
            { transform: [{ scale: targetPulseAnim }] },
          ]}
        >
          {/* Target Rings */}
          {[...TARGET_RINGS].reverse().map((ring) => (
            <View
              key={ring.ring}
              style={[
                styles.targetRing,
                {
                  width: ring.radius * 2,
                  height: ring.radius * 2,
                  borderRadius: ring.radius,
                  backgroundColor: ring.color,
                  borderWidth: 2,
                  borderColor: '#00000033',
                },
              ]}
            />
          ))}

          {/* Previous arrows on target */}
          {arrowsShot.map((arrow) =>
            arrow.ring !== 'miss' ? (
              <View
                key={arrow.id}
                style={[
                  styles.arrowOnTarget,
                  {
                    left: targetCenterX + arrow.x - 8,
                    top: targetCenterY + arrow.y - 8,
                  },
                ]}
              >
                <Text style={styles.arrowStuck}>🏹</Text>
              </View>
            ) : null
          )}

          {/* Crosshair */}
          {gameActive && !aimLocked && (
            <View
              style={[
                styles.crosshair,
                {
                  left: targetCenterX + aimX + swayX - 15,
                  top: targetCenterY + aimY + swayY - 15,
                },
              ]}
            >
              <Text style={styles.crosshairEmoji}>⊕</Text>
            </View>
          )}

          {/* Score popup */}
          {arrowsShot.length > 0 && (
            <Animated.View
              style={[
                styles.scorePop,
                {
                  opacity: scorePopAnim,
                  transform: [
                    {
                      translateY: scorePopAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [20, -20],
                      }),
                    },
                    {
                      scale: scorePopAnim.interpolate({
                        inputRange: [0, 0.5, 1],
                        outputRange: [0.5, 1.3, 1],
                      }),
                    },
                  ],
                },
              ]}
            >
              <Text style={styles.scorePopText}>
                +{arrowsShot[arrowsShot.length - 1]?.points || 0}
              </Text>
            </Animated.View>
          )}
        </Animated.View>

        {/* Point Labels */}
        <View style={styles.pointLabels}>
          {TARGET_RINGS.map((ring) => (
            <View
              key={ring.ring}
              style={[styles.pointLabel, { borderLeftColor: ring.color }]}
            >
              <Text style={styles.pointLabelText}>
                {ring.label}: {ring.points}pts
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* Aim Controls */}
      {gameActive && !aimLocked && (
        <View style={styles.aimControls}>
          <View style={styles.aimPad}>
            <TouchableOpacity
              style={styles.aimBtn}
              onPress={() => adjustAim(0, -5)}
            >
              <Text style={styles.aimBtnText}>▲</Text>
            </TouchableOpacity>
            <View style={styles.aimRow}>
              <TouchableOpacity
                style={styles.aimBtn}
                onPress={() => adjustAim(-5, 0)}
              >
                <Text style={styles.aimBtnText}>◄</Text>
              </TouchableOpacity>
              <View style={styles.aimCenter}>
                <Text style={styles.aimCenterText}>🎯</Text>
              </View>
              <TouchableOpacity
                style={styles.aimBtn}
                onPress={() => adjustAim(5, 0)}
              >
                <Text style={styles.aimBtnText}>►</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={styles.aimBtn}
              onPress={() => adjustAim(0, 5)}
            >
              <Text style={styles.aimBtnText}>▼</Text>
            </TouchableOpacity>
          </View>

          {/* Fine adjust */}
          <View style={styles.fineAdjust}>
            <TouchableOpacity
              style={styles.fineBtn}
              onPress={() => adjustAim(-1, 0)}
            >
              <Text style={styles.fineBtnText}>◁</Text>
            </TouchableOpacity>
            <Text style={styles.fineLabel}>Fine</Text>
            <TouchableOpacity
              style={styles.fineBtn}
              onPress={() => adjustAim(1, 0)}
            >
              <Text style={styles.fineBtnText}>▷</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.fineBtn}
              onPress={() => adjustAim(0, -1)}
            >
              <Text style={styles.fineBtnText}>△</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.fineBtn}
              onPress={() => adjustAim(0, 1)}
            >
              <Text style={styles.fineBtnText}>▽</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Power Meter */}
      {gameActive && (
        <View style={styles.powerContainer}>
          <View style={styles.powerHeader}>
            <Text style={styles.powerLabel}>
              Power: {Math.round(powerLevel)}%
            </Text>
            <Text style={[styles.powerStatus, { color: getPowerColor() }]}>
              {getPowerLabel()}
            </Text>
          </View>
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
            {/* Sweet spot indicator */}
            <View style={styles.sweetSpot} />
          </View>
          <View style={styles.powerMarks}>
            <Text style={styles.powerMark}>0</Text>
            <Text style={styles.powerMark}>25</Text>
            <Text style={styles.powerMark}>50</Text>
            <Text style={[styles.powerMark, { color: '#4ECDC4' }]}>70-90✨</Text>
            <Text style={styles.powerMark}>100</Text>
          </View>
        </View>
      )}

      {/* Shoot Button */}
      {gameActive && arrowsLeft > 0 && (
        <View style={styles.shootContainer}>
          {!powerCharging ? (
            <TouchableOpacity
              style={styles.chargeBtn}
              onPress={startCharging}
              disabled={aimLocked}
            >
              <Text style={styles.chargeBtnText}>
                ⚡ Hold to Charge Power
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.shootBtn, { backgroundColor: getPowerColor() }]}
              onPress={releaseArrow}
            >
              <Animated.View
                style={{
                  transform: [
                    {
                      scale: bowStringAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [1, 1.15],
                      }),
                    },
                  ],
                }}
              >
                <Text style={styles.shootBtnText}>
                  🏹 RELEASE! ({Math.round(powerLevel)}%)
                </Text>
              </Animated.View>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Shot History */}
      {arrowsShot.length > 0 && (
        <View style={styles.historyContainer}>
          <Text style={styles.historyTitle}>Shot History:</Text>
          <View style={styles.historyRow}>
            {arrowsShot.map((arrow, idx) => (
              <View key={arrow.id} style={styles.historyItem}>
                <Text style={styles.historyArrow}>
                  {arrow.ring === 'bullseye'
                    ? '🎯'
                    : arrow.ring === 'miss'
                    ? '💨'
                    : '🏹'}
                </Text>
                <Text style={styles.historyPoints}>
                  {arrow.points > 0 ? `+${arrow.points}` : arrow.points}
                </Text>
                <Text style={styles.historyDetail}>
                  P:{arrow.power}% W:{arrow.windSpeed}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Hits</Text>
          <Text style={styles.statValue}>{currentStats.hits}</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Misses</Text>
          <Text style={[styles.statValue, { color: '#FF6B6B' }]}>
            {currentStats.misses}
          </Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Accuracy</Text>
          <Text style={styles.statValue}>{accuracy}%</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Bull's Eyes</Text>
          <Text style={[styles.statValue, { color: '#FFD700' }]}>
            {currentStats.bullseyes}
          </Text>
        </View>
      </View>

      {/* Start / Next / End Buttons */}
      {!gameStarted && (
        <View style={styles.actionContainer}>
          <TouchableOpacity style={styles.startBtn} onPress={startGame}>
            <Text style={styles.startBtnText}>
              🏹 Start - Player {currentPlayer}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {!gameActive && gameStarted && round < maxRounds && (
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

      {!gameActive && gameStarted && round >= maxRounds && (
        <View style={styles.gameOverButtons}>
          <TouchableOpacity style={styles.nextRoundBtn} onPress={resetGame}>
            <Text style={styles.nextRoundText}>🔄 New Game</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.endGameBtn}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.endGameText}>🚪 Exit</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background || '#0A1628',
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg || 20,
    paddingVertical: SPACING.sm || 8,
    backgroundColor: COLORS.primary || '#16213E',
  },
  backBtn: {
    fontSize: 16,
    color: '#FFF',
    fontWeight: 'bold',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
  },
  roundInfo: {
    fontSize: 14,
    color: '#AAA',
    fontWeight: 'bold',
  },

  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: SPACING.sm || 8,
    backgroundColor: COLORS.cardBg || '#16213E',
  },
  scoreItem: {
    alignItems: 'center',
  },
  playerLabel: {
    fontSize: 11,
    color: '#AAA',
    fontWeight: 'bold',
  },
  scoreValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  bullseyeCount: {
    fontSize: 11,
    color: '#FFD700',
  },
  arrowsBox: {
    alignItems: 'center',
  },
  arrowsLabel: {
    fontSize: 11,
    color: '#AAA',
  },
  arrowIcons: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 4,
  },
  arrowIcon: {
    fontSize: 20,
  },
  arrowUsed: {
    opacity: 0.3,
  },

  windBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg || 20,
    paddingVertical: 6,
    backgroundColor: '#1B2A4A',
    gap: 8,
  },
  windIcon: {
    fontSize: 18,
  },
  windText: {
    fontSize: 12,
    color: '#FFF',
    fontWeight: 'bold',
    flex: 1,
  },
  windStrength: {
    height: 6,
    borderRadius: 3,
    width: '30%',
  },

  targetArea: {
    alignItems: 'center',
    paddingVertical: SPACING.sm || 8,
    position: 'relative',
  },
  targetContainer: {
    width: width - 40,
    height: 240,
    backgroundColor: '#1B4332',
    borderRadius: BORDER_RADIUS.lg || 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#2D6A4F',
    overflow: 'hidden',
    position: 'relative',
  },
  targetRing: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  arrowOnTarget: {
    position: 'absolute',
    zIndex: 10,
  },
  arrowStuck: {
    fontSize: 16,
    transform: [{ rotate: '45deg' }],
  },
  crosshair: {
    position: 'absolute',
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 20,
  },
  crosshairEmoji: {
    fontSize: 28,
    color: '#FF0000',
  },
  scorePop: {
    position: 'absolute',
    top: 20,
    zIndex: 30,
  },
  scorePopText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFD700',
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },

  pointLabels: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 6,
    marginTop: 6,
    paddingHorizontal: 10,
  },
  pointLabel: {
    borderLeftWidth: 3,
    paddingLeft: 6,
    paddingVertical: 2,
  },
  pointLabelText: {
    fontSize: 10,
    color: '#CCC',
    fontWeight: 'bold',
  },

  aimControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 6,
    gap: 16,
  },
  aimPad: {
    alignItems: 'center',
    gap: 2,
  },
  aimRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  aimBtn: {
    width: 40,
    height: 40,
    backgroundColor: '#2A3A5C',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#4A5A7C',
  },
  aimBtnText: {
    fontSize: 18,
    color: '#FFF',
    fontWeight: 'bold',
  },
  aimCenter: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  aimCenterText: {
    fontSize: 22,
  },
  fineAdjust: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: 100,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  fineBtn: {
    width: 32,
    height: 32,
    backgroundColor: '#1E2D4D',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#3A4A6C',
  },
  fineBtnText: {
    fontSize: 14,
    color: '#AAA',
  },
  fineLabel: {
    fontSize: 10,
    color: '#666',
    width: '100%',
    textAlign: 'center',
  },

  powerContainer: {
    paddingHorizontal: SPACING.lg || 20,
    paddingVertical: 6,
    backgroundColor: COLORS.cardBg || '#16213E',
  },
  powerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  powerLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFF',
  },
  powerStatus: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  powerBar: {
    height: 16,
    backgroundColor: '#333',
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  powerFill: {
    height: '100%',
    borderRadius: 8,
  },
  sweetSpot: {
    position: 'absolute',
    left: '70%',
    width: '20%',
    height: '100%',
    borderWidth: 2,
    borderColor: '#4ECDC466',
    borderRadius: 8,
  },
  powerMarks: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  powerMark: {
    fontSize: 9,
    color: '#666',
  },

  shootContainer: {
    paddingHorizontal: SPACING.lg || 20,
    paddingVertical: 6,
  },
  chargeBtn: {
    backgroundColor: '#2A3A5C',
    paddingVertical: 12,
    borderRadius: BORDER_RADIUS.md || 10,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#4A5A7C',
  },
  chargeBtnText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#FFF',
  },
  shootBtn: {
    paddingVertical: 14,
    borderRadius: BORDER_RADIUS.md || 10,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFF33',
  },
  shootBtnText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
  },

  historyContainer: {
    paddingHorizontal: SPACING.lg || 20,
    paddingVertical: 4,
  },
  historyTitle: {
    fontSize: 11,
    color: '#AAA',
    marginBottom: 4,
  },
  historyRow: {
    flexDirection: 'row',
    gap: 10,
  },
  historyItem: {
    alignItems: 'center',
    backgroundColor: '#1B2A4A',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  historyArrow: {
    fontSize: 18,
  },
  historyPoints: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFD700',
  },
  historyDetail: {
    fontSize: 8,
    color: '#666',
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
    fontSize: 10,
    color: '#AAA',
    marginBottom: 2,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4ECDC4',
  },

  actionContainer: {
    paddingHorizontal: SPACING.lg || 20,
    paddingVertical: SPACING.sm || 8,
  },
  startBtn: {
    backgroundColor: '#E94560',
    paddingVertical: 14,
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
    backgroundColor: '#E94560',
    paddingVertical: 12,
    borderRadius: BORDER_RADIUS.md || 10,
    alignItems: 'center',
  },
  nextRoundText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
  },
  endGameBtn: {
    backgroundColor: '#533483',
    paddingVertical: 12,
    borderRadius: BORDER_RADIUS.md || 10,
    alignItems: 'center',
  },
  endGameText: {
    fontSize: 16,   
    fontWeight: 'bold',
    color: '#FFF',
  },
});
