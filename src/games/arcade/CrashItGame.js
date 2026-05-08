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

const VEHICLE_TYPES = [
  { id: 'sedan', emoji: '🚗', label: 'Sedan', weight: 1, speed: 3, armor: 1, color: '#4ECDC4' },
  { id: 'truck', emoji: '🚛', label: 'Truck', weight: 3, speed: 1.5, armor: 3, color: '#FF6B6B' },
  { id: 'sports', emoji: '🏎️', label: 'Sports', weight: 1, speed: 5, armor: 0.5, color: '#FFD700' },
  { id: 'suv', emoji: '🚙', label: 'SUV', weight: 2, speed: 2.5, armor: 2, color: '#2ECC71' },
  { id: 'bus', emoji: '🚌', label: 'Bus', weight: 4, speed: 1, armor: 4, color: '#E94560' },
  { id: 'tank', emoji: '🛡️', label: 'Tank', weight: 5, speed: 0.8, armor: 5, color: '#9B59B6' },
];

const OBSTACLE_TYPES = [
  { id: 'barrel', emoji: '🛢️', label: 'Barrel', hp: 20, points: 15, color: '#C0392B' },
  { id: 'crate', emoji: '📦', label: 'Crate', hp: 30, points: 20, color: '#8B4513' },
  { id: 'wall', emoji: '🧱', label: 'Wall', hp: 60, points: 40, color: '#95A5A6' },
  { id: 'car', emoji: '🚘', label: 'Parked Car', hp: 50, points: 35, color: '#3498DB' },
  { id: 'cone', emoji: '🔺', label: 'Cone', hp: 5, points: 5, color: '#E67E22' },
  { id: 'hydrant', emoji: '🚿', label: 'Hydrant', hp: 25, points: 25, color: '#E74C3C' },
  { id: 'dumpster', emoji: '🗑️', label: 'Dumpster', hp: 70, points: 50, color: '#2C3E50' },
  { id: 'fence', emoji: '🚧', label: 'Fence', hp: 15, points: 10, color: '#F39C12' },
  { id: 'boulder', emoji: '🪨', label: 'Boulder', hp: 100, points: 75, color: '#7F8C8D' },
  { id: 'explosive', emoji: '💣', label: 'Explosive', hp: 10, points: 60, color: '#FF4500' },
];

const POWERUP_TYPES = [
  { id: 'nitro', emoji: '🚀', label: 'Nitro Boost', description: 'Speed x2' },
  { id: 'shield', emoji: '🛡️', label: 'Shield', description: 'No damage' },
  { id: 'magnet', emoji: '🧲', label: 'Magnet', description: 'Pull items' },
  { id: 'doublePoints', emoji: '✖️2️⃣', label: 'Double Points', description: 'x2 Score' },
  { id: 'repair', emoji: '🔧', label: 'Repair', description: '+30 HP' },
  { id: 'missile', emoji: '🚀', label: 'Missile', description: 'Destroy ahead' },
];

const LANES = 5;
const LANE_WIDTH = (width - 40) / LANES;

