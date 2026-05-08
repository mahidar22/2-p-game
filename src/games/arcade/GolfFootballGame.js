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

const HOLES = [
  { id: 1, par: 3, distance: 150, terrain: 'fairway', emoji: '⛳', wind: 'calm', hazards: [] },
  { id: 2, par: 3, distance: 180, terrain: 'fairway', emoji: '⛳', wind: 'light', hazards: ['bunker'] },
  { id: 3, par: 4, distance: 250, terrain: 'rough', emoji: '⛳', wind: 'moderate', hazards: ['water'] },
  { id: 4, par: 4, distance: 300, terrain: 'fairway', emoji: '⛳', wind: 'light', hazards: ['bunker', 'trees'] },
  { id: 5, par: 5, distance: 400, terrain: 'rough', emoji: '⛳', wind: 'strong', hazards: ['water', 'bunker'] },
  { id: 6, par: 3, distance: 160, terrain: 'fairway', emoji: '⛳', wind: 'calm', hazards: ['trees'] },
  { id: 7, par: 4, distance: 280, terrain: 'rough', emoji: '⛳', wind: 'moderate', hazards: ['water', 'trees'] },
  { id: 8, par: 5, distance: 450, terrain: 'fairway', emoji: '⛳', wind: 'strong', hazards: ['bunker', 'water', 'trees'] },
  { id: 9, par: 4, distance: 320, terrain: 'rough', emoji: '⛳', wind: 'moderate', hazards: ['bunker'] },
];

const KICK_TYPES = [
  { id: 'drive', label: 'Power Drive', emoji: '💨', maxDist: 200, accuracy: 0.6, description: 'Long distance, less accurate' },
  { id: 'approach', label: 'Approach', emoji: '🎯', maxDist: 120, accuracy: 0.8, description: 'Medium distance, good accuracy' },
  { id: 'chip', label: 'Chip Shot', emoji: '⬆️', maxDist: 60, accuracy: 0.9, description: 'Short distance, high accuracy' },
  { id: 'putt', label: 'Putt', emoji: '🏌️', maxDist: 30, accuracy: 0.95, description: 'Very short, very accurate' },
  { id: 'curve', label: 'Curve Kick', emoji: '🌀', maxDist: 150, accuracy: 0.5, description: 'Curves around obstacles' },
  { id: 'lob', label: 'Lob Kick', emoji: '🦅', maxDist: 100, accuracy: 0.7, description: 'High arc, clears hazards' },
];

const WIND_EFFECTS = {
  calm: { name: 'Calm', speed: 0, emoji: '🍃', modifier: 0 },
  light: { name: 'Light Breeze', speed: 5, emoji: '💨', modifier: 0.05 },
  moderate: { name: 'Moderate Wind', speed: 12, emoji: '🌬️', modifier: 0.12 },
  strong: { name: 'Strong Wind', speed: 20, emoji: '🌪️', modifier: 0.20 },
};

const TERRAIN_EFFECTS = {
  fairway: { name: 'Fairway', emoji: '🟩', bonus: 0.05, penalty: 0 },
  rough: { name: 'Rough', emoji: '🌿', bonus: 0, penalty: 0.08 },
  bunker: { name: 'Bunker', emoji: '🏖️', bonus: 0, penalty: 0.15 },
  water: { name: 'Water', emoji: '💧', bonus: 0, penalty: 0.30 },
};

const SCORE_NAMES = {
  '-3': { name: 'Albatross', emoji: '🦅🦅', color: '#FFD700' },
  '-2': { name: 'Eagle', emoji: '🦅', color: '#FFD700' },
  '-1': { name: 'Birdie', emoji: '🐦', color: '#4ECDC4' },
  '0': { name: 'Par', emoji: '✅', color: '#2ECC71' },
  '1': { name: 'Bogey', emoji: '😐', color: '#FFD700' },
  '2': { name: 'Double Bogey', emoji: '😟', color: '#FF6B6B' },
  '3': { name: 'Triple Bogey', emoji: '😩', color: '#FF0000' },
};

