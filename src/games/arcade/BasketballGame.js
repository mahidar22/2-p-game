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

const SHOT_ZONES = [
  { id: 'layup', label: 'Layup', emoji: '🏀', points: 2, difficulty: 0.75, distance: 'Close', color: '#4ECDC4' },
  { id: 'midrange', label: 'Mid-Range', emoji: '🎯', points: 2, difficulty: 0.55, distance: 'Medium', color: '#FFD700' },
  { id: 'three', label: '3-Pointer', emoji: '🔥', points: 3, difficulty: 0.40, distance: 'Far', color: '#FF6B6B' },
  { id: 'halfcourt', label: 'Half Court', emoji: '🚀', points: 4, difficulty: 0.15, distance: 'Very Far', color: '#9B59B6' },
  { id: 'dunk', label: 'Dunk', emoji: '💥', points: 2, difficulty: 0.85, distance: 'Close', color: '#E94560' },
  { id: 'freethrow', label: 'Free Throw', emoji: '✨', points: 1, difficulty: 0.70, distance: 'Line', color: '#2ECC71' },
];

const SHOT_CLOCK_TIME = 24;
const QUARTERS = 4;
const QUARTER_TIME = 60;

export default function BasketballGame({ navigation }) {
  const [scores, setScores] = useState({ player1: 0, player2: 0 });
  const [quarter, setQuarter] = useState(1);
  const [gameActive, setGameActive] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [quarterTime, setQuarterTime] = useState(QUARTER_TIME);
  const [shotClock, setShotClock] = useState(SHOT_CLOCK_TIME);
  const [currentPlayer, setCurrentPlayer] = useState(1);

  // Shot mechanics
  const [selectedZone, setSelectedZone] = useState(null);
  const [isShooting, setIsShooting] = useState(false);
  const [shotResult, setShotResult] = useState(null);
  const [shotsAttempted, setShotsAttempted] = useState(0);

  // Power meter
  const [powerLevel, setPowerLevel] = useState(0);
  const [powerCharging, setPowerCharging] = useState(false);
  const [powerIncreasing, setPowerIncreasing] = useState(true);

  // Release timing
  const [releaseWindow, setReleaseWindow] = useState(false);
  const [releaseQuality, setReleaseQuality] = useState('');

  // Streak & momentum
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [momentum, setMomentum] = useState(0);
  const [isOnFire, setIsOnFire] = useState(false);

  // Stats
  const [gameStats, setGameStats] = useState({
    player1: {
      shotsMade: 0,
      shotsMissed: 0,
      twoPointers: 0,
      threePointers: 0,
      dunks: 0,
      freeThrows: 0,
      halfCourt: 0,
      streak: 0,
      turnovers: 0,
    },
    player2: {
      shotsMade: 0,
      shotsMissed: 0,
      twoPointers: 0,
      threePointers: 0,
      dunks: 0,
      freeThrows: 0,
      halfCourt: 0,
      streak: 0,
      turnovers: 0,
    },
  });

  // Quarter scores history
  const [quarterScores, setQuarterScores] = useState({
    player1: [],
    player2: [],
  });

  // Animations
  const ballAnim = useRef(new Animated.Value(0)).current;
  const rimAnim = useRef(new Animated.Value(1)).current;
  const netAnim = useRef(new Animated.Value(0)).current;
  const streakAnim = useRef(new Animated.Value(1)).current;
  const fireAnim = useRef(new Animated.Value(0)).current;
  const shotClockAnim = useRef(new Animated.Value(1)).current;
  const scoreFlashAnim = useRef(new Animated.Value(0)).current;
  const courtAnim = useRef(new Animated.Value(0)).current;

  const powerInterval = useRef(null);
  const quarterTimer = useRef(null);
  const shotClockTimer = useRef(null);

  // Cleanup
  useEffect(() => {
    return () => {
      clearAllTimers();
    };
  }, []);

  const clearAllTimers = () => {
    if (powerInterval.current) clearInterval(powerInterval.current);
    if (quarterTimer.current) clearInterval(quarterTimer.current);
    if (shotClockTimer.current) clearInterval(shotClockTimer.current);
  };

  // Quarter timer
  useEffect(() => {
    if (!gameActive) return;

    quarterTimer.current = setInterval(() => {
      setQuarterTime((prev) => {
        if (prev <= 1) {
          endQuarter();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (quarterTimer.current) clearInterval(quarterTimer.current);
    };
  }, [gameActive]);

  // Shot clock timer
  useEffect(() => {
    if (!gameActive) return;

    shotClockTimer.current = setInterval(() => {
      setShotClock((prev) => {
        if (prev <= 1) {
          handleShotClockViolation();
          return SHOT_CLOCK_TIME;
        }
        if (prev <= 5) {
          Animated.sequence([
            Animated.timing(shotClockAnim, {
              toValue: 1.3,
              duration: 200,
              useNativeDriver: false,
            }),
            Animated.timing(shotClockAnim, {
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
      if (shotClockTimer.current) clearInterval(shotClockTimer.current);
    };
  }, [gameActive]);

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
          return prev + 2.5;
        } else {
          if (prev <= 0) {
            setPowerIncreasing(true);
            return 0;
          }
          return prev - 2.5;
        }
      });
    }, 30);

    return () => {
      if (powerInterval.current) clearInterval(powerInterval.current);
    };
  }, [powerCharging, powerIncreasing]);

  // Fire mode animation
  useEffect(() => {
    if (isOnFire) {
      const fireLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(fireAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: false,
          }),
          Animated.timing(fireAnim, {
            toValue: 0,
            duration: 500,
            useNativeDriver: false,
          }),
        ])
      );
      fireLoop.start();
      return () => fireLoop.stop();
    }
  }, [isOnFire]);

  // Start game
  const startGame = () => {
    setGameActive(true);
    setGameStarted(true);
    setQuarterTime(QUARTER_TIME);
    setShotClock(SHOT_CLOCK_TIME);
    setStreak(0);
    setMomentum(0);
    setIsOnFire(false);

    Animated.timing(courtAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: false,
    }).start();
  };

  // Shot clock violation
  const handleShotClockViolation = () => {
    const playerKey = currentPlayer === 1 ? 'player1' : 'player2';
    setGameStats((prev) => ({
      ...prev,
      [playerKey]: {
        ...prev[playerKey],
        turnovers: prev[playerKey].turnovers + 1,
      },
    }));

    setStreak(0);
    setMomentum((prev) => Math.max(0, prev - 10));
    setIsOnFire(false);

    Alert.alert(
      '⏰ Shot Clock Violation!',
      `Player ${currentPlayer} ran out of time!\nTurnover - ball goes to the other player.`,
      [{ text: 'Continue', onPress: switchPlayer }]
    );
  };

  // Select shot zone
  const handleSelectZone = (zone) => {
    if (!gameActive || isShooting) return;
    setSelectedZone(zone);
    setShotResult(null);
  };

  // Start shooting
  const startShot = () => {
    if (!selectedZone || isShooting || !gameActive) return;
    setIsShooting(true);
    setPowerCharging(true);
    setPowerLevel(0);
    setPowerIncreasing(true);
    setReleaseQuality('');
  };

  // Release shot
  const releaseShot = () => {
    if (!powerCharging) return;
    setPowerCharging(false);
    setIsShooting(false);

    // Calculate release quality
    const powerDiff = Math.abs(powerLevel - 75);
    let quality = '';
    let qualityBonus = 0;

    if (powerDiff <= 5) {
      quality = '🟢 PERFECT';
      qualityBonus = 0.20;
    } else if (powerDiff <= 15) {
      quality = '🟡 GOOD';
      qualityBonus = 0.10;
    } else if (powerDiff <= 25) {
      quality = '🟠 OK';
      qualityBonus = 0;
    } else {
      quality = '🔴 BAD';
      qualityBonus = -0.15;
    }

    setReleaseQuality(quality);

    // Calculate if shot goes in
    const baseDifficulty = selectedZone.difficulty;
    const momentumBonus = momentum * 0.003;
    const fireBonus = isOnFire ? 0.10 : 0;
    const streakBonus = Math.min(streak * 0.02, 0.10);

    const totalChance = Math.min(
      0.95,
      Math.max(0.05, baseDifficulty + qualityBonus + momentumBonus + fireBonus + streakBonus)
    );

    const roll = Math.random();
    const isMade = roll <= totalChance;

    // Ball animation
    animateBallFlight(isMade);

    setTimeout(() => {
      processResult(isMade, quality, totalChance);
    }, 1000);
  };

  // Ball flight animation
  const animateBallFlight = (made) => {
    ballAnim.setValue(0);
    Animated.sequence([
      Animated.timing(ballAnim, {
        toValue: 0.5,
        duration: 400,
        useNativeDriver: false,
      }),
      Animated.timing(ballAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: false,
      }),
    ]).start();

    if (made) {
      setTimeout(() => {
        // Rim bounce
        Animated.sequence([
          Animated.timing(rimAnim, {
            toValue: 0.9,
            duration: 100,
            useNativeDriver: false,
          }),
          Animated.spring(rimAnim, {
            toValue: 1,
            friction: 3,
            tension: 200,
            useNativeDriver: false,
          }),
        ]).start();

        // Net swish
        Animated.sequence([
          Animated.timing(netAnim, {
            toValue: 1,
            duration: 200,
            useNativeDriver: false,
          }),
          Animated.timing(netAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: false,
          }),
        ]).start();
      }, 600);
    }
  };

  // Process shot result
  const processResult = (made, quality, chance) => {
    const playerKey = currentPlayer === 1 ? 'player1' : 'player2';
    const zone = selectedZone;

    setShotsAttempted((prev) => prev + 1);

    if (made) {
      const points = zone.points;

      // Score flash
      scoreFlashAnim.setValue(0);
      Animated.sequence([
        Animated.spring(scoreFlashAnim, {
          toValue: 1,
          friction: 3,
          tension: 200,
          useNativeDriver: false,
        }),
        Animated.timing(scoreFlashAnim, {
          toValue: 0,
          duration: 800,
          delay: 500,
          useNativeDriver: false,
        }),
      ]).start();

      setScores((prev) => ({
        ...prev,
        [playerKey]: prev[playerKey] + points,
      }));

      const newStreak = streak + 1;
      setStreak(newStreak);
      if (newStreak > maxStreak) setMaxStreak(newStreak);
      setMomentum((prev) => Math.min(100, prev + 15));

      // Fire mode after 3 consecutive
      if (newStreak >= 3 && !isOnFire) {
        setIsOnFire(true);
        Alert.alert('🔥 ON FIRE!', `Player ${currentPlayer} is ON FIRE!\n+10% shot bonus!`, [
          { text: "Let's Go!", onPress: () => {} },
        ]);
      }

      // Streak animation
      Animated.sequence([
        Animated.timing(streakAnim, {
          toValue: 1.4,
          duration: 200,
          useNativeDriver: false,
        }),
        Animated.spring(streakAnim, {
          toValue: 1,
          friction: 3,
          tension: 200,
          useNativeDriver: false,
        }),
      ]).start();

      // Update detailed stats
      setGameStats((prev) => {
        const updated = { ...prev[playerKey] };
        updated.shotsMade += 1;
        updated.streak = Math.max(updated.streak, newStreak);

        switch (zone.id) {
          case 'dunk': updated.dunks += 1; break;
          case 'three': updated.threePointers += 1; break;
          case 'freethrow': updated.freeThrows += 1; break;
          case 'halfcourt': updated.halfCourt += 1; break;
          default: updated.twoPointers += 1; break;
        }

        return { ...prev, [playerKey]: updated };
      });

      setShotResult({
        made: true,
        points,
        quality,
        zone: zone.label,
        emoji: zone.id === 'dunk' ? '💥' : zone.id === 'three' ? '🔥' : zone.id === 'halfcourt' ? '🚀' : '🏀',
      });

      const shotMessage =
        zone.id === 'dunk'
          ? '💥 SLAM DUNK!'
          : zone.id === 'halfcourt'
          ? '🚀 HALF COURT MIRACLE!'
          : zone.id === 'three'
          ? '🔥 THREE POINTER!'
          : `🏀 ${zone.label} - SWISH!`;

      Alert.alert(
        shotMessage,
        `+${points} points!\n${quality}\nStreak: ${newStreak} 🔥\nChance: ${Math.round(chance * 100)}%`,
        [{ text: 'Next Shot', onPress: resetShot }]
      );
    } else {
      setStreak(0);
      setMomentum((prev) => Math.max(0, prev - 5));
      setIsOnFire(false);

      setGameStats((prev) => ({
        ...prev,
        [playerKey]: {
          ...prev[playerKey],
          shotsMissed: prev[playerKey].shotsMissed + 1,
        },
      }));

      setShotResult({
        made: false,
        points: 0,
        quality,
        zone: zone.label,
        emoji: '💨',
      });

      const missMessages = [
        'Brick! 🧱',
        'Air Ball! 💨',
        'Rimmed Out! ⭕',
        'Off the backboard! 📐',
        'No good! ❌',
      ];
      const missMsg = missMessages[Math.floor(Math.random() * missMessages.length)];

      Alert.alert(
        missMsg,
        `${zone.label} missed!\n${quality}\nChance was: ${Math.round(chance * 100)}%`,
        [{ text: 'Try Again', onPress: resetShot }]
      );
    }

    // Reset shot clock
    setShotClock(SHOT_CLOCK_TIME);
  };

  const resetShot = () => {
    setSelectedZone(null);
    setShotResult(null);
    setReleaseQuality('');
    setPowerLevel(0);
  };

  const switchPlayer = () => {
    setCurrentPlayer((prev) => (prev === 1 ? 2 : 1));
    setShotClock(SHOT_CLOCK_TIME);
    setStreak(0);
    setMomentum(0);
    setIsOnFire(false);
    setSelectedZone(null);
    setShotResult(null);
    setPowerLevel(0);
  };

  const endQuarter = () => {
    clearAllTimers();
    setGameActive(false);

    setQuarterScores((prev) => ({
      player1: [...prev.player1, scores.player1],
      player2: [...prev.player2, scores.player2],
    }));

    if (quarter >= QUARTERS) {
      handleGameOver();
    } else {
      Alert.alert(
        `📋 Quarter ${quarter} Over!`,
        `Score:\nPlayer 1: ${scores.player1}\nPlayer 2: ${scores.player2}`,
        [
          { text: `Start Q${quarter + 1}`, onPress: nextQuarter },
          { text: '🚪 End Game', onPress: () => navigation.goBack() },
        ]
      );
    }
  };

  const nextQuarter = () => {
    setQuarter((prev) => prev + 1);
    setQuarterTime(QUARTER_TIME);
    setShotClock(SHOT_CLOCK_TIME);
    setCurrentPlayer(1);
    setStreak(0);
    setMomentum(0);
    setIsOnFire(false);
    setSelectedZone(null);
    setShotResult(null);
    setPowerLevel(0);
    setShotsAttempted(0);
    setGameActive(true);
  };

  const handleGameOver = () => {
    const p1 = gameStats.player1;
    const p2 = gameStats.player2;

    let winner = '';
    if (scores.player1 > scores.player2) {
      winner = '🏆 Player 1 Wins!';
    } else if (scores.player2 > scores.player1) {
      winner = '🏆 Player 2 Wins!';
    } else {
      winner = "🤝 It's a Tie!";
    }

    Alert.alert(
      '🏀 Game Over!',
      `${winner}\n\nFinal Score:\nP1: ${scores.player1} | P2: ${scores.player2}\n\nP1 Shots: ${p1.shotsMade}/${p1.shotsMade + p1.shotsMissed}\nP2 Shots: ${p2.shotsMade}/${p2.shotsMade + p2.shotsMissed}\n\nP1 Best Streak: ${p1.streak}\nP2 Best Streak: ${p2.streak}`,
      [
        { text: '🔄 New Game', onPress: resetGame },
        { text: '🚪 Exit', onPress: () => navigation.goBack() },
      ]
    );
  };

  const resetGame = () => {
    setScores({ player1: 0, player2: 0 });
    setQuarter(1);
    setCurrentPlayer(1);
    setGameActive(false);
    setGameStarted(false);
    setQuarterTime(QUARTER_TIME);
    setShotClock(SHOT_CLOCK_TIME);
    setStreak(0);
    setMaxStreak(0);
    setMomentum(0);
    setIsOnFire(false);
    setSelectedZone(null);
    setShotResult(null);
    setPowerLevel(0);
    setShotsAttempted(0);
    setGameStats({
      player1: { shotsMade: 0, shotsMissed: 0, twoPointers: 0, threePointers: 0, dunks: 0, freeThrows: 0, halfCourt: 0, streak: 0, turnovers: 0 },
      player2: { shotsMade: 0, shotsMissed: 0, twoPointers: 0, threePointers: 0, dunks: 0, freeThrows: 0, halfCourt: 0, streak: 0, turnovers: 0 },
    });
    setQuarterScores({ player1: [], player2: [] });
  };

  const playerKey = currentPlayer === 1 ? 'player1' : 'player2';
  const currentGameStats = gameStats[playerKey];
  const totalShots = currentGameStats.shotsMade + currentGameStats.shotsMissed;
  const shootingPct = totalShots > 0 ? Math.round((currentGameStats.shotsMade / totalShots) * 100) : 0;

  const getPowerColor = () => {
    const diff = Math.abs(powerLevel - 75);
    if (diff <= 5) return '#4ECDC4';
    if (diff <= 15) return '#2ECC71';
    if (diff <= 25) return '#FFD700';
    return '#FF6B6B';
  };

  const getPowerLabel = () => {
    const diff = Math.abs(powerLevel - 75);
    if (diff <= 5) return '🟢 PERFECT';
    if (diff <= 15) return '🟡 GOOD';
    if (diff <= 25) return '🟠 OK';
    return '🔴 BAD';
  };

  const getShotClockColor = () => {
    if (shotClock > 10) return '#4ECDC4';
    if (shotClock > 5) return '#FFD700';
    return '#FF6B6B';
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backBtn}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>🏀 Basketball</Text>
        <Text style={styles.quarterInfo}>Q{quarter}/{QUARTERS}</Text>
      </View>

      {/* Scoreboard */}
      <View style={styles.scoreboard}>
        <View style={styles.scoreTeam}>
          <Text style={styles.teamLabel}>
            {currentPlayer === 1 ? '► ' : ''}P1
          </Text>
          <Animated.Text
            style={[
              styles.teamScore,
              { color: '#FF6B6B' },
              currentPlayer === 1 && {
                transform: [{ scale: scoreFlashAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, 1.2],
                })}],
              },
            ]}
          >
            {scores.player1}
          </Animated.Text>
        </View>

        <View style={styles.gameClocks}>
          <View style={styles.clockItem}>
            <Text style={styles.clockLabel}>Quarter</Text>
            <Text style={[styles.clockValue, { color: quarterTime <= 10 ? '#FF6B6B' : '#FFF' }]}>
              {Math.floor(quarterTime / 60)}:{(quarterTime % 60).toString().padStart(2, '0')}
            </Text>
          </View>
          <View style={styles.clockDivider} />
          <View style={styles.clockItem}>
            <Text style={styles.clockLabel}>Shot Clock</Text>
            <Animated.Text
              style={[
                styles.shotClockValue,
                {
                  color: getShotClockColor(),
                  transform: [{ scale: shotClockAnim }],
                },
              ]}
            >
              {shotClock}
            </Animated.Text>
          </View>
        </View>

        <View style={styles.scoreTeam}>
          <Text style={styles.teamLabel}>
            {currentPlayer === 2 ? '► ' : ''}P2
          </Text>
          <Animated.Text
            style={[
              styles.teamScore,
              { color: '#4ECDC4' },
              currentPlayer === 2 && {
                transform: [{ scale: scoreFlashAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, 1.2],
                })}],
              },
            ]}
          >
            {scores.player2}
          </Animated.Text>
        </View>
      </View>

      {/* Player Status */}
      <View style={[styles.playerStatus, isOnFire && styles.playerStatusFire]}>
        <Text style={styles.playerName}>
          🏀 Player {currentPlayer}
        </Text>
        {isOnFire && (
          <Animated.Text
            style={[
              styles.fireText,
              {
                opacity: fireAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.6, 1],
                }),
              },
            ]}
          >
            🔥 ON FIRE!
          </Animated.Text>
        )}
        <View style={styles.streakContainer}>
          <Animated.Text
            style={[
              styles.streakText,
              { transform: [{ scale: streakAnim }] },
            ]}
          >
            {streak > 0 ? `🎯 Streak: ${streak}` : ''}
          </Animated.Text>
        </View>
        <TouchableOpacity style={styles.switchBtn} onPress={switchPlayer}>
          <Text style={styles.switchBtnText}>⏭️ Pass Ball</Text>
        </TouchableOpacity>
      </View>

      {/* Court View */}
      <Animated.View
        style={[
          styles.courtContainer,
          {
            opacity: courtAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0.5, 1],
            }),
          },
        ]}
      >
        {/* Hoop */}
        <View style={styles.hoopArea}>
          <Animated.View
            style={[
              styles.backboard,
              { transform: [{ scaleX: rimAnim }] },
            ]}
          >
            <Text style={styles.backboardText}>┃</Text>
          </Animated.View>
          <Animated.View
            style={[
              styles.rim,
              { transform: [{ scale: rimAnim }] },
            ]}
          >
            <Text style={styles.rimEmoji}>⭕</Text>
          </Animated.View>
          <Animated.View
            style={[
              styles.net,
              {
                transform: [
                  {
                    skewX: netAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0deg', '15deg'],
                    }),
                  },
                ],
              },
            ]}
          >
            <Text style={styles.netText}>🥅</Text>
          </Animated.View>
        </View>

        {/* Ball animation */}
        <Animated.View
          style={[
            styles.ball,
            {
              opacity: ballAnim.interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: [1, 1, 0],
              }),
              transform: [
                {
                  translateY: ballAnim.interpolate({
                    inputRange: [0, 0.3, 0.5, 0.8, 1],
                    outputRange: [0, -80, -120, -80, 0],
                  }),
                },
                {
                  translateX: ballAnim.interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange: [0, 0, 0],
                  }),
                },
                {
                  rotate: ballAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', '720deg'],
                  }),
                },
              ],
            },
          ]}
        >
          <Text style={styles.ballEmoji}>🏀</Text>
        </Animated.View>

        {/* Shot result display */}
        {shotResult && (
          <View style={styles.resultDisplay}>
            <Text style={styles.resultEmoji}>{shotResult.emoji}</Text>
            <Text
              style={[
                styles.resultText,
                { color: shotResult.made ? '#4ECDC4' : '#FF6B6B' },
              ]}
            >
              {shotResult.made ? `+${shotResult.points}` : 'MISS'}
            </Text>
          </View>
        )}

        {/* Momentum bar */}
        <View style={styles.momentumContainer}>
          <Text style={styles.momentumLabel}>Momentum</Text>
          <View style={styles.momentumBar}>
            <View
              style={[
                styles.momentumFill,
                {
                  width: `${momentum}%`,
                  backgroundColor:
                    momentum >= 70
                      ? '#FF6B6B'
                      : momentum >= 40
                      ? '#FFD700'
                      : '#4ECDC4',
                },
              ]}
            />
          </View>
        </View>
      </Animated.View>

      {/* Shot Zone Selection */}
      {gameActive && !isShooting && (
        <View style={styles.shotZones}>
          <Text style={styles.zonesTitle}>Select Shot:</Text>
          <View style={styles.zonesGrid}>
            {SHOT_ZONES.map((zone) => (
              <TouchableOpacity
                key={zone.id}
                style={[
                  styles.zoneBtn,
                  {
                    borderColor: zone.color,
                    backgroundColor:
                      selectedZone?.id === zone.id
                        ? zone.color + '33'
                        : '#1B2A4A',
                  },
                  selectedZone?.id === zone.id && styles.zoneBtnSelected,
                ]}
                onPress={() => handleSelectZone(zone)}
              >
                <Text style={styles.zoneEmoji}>{zone.emoji}</Text>
                <Text style={styles.zoneLabel}>{zone.label}</Text>
                <Text style={[styles.zonePoints, { color: zone.color }]}>
                  +{zone.points}pts
                </Text>
                <Text style={styles.zoneDifficulty}>
                  {Math.round(zone.difficulty * 100)}%
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Power Meter & Shoot */}
      {gameActive && selectedZone && !shotResult && (
        <View style={styles.shootContainer}>
          {/* Power meter */}
          <View style={styles.powerContainer}>
            <View style={styles.powerHeader}>
              <Text style={styles.powerLabel}>
                Power: {Math.round(powerLevel)}%
              </Text>
              <Text style={[styles.powerQuality, { color: getPowerColor() }]}>
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
              <View style={styles.sweetSpot} />
            </View>
            <View style={styles.powerTicks}>
              <Text style={styles.tick}>0</Text>
              <Text style={styles.tick}>25</Text>
              <Text style={styles.tick}>50</Text>
              <Text style={[styles.tick, { color: '#4ECDC4' }]}>75✨</Text>
              <Text style={styles.tick}>100</Text>
            </View>
          </View>

          {/* Shoot buttons */}
          {!powerCharging ? (
            <TouchableOpacity style={styles.chargeBtn} onPress={startShot}>
              <Text style={styles.chargeBtnText}>
                ⚡ Charge Shot - {selectedZone.label} ({selectedZone.emoji})
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.releaseBtn, { backgroundColor: getPowerColor() }]}
              onPress={releaseShot}
            >
              <Text style={styles.releaseBtnText}>
                🏀 RELEASE! ({Math.round(powerLevel)}%)
              </Text>
            </TouchableOpacity>
          )}

          {releaseQuality !== '' && (
            <Text style={styles.releaseResult}>{releaseQuality}</Text>
          )}
        </View>
      )}

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>FG%</Text>
          <Text style={styles.statValue}>{shootingPct}%</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Made</Text>
          <Text style={[styles.statValue, { color: '#4ECDC4' }]}>
            {currentGameStats.shotsMade}
          </Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Missed</Text>
          <Text style={[styles.statValue, { color: '#FF6B6B' }]}>
            {currentGameStats.shotsMissed}
          </Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>3PT</Text>
          <Text style={[styles.statValue, { color: '#FFD700' }]}>
            {currentGameStats.threePointers}
          </Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Dunks</Text>
          <Text style={[styles.statValue, { color: '#E94560' }]}>
            {currentGameStats.dunks}
          </Text>
        </View>
      </View>

      {/* Start Button */}
      {!gameStarted && (
        <View style={styles.actionContainer}>
          <TouchableOpacity style={styles.startBtn} onPress={startGame}>
            <Text style={styles.startBtnText}>🏀 Tip Off!</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Game Over Buttons */}
      {!gameActive && gameStarted && (
        <View style={styles.gameOverButtons}>
          {quarter < QUARTERS ? (
            <TouchableOpacity style={styles.nextBtn} onPress={nextQuarter}>
              <Text style={styles.nextBtnText}>▶️ Start Q{quarter + 1}</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.nextBtn} onPress={resetGame}>
              <Text style={styles.nextBtnText}>🔄 New Game</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.exitBtn}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.exitBtnText}>🚪 Exit</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0E1A',
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg || 20,
    paddingVertical: SPACING.sm || 8,
    backgroundColor: '#1A1A2E',
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
  quarterInfo: {
    fontSize: 14,
    color: '#FFD700',
    fontWeight: 'bold',
  },

  scoreboard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg || 20,
    paddingVertical: SPACING.sm || 8,
    backgroundColor: '#16213E',
    borderBottomWidth: 2,
    borderBottomColor: '#FFD700',
  },
  scoreTeam: {
    alignItems: 'center',
    width: 70,
  },
  teamLabel: {
    fontSize: 12,
    color: '#AAA',
    fontWeight: 'bold',
  },
  teamScore: {
    fontSize: 32,
    fontWeight: 'bold',
  },

  gameClocks: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  clockItem: {
    alignItems: 'center',
  },
  clockLabel: {
    fontSize: 9,
    color: '#888',
  },
  clockValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
  },
  shotClockValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  clockDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#444',
  },

  playerStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg || 20,
    paddingVertical: 6,
    backgroundColor: '#0F3460',
  },
  playerStatusFire: {
    backgroundColor: '#8B0000',
  },
  playerName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFF',
  },
  fireText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFD700',
  },
  streakContainer: {
    flex: 1,
    alignItems: 'center',
  },
  streakText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#FFD700',
  },
  switchBtn: {
    backgroundColor: '#2A3A5C',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  switchBtnText: {
    fontSize: 11,
    color: '#FFF',
    fontWeight: 'bold',
  },

  courtContainer: {
    backgroundColor: '#C4722A',
    marginHorizontal: SPACING.md || 10,
    marginVertical: 4,
    borderRadius: BORDER_RADIUS.lg || 16,
    padding: SPACING.md || 10,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#8B4513',
    minHeight: 140,
    position: 'relative',
  },
  hoopArea: {
    alignItems: 'center',
    marginBottom: 8,
  },
  backboard: {
    width: 60,
    height: 4,
    backgroundColor: '#FFF',
    alignItems: 'center',
  },
  backboardText: {
    fontSize: 12,
    color: '#FFF',
  },
  rim: {
    marginTop: -2,
  },
  rimEmoji: {
    fontSize: 30,
  },
  net: {
    marginTop: -8,
  },
  netText: {
    fontSize: 20,
  },

  ball: {
    position: 'absolute',
    bottom: 20,
  },
  ballEmoji: {
    fontSize: 32,
  },

  resultDisplay: {
    alignItems: 'center',
    marginTop: 4,
  },
  resultEmoji: {
    fontSize: 30,
  },
  resultText: {
    fontSize: 18,
    fontWeight: 'bold',
  },

  momentumContainer: {
    width: '100%',
    marginTop: 6,
  },
  momentumLabel: {
    fontSize: 10,
    color: '#FFF',
    marginBottom: 2,
  },
  momentumBar: {
    height: 8,
    backgroundColor: '#5D3A1A',
    borderRadius: 4,
    overflow: 'hidden',
  },
  momentumFill: {
    height: '100%',
    borderRadius: 4,
  },

  shotZones: {
    paddingHorizontal: SPACING.md || 10,
    paddingVertical: 4,
  },
  zonesTitle: {
    fontSize: 12,
    color: '#AAA',
    marginBottom: 4,
    paddingLeft: 4,
  },
  zonesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    justifyContent: 'center',
  },
  zoneBtn: {
    width: (width - 50) / 3,
    paddingVertical: 8,
    borderRadius: BORDER_RADIUS.md || 10,
    borderWidth: 2,
    alignItems: 'center',
  },
  zoneBtnSelected: {
    borderWidth: 3,
  },
  zoneEmoji: {
    fontSize: 20,
  },
  zoneLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFF',
    marginTop: 2,
  },
  zonePoints: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  zoneDifficulty: {
    fontSize: 9,
    color: '#888',
  },

  shootContainer: {
    paddingHorizontal: SPACING.lg || 20,
    paddingVertical: 6,
  },
  powerContainer: {
    marginBottom: 6,
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
  powerQuality: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  powerBar: {
    height: 18,
    backgroundColor: '#333',
    borderRadius: 9,
    overflow: 'hidden',
    position: 'relative',
  },
  powerFill: {
    height: '100%',
    borderRadius: 9,
  },
  sweetSpot: {
    position: 'absolute',
    left: '70%',
    width: '10%',
    height: '100%',
    borderWidth: 2,
    borderColor: '#4ECDC466',
    borderRadius: 9,
  },
  powerTicks: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  tick: {
    fontSize: 9,
    color: '#666',
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
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFF',
  },
  releaseBtn: {
    paddingVertical: 14,
    borderRadius: BORDER_RADIUS.md || 10,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF33',
  },
  releaseBtnText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
  },
  releaseResult: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFD700',
    textAlign: 'center',
    marginTop: 4,
  },

  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: SPACING.sm || 8,
    paddingHorizontal: SPACING.md || 10,
    backgroundColor: '#16213E',
  },
  statBox: { alignItems: 'center' },
  statLabel: {
    fontSize: 9,
    color: '#888',
    marginBottom: 2,
  },
  statValue: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#FFF',
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
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
  },

  gameOverButtons: {
    paddingHorizontal: SPACING.lg || 20,
    paddingBottom: SPACING.md || 12,
    gap: 8,
  },
  nextBtn: {
    backgroundColor: '#E94560',
    paddingVertical: 12,
    borderRadius: BORDER_RADIUS.md || 10,
    alignItems: 'center',
  },
  nextBtnText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
  },
  exitBtn: {
    backgroundColor: '#533483',
    paddingVertical: 12,
    borderRadius: BORDER_RADIUS.md || 10,
    alignItems: 'center',
  },
  exitBtnText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
  },
});