export default function CrashItGame({ navigation }) {
  const [scores, setScores] = useState({ player1: 0, player2: 0 });
  const [round, setRound] = useState(1);
  const [maxRounds] = useState(3);
  const [gameActive, setGameActive] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [currentPlayer, setCurrentPlayer] = useState(1);
  const [gameTime, setGameTime] = useState(60);
  const [gamePhase, setGamePhase] = useState('select'); // select, playing, ended

  // Vehicle
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [vehicleHP, setVehicleHP] = useState(100);
  const [maxHP, setMaxHP] = useState(100);
  const [currentLane, setCurrentLane] = useState(2);
  const [vehicleSpeed, setVehicleSpeed] = useState(1);
  const [isNitro, setIsNitro] = useState(false);
  const [isShielded, setIsShielded] = useState(false);
  const [isDoublePoints, setIsDoublePoints] = useState(false);

  // Road obstacles
  const [obstacles, setObstacles] = useState([]);
  const [destroyedCount, setDestroyedCount] = useState(0);
  const [distanceTraveled, setDistanceTraveled] = useState(0);

  // Combo & streak
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [lastCrashTime, setLastCrashTime] = useState(null);
  const [crashStreak, setCrashStreak] = useState(0);

  // Power-ups on road
  const [roadPowerUps, setRoadPowerUps] = useState([]);
  const [collectedPowerUps, setCollectedPowerUps] = useState([]);

  // Stats
  const [gameStats, setGameStats] = useState({
    player1: {
      obstaclesDestroyed: 0,
      distanceTraveled: 0,
      powerUpsUsed: 0,
      maxCombo: 0,
      damageDealt: 0,
      damageTaken: 0,
      totalScore: 0,
    },
    player2: {
      obstaclesDestroyed: 0,
      distanceTraveled: 0,
      powerUpsUsed: 0,
      maxCombo: 0,
      damageDealt: 0,
      damageTaken: 0,
      totalScore: 0,
    },
  });

  // Animations
  const vehicleShakeAnim = useRef(new Animated.Value(0)).current;
  const crashFlashAnim = useRef(new Animated.Value(0)).current;
  const comboAnim = useRef(new Animated.Value(1)).current;
  const speedLinesAnim = useRef(new Animated.Value(0)).current;
  const nitroGlowAnim = useRef(new Animated.Value(0)).current;
  const hpBarAnim = useRef(new Animated.Value(1)).current;
  const roadScrollAnim = useRef(new Animated.Value(0)).current;
  const explosionAnim = useRef(new Animated.Value(0)).current;

  const gameTimerRef = useRef(null);
  const obstacleTimerRef = useRef(null);
  const scrollTimerRef = useRef(null);
  const powerUpTimerRef = useRef(null);

  // Cleanup
  useEffect(() => {
    return () => {
      clearAllTimers();
    };
  }, []);

  const clearAllTimers = () => {
    if (gameTimerRef.current) clearInterval(gameTimerRef.current);
    if (obstacleTimerRef.current) clearInterval(obstacleTimerRef.current);
    if (scrollTimerRef.current) clearInterval(scrollTimerRef.current);
    if (powerUpTimerRef.current) clearInterval(powerUpTimerRef.current);
  };

  // Game timer
  useEffect(() => {
    if (!gameActive) return;

    gameTimerRef.current = setInterval(() => {
      setGameTime((prev) => {
        if (prev <= 1) {
          endTurn();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (gameTimerRef.current) clearInterval(gameTimerRef.current);
    };
  }, [gameActive]);

  // Obstacle spawning
  useEffect(() => {
    if (!gameActive) return;

    const spawnRate = Math.max(600, 1500 - round * 200 - distanceTraveled * 0.5);

    obstacleTimerRef.current = setInterval(() => {
      const lane = Math.floor(Math.random() * LANES);
      const obstacleType = OBSTACLE_TYPES[Math.floor(Math.random() * OBSTACLE_TYPES.length)];

      const newObstacle = {
        id: Date.now() + Math.random(),
        lane,
        y: -60,
        type: obstacleType.id,
        emoji: obstacleType.emoji,
        label: obstacleType.label,
        hp: obstacleType.hp + round * 5,
        maxHP: obstacleType.hp + round * 5,
        points: obstacleType.points,
        color: obstacleType.color,
        destroyed: false,
        hit: false,
      };

      setObstacles((prev) => [...prev.slice(-15), newObstacle]);
    }, spawnRate);

    return () => {
      if (obstacleTimerRef.current) clearInterval(obstacleTimerRef.current);
    };
  }, [gameActive, round, distanceTraveled]);

  // Road scroll & obstacle movement
  useEffect(() => {
    if (!gameActive) return;

    const scrollSpeed = isNitro ? 80 : 120 / (vehicleSpeed || 1);

    scrollTimerRef.current = setInterval(() => {
      const moveSpeed = isNitro ? 6 : 3 * (vehicleSpeed || 1);

      setDistanceTraveled((prev) => prev + moveSpeed * 0.1);

      setObstacles((prev) => {
        const updated = prev
          .map((obs) => ({
            ...obs,
            y: obs.y + moveSpeed,
          }))
          .filter((obs) => obs.y < height * 0.7);

        // Check collisions with vehicle
        updated.forEach((obs) => {
          if (obs.destroyed || obs.hit) return;

          const vehicleY = height * 0.48;
          const vehicleLane = currentLane;

          if (
            obs.lane === vehicleLane &&
            obs.y + 40 >= vehicleY &&
            obs.y <= vehicleY + 50
          ) {
            handleCrash(obs);
          }
        });

        return updated;
      });

      // Move road power-ups
      setRoadPowerUps((prev) => {
        const updated = prev
          .map((pu) => ({ ...pu, y: pu.y + moveSpeed }))
          .filter((pu) => pu.y < height * 0.7);

        updated.forEach((pu) => {
          const vehicleY = height * 0.48;
          if (
            pu.lane === currentLane &&
            pu.y + 20 >= vehicleY &&
            pu.y <= vehicleY + 50 &&
            !pu.collected
          ) {
            collectPowerUp(pu);
            pu.collected = true;
          }
        });

        return updated.filter((pu) => !pu.collected);
      });
    }, scrollSpeed);

    return () => {
      if (scrollTimerRef.current) clearInterval(scrollTimerRef.current);
    };
  }, [gameActive, vehicleSpeed, currentLane, isNitro]);

  // Power-up spawning
  useEffect(() => {
    if (!gameActive) return;

    powerUpTimerRef.current = setInterval(() => {
      if (Math.random() < 0.4) {
        const lane = Math.floor(Math.random() * LANES);
        const puType = POWERUP_TYPES[Math.floor(Math.random() * POWERUP_TYPES.length)];

        setRoadPowerUps((prev) => [
          ...prev.slice(-5),
          {
            id: Date.now() + Math.random(),
            lane,
            y: -40,
            type: puType.id,
            emoji: puType.emoji,
            label: puType.label,
            collected: false,
          },
        ]);
      }
    }, 3000);

    return () => {
      if (powerUpTimerRef.current) clearInterval(powerUpTimerRef.current);
    };
  }, [gameActive]);

  // Nitro animation
  useEffect(() => {
    if (isNitro) {
      const nitroLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(nitroGlowAnim, {
            toValue: 1,
            duration: 200,
            useNativeDriver: false,
          }),
          Animated.timing(nitroGlowAnim, {
            toValue: 0,
            duration: 200,
            useNativeDriver: false,
          }),
        ])
      );
      nitroLoop.start();

      Animated.loop(
        Animated.sequence([
          Animated.timing(speedLinesAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: false,
          }),
          Animated.timing(speedLinesAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: false,
          }),
        ])
      ).start();

      return () => {
        nitroLoop.stop();
        speedLinesAnim.setValue(0);
      };
    }
  }, [isNitro]);

  // Combo reset
  useEffect(() => {
    if (!lastCrashTime) return;
    const timer = setTimeout(() => {
      setCombo(0);
    }, 4000);
    return () => clearTimeout(timer);
  }, [lastCrashTime]);

  // Handle crash into obstacle
  const handleCrash = (obstacle) => {
    if (!selectedVehicle) return;

    const vehicleWeight = selectedVehicle.weight;
    const vehicleSpeedVal = isNitro ? selectedVehicle.speed * 2 : selectedVehicle.speed;
    const vehicleArmor = selectedVehicle.armor;

    // Impact force
    const impactForce = vehicleWeight * vehicleSpeedVal * 10;
    const damageToObstacle = impactForce * (isShielded ? 1.5 : 1);
    const damageToVehicle = isShielded ? 0 : Math.max(2, (obstacle.hp * 0.3) / vehicleArmor);

    const now = Date.now();
    const newCombo = lastCrashTime && now - lastCrashTime < 4000 ? combo + 1 : 1;
    setCombo(newCombo);
    if (newCombo > maxCombo) setMaxCombo(newCombo);
    setLastCrashTime(now);
    setCrashStreak((prev) => prev + 1);

    // Vehicle shake
    Animated.sequence([
      Animated.timing(vehicleShakeAnim, {
        toValue: 10,
        duration: 50,
        useNativeDriver: false,
      }),
      Animated.timing(vehicleShakeAnim, {
        toValue: -10,
        duration: 50,
        useNativeDriver: false,
      }),
      Animated.timing(vehicleShakeAnim, {
        toValue: 5,
        duration: 50,
        useNativeDriver: false,
      }),
      Animated.timing(vehicleShakeAnim, {
        toValue: 0,
        duration: 50,
        useNativeDriver: false,
      }),
    ]).start();

    // Crash flash
    crashFlashAnim.setValue(1);
    Animated.timing(crashFlashAnim, {
      toValue: 0,
      duration: 400,
      useNativeDriver: false,
    }).start();

    // Combo animation
    if (newCombo > 1) {
      comboAnim.setValue(0.5);
      Animated.spring(comboAnim, {
        toValue: 1,
        friction: 3,
        tension: 200,
        useNativeDriver: false,
      }).start();
    }

    // Check if obstacle destroyed
    const remainingHP = obstacle.hp - damageToObstacle;
    const isDestroyed = remainingHP <= 0;

    if (isDestroyed) {
      // Calculate points
      const comboBonus = (newCombo - 1) * 10;
      const nitroBonus = isNitro ? 20 : 0;
      const multiplier = isDoublePoints ? 2 : 1;
      const totalPoints = (obstacle.points + comboBonus + nitroBonus) * multiplier;

      const playerKey = currentPlayer === 1 ? 'player1' : 'player2';
      setScores((prev) => ({
        ...prev,
        [playerKey]: prev[playerKey] + totalPoints,
      }));

      setDestroyedCount((prev) => prev + 1);

      setGameStats((prev) => ({
        ...prev,
        [playerKey]: {
          ...prev[playerKey],
          obstaclesDestroyed: prev[playerKey].obstaclesDestroyed + 1,
          damageDealt: prev[playerKey].damageDealt + damageToObstacle,
          totalScore: prev[playerKey].totalScore + totalPoints,
          maxCombo: Math.max(prev[playerKey].maxCombo, newCombo),
        },
      }));

      // Explosion animation for explosive type
      if (obstacle.type === 'explosive') {
        explosionAnim.setValue(0);
        Animated.sequence([
          Animated.timing(explosionAnim, {
            toValue: 1,
            duration: 200,
            useNativeDriver: false,
          }),
          Animated.timing(explosionAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: false,
          }),
        ]).start();

        // Chain explosion - destroy nearby
        setObstacles((prev) =>
          prev.map((obs) => {
            if (obs.destroyed) return obs;
            if (Math.abs(obs.y - obstacle.y) < 80) {
              handleCrash(obs);
              return { ...obs, destroyed: true, hit: true };
            }
            return obs;
          })
        );
      }

      // Mark destroyed
      setObstacles((prev) =>
        prev.map((obs) =>
          obs.id === obstacle.id ? { ...obs, destroyed: true, hit: true } : obs
        )
      );
    } else {
      // Obstacle damaged but not destroyed
      setObstacles((prev) =>
        prev.map((obs) =>
          obs.id === obstacle.id ? { ...obs, hp: remainingHP, hit: true } : obs
        )
      );

      // Small points for damage
      const playerKey = currentPlayer === 1 ? 'player1' : 'player2';
      const dmgPoints = Math.round(damageToObstacle * 0.1);
      setScores((prev) => ({
        ...prev,
        [playerKey]: prev[playerKey] + dmgPoints,
      }));
    }

    // Damage to vehicle
    if (damageToVehicle > 0) {
      const newHP = Math.max(0, vehicleHP - damageToVehicle);
      setVehicleHP(newHP);

      // HP bar animation
      Animated.timing(hpBarAnim, {
        toValue: newHP / maxHP,
        duration: 300,
        useNativeDriver: false,
      }).start();

      const playerKey = currentPlayer === 1 ? 'player1' : 'player2';
      setGameStats((prev) => ({
        ...prev,
        [playerKey]: {
          ...prev[playerKey],
          damageTaken: prev[playerKey].damageTaken + damageToVehicle,
        },
      }));

      if (newHP <= 0) {
        handleVehicleDestroyed();
      }
    }
  };

  const handleVehicleDestroyed = () => {
    clearAllTimers();
    setGameActive(false);

    const playerKey = currentPlayer === 1 ? 'player1' : 'player2';

    Alert.alert(
      '💥 WRECKED!',
      `Your ${selectedVehicle.label} is destroyed!\n\nScore: ${scores[playerKey]}\nObjects Smashed: ${destroyedCount}\nMax Combo: x${maxCombo}`,
      [{ text: 'Continue', onPress: handleTurnEnd }]
    );
  };

  const collectPowerUp = (powerUp) => {
    const playerKey = currentPlayer === 1 ? 'player1' : 'player2';
    setCollectedPowerUps((prev) => [...prev, powerUp.type]);

    setGameStats((prev) => ({
      ...prev,
      [playerKey]: {
        ...prev[playerKey],
        powerUpsUsed: prev[playerKey].powerUpsUsed + 1,
      },
    }));

    switch (powerUp.type) {
      case 'nitro':
        setIsNitro(true);
        setTimeout(() => setIsNitro(false), 6000);
        break;
      case 'shield':
        setIsShielded(true);
        setTimeout(() => setIsShielded(false), 8000);
        break;
      case 'doublePoints':
        setIsDoublePoints(true);
        setTimeout(() => setIsDoublePoints(false), 10000);
        break;
      case 'repair':
        setVehicleHP((prev) => {
          const newHP = Math.min(maxHP, prev + 30);
          Animated.timing(hpBarAnim, {
            toValue: newHP / maxHP,
            duration: 300,
            useNativeDriver: false,
          }).start();
          return newHP;
        });
        break;
      case 'missile':
        // Destroy all visible obstacles
        setObstacles((prev) => {
          const playerKey2 = currentPlayer === 1 ? 'player1' : 'player2';
          let bonusPoints = 0;
          const updated = prev.map((obs) => {
            if (!obs.destroyed && obs.y > 0) {
              bonusPoints += Math.round(obs.points * 0.5);
              return { ...obs, destroyed: true };
            }
            return obs;
          });
          setScores((s) => ({ ...s, [playerKey2]: s[playerKey2] + bonusPoints }));
          return updated;
        });

        explosionAnim.setValue(0);
        Animated.sequence([
          Animated.timing(explosionAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: false,
          }),
          Animated.timing(explosionAnim, {
            toValue: 0,
            duration: 400,
            useNativeDriver: false,
          }),
        ]).start();
        break;
      case 'magnet':
        // Pull all power-ups to vehicle lane
        setRoadPowerUps((prev) =>
          prev.map((pu) => ({ ...pu, lane: currentLane }))
        );
        break;
    }

    Alert.alert(
      `${powerUp.emoji} ${powerUp.label}!`,
      POWERUP_TYPES.find((p) => p.id === powerUp.type)?.description || '',
      [{ text: 'Go!', onPress: () => {} }]
    );
  };

  // Lane controls
  const moveLane = (direction) => {
    if (!gameActive) return;
    setCurrentLane((prev) => {
      if (direction === 'left' && prev > 0) return prev - 1;
      if (direction === 'right' && prev < LANES - 1) return prev + 1;
      return prev;
    });
  };

  // Select vehicle
  const selectVehicle = (vehicle) => {
    setSelectedVehicle(vehicle);
    const hp = 80 + vehicle.armor * 20;
    setVehicleHP(hp);
    setMaxHP(hp);
    setVehicleSpeed(vehicle.speed);
    hpBarAnim.setValue(1);
  };

  // Start playing
  const startPlaying = () => {
    if (!selectedVehicle) {
      Alert.alert('⚠️ Select a Vehicle!', 'Choose your ride first!');
      return;
    }
    setGamePhase('playing');
    setGameActive(true);
    setGameTime(60);
    setCurrentLane(2);
    setObstacles([]);
    setRoadPowerUps([]);
    setDestroyedCount(0);
    setDistanceTraveled(0);
    setCombo(0);
    setMaxCombo(0);
    setCrashStreak(0);
    setCollectedPowerUps([]);
    setIsNitro(false);
    setIsShielded(false);
    setIsDoublePoints(false);
    setGameStarted(true);
  };

  const endTurn = () => {
    clearAllTimers();
    setGameActive(false);
    handleTurnEnd();
  };

  const handleTurnEnd = () => {
    const playerKey = currentPlayer === 1 ? 'player1' : 'player2';
    const stats = gameStats[playerKey];

    setGameStats((prev) => ({
      ...prev,
      [playerKey]: {
        ...prev[playerKey],
        distanceTraveled: prev[playerKey].distanceTraveled + distanceTraveled,
        maxCombo: Math.max(prev[playerKey].maxCombo, maxCombo),
      },
    }));

    if (currentPlayer === 1) {
      Alert.alert(
        '🏁 Turn Over!',
        `Player 1:\nScore: ${scores.player1}\nCrashed: ${destroyedCount}\nDistance: ${Math.round(distanceTraveled)}m\nMax Combo: x${maxCombo}`,
        [{ text: "Player 2's Turn!", onPress: switchPlayer }]
      );
    } else {
      handleEndRound();
    }
  };

  const switchPlayer = () => {
    setCurrentPlayer(2);
    setGamePhase('select');
    setSelectedVehicle(null);
    setVehicleHP(100);
    setObstacles([]);
    setRoadPowerUps([]);
    setDestroyedCount(0);
    setDistanceTraveled(0);
    setCombo(0);
    setMaxCombo(0);
    setCrashStreak(0);
    setCollectedPowerUps([]);
    setIsNitro(false);
    setIsShielded(false);
    setIsDoublePoints(false);
    setGameActive(false);
  };

  const handleEndRound = () => {
    setGameActive(false);
    setGamePhase('ended');

    let winner = '';
    if (scores.player1 > scores.player2) {
      winner = '🏆 Player 1 Wins!';
    } else if (scores.player2 > scores.player1) {
      winner = '🏆 Player 2 Wins!';
    } else {
      winner = "🤝 It's a Tie!";
    }

    if (round >= maxRounds) {
      handleGameOver();
    } else {
      Alert.alert(
        `🏁 Round ${round} Complete!`,
        `${winner}\n\nP1: ${scores.player1} | P2: ${scores.player2}`,
        [
          { text: '🔄 Next Round', onPress: nextRound },
          { text: '🚪 End Game', onPress: () => navigation.goBack() },
        ]
      );
    }
  };

  const handleGameOver = () => {
    const p1 = gameStats.player1;
    const p2 = gameStats.player2;

    let champion = '';
    if (scores.player1 > scores.player2) {
      champion = '🏆 Player 1 is the Champion!';
    } else if (scores.player2 > scores.player1) {
      champion = '🏆 Player 2 is the Champion!';
    } else {
      champion = "🤝 It's a Tie!";
    }

    Alert.alert(
      '🎮 Game Over!',
      `${champion}\n\nFinal: P1 ${scores.player1} | P2 ${scores.player2}\n\nDestroyed: P1 ${p1.obstaclesDestroyed} | P2 ${p2.obstaclesDestroyed}\nBest Combo: P1 x${p1.maxCombo} | P2 x${p2.maxCombo}\nDistance: P1 ${Math.round(p1.distanceTraveled)}m | P2 ${Math.round(p2.distanceTraveled)}m`,
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
    setSelectedVehicle(null);
    setGameActive(false);
    setGameStarted(false);
    setObstacles([]);
    setRoadPowerUps([]);
    setCollectedPowerUps([]);
  };

  const resetGame = () => {
    setScores({ player1: 0, player2: 0 });
    setRound(1);
    setCurrentPlayer(1);
    setGamePhase('select');
    setGameActive(false);
    setGameStarted(false);
    setSelectedVehicle(null);
    setVehicleHP(100);
    setObstacles([]);
    setRoadPowerUps([]);
    setDestroyedCount(0);
    setDistanceTraveled(0);
    setCombo(0);
    setMaxCombo(0);
    setCrashStreak(0);
    setCollectedPowerUps([]);
    setIsNitro(false);
    setIsShielded(false);
    setIsDoublePoints(false);
    setGameStats({
      player1: { obstaclesDestroyed: 0, distanceTraveled: 0, powerUpsUsed: 0, maxCombo: 0, damageDealt: 0, damageTaken: 0, totalScore: 0 },
      player2: { obstaclesDestroyed: 0, distanceTraveled: 0, powerUpsUsed: 0, maxCombo: 0, damageDealt: 0, damageTaken: 0, totalScore: 0 },
    });
  };

  const playerKey = currentPlayer === 1 ? 'player1' : 'player2';
  const currentGameStats = gameStats[playerKey];
  const hpPercent = maxHP > 0 ? Math.round((vehicleHP / maxHP) * 100) : 0;

  const getHPColor = () => {
    if (hpPercent > 60) return '#4ECDC4';
    if (hpPercent > 30) return '#FFD700';
    return '#FF6B6B';
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backBtn}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>💥 Crash It!</Text>
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
          <Text style={styles.distanceText}>📏 {Math.round(distanceTraveled)}m</Text>
        </View>
        <View style={styles.scoreTeam}>
          <Text style={styles.teamLabel}>{currentPlayer === 2 ? '►' : ''} P2</Text>
          <Text style={[styles.teamScore, { color: '#4ECDC4' }]}>{scores.player2}</Text>
        </View>
      </View>

      {/* Vehicle Selection Phase */}
      {gamePhase === 'select' && (
        <View style={styles.selectPhase}>
          <Text style={styles.selectTitle}>🎮 Player {currentPlayer} - Choose Vehicle:</Text>
          <View style={styles.vehicleGrid}>
            {VEHICLE_TYPES.map((v) => (
              <TouchableOpacity
                key={v.id}
                style={[
                  styles.vehicleCard,
                  {
                    borderColor: v.color,
                    backgroundColor: selectedVehicle?.id === v.id ? v.color + '33' : '#1B2A4A',
                  },
                  selectedVehicle?.id === v.id && styles.vehicleCardSelected,
                ]}
                onPress={() => selectVehicle(v)}
              >
                <Text style={styles.vehicleEmoji}>{v.emoji}</Text>
                <Text style={styles.vehicleName}>{v.label}</Text>
                <View style={styles.vehicleStats}>
                  <Text style={styles.vStat}>⚡{v.speed}</Text>
                  <Text style={styles.vStat}>🛡️{v.armor}</Text>
                  <Text style={styles.vStat}>⚖️{v.weight}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {selectedVehicle && (
            <View style={styles.selectedInfo}>
              <Text style={styles.selectedText}>
                Selected: {selectedVehicle.emoji} {selectedVehicle.label}
              </Text>
              <Text style={styles.selectedHPText}>HP: {maxHP}</Text>
              <TouchableOpacity style={styles.goBtn} onPress={startPlaying}>
                <Text style={styles.goBtnText}>🏁 START CRASHING!</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      {/* Playing Phase */}
      {gamePhase === 'playing' && (
        <>
          {/* Status Bar */}
          <View style={[styles.statusBar, isNitro && styles.statusBarNitro]}>
            <Text style={styles.vehicleInfo}>
              {selectedVehicle?.emoji} {selectedVehicle?.label}
            </Text>
            {combo > 1 && (
              <Animated.Text
                style={[styles.comboText, { transform: [{ scale: comboAnim }] }]}
              >
                🔥 x{combo}!
              </Animated.Text>
            )}
            <View style={styles.activeEffects}>
              {isNitro && <Text style={styles.effectIcon}>🚀</Text>}
              {isShielded && <Text style={styles.effectIcon}>🛡️</Text>}
              {isDoublePoints && <Text style={styles.effectIcon}>✖️2️⃣</Text>}
            </View>
          </View>

          {/* HP Bar */}
          <View style={styles.hpContainer}>
            <Text style={styles.hpLabel}>HP: {Math.round(vehicleHP)}/{maxHP}</Text>
            <View style={styles.hpBar}>
              <Animated.View
                style={[
                  styles.hpFill,
                  {
                    width: hpBarAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0%', '100%'],
                    }),
                    backgroundColor: getHPColor(),
                  },
                ]}
              />
            </View>
          </View>

          {/* Road Arena */}
          <Animated.View
            style={[
              styles.road,
              { transform: [{ translateX: vehicleShakeAnim }] },
            ]}
          >
            {/* Lane markers */}
            {[...Array(LANES + 1)].map((_, i) => (
              <View
                key={`lane-${i}`}
                style={[
                  styles.laneMarker,
                  { left: 20 + i * LANE_WIDTH },
                ]}
              />
            ))}

            {/* Lane numbers */}
            {[...Array(LANES)].map((_, i) => (
              <View
                key={`label-${i}`}
                style={[
                  styles.laneLabel,
                  { left: 20 + i * LANE_WIDTH + LANE_WIDTH / 2 - 10 },
                ]}
              >
                <Text style={styles.laneLabelText}>{i + 1}</Text>
              </View>
            ))}

            {/* Obstacles */}
            {obstacles.map((obs) =>
              !obs.destroyed ? (
                <View
                  key={obs.id}
                  style={[
                    styles.obstacle,
                    {
                      left: 20 + obs.lane * LANE_WIDTH + LANE_WIDTH / 2 - 22,
                      top: obs.y,
                      borderColor: obs.hit ? '#FF6B6B' : obs.color,
                      backgroundColor: obs.hit ? '#FF6B6B22' : obs.color + '22',
                    },
                  ]}
                >
                  <Text style={styles.obstacleEmoji}>{obs.emoji}</Text>
                  {obs.hit && (
                    <View style={styles.obstacleHPBar}>
                      <View
                        style={[
                          styles.obstacleHPFill,
                          { width: `${(obs.hp / obs.maxHP) * 100}%` },
                        ]}
                      />
                    </View>
                  )}
                </View>
              ) : (
                <View
                  key={obs.id}
                  style={[
                    styles.destroyedObstacle,
                    {
                      left: 20 + obs.lane * LANE_WIDTH + LANE_WIDTH / 2 - 22,
                      top: obs.y,
                    },
                  ]}
                >
                  <Text style={styles.destroyedEmoji}>💥</Text>
                </View>
              )
            )}

            {/* Road Power-ups */}
            {roadPowerUps.map((pu) => (
              <View
                key={pu.id}
                style={[
                  styles.roadPowerUp,
                  {
                    left: 20 + pu.lane * LANE_WIDTH + LANE_WIDTH / 2 - 15,
                    top: pu.y,
                  },
                ]}
              >
                <Text style={styles.roadPUEmoji}>{pu.emoji}</Text>
              </View>
            ))}

            {/* Vehicle */}
            <Animated.View
              style={[
                styles.vehicle,
                {
                  left: 20 + currentLane * LANE_WIDTH + LANE_WIDTH / 2 - 22,
                  bottom: 30,
                },
                isNitro && {
                  shadowColor: '#FF4500',
                  shadowRadius: nitroGlowAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [4, 16],
                  }),
                },
              ]}
            >
              <Text style={styles.vehicleBigEmoji}>{selectedVehicle?.emoji}</Text>
              {isShielded && (
                <View style={styles.shieldOverlay}>
                  <Text style={styles.shieldEmoji}>🛡️</Text>
                </View>
              )}
            </Animated.View>

            {/* Crash flash */}
            <Animated.View
              style={[
                styles.crashFlash,
                { opacity: crashFlashAnim },
              ]}
            />

            {/* Explosion effect */}
            <Animated.View
              style={[
                styles.explosionOverlay,
                {
                  opacity: explosionAnim,
                  transform: [
                    {
                      scale: explosionAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.5, 2],
                      }),
                    },
                  ],
                },
              ]}
            >
              <Text style={styles.explosionEmoji}>💥🔥💥</Text>
            </Animated.View>

            {/* Nitro speed lines */}
            {isNitro && (
              <Animated.View
                style={[
                  styles.speedLines,
                  { opacity: speedLinesAnim },
                ]}
              >
                <Text style={styles.speedLineText}>⚡⚡⚡</Text>
              </Animated.View>
            )}
          </Animated.View>

          {/* Controls */}
          <View style={styles.controls}>
            <TouchableOpacity
              style={styles.laneBtn}
              onPress={() => moveLane('left')}
              disabled={currentLane <= 0}
            >
              <Text style={styles.laneBtnText}>◄ LEFT</Text>
            </TouchableOpacity>

            <View style={styles.centerInfo}>
              <Text style={styles.laneInfo}>Lane {currentLane + 1}</Text>
              <Text style={styles.destroyedInfo}>💥 {destroyedCount}</Text>
            </View>

            <TouchableOpacity
              style={styles.laneBtn}
              onPress={() => moveLane('right')}
              disabled={currentLane >= LANES - 1}
            >
              <Text style={styles.laneBtnText}>RIGHT ►</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Destroyed</Text>
          <Text style={styles.statValue}>{currentGameStats.obstaclesDestroyed}</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Combo</Text>
          <Text style={[styles.statValue, { color: '#FFD700' }]}>x{maxCombo}</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Power-Ups</Text>
          <Text style={[styles.statValue, { color: '#9B59B6' }]}>{currentGameStats.powerUpsUsed}</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Damage</Text>
          <Text style={[styles.statValue, { color: '#FF6B6B' }]}>{Math.round(currentGameStats.damageDealt)}</Text>
        </View>
      </View>

      {/* Game Over Buttons */}
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
  backBtn: { fontSize: 16, color: '#FFF', fontWeight: 'bold' },
  title: { fontSize: 20, fontWeight: 'bold', color: '#FFF' },
  roundInfo: { fontSize: 13, color: '#FFD700', fontWeight: 'bold' },

  scoreboard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg || 20,
    paddingVertical: 6,
    backgroundColor: '#16213E',
    borderBottomWidth: 2,
    borderBottomColor: '#E94560',
  },
  scoreTeam: { alignItems: 'center', width: 70 },
  teamLabel: { fontSize: 11, color: '#AAA', fontWeight: 'bold' },
  teamScore: { fontSize: 26, fontWeight: 'bold' },
  gameInfoCenter: { alignItems: 'center' },
  timerText: { fontSize: 18, fontWeight: 'bold' },
  distanceText: { fontSize: 11, color: '#AAA' },

  selectPhase: {
    flex: 1,
    paddingHorizontal: SPACING.lg || 20,
    paddingTop: SPACING.md || 12,
  },
  selectTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
    textAlign: 'center',
    marginBottom: 12,
  },
  vehicleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  vehicleCard: {
    width: (width - 70) / 3,
    paddingVertical: 10,
    borderRadius: BORDER_RADIUS.md || 10,
    borderWidth: 2,
    alignItems: 'center',
  },
  vehicleCardSelected: { borderWidth: 3 },
  vehicleEmoji: { fontSize: 28 },
  vehicleName: { fontSize: 11, fontWeight: 'bold', color: '#FFF', marginTop: 4 },
  vehicleStats: { flexDirection: 'row', gap: 4, marginTop: 4 },
  vStat: { fontSize: 9, color: '#AAA' },

  selectedInfo: {
    marginTop: 16,
    alignItems: 'center',
    gap: 8,
  },
  selectedText: { fontSize: 15, fontWeight: 'bold', color: '#FFD700' },
  selectedHPText: { fontSize: 13, color: '#4ECDC4' },
  goBtn: {
    backgroundColor: '#E94560',
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: BORDER_RADIUS.md || 10,
    marginTop: 8,
  },
  goBtnText: { fontSize: 18, fontWeight: 'bold', color: '#FFF' },

  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg || 20,
    paddingVertical: 4,
    backgroundColor: '#0F3460',
  },
  statusBarNitro: { backgroundColor: '#8B0000' },
  vehicleInfo: { fontSize: 13, fontWeight: 'bold', color: '#FFF' },
  comboText: { fontSize: 14, fontWeight: 'bold', color: '#FFD700' },
  activeEffects: { flexDirection: 'row', gap: 4 },
  effectIcon: { fontSize: 16 },

  hpContainer: {
    paddingHorizontal: SPACING.lg || 20,
    paddingVertical: 4,
    backgroundColor: '#16213E',
  },
  hpLabel: { fontSize: 11, color: '#AAA', marginBottom: 2 },
  hpBar: {
    height: 12,
    backgroundColor: '#333',
    borderRadius: 6,
    overflow: 'hidden',
  },
  hpFill: { height: '100%', borderRadius: 6 },

  road: {
    flex: 1,
    backgroundColor: '#2C2C2C',
    marginHorizontal: 10,
    marginVertical: 4,
    borderRadius: BORDER_RADIUS.md || 10,
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#444',
  },
  laneMarker: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: '#FFFFFF22',
    borderStyle: 'dashed',
  },
  laneLabel: {
    position: 'absolute',
    top: 4,
    width: 20,
    alignItems: 'center',
  },
  laneLabelText: { fontSize: 10, color: '#555' },

  obstacle: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: 8,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 5,
  },
  obstacleEmoji: { fontSize: 24 },
  obstacleHPBar: {
    position: 'absolute',
    bottom: -6,
    width: 36,
    height: 4,
    backgroundColor: '#333',
    borderRadius: 2,
    overflow: 'hidden',
  },
  obstacleHPFill: {
    height: '100%',
    backgroundColor: '#FF6B6B',
    borderRadius: 2,
  },

  destroyedObstacle: {
    position: 'absolute',
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 5,
  },
  destroyedEmoji: { fontSize: 28 },

  roadPowerUp: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#9B59B633',
    borderWidth: 2,
    borderColor: '#9B59B6',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 8,
  },
  roadPUEmoji: { fontSize: 16 },

  vehicle: {
    position: 'absolute',
    width: 44,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  vehicleBigEmoji: { fontSize: 36 },
  shieldOverlay: {
    position: 'absolute',
    top: -5,
    right: -5,
  },
  shieldEmoji: { fontSize: 18 },

  crashFlash: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#FF000033',
    zIndex: 20,
  },

  explosionOverlay: {
    position: 'absolute',
    top: '40%',
    left: '30%',
    zIndex: 25,
  },
  explosionEmoji: { fontSize: 40 },

  speedLines: {
    position: 'absolute',
    bottom: 80,
    left: '35%',
    zIndex: 15,
  },
  speedLineText: { fontSize: 20, color: '#FFD700' },

  controls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg || 20,
    paddingVertical: 8,
    backgroundColor: '#16213E',
  },
  laneBtn: {
    width: 100,
    height: 50,
    backgroundColor: '#2A3A5C',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#4A5A7C',
  },
  laneBtnText: { fontSize: 14, fontWeight: 'bold', color: '#FFF' },
  centerInfo: { alignItems: 'center' },
  laneInfo: { fontSize: 13, color: '#AAA', fontWeight: 'bold' },
  destroyedInfo: { fontSize: 16, fontWeight: 'bold', color: '#FFD700' },

  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 6,
    paddingHorizontal: SPACING.md || 10,
    backgroundColor: '#1A1A2E',
  },
  statBox: { alignItems: 'center' },
  statLabel: { fontSize: 9, color: '#888', marginBottom: 2 },
  statValue: { fontSize: 15, fontWeight: 'bold', color: '#4ECDC4' },

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
  nextBtnText: { fontSize: 16, fontWeight: 'bold', color: '#FFF' },
  exitBtn: {
    backgroundColor: '#533483',
    paddingVertical: 12,
    borderRadius: BORDER_RADIUS.md || 10,
    alignItems: 'center',
  },
  exitBtnText: { fontSize: 16, fontWeight: 'bold', color: '#FFF' },
});