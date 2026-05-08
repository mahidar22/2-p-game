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

const LANES = 3;
const LANE_WIDTH = (width - 60) / LANES;
const GRAVITY_MODES = [
  { id: 'normal', label: 'Normal', emoji: '⬇️', gravity: 1, color: '#4ECDC4' },
  { id: 'low', label: 'Low Gravity', emoji: '🌙', gravity: 0.5, color: '#9B59B6' },
  { id: 'high', label: 'High Gravity', emoji: '🪐', gravity: 2, color: '#FF6B6B' },
  { id: 'reverse', label: 'Reverse', emoji: '⬆️', gravity: -1, color: '#FFD700' },
  { id: 'zero', label: 'Zero-G', emoji: '🚀', gravity: 0, color: '#E94560' },
];

const OBSTACLE_TYPES = [
  { id: 'spike', emoji: '🔺', label: 'Spike', damage: 15, points: 0, color: '#FF0000' },
  { id: 'laser', emoji: '⚡', label: 'Laser', damage: 20, points: 0, color: '#FF4500' },
  { id: 'wall', emoji: '🧱', label: 'Wall', damage: 10, points: 0, color: '#8B4513' },
  { id: 'portal', emoji: '🌀', label: 'Portal', damage: 0, points: 0, color: '#9B59B6' },
  { id: 'blackhole', emoji: '🕳️', label: 'Black Hole', damage: 25, points: 0, color: '#000' },
  { id: 'meteor', emoji: '☄️', label: 'Meteor', damage: 30, points: 0, color: '#FF6347' },
];

const COLLECTIBLE_TYPES = [
  { id: 'star', emoji: '⭐', label: 'Star', points: 10, color: '#FFD700' },
  { id: 'gem', emoji: '💎', label: 'Gem', points: 25, color: '#00CED1' },
  { id: 'coin', emoji: '🪙', label: 'Coin', points: 5, color: '#DAA520' },
  { id: 'crystal', emoji: '🔮', label: 'Crystal', points: 50, color: '#DA70D6' },
  { id: 'ring', emoji: '💍', label: 'Ring', points: 35, color: '#FFD700' },
];

const POWERUP_TYPES = [
  { id: 'shield', emoji: '🛡️', label: 'Shield', duration: 8000 },
  { id: 'magnet', emoji: '🧲', label: 'Magnet', duration: 10000 },
  { id: 'slowmo', emoji: '⏳', label: 'Slow Motion', duration: 6000 },
  { id: 'double', emoji: '✖️2️⃣', label: 'Double Points', duration: 10000 },
  { id: 'tiny', emoji: '🔬', label: 'Shrink', duration: 7000 },
  { id: 'ghost', emoji: '👻', label: 'Ghost Mode', duration: 5000 },
];

const CHARACTER_SKINS = [
  { id: 'astronaut', emoji: '👨‍🚀', label: 'Astronaut', color: '#FFF' },
  { id: 'alien', emoji: '👽', label: 'Alien', color: '#4ECDC4' },
  { id: 'robot', emoji: '🤖', label: 'Robot', color: '#C0C0C0' },
  { id: 'ninja', emoji: '🥷', label: 'Ninja', color: '#2C2C2C' },
  { id: 'wizard', emoji: '🧙', label: 'Wizard', color: '#9B59B6' },
  { id: 'cat', emoji: '🐱', label: 'Space Cat', color: '#FFD700' },
];

