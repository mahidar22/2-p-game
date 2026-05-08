import React, { useState, useEffect, useRef, useCallback } from 'react';
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

const THROWABLE_TYPES = [
  { id: 'ball', emoji: '⚾', label: 'Baseball', weight: 1, bouncy: 0.6, spin: 1, drag: 0.01, color: '#F5F5DC' },
  { id: 'disc', emoji: '🥏', label: 'Frisbee', weight: 0.5, bouncy: 0.3, spin: 3, drag: 0.03, color: '#4ECDC4' },
  { id: 'rock', emoji: '🪨', label: 'Rock', weight: 3, bouncy: 0.2, spin: 0.5, drag: 0.005, color: '#808080' },
  { id: 'grenade', emoji: '💣', label: 'Grenade', weight: 2, bouncy: 0.4, spin: 1, drag: 0.01, color: '#2C3E50' },
  { id: 'boomerang', emoji: '🪃', label: 'Boomerang', weight: 0.8, bouncy: 0.5, spin: 5, drag: 0.04, color: '#D2691E' },
  { id: 'snowball', emoji: '🏐', label: 'Snowball', weight: 0.6, bouncy: 0.1, spin: 0.5, drag: 0.02, color: '#E0E0E0' },
  { id: 'hammer', emoji: '🔨', label: 'Hammer', weight: 4, bouncy: 0.3, spin: 2, drag: 0.008, color: '#8B4513' },
  { id: 'javelin', emoji: '🏹', label: 'Javelin', weight: 1.5, bouncy: 0.1, spin: 0.3, drag: 0.006, color: '#FFD700' },
];

const TARGET_ZONES = [
  { id: 'bullseye', emoji: '🎯', label: "Bull's Eye", points: 100, radius: 15, color: '#FF0000', distance: 0 },
  { id: 'inner', emoji: '🔴', label: 'Inner Ring', points: 75, radius: 30, color: '#FF4500', distance: 1 },
  { id: 'middle', emoji: '🟡', label: 'Middle Ring', points: 50, radius: 50, color: '#FFD700', distance: 2 },
  { id: 'outer', emoji: '🟢', label: 'Outer Ring', points: 30, radius: 75, color: '#4ECDC4', distance: 3 },
  { id: 'edge', emoji: '🔵', label: 'Edge', points: 15, radius: 100, color: '#2980B9', distance: 4 },
  { id: 'miss', emoji: '⬜', label: 'Miss', points: 0, radius: 999, color: '#555', distance: 5 },
];

const CHALLENGE_TYPES = [
  { id: 'standard', emoji: '🎯', label: 'Standard', throws: 5, description: 'Hit the target!' },
  { id: 'distance', emoji: '📏', label: 'Distance', throws: 3, description: 'Throw as far as you can!' },
  { id: 'precision', emoji: '🔬', label: 'Precision', throws: 5, description: 'Accuracy is key!' },
  { id: 'power', emoji: '💪', label: 'Power', throws: 3, description: 'Maximum force!' },
  { id: 'trick', emoji: '🌀', label: 'Trick Shot', throws: 4, description: 'Bounce & curve!' },
];

const WIND_LEVELS = [
  { id: 'calm', emoji: '🍃', label: 'Calm', speed: 0, effect: 0 },
  { id: 'light', emoji: '💨', label: 'Light Breeze', speed: 5, effect: 0.05 },
  { id: 'moderate', emoji: '🌬️', label: 'Moderate', speed: 12, effect: 0.12 },
  { id: 'strong', emoji: '🌪️', label: 'Strong', speed: 20, effect: 0.20 },
  { id: 'gale', emoji: '🌊', label: 'Gale Force', speed: 30, effect: 0.30 },
];

const POWERUP_TYPES = [
  { id: 'guide', emoji: '📐', label: 'Trajectory Guide', duration: 0 },
  { id: 'strength', emoji: '💪', label: 'Super Strength', duration: 0 },
  { id: 'calm', emoji: '🧘', label: 'Calm Wind', duration: 0 },
  { id: 'double', emoji: '✖️2️⃣', label: 'Double Points', duration: 0 },
  { id: 'magnet', emoji: '🧲', label: 'Target Magnet', duration: 0 },
  { id: 'extra', emoji: '➕', label: 'Extra Throw', duration: 0 },
];