export default function GolfFootballGame({ navigation }) {
  const [scores, setScores] = useState({ player1: 0, player2: 0 });
  const [strokes, setStrokes] = useState({ player1: 0, player2: 0 });
  const [currentHole, setCurrentHole] = useState(0);
  const [totalHoles] = useState(9);
  const [gameActive, setGameActive] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [currentPlayer, setCurrentPlayer] = useState(1);
  const [turnPhase, setTurnPhase] = useState('aim'); // aim, power, result

  // Ball position
  const [ballDistance, setBallDistance] = useState(0);
  const [ballPosition, setBallPosition] = useState('tee');
  const [ballTerrain, setBallTerrain] = useState('fairway');
  const [distanceToHole, setDistanceToHole] = useState(0);

  // Kick selection
  const [selectedKick, setSelectedKick] = useState(null);

  // Aim angle
  const [aimAngle, setAimAngle] = useState(0);
  const [aimDirection, setAimDirection] = useState('straight');

  // Power meter
  const [powerLevel, setPowerLevel] = useState(0);
  const [powerCharging, setPowerCharging] = useState(false);
  const [powerIncreasing, setPowerIncreasing] = useState(true);

  // Current hole kicks
  const [currentKicks, setCurrentKicks] = useState(0);
  const [holeComplete, setHoleComplete] = useState(false);

  // Wind
  const [currentWind, setCurrentWind] = useState({ name: 'Calm', speed: 0, emoji: '🍃', modifier: 0 });
  const [windDirection, setWindDirection] = useState('→');

  // Hole scores history
  const [holeScores, setHoleScores] = useState({
    player1: [],
    player2: [],
  });

  // Stats
  const [gameStats, setGameStats] = useState({
    player1: {
      totalKicks: 0,
      eagles: 0,
      birdies: 0,
      pars: 0,
      bogeys: 0,
      longestDrive: 0,
      hazardHits: 0,
      perfectKicks: 0,
    },
    player2: {
      totalKicks: 0,
      eagles: 0,
      birdies: 0,
      pars: 0,
      bogeys: 0,
      longestDrive: 0,
      hazardHits: 0,
      perfectKicks: 0,
    },
  });

  // Animations
  const ballFlyAnim = useRef(new Animated.Value(0)).current;
  const ballBounceAnim = useRef(new Animated.Value(0)).current;
  const flagWaveAnim = useRef(new Animated.Value(0)).current;
  const powerBarAnim = useRef(new Animated.Value(0)).current;
  const scorePopAnim = useRef(new Animated.Value(0)).current;
  const windAnim = useRef(new Animated.Value(0)).current;
  const celebrationAnim = useRef(new Animated.Value(0)).current;
  const terrainAnim = useRef(new Animated.Value(1)).current;

  const powerInterval = useRef(null);

  // Cleanup
  useEffect(() => {
    return () => {
      if (powerInterval.current) clearInterval(powerInterval.current);
    };
  }, []);

  // Flag wave animation
  useEffect(() => {
    const flagLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(flagWaveAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: false,
        }),
        Animated.timing(flagWaveAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: false,
        }),
      ])
    );
    flagLoop.start();
    return () => flagLoop.stop();
  }, []);

  // Wind animation
  useEffect(() => {
    const windLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(windAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: false,
        }),
        Animated.timing(windAnim, {
          toValue: 0,
          duration: 800,
          useNativeDriver: false,
        }),
      ])
    );
    windLoop.start();
    return () => windLoop.stop();
  }, []);

  // Power meter
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
          return prev + 1.8;
        } else {
          if (prev <= 0) {
            setPowerIncreasing(true);
            return 0;
          }
          return prev - 1.8;
        }
      });
    }, 25);

    return () => {
      if (powerInterval.current) clearInterval(powerInterval.current);
    };
  }, [powerCharging, powerIncreasing]);

  // Setup hole
  const setupHole = (holeIndex) => {
    const hole = HOLES[holeIndex];
    setDistanceToHole(hole.distance);
    setBallDistance(0);
    setBallPosition('tee');
    setBallTerrain('fairway');
    setCurrentKicks(0);
    setHoleComplete(false);
    setSelectedKick(null);
    setTurnPhase('aim');
    setPowerLevel(0);
    setAimAngle(0);

    // Setup wind
    const wind = WIND_EFFECTS[hole.wind];
    setCurrentWind(wind);
    const directions = ['←', '→', '↗', '↘', '↙', '↖'];
    setWindDirection(directions[Math.floor(Math.random() * directions.length)]);
  };

  // Start game
  const startGame = () => {
    setGameStarted(true);
    setGameActive(true);
    setCurrentHole(0);
    setupHole(0);
  };

  // Select kick type
  const selectKick = (kick) => {
    if (turnPhase !== 'aim' || holeComplete) return;
    setSelectedKick(kick);
  };

  // Adjust aim
  const adjustAim = (direction) => {
    if (turnPhase !== 'aim') return;
    setAimAngle((prev) => {
      if (direction === 'left') return Math.max(-45, prev - 5);
      if (direction === 'right') return Math.min(45, prev + 5);
      return prev;
    });

    if (aimAngle < -15) setAimDirection('far left');
    else if (aimAngle < -5) setAimDirection('left');
    else if (aimAngle > 15) setAimDirection('far right');
    else if (aimAngle > 5) setAimDirection('right');
    else setAimDirection('straight');
  };

  // Start power charge
  const startPowerCharge = () => {
    if (!selectedKick || turnPhase !== 'aim') return;
    setTurnPhase('power');
    setPowerCharging(true);
    setPowerLevel(0);
    setPowerIncreasing(true);
  };

  // Execute kick
  const executeKick = () => {
    if (!powerCharging) return;
    setPowerCharging(false);
    setTurnPhase('result');

    const hole = HOLES[currentHole];
    const kick = selectedKick;
    const power = powerLevel;

    // Calculate distance
    const baseDist = (power / 100) * kick.maxDist;

    // Power accuracy (best at 75-85%)
    const powerDiff = Math.abs(power - 80);
    let powerQuality = '';
    let powerAccuracyBonus = 0;

    if (powerDiff <= 5) {
      powerQuality = '🟢 PERFECT';
      powerAccuracyBonus = 0.15;
    } else if (powerDiff <= 15) {
      powerQuality = '🟡 GREAT';
      powerAccuracyBonus = 0.08;
    } else if (powerDiff <= 25) {
      powerQuality = '🟠 GOOD';
      powerAccuracyBonus = 0;
    } else {
      powerQuality = '🔴 POOR';
      powerAccuracyBonus = -0.12;
    }

    // Terrain effect
    const terrainEffect = TERRAIN_EFFECTS[ballTerrain];
    const terrainModifier = terrainEffect.bonus - terrainEffect.penalty;

    // Wind effect
    const windModifier = currentWind.modifier * (Math.random() > 0.5 ? 1 : -1);

    // Aim accuracy
    const aimOffset = Math.abs(aimAngle) / 45;
    const aimPenalty = aimOffset * 0.1;

    // Total accuracy
    const totalAccuracy = Math.min(0.98, Math.max(0.1,
      kick.accuracy + powerAccuracyBonus + terrainModifier - aimPenalty
    ));

    // Roll for accuracy
    const accuracyRoll = Math.random();
    const isAccurate = accuracyRoll <= totalAccuracy;

    // Calculate actual distance
    let actualDistance = baseDist;
    if (!isAccurate) {
      const deviation = (1 - totalAccuracy) * baseDist * 0.5;
      actualDistance = baseDist + (Math.random() - 0.5) * deviation * 2;
    }

    // Wind adjustment
    actualDistance += actualDistance * windModifier * (Math.random() * 0.5);

    // Curve kick bonus
    if (kick.id === 'curve') {
      actualDistance *= 1.1;
    }

    // Lob kick - clear hazards
    let hitHazard = false;
    let hazardType = '';

    if (kick.id !== 'lob' && hole.hazards.length > 0) {
      const hazardChance = 0.15 + aimPenalty + (1 - totalAccuracy) * 0.2;
      if (Math.random() < hazardChance) {
        hitHazard = true;
        hazardType = hole.hazards[Math.floor(Math.random() * hole.hazards.length)];

        if (hazardType === 'water') {
          actualDistance *= 0.3;
        } else if (hazardType === 'bunker') {
          actualDistance *= 0.6;
          setBallTerrain('bunker');
        } else if (hazardType === 'trees') {
          actualDistance *= 0.5;
          setBallTerrain('rough');
        }
      }
    }

    actualDistance = Math.max(5, Math.round(actualDistance));

    // Update ball position
    const newRemainingDist = Math.max(0, distanceToHole - actualDistance);
    setDistanceToHole(newRemainingDist);
    setBallDistance((prev) => prev + actualDistance);
    setCurrentKicks((prev) => prev + 1);

    const playerKey = currentPlayer === 1 ? 'player1' : 'player2';
    setGameStats((prev) => ({
      ...prev,
      [playerKey]: {
        ...prev[playerKey],
        totalKicks: prev[playerKey].totalKicks + 1,
        longestDrive: Math.max(prev[playerKey].longestDrive, actualDistance),
        hazardHits: prev[playerKey].hazardHits + (hitHazard ? 1 : 0),
        perfectKicks: prev[playerKey].perfectKicks + (powerDiff <= 5 ? 1 : 0),
      },
    }));

    // Ball animation
    ballFlyAnim.setValue(0);
    Animated.sequence([
      Animated.timing(ballFlyAnim, {
        toValue: 0.5,
        duration: 600,
        useNativeDriver: false,
      }),
      Animated.timing(ballFlyAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: false,
      }),
    ]).start();

    // Ball bounce
    setTimeout(() => {
      ballBounceAnim.setValue(0);
      Animated.sequence([
        Animated.timing(ballBounceAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: false,
        }),
        Animated.timing(ballBounceAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: false,
        }),
        Animated.timing(ballBounceAnim, {
          toValue: 0.5,
          duration: 150,
          useNativeDriver: false,
        }),
        Animated.timing(ballBounceAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: false,
        }),
      ]).start();
    }, 800);

    // Determine terrain after shot
    if (!hitHazard) {
      if (newRemainingDist < 30) {
        setBallPosition('green');
        setBallTerrain('fairway');
      } else if (Math.abs(aimAngle) > 20) {
        setBallTerrain('rough');
        setBallPosition('rough');
      } else {
        setBallTerrain('fairway');
        setBallPosition('fairway');
      }
    }

    // Check if ball in hole
    const isInHole = newRemainingDist <= 0 || (newRemainingDist < 5 && kick.id === 'putt' && isAccurate);

    setTimeout(() => {
      if (isInHole) {
        handleBallInHole(powerQuality, actualDistance, hitHazard, hazardType);
      } else {
        let message = `⚽ ${kick.label}\n${powerQuality}\nDistance: ${actualDistance}m\nRemaining: ${newRemainingDist}m`;

        if (hitHazard) {
          const hazardEmoji = hazardType === 'water' ? '💧' : hazardType === 'bunker' ? '🏖️' : '🌳';
          message += `\n\n${hazardEmoji} Hit ${hazardType}!`;
        }

        Alert.alert(
          hitHazard ? `${hazardType === 'water' ? '💧' : '🏖️'} Hazard!` : '⚽ Kicked!',
          message,
          [{ text: 'Next Kick', onPress: () => setTurnPhase('aim') }]
        );
      }
    }, 1200);
  };

  // Ball in hole
  const handleBallInHole = (powerQuality, distance, hitHazard, hazardType) => {
    setHoleComplete(true);

    const hole = HOLES[currentHole];
    const kicksUsed = currentKicks;
    const scoreToPar = kicksUsed - hole.par;

    const playerKey = currentPlayer === 1 ? 'player1' : 'player2';

    // Update stroke count
    setStrokes((prev) => ({
      ...prev,
      [playerKey]: prev[playerKey] + kicksUsed,
    }));

    // Calculate points (lower is better in golf)
    let points = 0;
    const scoreKey = Math.max(-3, Math.min(3, scoreToPar)).toString();
    const scoreInfo = SCORE_NAMES[scoreKey] || { name: `+${scoreToPar}`, emoji: '😫', color: '#FF0000' };

    // Points system (reward good play)
    if (scoreToPar <= -2) points = 100;
    else if (scoreToPar === -1) points = 70;
    else if (scoreToPar === 0) points = 50;
    else if (scoreToPar === 1) points = 30;
    else if (scoreToPar === 2) points = 15;
    else points = 5;

    // Bonus for no hazards
    if (!hitHazard) points += 10;

    // Hole-in-one bonus
    if (kicksUsed === 1) {
      points = 200;
    }

    setScores((prev) => ({
      ...prev,
      [playerKey]: prev[playerKey] + points,
    }));

    // Record hole score
    setHoleScores((prev) => ({
      ...prev,
      [playerKey]: [...prev[playerKey], { hole: currentHole + 1, kicks: kicksUsed, par: hole.par, scoreToPar, points }],
    }));

    // Update stats
    setGameStats((prev) => {
      const updated = { ...prev[playerKey] };
      if (scoreToPar <= -2) updated.eagles += 1;
      else if (scoreToPar === -1) updated.birdies += 1;
      else if (scoreToPar === 0) updated.pars += 1;
      else updated.bogeys += 1;
      return { ...prev, [playerKey]: updated };
    });

    // Celebration animation
    if (scoreToPar <= 0) {
      celebrationAnim.setValue(0);
      Animated.sequence([
        Animated.spring(celebrationAnim, {
          toValue: 1,
          friction: 3,
          tension: 200,
          useNativeDriver: false,
        }),
        Animated.timing(celebrationAnim, {
          toValue: 0,
          duration: 1000,
          delay: 500,
          useNativeDriver: false,
        }),
      ]).start();
    }

    // Score popup
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
        delay: 600,
        useNativeDriver: false,
      }),
    ]).start();

    const holeInOneMsg = kicksUsed === 1 ? '\n\n🏆 HOLE IN ONE!! 🏆' : '';

    Alert.alert(
      `${scoreInfo.emoji} ${scoreInfo.name}!`,
      `Hole ${currentHole + 1} Complete!\n\nKicks: ${kicksUsed} (Par ${hole.par})\nScore: ${scoreToPar >= 0 ? '+' : ''}${scoreToPar}\nPoints: +${points}${holeInOneMsg}`,
      [{ text: 'Continue', onPress: handleHoleComplete }]
    );
  };

  const handleHoleComplete = () => {
    if (currentPlayer === 1) {
      // Player 2's turn on same hole
      setCurrentPlayer(2);
      setupHole(currentHole);
    } else {
      // Both players done - next hole
      if (currentHole + 1 >= totalHoles) {
        handleGameOver();
      } else {
        Alert.alert(
          `📋 Hole ${currentHole + 1} Summary`,
          `P1: ${holeScores.player1[holeScores.player1.length - 1]?.kicks || '-'} kicks\nP2: ${holeScores.player2[holeScores.player2.length - 1]?.kicks || '-'} kicks\n\nTotal Strokes:\nP1: ${strokes.player1} | P2: ${strokes.player2}\nPoints: P1: ${scores.player1} | P2: ${scores.player2}`,
          [{ text: `Next Hole ⛳`, onPress: moveToNextHole }]
        );
      }
    }
  };

  const moveToNextHole = () => {
    setCurrentHole((prev) => prev + 1);
    setCurrentPlayer(1);
    setupHole(currentHole + 1);
  };

  const handleGameOver = () => {
    setGameActive(false);
    const p1 = gameStats.player1;
    const p2 = gameStats.player2;

    let champion = '';
    // In golf, LOWER strokes is better, but we also have points
    if (scores.player1 > scores.player2) {
      champion = '🏆 Player 1 Wins!';
    } else if (scores.player2 > scores.player1) {
      champion = '🏆 Player 2 Wins!';
    } else {
      // Tiebreaker: fewer strokes
      if (strokes.player1 < strokes.player2) champion = '🏆 Player 1 Wins (fewer strokes)!';
      else if (strokes.player2 < strokes.player1) champion = '🏆 Player 2 Wins (fewer strokes)!';
      else champion = "🤝 Perfect Tie!";
    }

    Alert.alert(
      '🏌️ Game Over!',
      `${champion}\n\nPoints: P1 ${scores.player1} | P2 ${scores.player2}\nStrokes: P1 ${strokes.player1} | P2 ${strokes.player2}\n\n🦅 Eagles: P1 ${p1.eagles} | P2 ${p2.eagles}\n🐦 Birdies: P1 ${p1.birdies} | P2 ${p2.birdies}\n✅ Pars: P1 ${p1.pars} | P2 ${p2.pars}\n💨 Longest: P1 ${p1.longestDrive}m | P2 ${p2.longestDrive}m`,
      [
        { text: '🔄 New Game', onPress: resetGame },
        { text: '🚪 Exit', onPress: () => navigation.goBack() },
      ]
    );
  };

  const resetGame = () => {
    setScores({ player1: 0, player2: 0 });
    setStrokes({ player1: 0, player2: 0 });
    setCurrentHole(0);
    setCurrentPlayer(1);
    setGameActive(false);
    setGameStarted(false);
    setHoleScores({ player1: [], player2: [] });
    setGameStats({
      player1: { totalKicks: 0, eagles: 0, birdies: 0, pars: 0, bogeys: 0, longestDrive: 0, hazardHits: 0, perfectKicks: 0 },
      player2: { totalKicks: 0, eagles: 0, birdies: 0, pars: 0, bogeys: 0, longestDrive: 0, hazardHits: 0, perfectKicks: 0 },
    });
  };

  const hole = HOLES[currentHole] || HOLES[0];
  const playerKey = currentPlayer === 1 ? 'player1' : 'player2';
  const currentGameStats = gameStats[playerKey];

  const getPowerColor = () => {
    const diff = Math.abs(powerLevel - 80);
    if (diff <= 5) return '#4ECDC4';
    if (diff <= 15) return '#2ECC71';
    if (diff <= 25) return '#FFD700';
    return '#FF6B6B';
  };

  const getPowerLabel = () => {
    const diff = Math.abs(powerLevel - 80);
    if (diff <= 5) return '🟢 PERFECT';
    if (diff <= 15) return '🟡 GREAT';
    if (diff <= 25) return '🟠 GOOD';
    return '🔴 POOR';
  };

  const getTerrainEmoji = () => {
    switch (ballTerrain) {
      case 'fairway': return '🟩';
      case 'rough': return '🌿';
      case 'bunker': return '🏖️';
      default: return '🟩';
    }
  };

  const getDistanceColor = () => {
    if (distanceToHole <= 30) return '#4ECDC4';
    if (distanceToHole <= 100) return '#FFD700';
    return '#FF6B6B';
  };

  const getRecommendedKick = () => {
    if (distanceToHole <= 10) return 'putt';
    if (distanceToHole <= 30) return 'putt';
    if (distanceToHole <= 60) return 'chip';
    if (distanceToHole <= 120) return 'approach';
    return 'drive';
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backBtn}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>⚽⛳ Golf Football</Text>
        <Text style={styles.holeInfo}>Hole {currentHole + 1}/{totalHoles}</Text>
      </View>

      {/* Scoreboard */}
      <View style={styles.scoreboard}>
        <View style={styles.scoreTeam}>
          <Text style={styles.teamLabel}>{currentPlayer === 1 ? '► ' : ''}P1</Text>
          <Text style={[styles.teamScore, { color: '#FF6B6B' }]}>{scores.player1}</Text>
          <Text style={styles.strokeCount}>⛳ {strokes.player1} strokes</Text>
        </View>

        <View style={styles.holeInfoCenter}>
          <Text style={styles.holePar}>Par {hole.par}</Text>
          <Text style={styles.holeDistance}>{hole.distance}m</Text>
          <Animated.Text
            style={[
              styles.windText,
              { opacity: windAnim.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }) },
            ]}
          >
            {currentWind.emoji} {currentWind.name} {windDirection}
          </Animated.Text>
        </View>

        <View style={styles.scoreTeam}>
          <Text style={styles.teamLabel}>{currentPlayer === 2 ? '► ' : ''}P2</Text>
          <Text style={[styles.teamScore, { color: '#4ECDC4' }]}>{scores.player2}</Text>
          <Text style={styles.strokeCount}>⛳ {strokes.player2} strokes</Text>
        </View>
      </View>

      {/* Player Bar */}
      <View style={styles.playerBar}>
        <Text style={styles.playerName}>🏌️ Player {currentPlayer}</Text>
        <Text style={styles.kickCount}>Kick {currentKicks + 1}</Text>
        <Text style={styles.terrainLabel}>{getTerrainEmoji()} {ballTerrain}</Text>
      </View>

      {/* Course View */}
      <View style={styles.courseContainer}>
        {/* Sky */}
        <View style={styles.sky}>
          <Text style={styles.sunEmoji}>☀️</Text>
          <Animated.Text
            style={[
              styles.cloudEmoji,
              {
                transform: [{
                  translateX: windAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-10, 10],
                  }),
                }],
              },
            ]}
          >
            ☁️   ☁️
          </Animated.Text>
        </View>

        {/* Course */}
        <View style={styles.courseGround}>
          {/* Hazards display */}
          <View style={styles.hazardRow}>
            {hole.hazards.map((h, i) => (
              <View key={i} style={styles.hazardItem}>
                <Text style={styles.hazardEmoji}>
                  {h === 'water' ? '💧' : h === 'bunker' ? '🏖️' : '🌳'}
                </Text>
                <Text style={styles.hazardLabel}>{h}</Text>
              </View>
            ))}
          </View>

          {/* Distance meter */}
          <View style={styles.distanceMeter}>
            <View style={styles.distanceTrack}>
              {/* Ball position indicator */}
              <View
                style={[
                  styles.ballIndicator,
                  {
                    left: `${Math.min(95, Math.max(5, ((hole.distance - distanceToHole) / hole.distance) * 100))}%`,
                  },
                ]}
              >
                <Animated.Text
                  style={[
                    styles.ballEmoji,
                    {
                      transform: [{
                        translateY: ballBounceAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, -15],
                        }),
                      }],
                    },
                  ]}
                >
                  ⚽
                </Animated.Text>
              </View>

              {/* Flag at end */}
              <Animated.View
                style={[
                  styles.flagPosition,
                  {
                    transform: [{
                      rotate: flagWaveAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['-5deg', '5deg'],
                      }),
                    }],
                  },
                ]}
              >
                <Text style={styles.flagEmoji}>⛳</Text>
              </Animated.View>
            </View>

            <View style={styles.distanceLabels}>
              <Text style={styles.distLabel}>Tee</Text>
              <Text style={[styles.distRemaining, { color: getDistanceColor() }]}>
                {distanceToHole}m to hole
              </Text>
              <Text style={styles.distLabel}>Hole</Text>
            </View>
          </View>

          {/* Celebration */}
          <Animated.View
            style={[
              styles.celebration,
              {
                opacity: celebrationAnim,
                transform: [{
                  scale: celebrationAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.5, 1.5],
                  }),
                }],
              },
            ]}
          >
            <Text style={styles.celebrationText}>🎉⚽⛳🎉</Text>
          </Animated.View>

          {/* Score popup */}
          <Animated.View
            style={[
              styles.scorePop,
              {
                opacity: scorePopAnim,
                transform: [{
                  translateY: scorePopAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [20, -20],
                  }),
                }],
              },
            ]}
          >
            <Text style={styles.scorePopText}>GOAL! ⚽</Text>
          </Animated.View>
        </View>
      </View>

      {/* Kick Selection */}
      {turnPhase === 'aim' && !holeComplete && gameActive && (
        <View style={styles.kickSelection}>
          <Text style={styles.kickTitle}>
            Select Kick: (Recommended: {KICK_TYPES.find((k) => k.id === getRecommendedKick())?.emoji || ''})
          </Text>
          <View style={styles.kickGrid}>
            {KICK_TYPES.map((kick) => (
              <TouchableOpacity
                key={kick.id}
                style={[
                  styles.kickCard,
                  selectedKick?.id === kick.id && styles.kickCardSelected,
                  kick.id === getRecommendedKick() && styles.kickCardRecommended,
                ]}
                onPress={() => selectKick(kick)}
              >
                <Text style={styles.kickEmoji}>{kick.emoji}</Text>
                <Text style={styles.kickName}>{kick.label}</Text>
                <Text style={styles.kickDist}>Max: {kick.maxDist}m</Text>
                <Text style={styles.kickAcc}>{Math.round(kick.accuracy * 100)}% acc</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Aim Controls */}
      {turnPhase === 'aim' && selectedKick && !holeComplete && gameActive && (
        <View style={styles.aimControls}>
          <TouchableOpacity style={styles.aimBtn} onPress={() => adjustAim('left')}>
            <Text style={styles.aimBtnText}>◄ Left</Text>
          </TouchableOpacity>

          <View style={styles.aimDisplay}>
            <Text style={styles.aimAngleText}>
              {aimAngle === 0 ? '↑ Straight' : aimAngle < 0 ? `↰ ${Math.abs(aimAngle)}°` : `↱ ${aimAngle}°`}
            </Text>
            <View style={styles.aimMeter}>
              <View style={[styles.aimIndicator, { left: `${((aimAngle + 45) / 90) * 100}%` }]} />
            </View>
          </View>

          <TouchableOpacity style={styles.aimBtn} onPress={() => adjustAim('right')}>
            <Text style={styles.aimBtnText}>Right ►</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Power Meter & Kick Button */}
      {gameActive && !holeComplete && (
        <View style={styles.powerSection}>
          {turnPhase === 'power' && (
            <View style={styles.powerContainer}>
              <View style={styles.powerHeader}>
                <Text style={styles.powerLabel}>Power: {Math.round(powerLevel)}%</Text>
                <Text style={[styles.powerQuality, { color: getPowerColor() }]}>
                  {getPowerLabel()}
                </Text>
              </View>
              <View style={styles.powerBar}>
                <View
                  style={[
                    styles.powerFill,
                    { width: `${powerLevel}%`, backgroundColor: getPowerColor() },
                  ]}
                />
                <View style={styles.sweetSpot} />
              </View>
              <View style={styles.powerTicks}>
                <Text style={styles.tick}>0</Text>
                <Text style={styles.tick}>25</Text>
                <Text style={styles.tick}>50</Text>
                <Text style={[styles.tick, { color: '#4ECDC4' }]}>80✨</Text>
                <Text style={styles.tick}>100</Text>
              </View>
            </View>
          )}

          {turnPhase === 'aim' && selectedKick && (
            <TouchableOpacity style={styles.chargeBtn} onPress={startPowerCharge}>
              <Text style={styles.chargeBtnText}>
                ⚡ Charge Kick - {selectedKick.emoji} {selectedKick.label}
              </Text>
            </TouchableOpacity>
          )}

          {turnPhase === 'power' && (
            <TouchableOpacity
              style={[styles.kickBtn, { backgroundColor: getPowerColor() }]}
              onPress={executeKick}
            >
              <Text style={styles.kickBtnText}>
                ⚽ KICK! ({Math.round(powerLevel)}%)
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Scorecard */}
      {holeScores[playerKey].length > 0 && (
        <View style={styles.scorecardContainer}>
          <Text style={styles.scorecardTitle}>Scorecard:</Text>
          <View style={styles.scorecardRow}>
            {holeScores[playerKey].slice(-5).map((hs, i) => {
              const scoreKey = Math.max(-3, Math.min(3, hs.scoreToPar)).toString();
              const info = SCORE_NAMES[scoreKey] || { emoji: '🔴', color: '#FF0000' };
              return (
                <View key={i} style={styles.scorecardItem}>
                  <Text style={styles.scorecardHole}>H{hs.hole}</Text>
                  <Text style={styles.scorecardEmoji}>{info.emoji}</Text>
                  <Text style={[styles.scorecardScore, { color: info.color }]}>
                    {hs.scoreToPar >= 0 ? '+' : ''}{hs.scoreToPar}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      )}

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Kicks</Text>
          <Text style={styles.statValue}>{currentGameStats.totalKicks}</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>🦅</Text>
          <Text style={[styles.statValue, { color: '#FFD700' }]}>{currentGameStats.eagles}</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>🐦</Text>
          <Text style={[styles.statValue, { color: '#4ECDC4' }]}>{currentGameStats.birdies}</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>✅</Text>
          <Text style={[styles.statValue, { color: '#2ECC71' }]}>{currentGameStats.pars}</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Longest</Text>
          <Text style={[styles.statValue, { color: '#E94560' }]}>{currentGameStats.longestDrive}m</Text>
        </View>
      </View>

      {/* Start Button */}
      {!gameStarted && (
        <View style={styles.actionContainer}>
          <TouchableOpacity style={styles.startBtn} onPress={startGame}>
            <Text style={styles.startBtnText}>⚽⛳ Tee Off!</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Game Over */}
      {!gameActive && gameStarted && (
        <View style={styles.gameOverButtons}>
          <TouchableOpacity style={styles.nextBtn} onPress={resetGame}>
            <Text style={styles.nextBtnText}>🔄 New Game</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.exitBtn} onPress={() => navigation.goBack()}>
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
    backgroundColor: '#0A1628',
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg || 20,
    paddingVertical: SPACING.sm || 8,
    backgroundColor: '#1A1A2E',
  },
  backBtn: { fontSize: 16, color: '#FFF', fontWeight: 'bold' },
  title: { fontSize: 18, fontWeight: 'bold', color: '#FFF' },
  holeInfo: { fontSize: 13, color: '#FFD700', fontWeight: 'bold' },

  scoreboard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg || 20,
    paddingVertical: 6,
    backgroundColor: '#16213E',
    borderBottomWidth: 2,
    borderBottomColor: '#2ECC71',
  },
  scoreTeam: { alignItems: 'center', width: 85 },
  teamLabel: { fontSize: 11, color: '#AAA', fontWeight: 'bold' },
  teamScore: { fontSize: 24, fontWeight: 'bold' },
  strokeCount: { fontSize: 9, color: '#888' },
  holeInfoCenter: { alignItems: 'center' },
  holePar: { fontSize: 16, fontWeight: 'bold', color: '#2ECC71' },
  holeDistance: { fontSize: 12, color: '#AAA' },
  windText: { fontSize: 10, color: '#87CEEB' },

  playerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg || 20,
    paddingVertical: 4,
    backgroundColor: '#0F3460',
  },
  playerName: { fontSize: 13, fontWeight: 'bold', color: '#FFF' },
  kickCount: { fontSize: 12, color: '#FFD700', fontWeight: 'bold' },
  terrainLabel: { fontSize: 11, color: '#AAA' },

  courseContainer: {
    marginHorizontal: 10,
    marginVertical: 4,
    borderRadius: BORDER_RADIUS.lg || 16,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#2D6A4F',
  },
  sky: {
    height: 50,
    backgroundColor: '#87CEEB',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 20,
  },
  sunEmoji: { fontSize: 24 },
  cloudEmoji: { fontSize: 16, color: '#FFF' },

  courseGround: {
    height: 120,
    backgroundColor: '#228B22',
    padding: 10,
    position: 'relative',
  },
  hazardRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 6,
  },
  hazardItem: { alignItems: 'center' },
  hazardEmoji: { fontSize: 18 },
  hazardLabel: { fontSize: 8, color: '#FFF' },

  distanceMeter: {
    marginTop: 4,
  },
  distanceTrack: {
    height: 8,
    backgroundColor: '#1B4332',
    borderRadius: 4,
    position: 'relative',
    overflow: 'visible',
  },
  ballIndicator: {
    position: 'absolute',
    top: -18,
    marginLeft: -10,
  },
  ballEmoji: { fontSize: 20 },
  flagPosition: {
    position: 'absolute',
    right: -5,
    top: -22,
  },
  flagEmoji: { fontSize: 22 },
  distanceLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  distLabel: { fontSize: 9, color: '#AAA' },
  distRemaining: { fontSize: 12, fontWeight: 'bold' },

  celebration: {
    position: 'absolute',
    top: '30%',
    left: '25%',
  },
  celebrationText: { fontSize: 30 },
  scorePop: {
    position: 'absolute',
    top: '20%',
    left: '30%',
  },
  scorePopText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFD700',
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },

  kickSelection: {
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  kickTitle: { fontSize: 11, color: '#AAA', marginBottom: 4, paddingLeft: 4 },
  kickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    justifyContent: 'center',
  },
  kickCard: {
    width: (width - 50) / 3,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#2A3A5C',
    backgroundColor: '#1B2A4A',
    alignItems: 'center',
  },
  kickCardSelected: {
    borderColor: '#4ECDC4',
    backgroundColor: '#4ECDC422',
    borderWidth: 3,
  },
  kickCardRecommended: {
    borderColor: '#FFD70066',
  },
  kickEmoji: { fontSize: 18 },
  kickName: { fontSize: 9, fontWeight: 'bold', color: '#FFF', marginTop: 2 },
  kickDist: { fontSize: 8, color: '#AAA' },
  kickAcc: { fontSize: 8, color: '#4ECDC4' },

  aimControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    gap: 8,
  },
  aimBtn: {
    width: 70,
    height: 38,
    backgroundColor: '#2A3A5C',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#4A5A7C',
  },
  aimBtnText: { fontSize: 12, fontWeight: 'bold', color: '#FFF' },
  aimDisplay: {
    flex: 1,
    alignItems: 'center',
  },
  aimAngleText: { fontSize: 13, fontWeight: 'bold', color: '#FFD700', marginBottom: 4 },
  aimMeter: {
    width: '100%',
    height: 6,
    backgroundColor: '#333',
    borderRadius: 3,
    position: 'relative',
  },
  aimIndicator: {
    position: 'absolute',
    top: -4,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#FFD700',
    marginLeft: -7,
  },

  powerSection: {
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
  powerLabel: { fontSize: 12, fontWeight: 'bold', color: '#FFF' },
  powerQuality: { fontSize: 12, fontWeight: 'bold' },
  powerBar: {
    height: 18,
    backgroundColor: '#333',
    borderRadius: 9,
    overflow: 'hidden',
    position: 'relative',
  },
  powerFill: { height: '100%', borderRadius: 9 },
  sweetSpot: {
    position: 'absolute',
    left: '75%',
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
  tick: { fontSize: 8, color: '#666' },

  chargeBtn: {
    backgroundColor: '#2A3A5C',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#4A5A7C',
  },
  chargeBtnText: { fontSize: 14, fontWeight: 'bold', color: '#FFF' },
  kickBtn: {
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF33',
  },
  kickBtnText: { fontSize: 16, fontWeight: 'bold', color: '#FFF' },

  scorecardContainer: {
    paddingHorizontal: SPACING.lg || 20,
    paddingVertical: 4,
  },
  scorecardTitle: { fontSize: 10, color: '#AAA', marginBottom: 4 },
  scorecardRow: {
    flexDirection: 'row',
    gap: 8,
  },
  scorecardItem: {
    alignItems: 'center',
    backgroundColor: '#1B2A4A',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  scorecardHole: { fontSize: 9, color: '#888' },
  scorecardEmoji: { fontSize: 14 },
  scorecardScore: { fontSize: 11, fontWeight: 'bold' },

  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 6,
    paddingHorizontal: SPACING.md || 10,
    backgroundColor: '#16213E',
  },
  statBox: { alignItems: 'center' },
  statLabel: { fontSize: 9, color: '#888', marginBottom: 2 },
  statValue: { fontSize: 14, fontWeight: 'bold', color: '#4ECDC4' },

  actionContainer: {
    paddingHorizontal: SPACING.lg || 20,
    paddingVertical: SPACING.sm || 8,
  },
  startBtn: {
    backgroundColor: '#2ECC71',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  startBtnText: { fontSize: 20, fontWeight: 'bold', color: '#FFF' },

  gameOverButtons: {
    paddingHorizontal: SPACING.lg || 20,
    paddingBottom: SPACING.md || 12,
    gap: 8,
  },
  nextBtn: {
    backgroundColor: '#E94560',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  nextBtnText: { fontSize: 16, fontWeight: 'bold', color: '#FFF' },
  exitBtn: {
    backgroundColor: '#533483',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  exitBtnText: { fontSize: 16, fontWeight: 'bold', color: '#FFF' },
});