export default function GravityRunGame({ navigation }) {
  const [scores, setScores] = useState({ player1: 0, player2: 0 });
  const [round, setRound] = useState(1);
  const [maxRounds] = useState(3);
  const [gameActive, setGameActive] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [currentPlayer, setCurrentPlayer] = useState(1);
  const [gamePhase, setGamePhase] = useState('select');

  // Character
  const [selectedSkin, setSelectedSkin] = useState(null);
  const [playerLane, setPlayerLane] = useState(1);
  const [playerY, setPlayerY] = useState(0);
  const [isJumping, setIsJumping] = useState(false);
  const [isDucking, setIsDucking] = useState(false);

  // Health & Energy
  const [health, setHealth] = useState(100);
  const [energy, setEnergy] = useState(100);
  const [maxHealth] = useState(100);
  const [maxEnergy] = useState(100);

  // Gravity
  const [currentGravity, setCurrentGravity] = useState(GRAVITY_MODES[0]);
  const [gravityTimer, setGravityTimer] = useState(0);
  const [nextGravityChange, setNextGravityChange] = useState(15);

  // Game objects
  const [obstacles, setObstacles] = useState([]);
  const [collectibles, setCollectibles] = useState([]);
  const [powerUps, setPowerUps] = useState([]);
  const [particles, setParticles] = useState([]);

  // Active effects
  const [isShielded, setIsShielded] = useState(false);
  const [isMagnet, setIsMagnet] = useState(false);
  const [isSlowMo, setIsSlowMo] = useState(false);
  const [isDoublePoints, setIsDoublePoints] = useState(false);
  const [isTiny, setIsTiny] = useState(false);
  const [isGhost, setIsGhost] = useState(false);

  // Distance & speed
  const [distance, setDistance] = useState(0);
  const [speed, setSpeed] = useState(3);
  const [gameTime, setGameTime] = useState(60);

  // Combo
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [lastCollectTime, setLastCollectTime] = useState(null);

  // Stats
  const [gameStats, setGameStats] = useState({
    player1: {
      distance: 0,
      collectibles: 0,
      obstaclesAvoided: 0,
      powerUpsUsed: 0,
      maxCombo: 0,
      jumps: 0,
      ducks: 0,
      gravityChanges: 0,
      damagesTaken: 0,
    },
    player2: {
      distance: 0,
      collectibles: 0,
      obstaclesAvoided: 0,
      powerUpsUsed: 0,
      maxCombo: 0,
      jumps: 0,
      ducks: 0,
      gravityChanges: 0,
      damagesTaken: 0,
    },
  });

  // Animations
  const playerBounceAnim = useRef(new Animated.Value(0)).current;
  const jumpAnim = useRef(new Animated.Value(0)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const gravityFlashAnim = useRef(new Animated.Value(0)).current;
  const comboAnim = useRef(new Animated.Value(1)).current;
  const shieldGlowAnim = useRef(new Animated.Value(0)).current;
  const bgScrollAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const collectFlashAnim = useRef(new Animated.Value(0)).current;

  const gameLoopRef = useRef(null);
  const timerRef = useRef(null);
  const spawnRef = useRef(null);
  const gravityRef = useRef(null);
  const energyRef = useRef(null);

  // Cleanup
  useEffect(() => {
    return () => clearAllTimers();
  }, []);

  const clearAllTimers = () => {
    if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    if (timerRef.current) clearInterval(timerRef.current);
    if (spawnRef.current) clearInterval(spawnRef.current);
    if (gravityRef.current) clearInterval(gravityRef.current);
    if (energyRef.current) clearInterval(energyRef.current);
  };

  // Shield glow
  useEffect(() => {
    if (isShielded) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(shieldGlowAnim, { toValue: 1, duration: 500, useNativeDriver: false }),
          Animated.timing(shieldGlowAnim, { toValue: 0, duration: 500, useNativeDriver: false }),
        ])
      );
      loop.start();
      return () => loop.stop();
    }
  }, [isShielded]);

  // Pulse animation
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.05, duration: 1000, useNativeDriver: false }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: false }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  // Background scroll
  useEffect(() => {
    if (!gameActive) return;
    const loop = Animated.loop(
      Animated.timing(bgScrollAnim, {
        toValue: 1,
        duration: isSlowMo ? 4000 : 2000,
        useNativeDriver: false,
      })
    );
    loop.start();
    return () => loop.stop();
  }, [gameActive, isSlowMo]);

  // Combo reset
  useEffect(() => {
    if (!lastCollectTime) return;
    const timer = setTimeout(() => setCombo(0), 3000);
    return () => clearTimeout(timer);
  }, [lastCollectTime]);

  // Game timer
  useEffect(() => {
    if (!gameActive) return;
    timerRef.current = setInterval(() => {
      setGameTime((prev) => {
        if (prev <= 1) {
          endTurn();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [gameActive]);

  // Gravity changes
  useEffect(() => {
    if (!gameActive) return;
    gravityRef.current = setInterval(() => {
      setGravityTimer((prev) => {
        const newVal = prev + 1;
        if (newVal >= nextGravityChange) {
          changeGravity();
          setNextGravityChange(Math.max(8, 15 - round * 2));
          return 0;
        }
        return newVal;
      });
    }, 1000);
    return () => { if (gravityRef.current) clearInterval(gravityRef.current); };
  }, [gameActive, nextGravityChange, round]);

  // Energy regen
  useEffect(() => {
    if (!gameActive) return;
    energyRef.current = setInterval(() => {
      setEnergy((prev) => Math.min(maxEnergy, prev + 2));
    }, 500);
    return () => { if (energyRef.current) clearInterval(energyRef.current); };
  }, [gameActive]);

  // Main game loop
  useEffect(() => {
    if (!gameActive) return;

    const scrollSpeed = isSlowMo ? speed * 0.5 : speed;

    gameLoopRef.current = setInterval(() => {
      setDistance((prev) => prev + scrollSpeed * 0.5);
      setSpeed((prev) => Math.min(8, prev + 0.002));

      // Move obstacles
      setObstacles((prev) => {
        const updated = prev
          .map((obs) => ({ ...obs, y: obs.y + scrollSpeed * 1.5 }))
          .filter((obs) => obs.y < height * 0.65);

        // Collision check
        updated.forEach((obs) => {
          if (obs.hit) return;
          const vehicleY = height * 0.42;

          if (
            obs.lane === playerLane &&
            obs.y + 30 >= vehicleY &&
            obs.y <= vehicleY + 40 &&
            !isDucking
          ) {
            if (isGhost) return;

            if (obs.type === 'portal') {
              handlePortal();
              obs.hit = true;
              return;
            }

            if (isShielded) {
              obs.hit = true;
              addParticle(obs.lane, obs.y, '✨');
              return;
            }

            handleObstacleHit(obs);
            obs.hit = true;
          }
        });

        return updated;
      });

      // Move collectibles
      setCollectibles((prev) => {
        const updated = prev
          .map((col) => ({
            ...col,
            y: col.y + scrollSpeed * 1.5,
            lane: isMagnet ? playerLane : col.lane,
          }))
          .filter((col) => col.y < height * 0.65);

        updated.forEach((col) => {
          if (col.collected) return;
          const vehicleY = height * 0.42;

          if (
            col.lane === playerLane &&
            col.y + 20 >= vehicleY &&
            col.y <= vehicleY + 40
          ) {
            handleCollect(col);
            col.collected = true;
          }
        });

        return updated.filter((col) => !col.collected);
      });

      // Move power-ups
      setPowerUps((prev) => {
        const updated = prev
          .map((pu) => ({ ...pu, y: pu.y + scrollSpeed * 1.5 }))
          .filter((pu) => pu.y < height * 0.65);

        updated.forEach((pu) => {
          if (pu.collected) return;
          const vehicleY = height * 0.42;

          if (
            pu.lane === playerLane &&
            pu.y + 20 >= vehicleY &&
            pu.y <= vehicleY + 40
          ) {
            handlePowerUp(pu);
            pu.collected = true;
          }
        });

        return updated.filter((pu) => !pu.collected);
      });

      // Move particles
      setParticles((prev) =>
        prev
          .map((p) => ({ ...p, y: p.y - 1, opacity: p.opacity - 0.02 }))
          .filter((p) => p.opacity > 0)
      );
    }, isSlowMo ? 32 : 16);

    return () => { if (gameLoopRef.current) clearInterval(gameLoopRef.current); };
  }, [gameActive, speed, playerLane, isSlowMo, isShielded, isGhost, isDucking, isMagnet]);

  // Spawn objects
  useEffect(() => {
    if (!gameActive) return;

    const spawnRate = Math.max(400, 1200 - round * 150 - distance * 0.2);

    spawnRef.current = setInterval(() => {
      const rand = Math.random();
      const lane = Math.floor(Math.random() * LANES);

      if (rand < 0.4) {
        // Spawn obstacle
        const obsType = OBSTACLE_TYPES[Math.floor(Math.random() * OBSTACLE_TYPES.length)];
        setObstacles((prev) => [
          ...prev.slice(-12),
          {
            id: Date.now() + Math.random(),
            lane,
            y: -50,
            type: obsType.id,
            emoji: obsType.emoji,
            damage: obsType.damage + round * 3,
            color: obsType.color,
            hit: false,
          },
        ]);
      } else if (rand < 0.75) {
        // Spawn collectible
        const colType = COLLECTIBLE_TYPES[Math.floor(Math.random() * COLLECTIBLE_TYPES.length)];
        setCollectibles((prev) => [
          ...prev.slice(-10),
          {
            id: Date.now() + Math.random(),
            lane,
            y: -40,
            type: colType.id,
            emoji: colType.emoji,
            points: colType.points,
            color: colType.color,
            collected: false,
          },
        ]);
      } else if (rand < 0.88) {
        // Spawn power-up
        const puType = POWERUP_TYPES[Math.floor(Math.random() * POWERUP_TYPES.length)];
        setPowerUps((prev) => [
          ...prev.slice(-5),
          {
            id: Date.now() + Math.random(),
            lane,
            y: -40,
            type: puType.id,
            emoji: puType.emoji,
            label: puType.label,
            duration: puType.duration,
            collected: false,
          },
        ]);
      }
    }, spawnRate);

    return () => { if (spawnRef.current) clearInterval(spawnRef.current); };
  }, [gameActive, round, distance]);

  const changeGravity = () => {
    const newGravity = GRAVITY_MODES[Math.floor(Math.random() * GRAVITY_MODES.length)];
    setCurrentGravity(newGravity);

    const playerKey = currentPlayer === 1 ? 'player1' : 'player2';
    setGameStats((prev) => ({
      ...prev,
      [playerKey]: { ...prev[playerKey], gravityChanges: prev[playerKey].gravityChanges + 1 },
    }));

    // Flash animation
    gravityFlashAnim.setValue(1);
    Animated.timing(gravityFlashAnim, {
      toValue: 0,
      duration: 800,
      useNativeDriver: false,
    }).start();

    Alert.alert(
      `${newGravity.emoji} Gravity Shift!`,
      `${newGravity.label}`,
      [{ text: 'Go!', onPress: () => {} }]
    );
  };

  const addParticle = (lane, y, emoji) => {
    setParticles((prev) => [
      ...prev.slice(-20),
      { id: Date.now() + Math.random(), lane, y, emoji, opacity: 1 },
    ]);
  };

  const handleObstacleHit = (obstacle) => {
    const damage = obstacle.damage;
    const newHealth = Math.max(0, health - damage);
    setHealth(newHealth);
    setCombo(0);

    const playerKey = currentPlayer === 1 ? 'player1' : 'player2';
    setGameStats((prev) => ({
      ...prev,
      [playerKey]: { ...prev[playerKey], damagesTaken: prev[playerKey].damagesTaken + 1 },
    }));

    // Shake animation
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 12, duration: 50, useNativeDriver: false }),
      Animated.timing(shakeAnim, { toValue: -12, duration: 50, useNativeDriver: false }),
      Animated.timing(shakeAnim, { toValue: 6, duration: 50, useNativeDriver: false }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: false }),
    ]).start();

    addParticle(obstacle.lane, obstacle.y, '💥');

    if (newHealth <= 0) {
      handleDeath();
    }
  };

  const handlePortal = () => {
    const newLane = Math.floor(Math.random() * LANES);
    setPlayerLane(newLane);
    addParticle(newLane, height * 0.42, '🌀');

    // Bonus points
    const playerKey = currentPlayer === 1 ? 'player1' : 'player2';
    setScores((prev) => ({
      ...prev,
      [playerKey]: prev[playerKey] + 15,
    }));
  };

  const handleCollect = (collectible) => {
    const now = Date.now();
    const newCombo = lastCollectTime && now - lastCollectTime < 3000 ? combo + 1 : 1;
    setCombo(newCombo);
    if (newCombo > maxCombo) setMaxCombo(newCombo);
    setLastCollectTime(now);

    const comboBonus = (newCombo - 1) * 3;
    const multiplier = isDoublePoints ? 2 : 1;
    const totalPoints = (collectible.points + comboBonus) * multiplier;

    const playerKey = currentPlayer === 1 ? 'player1' : 'player2';
    setScores((prev) => ({
      ...prev,
      [playerKey]: prev[playerKey] + totalPoints,
    }));

    setGameStats((prev) => ({
      ...prev,
      [playerKey]: { ...prev[playerKey], collectibles: prev[playerKey].collectibles + 1 },
    }));

    if (newCombo > 1) {
      comboAnim.setValue(0.5);
      Animated.spring(comboAnim, {
        toValue: 1,
        friction: 3,
        tension: 200,
        useNativeDriver: false,
      }).start();
    }

    collectFlashAnim.setValue(1);
    Animated.timing(collectFlashAnim, {
      toValue: 0,
      duration: 400,
      useNativeDriver: false,
    }).start();

    addParticle(collectible.lane, collectible.y, `+${totalPoints}`);
  };

  const handlePowerUp = (powerUp) => {
    const playerKey = currentPlayer === 1 ? 'player1' : 'player2';
    setGameStats((prev) => ({
      ...prev,
      [playerKey]: { ...prev[playerKey], powerUpsUsed: prev[playerKey].powerUpsUsed + 1 },
    }));

    switch (powerUp.type) {
      case 'shield':
        setIsShielded(true);
        setTimeout(() => setIsShielded(false), powerUp.duration);
        break;
      case 'magnet':
        setIsMagnet(true);
        setTimeout(() => setIsMagnet(false), powerUp.duration);
        break;
      case 'slowmo':
        setIsSlowMo(true);
        setTimeout(() => setIsSlowMo(false), powerUp.duration);
        break;
      case 'double':
        setIsDoublePoints(true);
        setTimeout(() => setIsDoublePoints(false), powerUp.duration);
        break;
      case 'tiny':
        setIsTiny(true);
        setTimeout(() => setIsTiny(false), powerUp.duration);
        break;
      case 'ghost':
        setIsGhost(true);
        setTimeout(() => setIsGhost(false), powerUp.duration);
        break;
    }

    addParticle(powerUp.lane, powerUp.y, powerUp.emoji);
  };

  // Player actions
  const moveLeft = () => {
    if (!gameActive) return;
    setPlayerLane((prev) => Math.max(0, prev - 1));
  };

  const moveRight = () => {
    if (!gameActive) return;
    setPlayerLane((prev) => Math.min(LANES - 1, prev + 1));
  };

  const jump = () => {
    if (!gameActive || isJumping || energy < 15) return;
    setIsJumping(true);
    setEnergy((prev) => Math.max(0, prev - 15));

    const playerKey = currentPlayer === 1 ? 'player1' : 'player2';
    setGameStats((prev) => ({
      ...prev,
      [playerKey]: { ...prev[playerKey], jumps: prev[playerKey].jumps + 1 },
    }));

    const jumpHeight = currentGravity.gravity <= 0.5 ? -40 : -25;

    Animated.sequence([
      Animated.timing(jumpAnim, {
        toValue: jumpHeight,
        duration: currentGravity.gravity === 0 ? 600 : 300,
        useNativeDriver: false,
      }),
      Animated.timing(jumpAnim, {
        toValue: 0,
        duration: currentGravity.gravity === 0 ? 600 : 300 * Math.max(0.3, currentGravity.gravity),
        useNativeDriver: false,
      }),
    ]).start(() => setIsJumping(false));
  };

  const duck = () => {
    if (!gameActive || isDucking) return;
    setIsDucking(true);

    const playerKey = currentPlayer === 1 ? 'player1' : 'player2';
    setGameStats((prev) => ({
      ...prev,
      [playerKey]: { ...prev[playerKey], ducks: prev[playerKey].ducks + 1 },
    }));

    setTimeout(() => setIsDucking(false), 800);
  };

  const handleDeath = () => {
    clearAllTimers();
    setGameActive(false);

    const playerKey = currentPlayer === 1 ? 'player1' : 'player2';
    const distBonus = Math.round(distance * 0.5);
    setScores((prev) => ({
      ...prev,
      [playerKey]: prev[playerKey] + distBonus,
    }));

    Alert.alert(
      '💀 Crashed!',
      `Distance Bonus: +${distBonus}\nScore: ${scores[playerKey] + distBonus}\nDistance: ${Math.round(distance)}m\nMax Combo: x${maxCombo}`,
      [{ text: 'Continue', onPress: handleTurnEnd }]
    );
  };

  const selectSkin = (skin) => {
    setSelectedSkin(skin);
  };

  const startPlaying = () => {
    if (!selectedSkin) {
      Alert.alert('⚠️ Select a Character!', 'Choose your runner first!');
      return;
    }
    setGamePhase('playing');
    setGameActive(true);
    setGameTime(60);
    setHealth(100);
    setEnergy(100);
    setSpeed(3);
    setDistance(0);
    setPlayerLane(1);
    setCombo(0);
    setMaxCombo(0);
    setObstacles([]);
    setCollectibles([]);
    setPowerUps([]);
    setParticles([]);
    setCurrentGravity(GRAVITY_MODES[0]);
    setGravityTimer(0);
    setIsShielded(false);
    setIsMagnet(false);
    setIsSlowMo(false);
    setIsDoublePoints(false);
    setIsTiny(false);
    setIsGhost(false);
    setIsJumping(false);
    setIsDucking(false);
    setGameStarted(true);
  };

  const endTurn = () => {
    clearAllTimers();
    setGameActive(false);

    const playerKey = currentPlayer === 1 ? 'player1' : 'player2';
    const distBonus = Math.round(distance * 0.5);
    setScores((prev) => ({
      ...prev,
      [playerKey]: prev[playerKey] + distBonus,
    }));

    setGameStats((prev) => ({
      ...prev,
      [playerKey]: {
        ...prev[playerKey],
        distance: prev[playerKey].distance + distance,
        maxCombo: Math.max(prev[playerKey].maxCombo, maxCombo),
      },
    }));

    handleTurnEnd();
  };

  const handleTurnEnd = () => {
    if (currentPlayer === 1) {
      Alert.alert(
        '🏁 Turn Over!',
        `Player 1:\nScore: ${scores.player1}\nDistance: ${Math.round(distance)}m`,
        [{ text: "Player 2's Turn!", onPress: switchPlayer }]
      );
    } else {
      handleEndRound();
    }
  };

  const switchPlayer = () => {
    setCurrentPlayer(2);
    setGamePhase('select');
    setSelectedSkin(null);
    setGameActive(false);
  };

  const handleEndRound = () => {
    setGamePhase('ended');

    let winner = '';
    if (scores.player1 > scores.player2) winner = '🏆 Player 1 Wins!';
    else if (scores.player2 > scores.player1) winner = '🏆 Player 2 Wins!';
    else winner = "🤝 It's a Tie!";

    if (round >= maxRounds) {
      handleGameOver();
    } else {
      Alert.alert(
        `🏁 Round ${round} Complete!`,
        `${winner}\n\nP1: ${scores.player1} | P2: ${scores.player2}`,
        [
          { text: '🔄 Next Round', onPress: nextRound },
          { text: '🚪 End', onPress: () => navigation.goBack() },
        ]
      );
    }
  };

  const handleGameOver = () => {
    const p1 = gameStats.player1;
    const p2 = gameStats.player2;

    let champion = '';
    if (scores.player1 > scores.player2) champion = '🏆 Player 1 is Champion!';
    else if (scores.player2 > scores.player1) champion = '🏆 Player 2 is Champion!';
    else champion = "🤝 Perfect Tie!";

    Alert.alert(
      '🎮 Game Over!',
      `${champion}\n\nP1: ${scores.player1} | P2: ${scores.player2}\n\nDistance: P1 ${Math.round(p1.distance)}m | P2 ${Math.round(p2.distance)}m\nCollected: P1 ${p1.collectibles} | P2 ${p2.collectibles}\nCombo: P1 x${p1.maxCombo} | P2 x${p2.maxCombo}`,
      [
        { text: '🔄 New Game', onPress: resetGame },
        { text: '🚪 Exit', onPress: () => navigation.goBack() },
      ]
    );
  };

  const nextRound = () => {
    setRound((prev) => prev + 1);
    setCurrentPlayer(1);
    setGamePhase('select');
    setSelectedSkin(null);
    setGameActive(false);
    setGameStarted(false);
  };

  const resetGame = () => {
    setScores({ player1: 0, player2: 0 });
    setRound(1);
    setCurrentPlayer(1);
    setGamePhase('select');
    setGameActive(false);
    setGameStarted(false);
    setSelectedSkin(null);
    setGameStats({
      player1: { distance: 0, collectibles: 0, obstaclesAvoided: 0, powerUpsUsed: 0, maxCombo: 0, jumps: 0, ducks: 0, gravityChanges: 0, damagesTaken: 0 },
      player2: { distance: 0, collectibles: 0, obstaclesAvoided: 0, powerUpsUsed: 0, maxCombo: 0, jumps: 0, ducks: 0, gravityChanges: 0, damagesTaken: 0 },
    });
  };

  const playerKey = currentPlayer === 1 ? 'player1' : 'player2';
  const currentStats = gameStats[playerKey];
  const hpPercent = Math.round((health / maxHealth) * 100);
  const energyPercent = Math.round((energy / maxEnergy) * 100);

  const getHPColor = () => {
    if (hpPercent > 60) return '#4ECDC4';
    if (hpPercent > 30) return '#FFD700';
    return '#FF6B6B';
  };

  const getGravityArrow = () => {
    if (currentGravity.gravity > 1) return '⬇️⬇️';
    if (currentGravity.gravity > 0) return '⬇️';
    if (currentGravity.gravity === 0) return '🔄';
    return '⬆️';
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backBtn}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>🌌 Gravity Run</Text>
        <Text style={styles.roundInfo}>Rd {round}/{maxRounds}</Text>
      </View>

      {/* Scoreboard */}
      <View style={styles.scoreboard}>
        <View style={styles.scoreTeam}>
          <Text style={styles.teamLabel}>{currentPlayer === 1 ? '►' : ''} P1</Text>
          <Text style={[styles.teamScore, { color: '#FF6B6B' }]}>{scores.player1}</Text>
        </View>
        <View style={styles.gameInfoCenter}>
          <Text style={[styles.timerText, { color: gameTime <= 10 ? '#FF6B6B' : '#FFF' }]}>
            ⏱️ {gameTime}s
          </Text>
          <Text style={styles.distText}>📏 {Math.round(distance)}m</Text>
        </View>
        <View style={styles.scoreTeam}>
          <Text style={styles.teamLabel}>{currentPlayer === 2 ? '►' : ''} P2</Text>
          <Text style={[styles.teamScore, { color: '#4ECDC4' }]}>{scores.player2}</Text>
        </View>
      </View>

      {/* Character Selection */}
      {gamePhase === 'select' && (
        <View style={styles.selectPhase}>
          <Text style={styles.selectTitle}>🎮 Player {currentPlayer} - Choose Runner:</Text>
          <View style={styles.skinGrid}>
            {CHARACTER_SKINS.map((skin) => (
              <TouchableOpacity
                key={skin.id}
                style={[
                  styles.skinCard,
                  selectedSkin?.id === skin.id && styles.skinCardSelected,
                ]}
                onPress={() => selectSkin(skin)}
              >
                <Text style={styles.skinEmoji}>{skin.emoji}</Text>
                <Text style={styles.skinName}>{skin.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
          {selectedSkin && (
            <TouchableOpacity style={styles.goBtn} onPress={startPlaying}>
              <Text style={styles.goBtnText}>🚀 START RUNNING!</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Playing Phase */}
      {gamePhase === 'playing' && (
        <>
          {/* Status Bar */}
          <View style={[styles.statusBar, { borderBottomColor: currentGravity.color }]}>
            <View style={styles.statusLeft}>
              <Text style={styles.gravityLabel}>
                {currentGravity.emoji} {currentGravity.label}
              </Text>
              <Text style={styles.speedLabel}>Speed: {speed.toFixed(1)}x</Text>
            </View>
            {combo > 1 && (
              <Animated.Text
                style={[styles.comboText, { transform: [{ scale: comboAnim }] }]}
              >
                🔥 x{combo}
              </Animated.Text>
            )}
            <View style={styles.activeEffects}>
              {isShielded && <Text style={styles.effectEmoji}>🛡️</Text>}
              {isMagnet && <Text style={styles.effectEmoji}>🧲</Text>}
              {isSlowMo && <Text style={styles.effectEmoji}>⏳</Text>}
              {isDoublePoints && <Text style={styles.effectEmoji}>✖️2️⃣</Text>}
              {isGhost && <Text style={styles.effectEmoji}>👻</Text>}
              {isTiny && <Text style={styles.effectEmoji}>🔬</Text>}
            </View>
          </View>

          {/* HP & Energy Bars */}
          <View style={styles.barsContainer}>
            <View style={styles.barRow}>
              <Text style={styles.barLabel}>❤️ {hpPercent}%</Text>
              <View style={styles.bar}>
                <View style={[styles.barFill, { width: `${hpPercent}%`, backgroundColor: getHPColor() }]} />
              </View>
            </View>
            <View style={styles.barRow}>
              <Text style={styles.barLabel}>⚡ {energyPercent}%</Text>
              <View style={styles.bar}>
                <View style={[styles.barFill, { width: `${energyPercent}%`, backgroundColor: '#FFD700' }]} />
              </View>
            </View>
          </View>

          {/* Game Arena */}
          <Animated.View
            style={[
              styles.arena,
              {
                transform: [{ translateX: shakeAnim }],
                backgroundColor: currentGravity.id === 'reverse' ? '#1A0A2E' :
                  currentGravity.id === 'zero' ? '#0A1A2E' :
                  currentGravity.id === 'low' ? '#1A1A3E' : '#0D1B2A',
              },
            ]}
          >
            {/* Gravity flash */}
            <Animated.View
              style={[
                styles.gravityFlash,
                {
                  opacity: gravityFlashAnim,
                  backgroundColor: currentGravity.color + '33',
                },
              ]}
            />

            {/* Stars background */}
            <View style={styles.starsLayer}>
              {[...Array(15)].map((_, i) => (
                <Text
                  key={`star-${i}`}
                  style={[
                    styles.bgStar,
                    {
                      left: `${(i * 7 + 3) % 100}%`,
                      top: `${(i * 13 + 5) % 100}%`,
                      fontSize: i % 3 === 0 ? 8 : 6,
                    },
                  ]}
                >
                  ✦
                </Text>
              ))}
            </View>

            {/* Lane dividers */}
            {[...Array(LANES + 1)].map((_, i) => (
              <View
                key={`lane-${i}`}
                style={[styles.laneMarker, { left: 20 + i * LANE_WIDTH }]}
              />
            ))}

            {/* Obstacles */}
            {obstacles.map((obs) =>
              !obs.hit ? (
                <View
                  key={obs.id}
                  style={[
                    styles.obstacle,
                    {
                      left: 20 + obs.lane * LANE_WIDTH + LANE_WIDTH / 2 - 20,
                      top: obs.y,
                      borderColor: obs.color,
                    },
                  ]}
                >
                  <Text style={styles.obstacleEmoji}>{obs.emoji}</Text>
                </View>
              ) : null
            )}

            {/* Collectibles */}
            {collectibles.map((col) => (
              <Animated.View
                key={col.id}
                style={[
                  styles.collectible,
                  {
                    left: 20 + col.lane * LANE_WIDTH + LANE_WIDTH / 2 - 15,
                    top: col.y,
                    transform: [{ scale: pulseAnim }],
                  },
                ]}
              >
                <Text style={styles.collectEmoji}>{col.emoji}</Text>
              </Animated.View>
            ))}

            {/* Power-ups */}
            {powerUps.map((pu) => (
              <View
                key={pu.id}
                style={[
                  styles.powerUp,
                  {
                    left: 20 + pu.lane * LANE_WIDTH + LANE_WIDTH / 2 - 18,
                    top: pu.y,
                  },
                ]}
              >
                <Text style={styles.puEmoji}>{pu.emoji}</Text>
              </View>
            ))}

            {/* Particles */}
            {particles.map((p) => (
              <View
                key={p.id}
                style={[
                  styles.particle,
                  {
                    left: 20 + p.lane * LANE_WIDTH + LANE_WIDTH / 2 - 15,
                    top: p.y,
                    opacity: p.opacity,
                  },
                ]}
              >
                <Text style={styles.particleText}>{p.emoji}</Text>
              </View>
            ))}

            {/* Player */}
            <Animated.View
              style={[
                styles.player,
                {
                  left: 20 + playerLane * LANE_WIDTH + LANE_WIDTH / 2 - 22,
                  bottom: 40,
                  transform: [
                    { translateY: jumpAnim },
                    { scale: isTiny ? 0.7 : 1 },
                  ],
                  opacity: isGhost ? 0.5 : 1,
                },
              ]}
            >
              {isShielded && (
                <Animated.View
                  style={[
                    styles.shieldBubble,
                    {
                      borderColor: shieldGlowAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['#4ECDC466', '#4ECDC4'],
                      }),
                    },
                  ]}
                />
              )}
              <Text style={[styles.playerEmoji, isDucking && styles.playerDucking]}>
                {selectedSkin?.emoji || '👨‍🚀'}
              </Text>
              {isDucking && <Text style={styles.duckIndicator}>⬇️</Text>}
            </Animated.View>

            {/* Collect flash */}
            <Animated.View
              style={[
                styles.collectFlash,
                { opacity: collectFlashAnim },
              ]}
            />

            {/* Gravity indicator */}
            <View style={styles.gravityIndicator}>
              <Text style={styles.gravityArrow}>{getGravityArrow()}</Text>
            </View>

            {/* Next gravity change timer */}
            <View style={styles.gravityTimerBox}>
              <Text style={styles.gravityTimerText}>
                ⚡ {nextGravityChange - gravityTimer}s
              </Text>
            </View>
          </Animated.View>

          {/* Controls */}
          <View style={styles.controls}>
            <View style={styles.moveControls}>
              <TouchableOpacity style={styles.moveBtn} onPress={moveLeft}>
                <Text style={styles.moveBtnText}>◄</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.jumpBtn, energy < 15 && styles.btnDisabled]}
                onPress={jump}
                disabled={energy < 15 || isJumping}
              >
                <Text style={styles.jumpBtnText}>⬆️ JUMP</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.duckBtn, isDucking && styles.btnActive]}
                onPress={duck}
                disabled={isDucking}
              >
                <Text style={styles.duckBtnText}>⬇️ DUCK</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.moveBtn} onPress={moveRight}>
                <Text style={styles.moveBtnText}>►</Text>
              </TouchableOpacity>
            </View>
          </View>
        </>
      )}

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Distance</Text>
          <Text style={styles.statValue}>{Math.round(currentStats.distance + distance)}m</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Collected</Text>
          <Text style={[styles.statValue, { color: '#FFD700' }]}>{currentStats.collectibles}</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Combo</Text>
          <Text style={[styles.statValue, { color: '#FF6B6B' }]}>x{Math.max(maxCombo, currentStats.maxCombo)}</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Power-Ups</Text>
          <Text style={[styles.statValue, { color: '#9B59B6' }]}>{currentStats.powerUpsUsed}</Text>
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
  container: {
    flex: 1,
    backgroundColor: '#0A0A1A',
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg || 20,
    paddingVertical: SPACING.sm || 8,
    backgroundColor: '#12122A',
  },
  backBtn: { fontSize: 16, color: '#FFF', fontWeight: 'bold' },
  title: { fontSize: 19, fontWeight: 'bold', color: '#FFF' },
  roundInfo: { fontSize: 13, color: '#FFD700', fontWeight: 'bold' },

  scoreboard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg || 20,
    paddingVertical: 6,
    backgroundColor: '#16163A',
    borderBottomWidth: 2,
    borderBottomColor: '#9B59B6',
  },
  scoreTeam: { alignItems: 'center', width: 70 },
  teamLabel: { fontSize: 11, color: '#AAA', fontWeight: 'bold' },
  teamScore: { fontSize: 24, fontWeight: 'bold' },
  gameInfoCenter: { alignItems: 'center' },
  timerText: { fontSize: 18, fontWeight: 'bold' },
  distText: { fontSize: 11, color: '#AAA' },

  selectPhase: {
    flex: 1,
    paddingHorizontal: SPACING.lg || 20,
    paddingTop: SPACING.lg || 20,
  },
  selectTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
    textAlign: 'center',
    marginBottom: 16,
  },
  skinGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
  },
  skinCard: {
    width: (width - 80) / 3,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#2A2A5A',
    backgroundColor: '#1A1A3A',
    alignItems: 'center',
  },
  skinCardSelected: {
    borderColor: '#4ECDC4',
    backgroundColor: '#4ECDC422',
    borderWidth: 3,
  },
  skinEmoji: { fontSize: 32 },
  skinName: { fontSize: 11, fontWeight: 'bold', color: '#FFF', marginTop: 6 },

  goBtn: {
    backgroundColor: '#9B59B6',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  goBtnText: { fontSize: 18, fontWeight: 'bold', color: '#FFF' },

  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg || 20,
    paddingVertical: 4,
    backgroundColor: '#0F0F2A',
    borderBottomWidth: 2,
  },
  statusLeft: {},
  gravityLabel: { fontSize: 12, fontWeight: 'bold', color: '#FFF' },
  speedLabel: { fontSize: 9, color: '#888' },
  comboText: { fontSize: 15, fontWeight: 'bold', color: '#FFD700' },
  activeEffects: { flexDirection: 'row', gap: 4 },
  effectEmoji: { fontSize: 14 },

  barsContainer: {
    paddingHorizontal: SPACING.lg || 20,
    paddingVertical: 4,
    backgroundColor: '#16163A',
    flexDirection: 'row',
    gap: 8,
  },
  barRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  barLabel: { fontSize: 9, color: '#AAA', width: 40 },
  bar: {
    flex: 1,
    height: 10,
    backgroundColor: '#333',
    borderRadius: 5,
    overflow: 'hidden',
  },
  barFill: { height: '100%', borderRadius: 5 },

  arena: {
    flex: 1,
    marginHorizontal: 10,
    marginVertical: 4,
    borderRadius: BORDER_RADIUS.lg || 16,
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#2A2A5A',
  },

  gravityFlash: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 30,
  },

  starsLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
  bgStar: {
    position: 'absolute',
    color: '#FFFFFF44',
  },

  laneMarker: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: '#FFFFFF11',
  },

  obstacle: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 8,
    borderWidth: 2,
    backgroundColor: '#FF000022',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 5,
  },
  obstacleEmoji: { fontSize: 22 },

  collectible: {
    position: 'absolute',
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 5,
  },
  collectEmoji: { fontSize: 20 },

  powerUp: {
    position: 'absolute',
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#9B59B633',
    borderWidth: 2,
    borderColor: '#9B59B6',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 8,
  },
  puEmoji: { fontSize: 18 },

  particle: {
    position: 'absolute',
    zIndex: 15,
  },
  particleText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFD700',
  },

  player: {
    position: 'absolute',
    width: 44,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  playerEmoji: { fontSize: 34 },
  playerDucking: {
    fontSize: 24,
    marginTop: 10,
  },
  duckIndicator: {
    fontSize: 10,
    position: 'absolute',
    top: -5,
  },
  shieldBubble: {
    position: 'absolute',
    width: 52,
    height: 56,
    borderRadius: 28,
    borderWidth: 3,
    zIndex: -1,
  },

  collectFlash: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#FFD70022',
    zIndex: 20,
  },

  gravityIndicator: {
    position: 'absolute',
    top: 8,
    left: 8,
    zIndex: 25,
  },
  gravityArrow: { fontSize: 18 },

  gravityTimerBox: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#00000066',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    zIndex: 25,
  },
  gravityTimerText: { fontSize: 10, color: '#FFF', fontWeight: 'bold' },

  controls: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: '#12122A',
  },
  moveControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  moveBtn: {
    width: 55,
    height: 50,
    backgroundColor: '#2A2A5A',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#4A4A7A',
  },
  moveBtnText: { fontSize: 22, fontWeight: 'bold', color: '#FFF' },
  jumpBtn: {
    flex: 1,
    height: 50,
    backgroundColor: '#2ECC71',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#27AE60',
  },
  jumpBtnText: { fontSize: 14, fontWeight: 'bold', color: '#FFF' },
  duckBtn: {
    flex: 1,
    height: 50,
    backgroundColor: '#3498DB',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#2980B9',
  },
  duckBtnText: { fontSize: 14, fontWeight: 'bold', color: '#FFF' },
  btnDisabled: { opacity: 0.4 },
  btnActive: { backgroundColor: '#1A6EA0' },

  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 6,
    paddingHorizontal: SPACING.md || 10,
    backgroundColor: '#16163A',
  },
  statBox: { alignItems: 'center' },
  statLabel: { fontSize: 9, color: '#888', marginBottom: 2 },
  statValue: { fontSize: 14, fontWeight: 'bold', color: '#4ECDC4' },

  gameOverButtons: {
    paddingHorizontal: SPACING.lg || 20,
    paddingBottom: SPACING.md || 12,
    gap: 8,
  },
  nextBtn: {
    backgroundColor: '#9B59B6',
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