export default function ThrowGame({ navigation }) {
  const [scores, setScores] = useState({ player1: 0, player2: 0 });
  const [round, setRound] = useState(1);
  const [maxRounds] = useState(3);
  const [gameActive, setGameActive] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [currentPlayer, setCurrentPlayer] = useState(1);
  const [gamePhase, setGamePhase] = useState('select');

  // Selection
  const [selectedThrowable, setSelectedThrowable] = useState(null);
  const [selectedChallenge, setSelectedChallenge] = useState(CHALLENGE_TYPES[0]);

  // Throws
  const [throwsLeft, setThrowsLeft] = useState(5);
  const [throwNumber, setThrowNumber] = useState(0);
  const [isThrowing, setIsThrowing] = useState(false);
  const [throwPhase, setThrowPhase] = useState('aim'); // aim, power, spin, flying, landed

  // Aim
  const [aimAngle, setAimAngle] = useState(45);
  const [aimDirection, setAimDirection] = useState(0);

  // Power
  const [powerLevel, setPowerLevel] = useState(50);
  const [powerCharging, setPowerCharging] = useState(false);
  const [powerIncreasing, setPowerIncreasing] = useState(true);

  // Spin
  const [spinLevel, setSpinLevel] = useState(0);
  const [spinCharging, setSpinCharging] = useState(false);
  const [spinIncreasing, setSpinIncreasing] = useState(true);

  // Projectile
  const [projectile, setProjectile] = useState(null);
  const [landingSpot, setLandingSpot] = useState(null);

  // Wind
  const [currentWind, setCurrentWind] = useState(WIND_LEVELS[0]);
  const [windDirectionAngle, setWindDirectionAngle] = useState(0);

  // Target
  const [targetX, setTargetX] = useState(width * 0.7);
  const [targetY, setTargetY] = useState(height * 0.2);

  // Active effects
  const [hasGuide, setHasGuide] = useState(false);
  const [hasSuperStrength, setHasSuperStrength] = useState(false);
  const [hasDoublePoints, setHasDoublePoints] = useState(false);
  const [hasMagnet, setHasMagnet] = useState(false);

  // Throw history
  const [throwHistory, setThrowHistory] = useState([]);

  // Combo
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);

  // Coins
  const [coins, setCoins] = useState(20);

  // Stats
  const [gameStats, setGameStats] = useState({
    player1: {
      totalThrows: 0, bullseyes: 0, hits: 0, misses: 0,
      maxCombo: 0, longestThrow: 0, totalPoints: 0,
      trickShots: 0, powerUpsUsed: 0,
    },
    player2: {
      totalThrows: 0, bullseyes: 0, hits: 0, misses: 0,
      maxCombo: 0, longestThrow: 0, totalPoints: 0,
      trickShots: 0, powerUpsUsed: 0,
    },
  });

  // Refs
  const powerRef = useRef(null);
  const spinRef = useRef(null);
  const flightRef = useRef(null);
  const projectileRef = useRef(null);

  // Animations
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const throwAnim = useRef(new Animated.Value(0)).current;
  const landAnim = useRef(new Animated.Value(0)).current;
  const comboAnim = useRef(new Animated.Value(1)).current;
  const windAnim = useRef(new Animated.Value(0)).current;
  const targetPulse = useRef(new Animated.Value(1)).current;
  const powerPulse = useRef(new Animated.Value(1)).current;
  const spinVisual = useRef(new Animated.Value(0)).current;
  const guideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    return () => clearAllTimers();
  }, []);

  const clearAllTimers = () => {
    if (powerRef.current) clearInterval(powerRef.current);
    if (spinRef.current) clearInterval(spinRef.current);
    if (flightRef.current) clearInterval(flightRef.current);
  };

  // Target pulse
  useEffect(() => {
    if (!gameActive) return;
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(targetPulse, { toValue: 1.08, duration: 1000, useNativeDriver: false }),
      Animated.timing(targetPulse, { toValue: 1, duration: 1000, useNativeDriver: false }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [gameActive]);

  // Wind animation
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(windAnim, { toValue: 1, duration: 800, useNativeDriver: false }),
      Animated.timing(windAnim, { toValue: 0, duration: 800, useNativeDriver: false }),
    ]));
    loop.start();
    return () => loop.stop();
  }, []);

  // Power meter
  useEffect(() => {
    if (!powerCharging) {
      if (powerRef.current) clearInterval(powerRef.current);
      return;
    }
    powerRef.current = setInterval(() => {
      setPowerLevel((prev) => {
        if (powerIncreasing) {
          if (prev >= 100) { setPowerIncreasing(false); return 100; }
          return prev + 1.5;
        } else {
          if (prev <= 0) { setPowerIncreasing(true); return 0; }
          return prev - 1.5;
        }
      });
    }, 20);
    return () => { if (powerRef.current) clearInterval(powerRef.current); };
  }, [powerCharging, powerIncreasing]);

  // Spin meter
  useEffect(() => {
    if (!spinCharging) {
      if (spinRef.current) clearInterval(spinRef.current);
      return;
    }
    spinRef.current = setInterval(() => {
      setSpinLevel((prev) => {
        if (spinIncreasing) {
          if (prev >= 100) { setSpinIncreasing(false); return 100; }
          return prev + 2;
        } else {
          if (prev <= -100) { setSpinIncreasing(true); return -100; }
          return prev - 2;
        }
      });
    }, 20);
    return () => { if (spinRef.current) clearInterval(spinRef.current); };
  }, [spinCharging, spinIncreasing]);

  // Generate wind
  const generateWind = useCallback(() => {
    const windIndex = Math.floor(Math.random() * WIND_LEVELS.length);
    setCurrentWind(WIND_LEVELS[windIndex]);
    setWindDirectionAngle(Math.random() * 360);
  }, []);

  // Generate target position
  const generateTarget = useCallback(() => {
    if (selectedChallenge.id === 'distance') {
      setTargetX(width * 0.85);
      setTargetY(height * 0.25);
    } else {
      setTargetX(width * 0.55 + Math.random() * width * 0.3);
      setTargetY(height * 0.12 + Math.random() * height * 0.2);
    }
  }, [selectedChallenge]);

  // Start game
  const startPlaying = () => {
    if (!selectedThrowable) {
      Alert.alert('⚠️ Select an Item!', 'Choose what to throw!');
      return;
    }
    setGamePhase('playing');
    setGameActive(true);
    setThrowsLeft(selectedChallenge.throws);
    setThrowNumber(0);
    setThrowHistory([]);
    setCombo(0);
    setMaxCombo(0);
    setCoins(20);
    setHasGuide(false);
    setHasSuperStrength(false);
    setHasDoublePoints(false);
    setHasMagnet(false);
    setIsThrowing(false);
    setThrowPhase('aim');
    setAimAngle(45);
    setAimDirection(0);
    setPowerLevel(50);
    setSpinLevel(0);
    setProjectile(null);
    setLandingSpot(null);
    generateWind();
    generateTarget();
    setGameStarted(true);
  };

  // Adjust aim
  const adjustAngle = useCallback((delta) => {
    if (throwPhase !== 'aim') return;
    setAimAngle((prev) => Math.max(5, Math.min(85, prev + delta)));
  }, [throwPhase]);

  const adjustDirection = useCallback((delta) => {
    if (throwPhase !== 'aim') return;
    setAimDirection((prev) => Math.max(-30, Math.min(30, prev + delta)));
  }, [throwPhase]);

  // Start power charge
  const startPowerCharge = useCallback(() => {
    if (throwPhase !== 'aim' || throwsLeft <= 0) return;
    setThrowPhase('power');
    setPowerCharging(true);
    setPowerLevel(0);
    setPowerIncreasing(true);

    powerPulse.setValue(1);
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(powerPulse, { toValue: 1.1, duration: 300, useNativeDriver: false }),
      Animated.timing(powerPulse, { toValue: 1, duration: 300, useNativeDriver: false }),
    ]));
    loop.start();
  }, [throwPhase, throwsLeft]);

  // Lock power, start spin
  const lockPower = useCallback(() => {
    if (throwPhase !== 'power') return;
    setPowerCharging(false);

    if (selectedThrowable.spin > 1) {
      setThrowPhase('spin');
      setSpinCharging(true);
      setSpinLevel(0);
      setSpinIncreasing(true);
    } else {
      executeThrow(powerLevel, 0);
    }
  }, [throwPhase, powerLevel, selectedThrowable]);

  // Lock spin and throw
  const lockSpin = useCallback(() => {
    if (throwPhase !== 'spin') return;
    setSpinCharging(false);
    executeThrow(powerLevel, spinLevel);
  }, [throwPhase, powerLevel, spinLevel]);

  // Execute throw
  const executeThrow = useCallback((power, spin) => {
    setThrowPhase('flying');
    setIsThrowing(true);

    const item = selectedThrowable;
    const angle = aimAngle;
    const direction = aimDirection;
    const strengthMod = hasSuperStrength ? 1.5 : 1;

    const radians = (angle * Math.PI) / 180;
    const dirRadians = (direction * Math.PI) / 180;
    const velocity = (power / 100) * 12 * strengthMod / Math.sqrt(item.weight);

    const windEffect = currentWind.effect;
    const windRad = (windDirectionAngle * Math.PI) / 180;
    const windVX = Math.cos(windRad) * windEffect * 2;
    const windVY = Math.sin(windRad) * windEffect;

    const spinEffect = (spin / 100) * item.spin * 0.3;

    let proj = {
      x: width * 0.1,
      y: height * 0.5,
      vx: Math.cos(radians) * velocity + windVX + Math.cos(dirRadians) * 2,
      vy: -Math.sin(radians) * velocity + windVY,
      rotation: 0,
      spinRate: spinEffect,
      trail: [],
      bounces: 0,
    };

    projectileRef.current = proj;
    setProjectile({ ...proj });

    // Throw animation
    throwAnim.setValue(0);
    Animated.timing(throwAnim, { toValue: 1, duration: 300, useNativeDriver: false }).start();

    // Spin animation
    if (Math.abs(spin) > 10) {
      const spinLoop = Animated.loop(
        Animated.timing(spinVisual, {
          toValue: spin > 0 ? 360 : -360,
          duration: Math.max(200, 1000 / Math.abs(spin / 20)),
          useNativeDriver: false,
        })
      );
      spinLoop.start();
    }

    const gravity = 0.12 * item.weight;
    const drag = item.drag;
    const bounciness = item.bouncy;

    flightRef.current = setInterval(() => {
      const p = projectileRef.current;
      if (!p) return;

      // Apply physics
      let newVX = p.vx * (1 - drag) + windVX * 0.01;
      let newVY = p.vy + gravity;
      let newX = p.x + newVX;
      let newY = p.y + newVY;

      // Spin curves the trajectory
      newVX += p.spinRate * 0.02;

      // Boomerang special - curves back
      if (item.id === 'boomerang' && p.trail.length > 30) {
        const returnForce = 0.03;
        newVX -= returnForce * (newX - width * 0.1);
        newVY -= returnForce * (newY - height * 0.5);
      }

      // Magnet effect - pull toward target
      if (hasMagnet) {
        const dx = targetX - newX;
        const dy = targetY - newY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 150) {
          newVX += (dx / dist) * 0.3;
          newVY += (dy / dist) * 0.3;
        }
      }

      // Ground bounce
      if (newY > height * 0.5) {
        if (bounciness > 0.15 && p.bounces < 3) {
          newVY = -newVY * bounciness;
          newY = height * 0.5;
          p.bounces += 1;

          Animated.sequence([
            Animated.timing(shakeAnim, { toValue: 5, duration: 30, useNativeDriver: false }),
            Animated.timing(shakeAnim, { toValue: 0, duration: 30, useNativeDriver: false }),
          ]).start();
        } else {
          handleLanding(newX, newY, power, spin);
          clearInterval(flightRef.current);
          return;
        }
      }

      // Wall bounce
      if (newX < 5 || newX > width - 5) {
        newVX = -newVX * 0.5;
        newX = newX < 5 ? 6 : width - 6;
      }

      // Ceiling
      if (newY < 5) {
        newVY = -newVY * 0.3;
        newY = 6;
      }

      // Out of bounds check
      if (newX > width + 50 || newY > height * 0.55) {
        handleLanding(newX, Math.min(newY, height * 0.5), power, spin);
        clearInterval(flightRef.current);
        return;
      }

      const newTrail = [...p.trail.slice(-25), { x: p.x, y: p.y }];

      const updated = {
        ...p,
        x: newX,
        y: newY,
        vx: newVX,
        vy: newVY,
        rotation: (p.rotation + p.spinRate * 5) % 360,
        trail: newTrail,
      };

      projectileRef.current = updated;
      setProjectile({ ...updated });
    }, 16);
  }, [selectedThrowable, aimAngle, aimDirection, hasSuperStrength, currentWind, windDirectionAngle, hasMagnet, targetX, targetY]);

  // Handle landing
  const handleLanding = useCallback((x, y, power, spin) => {
    setIsThrowing(false);
    setThrowPhase('landed');
    spinVisual.setValue(0);

    // Landing animation
    landAnim.setValue(0);
    Animated.sequence([
      Animated.timing(landAnim, { toValue: 1, duration: 200, useNativeDriver: false }),
      Animated.timing(landAnim, { toValue: 0.7, duration: 300, useNativeDriver: false }),
    ]).start();

    setLandingSpot({ x, y });

    // Calculate distance to target
    const dist = Math.sqrt(Math.pow(x - targetX, 2) + Math.pow(y - targetY, 2));
    const throwDist = Math.round(Math.sqrt(Math.pow(x - width * 0.1, 2) + Math.pow(y - height * 0.5, 2)));

    // Determine zone
    let hitZone = TARGET_ZONES[TARGET_ZONES.length - 1]; // miss
    for (const zone of TARGET_ZONES) {
      if (dist <= zone.radius) {
        hitZone = zone;
        break;
      }
    }

    // Calculate points
    let basePoints = hitZone.points;
    const playerKey = currentPlayer === 1 ? 'player1' : 'player2';

    // Challenge-specific bonuses
    if (selectedChallenge.id === 'distance') {
      basePoints = Math.round(throwDist * 0.5);
    } else if (selectedChallenge.id === 'power') {
      basePoints = Math.round(power * 0.8) + hitZone.points;
    } else if (selectedChallenge.id === 'trick' && Math.abs(spin) > 50) {
      basePoints = Math.round(basePoints * 1.5);
      setGameStats((prev) => ({
        ...prev,
        [playerKey]: { ...prev[playerKey], trickShots: prev[playerKey].trickShots + 1 },
      }));
    }

    // Combo
    let newCombo = 0;
    if (hitZone.id !== 'miss') {
      newCombo = combo + 1;
      setCombo(newCombo);
      if (newCombo > maxCombo) setMaxCombo(newCombo);

      comboAnim.setValue(0.5);
      Animated.spring(comboAnim, { toValue: 1, friction: 3, tension: 200, useNativeDriver: false }).start();
    } else {
      setCombo(0);
      newCombo = 0;
    }

    const comboBonus = (newCombo - 1) * 10;
    const multiplier = hasDoublePoints ? 2 : 1;
    const totalPoints = Math.max(0, (basePoints + comboBonus) * multiplier);

    setScores((prev) => ({
      ...prev,
      [playerKey]: prev[playerKey] + totalPoints,
    }));

    // Coins earned
    const coinsEarned = Math.round(totalPoints * 0.1);
    setCoins((prev) => prev + coinsEarned);

    // Update stats
    setGameStats((prev) => ({
      ...prev,
      [playerKey]: {
        ...prev[playerKey],
        totalThrows: prev[playerKey].totalThrows + 1,
        bullseyes: prev[playerKey].bullseyes + (hitZone.id === 'bullseye' ? 1 : 0),
        hits: prev[playerKey].hits + (hitZone.id !== 'miss' ? 1 : 0),
        misses: prev[playerKey].misses + (hitZone.id === 'miss' ? 1 : 0),
        maxCombo: Math.max(prev[playerKey].maxCombo, newCombo),
        longestThrow: Math.max(prev[playerKey].longestThrow, throwDist),
        totalPoints: prev[playerKey].totalPoints + totalPoints,
      },
    }));

    // Throw history
    setThrowHistory((prev) => [
      ...prev,
      {
        number: throwNumber + 1,
        zone: hitZone.id,
        emoji: hitZone.emoji,
        points: totalPoints,
        distance: throwDist,
        power: Math.round(power),
        spin: Math.round(spin),
      },
    ]);

    setThrowNumber((prev) => prev + 1);
    setThrowsLeft((prev) => prev - 1);

    // Screen shake on strong hit
    if (hitZone.id === 'bullseye') {
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: false }),
        Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: false }),
        Animated.timing(shakeAnim, { toValue: 5, duration: 50, useNativeDriver: false }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: false }),
      ]).start();
    }

    const distText = selectedChallenge.id === 'distance' ? `\nDistance: ${throwDist}m` : '';
    const trickText = selectedChallenge.id === 'trick' && Math.abs(spin) > 50 ? '\n🌀 TRICK SHOT! 1.5x bonus!' : '';
    const comboText = newCombo > 1 ? `\n🔥 Combo x${newCombo}! +${comboBonus}` : '';

    Alert.alert(
      hitZone.id === 'bullseye' ? "🎯 BULL'S EYE!" : hitZone.id === 'miss' ? '💨 Miss!' : `${hitZone.emoji} ${hitZone.label}!`,
      `+${totalPoints} points!${distText}${trickText}${comboText}\n\nThrows left: ${throwsLeft - 1}`,
      [{ text: throwsLeft - 1 > 0 ? 'Next Throw' : 'Continue', onPress: prepareNextThrow }]
    );
  }, [targetX, targetY, currentPlayer, combo, maxCombo, hasDoublePoints, selectedChallenge, throwNumber, throwsLeft]);

  const prepareNextThrow = useCallback(() => {
    setProjectile(null);
    setLandingSpot(null);
    setThrowPhase('aim');
    setAimAngle(45);
    setAimDirection(0);
    setPowerLevel(50);
    setSpinLevel(0);

    generateWind();

    if (throwsLeft <= 1) {
      handleTurnEnd();
    } else {
      generateTarget();
    }
  }, [throwsLeft]);

  const buyPowerUp = useCallback((puType) => {
    const cost = 10;
    if (coins < cost) {
      Alert.alert('⚠️ Not Enough Coins!', `Need ${cost} coins.`);
      return;
    }
    setCoins((prev) => prev - cost);

    const playerKey = currentPlayer === 1 ? 'player1' : 'player2';
    setGameStats((prev) => ({
      ...prev,
      [playerKey]: { ...prev[playerKey], powerUpsUsed: prev[playerKey].powerUpsUsed + 1 },
    }));

    switch (puType) {
      case 'guide': setHasGuide(true); break;
      case 'strength': setHasSuperStrength(true); break;
      case 'calm':
        setCurrentWind(WIND_LEVELS[0]);
        break;
      case 'double': setHasDoublePoints(true); break;
      case 'magnet': setHasMagnet(true); break;
      case 'extra': setThrowsLeft((prev) => prev + 1); break;
    }
  }, [coins, currentPlayer]);

  const handleTurnEnd = useCallback(() => {
    setGameActive(false);
    const playerKey = currentPlayer === 1 ? 'player1' : 'player2';
    const stats = gameStats[playerKey];
    const accuracy = stats.totalThrows > 0 ? Math.round((stats.hits / stats.totalThrows) * 100) : 0;

    if (currentPlayer === 1) {
      Alert.alert(
        '🏁 Turn Over!',
        `Player 1:\nScore: ${scores.player1}\nAccuracy: ${accuracy}%\nBullseyes: ${stats.bullseyes}\nMax Combo: x${maxCombo}\nLongest: ${stats.longestThrow}m`,
        [{ text: "Player 2's Turn!", onPress: switchPlayer }]
      );
    } else {
      handleEndRound();
    }
  }, [currentPlayer, scores, gameStats, maxCombo]);

  const switchPlayer = useCallback(() => {
    setCurrentPlayer(2);
    setGamePhase('select');
    setSelectedThrowable(null);
    setGameActive(false);
  }, []);

  const handleEndRound = useCallback(() => {
    setGamePhase('ended');
    let winner = scores.player1 > scores.player2 ? '🏆 Player 1!' : scores.player2 > scores.player1 ? '🏆 Player 2!' : '🤝 Tie!';

    if (round >= maxRounds) {
      handleGameOver();
    } else {
      Alert.alert(
        `🏁 Round ${round} Complete!`,
        `${winner}\nP1: ${scores.player1} | P2: ${scores.player2}`,
        [
          { text: '🔄 Next Round', onPress: nextRound },
          { text: '🚪 End', onPress: () => navigation.goBack() },
        ]
      );
    }
  }, [scores, round, maxRounds]);

  const handleGameOver = useCallback(() => {
    const p1 = gameStats.player1;
    const p2 = gameStats.player2;
    let champion = scores.player1 > scores.player2 ? '🏆 Player 1!' : scores.player2 > scores.player1 ? '🏆 Player 2!' : '🤝 Tie!';

    Alert.alert(
      '🎮 Game Over!',
      `${champion}\n\nP1: ${scores.player1} | P2: ${scores.player2}\n🎯 Bullseyes: P1 ${p1.bullseyes} | P2 ${p2.bullseyes}\nAccuracy: P1 ${p1.totalThrows > 0 ? Math.round((p1.hits / p1.totalThrows) * 100) : 0}% | P2 ${p2.totalThrows > 0 ? Math.round((p2.hits / p2.totalThrows) * 100) : 0}%\nLongest: P1 ${p1.longestThrow}m | P2 ${p2.longestThrow}m\nCombo: P1 x${p1.maxCombo} | P2 x${p2.maxCombo}`,
      [
        { text: '🔄 New Game', onPress: resetGame },
        { text: '🚪 Exit', onPress: () => navigation.goBack() },
      ]
    );
  }, [scores, gameStats]);

  const nextRound = useCallback(() => {
    setRound((prev) => prev + 1);
    setCurrentPlayer(1);
    setGamePhase('select');
    setSelectedThrowable(null);
    setGameActive(false);
    setGameStarted(false);
  }, []);

  const resetGame = useCallback(() => {
    setScores({ player1: 0, player2: 0 });
    setRound(1);
    setCurrentPlayer(1);
    setGamePhase('select');
    setGameActive(false);
    setGameStarted(false);
    setSelectedThrowable(null);
    setGameStats({
      player1: { totalThrows: 0, bullseyes: 0, hits: 0, misses: 0, maxCombo: 0, longestThrow: 0, totalPoints: 0, trickShots: 0, powerUpsUsed: 0 },
      player2: { totalThrows: 0, bullseyes: 0, hits: 0, misses: 0, maxCombo: 0, longestThrow: 0, totalPoints: 0, trickShots: 0, powerUpsUsed: 0 },
    });
  }, []);

  const playerKey = currentPlayer === 1 ? 'player1' : 'player2';
  const currentStats = gameStats[playerKey];
  const accuracy = currentStats.totalThrows > 0 ? Math.round((currentStats.hits / currentStats.totalThrows) * 100) : 0;

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
    if (diff <= 15) return '🟡 GREAT';
    if (diff <= 25) return '🟠 OK';
    return '🔴 WEAK';
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backBtn}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>🎯 Throw Game</Text>
        <Text style={styles.roundInfo}>Rd {round}/{maxRounds}</Text>
      </View>

      {/* Scoreboard */}
      <View style={styles.scoreboard}>
        <View style={styles.scoreTeam}>
          <Text style={styles.teamLabel}>{currentPlayer === 1 ? '►' : ''} P1</Text>
          <Text style={[styles.teamScore, { color: '#FF6B6B' }]}>{scores.player1}</Text>
        </View>
        <View style={styles.gameInfoCenter}>
          <Text style={styles.throwsText}>🎯 Throws: {throwsLeft}</Text>
          <Animated.Text style={[styles.windText, { opacity: windAnim.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }) }]}>
            {currentWind.emoji} {currentWind.label}
          </Animated.Text>
        </View>
        <View style={styles.scoreTeam}>
          <Text style={styles.teamLabel}>{currentPlayer === 2 ? '►' : ''} P2</Text>
          <Text style={[styles.teamScore, { color: '#4ECDC4' }]}>{scores.player2}</Text>
        </View>
      </View>

      {/* Selection Phase */}
      {gamePhase === 'select' && (
        <View style={styles.selectPhase}>
          <Text style={styles.selectTitle}>🎮 Player {currentPlayer}</Text>

          <Text style={styles.sectionLabel}>📋 Challenge:</Text>
          <View style={styles.challengeRow}>
            {CHALLENGE_TYPES.map((ch) => (
              <TouchableOpacity
                key={ch.id}
                style={[styles.challengeCard, selectedChallenge.id === ch.id && styles.challengeSelected]}
                onPress={() => setSelectedChallenge(ch)}
              >
                <Text style={styles.challengeEmoji}>{ch.emoji}</Text>
                <Text style={styles.challengeName}>{ch.label}</Text>
                <Text style={styles.challengeInfo}>{ch.throws} throws</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.sectionLabel}>🏀 Item to Throw:</Text>
          <View style={styles.throwableGrid}>
            {THROWABLE_TYPES.map((t) => (
              <TouchableOpacity
                key={t.id}
                style={[
                  styles.throwableCard,
                  { borderColor: t.color },
                  selectedThrowable?.id === t.id && { backgroundColor: t.color + '33', borderWidth: 3 },
                ]}
                onPress={() => setSelectedThrowable(t)}
              >
                <Text style={styles.throwableEmoji}>{t.emoji}</Text>
                <Text style={styles.throwableName}>{t.label}</Text>
                <Text style={styles.throwableStat}>
                  ⚖️{t.weight} 🌀{t.spin} 🏀{Math.round(t.bouncy * 100)}%
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {selectedThrowable && (
            <TouchableOpacity style={styles.goBtn} onPress={startPlaying}>
              <Text style={styles.goBtnText}>🎯 START THROWING!</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Playing Phase */}
      {gamePhase === 'playing' && (
        <>
          {/* Status */}
          <View style={styles.statusBar}>
            <Text style={styles.itemLabel}>{selectedThrowable?.emoji} {selectedThrowable?.label}</Text>
            {combo > 1 && (
              <Animated.Text style={[styles.comboText, { transform: [{ scale: comboAnim }] }]}>
                🔥 x{combo}
              </Animated.Text>
            )}
            <View style={styles.activeEffects}>
              {hasGuide && <Text style={styles.effectIcon}>📐</Text>}
              {hasSuperStrength && <Text style={styles.effectIcon}>💪</Text>}
              {hasDoublePoints && <Text style={styles.effectIcon}>✖️2️⃣</Text>}
              {hasMagnet && <Text style={styles.effectIcon}>🧲</Text>}
            </View>
            <Text style={styles.coinLabel}>🪙 {coins}</Text>
          </View>

          {/* Field */}
          <Animated.View style={[styles.field, { transform: [{ translateX: shakeAnim }] }]}>
            {/* Target rings */}
            <Animated.View style={[styles.targetContainer, {
              left: targetX - 100, top: targetY - 100,
              transform: [{ scale: targetPulse }],
            }]}>
              {[...TARGET_ZONES].reverse().slice(1).map((zone) => (
                <View key={zone.id} style={[styles.targetRing, {
                  width: zone.radius * 2, height: zone.radius * 2,
                  borderRadius: zone.radius, backgroundColor: zone.color,
                }]} />
              ))}
            </Animated.View>

            {/* Trajectory guide */}
            {hasGuide && throwPhase === 'aim' && (
              <View style={styles.guideLine}>
                {[...Array(8)].map((_, i) => {
                  const rad = (aimAngle * Math.PI) / 180;
                  const dirRad = (aimDirection * Math.PI) / 180;
                  const t = (i + 1) * 0.15;
                  const gx = width * 0.1 + Math.cos(rad) * powerLevel * t * 3 + Math.cos(dirRad) * t * 20;
                  const gy = height * 0.5 - Math.sin(rad) * powerLevel * t * 3 + 0.5 * 9.8 * t * t * 20;
                  return (
                    <View key={i} style={[styles.guideDot, { left: gx, top: gy, opacity: 1 - i * 0.1 }]} />
                  );
                })}
              </View>
            )}

            {/* Projectile trail */}
            {projectile?.trail.map((t, i) => (
              <View key={i} style={[styles.trailDot, { left: t.x - 2, top: t.y - 2, opacity: i / 25 }]} />
            ))}

            {/* Projectile */}
            {projectile && (
              <Animated.View style={[styles.projectile, {
                left: projectile.x - 15, top: projectile.y - 15,
                transform: [{ rotate: `${projectile.rotation}deg` }],
              }]}>
                <Text style={styles.projectileEmoji}>{selectedThrowable?.emoji}</Text>
              </Animated.View>
            )}

            {/* Landing spot */}
            {landingSpot && (
              <Animated.View style={[styles.landingMark, {
                left: landingSpot.x - 10, top: landingSpot.y - 10,
                transform: [{ scale: landAnim }],
              }]}>
                <Text style={styles.landingEmoji}>💥</Text>
              </Animated.View>
            )}

            {/* Thrower */}
            <View style={[styles.thrower, { left: width * 0.08 }]}>
              <Text style={styles.throwerEmoji}>🧑‍🎯</Text>
            </View>

            {/* Ground */}
            <View style={styles.ground} />
          </Animated.View>

          {/* Controls based on phase */}
          {throwPhase === 'aim' && (
            <View style={styles.controlSection}>
              <View style={styles.aimInfo}>
                <Text style={styles.aimLabel}>📐 Angle: {aimAngle}° | ↔️ Direction: {aimDirection}°</Text>
              </View>

              <View style={styles.aimControls}>
                <View style={styles.controlGroup}>
                  <Text style={styles.ctrlGroupLabel}>Angle ↕️</Text>
                  <View style={styles.ctrlRow}>
                    <TouchableOpacity style={styles.ctrlBtn} onPress={() => adjustAngle(-5)}>
                      <Text style={styles.ctrlBtnText}>-5</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.ctrlBtn} onPress={() => adjustAngle(-1)}>
                      <Text style={styles.ctrlBtnText}>-1</Text>
                    </TouchableOpacity>
                    <Text style={styles.ctrlValue}>{aimAngle}°</Text>
                    <TouchableOpacity style={styles.ctrlBtn} onPress={() => adjustAngle(1)}>
                      <Text style={styles.ctrlBtnText}>+1</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.ctrlBtn} onPress={() => adjustAngle(5)}>
                      <Text style={styles.ctrlBtnText}>+5</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                <View style={styles.controlGroup}>
                  <Text style={styles.ctrlGroupLabel}>Direction ↔️</Text>
                  <View style={styles.ctrlRow}>
                    <TouchableOpacity style={styles.ctrlBtn} onPress={() => adjustDirection(-5)}>
                      <Text style={styles.ctrlBtnText}>◄5</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.ctrlBtn} onPress={() => adjustDirection(-1)}>
                      <Text style={styles.ctrlBtnText}>◄1</Text>
                    </TouchableOpacity>
                    <Text style={styles.ctrlValue}>{aimDirection}°</Text>
                    <TouchableOpacity style={styles.ctrlBtn} onPress={() => adjustDirection(1)}>
                      <Text style={styles.ctrlBtnText}>1►</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.ctrlBtn} onPress={() => adjustDirection(5)}>
                      <Text style={styles.ctrlBtnText}>5►</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              <TouchableOpacity style={styles.actionBtn} onPress={startPowerCharge}>
                <Text style={styles.actionBtnText}>⚡ Set Power →</Text>
              </TouchableOpacity>
            </View>
          )}

          {throwPhase === 'power' && (
            <View style={styles.controlSection}>
              <View style={styles.meterContainer}>
                <View style={styles.meterHeader}>
                  <Text style={styles.meterLabel}>💪 Power: {Math.round(powerLevel)}%</Text>
                  <Text style={[styles.meterQuality, { color: getPowerColor() }]}>{getPowerLabel()}</Text>
                </View>
                <View style={styles.meterBar}>
                  <View style={[styles.meterFill, { width: `${powerLevel}%`, backgroundColor: getPowerColor() }]} />
                  <View style={styles.sweetSpot} />
                </View>
                <View style={styles.meterTicks}>
                  <Text style={styles.tick}>0</Text>
                  <Text style={styles.tick}>25</Text>
                  <Text style={styles.tick}>50</Text>
                  <Text style={[styles.tick, { color: '#4ECDC4' }]}>75✨</Text>
                  <Text style={styles.tick}>100</Text>
                </View>
              </View>
              <TouchableOpacity style={[styles.actionBtn, { backgroundColor: getPowerColor() }]} onPress={lockPower}>
                <Text style={styles.actionBtnText}>🎯 Lock Power! ({Math.round(powerLevel)}%)</Text>
              </TouchableOpacity>
            </View>
          )}

          {throwPhase === 'spin' && (
            <View style={styles.controlSection}>
              <View style={styles.meterContainer}>
                <Text style={styles.meterLabel}>🌀 Spin: {Math.round(spinLevel)}%</Text>
                <View style={styles.spinBar}>
                  <View style={[styles.spinFill, {
                    width: `${Math.abs(spinLevel) / 2}%`,
                    marginLeft: spinLevel >= 0 ? '50%' : `${50 - Math.abs(spinLevel) / 2}%`,
                    backgroundColor: spinLevel > 0 ? '#4ECDC4' : '#FF6B6B',
                  }]} />
                  <View style={styles.spinCenter} />
                </View>
                <View style={styles.spinLabels}>
                  <Text style={styles.spinLabel}>← Left</Text>
                  <Text style={styles.spinLabel}>Center</Text>
                  <Text style={styles.spinLabel}>Right →</Text>
                </View>
              </View>
              <TouchableOpacity style={styles.actionBtn} onPress={lockSpin}>
                <Text style={styles.actionBtnText}>🚀 THROW! (Spin: {Math.round(spinLevel)})</Text>
              </TouchableOpacity>
            </View>
          )}

          {throwPhase === 'flying' && (
            <View style={styles.flyingSection}>
              <Text style={styles.flyingText}>🚀 Flying...</Text>
            </View>
          )}

          {/* Power-up Shop */}
          {throwPhase === 'aim' && (
            <View style={styles.shopSection}>
              <Text style={styles.shopTitle}>🏪 Power-Ups (🪙 {coins}):</Text>
              <View style={styles.shopRow}>
                {POWERUP_TYPES.map((pu) => (
                  <TouchableOpacity
                    key={pu.id}
                    style={[styles.shopItem, coins < 10 && styles.shopDisabled]}
                    onPress={() => buyPowerUp(pu.id)}
                    disabled={coins < 10}
                  >
                    <Text style={styles.shopEmoji}>{pu.emoji}</Text>
                    <Text style={styles.shopLabel}>{pu.label}</Text>
                    <Text style={styles.shopCost}>🪙10</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Throw History */}
          {throwHistory.length > 0 && (
            <View style={styles.historySection}>
              <Text style={styles.historyTitle}>📋 History:</Text>
              <View style={styles.historyRow}>
                {throwHistory.slice(-5).map((t, i) => (
                  <View key={i} style={styles.historyItem}>
                    <Text style={styles.historyEmoji}>{t.emoji}</Text>
                    <Text style={styles.historyPoints}>+{t.points}</Text>
                    <Text style={styles.historyDetail}>P{t.power}%</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </>
      )}

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Throws</Text>
          <Text style={styles.statValue}>{currentStats.totalThrows}</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>🎯</Text>
          <Text style={[styles.statValue, { color: '#FFD700' }]}>{currentStats.bullseyes}</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Acc</Text>
          <Text style={[styles.statValue, { color: '#4ECDC4' }]}>{accuracy}%</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Longest</Text>
          <Text style={[styles.statValue, { color: '#FF6B6B' }]}>{currentStats.longestThrow}m</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Combo</Text>
          <Text style={[styles.statValue, { color: '#9B59B6' }]}>x{Math.max(maxCombo, currentStats.maxCombo)}</Text>
        </View>
      </View>

      {/* Game Over */}
      {gamePhase === 'ended' && (
        <View style={styles.gameOverButtons}>
          {round < maxRounds ? (
            <TouchableOpacity style={styles.nextBtn} onPress={nextRound}>
              <Text style={styles.nextBtnText}>🔄 Next Round</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.nextBtn} onPress={resetGame}>
              <Text style={styles.nextBtnText}>🔄 New Game</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.exitBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.exitBtnText}>🚪 Exit</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A1628' },

  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: SPACING.lg || 20, paddingVertical: SPACING.sm || 8,
    backgroundColor: '#16213E',
  },
  backBtn: { fontSize: 16, color: '#FFF', fontWeight: 'bold' },
  title: { fontSize: 19, fontWeight: 'bold', color: '#FFF' },
  roundInfo: { fontSize: 13, color: '#FFD700', fontWeight: 'bold' },

  scoreboard: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: SPACING.lg || 20, paddingVertical: 6,
    backgroundColor: '#1A2744', borderBottomWidth: 2, borderBottomColor: '#E94560',
  },
  scoreTeam: { alignItems: 'center', width: 70 },
  teamLabel: { fontSize: 11, color: '#AAA', fontWeight: 'bold' },
  teamScore: { fontSize: 24, fontWeight: 'bold' },
  gameInfoCenter: { alignItems: 'center' },
  throwsText: { fontSize: 14, fontWeight: 'bold', color: '#FFD700' },
  windText: { fontSize: 10, color: '#87CEEB' },

  selectPhase: { flex: 1, paddingHorizontal: 10, paddingTop: 6 },
  selectTitle: { fontSize: 16, fontWeight: 'bold', color: '#FFF', textAlign: 'center', marginBottom: 8 },
  sectionLabel: { fontSize: 12, fontWeight: 'bold', color: '#AAA', marginBottom: 4, marginTop: 6 },

  challengeRow: { flexDirection: 'row', gap: 4, justifyContent: 'center', flexWrap: 'wrap' },
  challengeCard: {
    width: (width - 50) / 3, paddingVertical: 6, borderRadius: 8, borderWidth: 2,
    borderColor: '#2A3A5C', backgroundColor: '#1B2A4A', alignItems: 'center',
  },
  challengeSelected: { borderColor: '#FFD700', backgroundColor: '#FFD70022', borderWidth: 3 },
  challengeEmoji: { fontSize: 18 },
  challengeName: { fontSize: 8, fontWeight: 'bold', color: '#FFF', marginTop: 2 },
  challengeInfo: { fontSize: 7, color: '#888' },

  throwableGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'center' },
  throwableCard: {
    width: (width - 56) / 4, paddingVertical: 6, borderRadius: 8, borderWidth: 2,
    backgroundColor: '#1B2A4A', alignItems: 'center',
  },
  throwableEmoji: { fontSize: 20 },
  throwableName: { fontSize: 7, fontWeight: 'bold', color: '#FFF', marginTop: 2 },
  throwableStat: { fontSize: 6, color: '#888' },

  goBtn: {
    backgroundColor: '#E94560', paddingVertical: 14, borderRadius: 12,
    alignItems: 'center', marginTop: 10, borderWidth: 2, borderColor: '#FF6B8A',
  },
  goBtnText: { fontSize: 18, fontWeight: 'bold', color: '#FFF' },

  statusBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg || 20, paddingVertical: 4, backgroundColor: '#0F3460',
  },
  itemLabel: { fontSize: 11, fontWeight: 'bold', color: '#FFF' },
  comboText: { fontSize: 14, fontWeight: 'bold', color: '#FFD700' },
  activeEffects: { flexDirection: 'row', gap: 4 },
  effectIcon: { fontSize: 14 },
  coinLabel: { fontSize: 11, color: '#FFD700', fontWeight: 'bold' },

  field: {
    flex: 1, backgroundColor: '#87CEEB', marginHorizontal: 8, marginVertical: 4,
    borderRadius: BORDER_RADIUS.md || 10, position: 'relative', overflow: 'hidden',
    borderWidth: 2, borderColor: '#5DADE2',
  },

  targetContainer: {
    position: 'absolute', width: 200, height: 200,
    justifyContent: 'center', alignItems: 'center', zIndex: 5,
  },
  targetRing: { position: 'absolute', borderWidth: 2, borderColor: '#00000022' },

  guideLine: { position: 'absolute', zIndex: 8 },
  guideDot: { position: 'absolute', width: 6, height: 6, borderRadius: 3, backgroundColor: '#FFD700' },

  trailDot: {
    position: 'absolute', width: 4, height: 4, borderRadius: 2, backgroundColor: '#FFD70088', zIndex: 10,
  },

  projectile: {
    position: 'absolute', width: 30, height: 30,
    justifyContent: 'center', alignItems: 'center', zIndex: 15,
  },
  projectileEmoji: { fontSize: 24 },

  landingMark: {
    position: 'absolute', width: 20, height: 20,
    justifyContent: 'center', alignItems: 'center', zIndex: 12,
  },
  landingEmoji: { fontSize: 20 },

  thrower: { position: 'absolute', bottom: 25, zIndex: 10 },
  throwerEmoji: { fontSize: 30 },

  ground: {
    position: 'absolute', bottom: 0, left: 0, right: 0, height: 25,
    backgroundColor: '#228B22', borderTopWidth: 2, borderTopColor: '#1B6B1B',
  },

  controlSection: { paddingHorizontal: 10, paddingVertical: 6 },

  aimInfo: { backgroundColor: '#0F3460', paddingVertical: 3, paddingHorizontal: 10, borderRadius: 6, marginBottom: 4 },
  aimLabel: { fontSize: 10, color: '#FFD700', fontWeight: 'bold', textAlign: 'center' },

  aimControls: { flexDirection: 'row', gap: 6, marginBottom: 4 },
  controlGroup: { flex: 1 },
  ctrlGroupLabel: { fontSize: 9, color: '#AAA', textAlign: 'center', marginBottom: 2 },
  ctrlRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 3 },
  ctrlBtn: {
    width: 30, height: 28, backgroundColor: '#2A3A5C', borderRadius: 6,
    justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#4A5A7C',
  },
  ctrlBtnText: { fontSize: 9, fontWeight: 'bold', color: '#FFF' },
  ctrlValue: { fontSize: 13, fontWeight: 'bold', color: '#FFD700', width: 32, textAlign: 'center' },

  actionBtn: {
    backgroundColor: '#E94560', paddingVertical: 12, borderRadius: 10,
    alignItems: 'center', borderWidth: 2, borderColor: '#FF6B8A',
  },
  actionBtnText: { fontSize: 15, fontWeight: 'bold', color: '#FFF' },

  meterContainer: { marginBottom: 6 },
  meterHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 },
  meterLabel: { fontSize: 12, fontWeight: 'bold', color: '#FFF' },
  meterQuality: { fontSize: 12, fontWeight: 'bold' },
  meterBar: {
    height: 18, backgroundColor: '#333', borderRadius: 9, overflow: 'hidden', position: 'relative',
  },
  meterFill: { height: '100%', borderRadius: 9 },
  sweetSpot: {
    position: 'absolute', left: '70%', width: '10%', height: '100%',
    borderWidth: 2, borderColor: '#4ECDC466', borderRadius: 9,
  },
  meterTicks: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 2 },
  tick: { fontSize: 8, color: '#666' },

  spinBar: {
    height: 18, backgroundColor: '#333', borderRadius: 9, overflow: 'hidden',
    position: 'relative', marginTop: 4,
  },
  spinFill: { height: '100%', borderRadius: 9 },
  spinCenter: {
    position: 'absolute', left: '49%', width: 3, height: '100%', backgroundColor: '#FFF',
  },
  spinLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 2 },
  spinLabel: { fontSize: 8, color: '#888' },

  flyingSection: { padding: 20, alignItems: 'center' },
  flyingText: { fontSize: 18, fontWeight: 'bold', color: '#FFD700' },

  shopSection: { paddingHorizontal: 8, paddingVertical: 4, backgroundColor: '#16213E' },
  shopTitle: { fontSize: 9, color: '#AAA', marginBottom: 3 },
  shopRow: { flexDirection: 'row', gap: 3, justifyContent: 'center' },
  shopItem: {
    flex: 1, paddingVertical: 4, borderRadius: 6, borderWidth: 1,
    borderColor: '#2A3A5C', backgroundColor: '#0F1A2E', alignItems: 'center',
  },
  shopDisabled: { opacity: 0.3 },
  shopEmoji: { fontSize: 12 },
  shopLabel: { fontSize: 6, color: '#FFF', fontWeight: 'bold' },
  shopCost: { fontSize: 6, color: '#FFD700' },

  historySection: { paddingHorizontal: 10, paddingVertical: 3 },
  historyTitle: { fontSize: 9, color: '#AAA', marginBottom: 2 },
  historyRow: { flexDirection: 'row', gap: 6 },
  historyItem: {
    alignItems: 'center', backgroundColor: '#1B2A4A', paddingHorizontal: 8,
    paddingVertical: 3, borderRadius: 6,
  },
  historyEmoji: { fontSize: 14 },
  historyPoints: { fontSize: 10, fontWeight: 'bold', color: '#FFD700' },
  historyDetail: { fontSize: 7, color: '#888' },

  statsContainer: {
    flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 5,
    paddingHorizontal: SPACING.md || 10, backgroundColor: '#16213E',
  },
  statBox: { alignItems: 'center' },
  statLabel: { fontSize: 8, color: '#888', marginBottom: 1 },
  statValue: { fontSize: 13, fontWeight: 'bold', color: '#FFF' },

  gameOverButtons: {
    paddingHorizontal: SPACING.lg || 20, paddingBottom: SPACING.md || 12, gap: 8,
  },
  nextBtn: {
    backgroundColor: '#E94560', paddingVertical: 12, borderRadius: 10,
    alignItems: 'center', borderWidth: 2, borderColor: '#FF6B8A',
  },
  nextBtnText: { fontSize: 16, fontWeight: 'bold', color: '#FFF' },
  exitBtn: { backgroundColor: '#533483', paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  exitBtnText: { fontSize: 16, fontWeight: 'bold', color: '#FFF' },
});