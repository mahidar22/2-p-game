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
import { COLORS, SPACING, BORDER_RADIUS } from '../../styles/theme';

const { width, height } = Dimensions.get('window');

const LANES = 5;
const LANE_WIDTH = (width - 40) / LANES;

const ANIMAL_TYPES = [
  { id: 'bull', emoji: '🐂', label: 'Bull', speed: 4, points: 15, hp: 30, size: 'large', color: '#8B4513' },
  { id: 'horse', emoji: '🐎', label: 'Horse', speed: 5, points: 20, hp: 20, size: 'large', color: '#D2691E' },
  { id: 'buffalo', emoji: '🦬', label: 'Buffalo', speed: 3, points: 25, hp: 50, size: 'large', color: '#5C4033' },
  { id: 'rhino', emoji: '🦏', label: 'Rhino', speed: 2.5, points: 40, hp: 80, size: 'large', color: '#808080' },
  { id: 'elephant', emoji: '🐘', label: 'Elephant', speed: 2, points: 50, hp: 100, size: 'huge', color: '#A9A9A9' },
  { id: 'sheep', emoji: '🐑', label: 'Sheep', speed: 6, points: 5, hp: 10, size: 'small', color: '#F5F5DC' },
  { id: 'goat', emoji: '🐐', label: 'Goat', speed: 5.5, points: 8, hp: 15, size: 'small', color: '#D2B48C' },
  { id: 'boar', emoji: '🐗', label: 'Boar', speed: 4.5, points: 18, hp: 25, size: 'medium', color: '#654321' },
  { id: 'deer', emoji: '🦌', label: 'Deer', speed: 7, points: 12, hp: 12, size: 'medium', color: '#CD853F' },
  { id: 'mammoth', emoji: '🦣', label: 'Mammoth', speed: 1.5, points: 75, hp: 150, size: 'huge', color: '#8B7355' },
];

const LASSO_TYPES = [
  { id: 'basic', emoji: '🪢', label: 'Basic Lasso', power: 20, range: 1, cooldown: 1000, cost: 0 },
  { id: 'strong', emoji: '⛓️', label: 'Strong Lasso', power: 40, range: 1, cooldown: 1500, cost: 15 },
  { id: 'wide', emoji: '🕸️', label: 'Wide Net', power: 15, range: 3, cooldown: 2000, cost: 20 },
  { id: 'electric', emoji: '⚡', label: 'Electric Lasso', power: 60, range: 1, cooldown: 2500, cost: 30 },
  { id: 'trap', emoji: '🪤', label: 'Trap', power: 35, range: 1, cooldown: 3000, cost: 25 },
];

const POWERUP_TYPES = [
  { id: 'speed', emoji: '👢', label: 'Speed Boots', duration: 8000 },
  { id: 'strength', emoji: '💪', label: 'Strength', duration: 10000 },
  { id: 'freeze', emoji: '❄️', label: 'Freeze All', duration: 5000 },
  { id: 'magnet', emoji: '🧲', label: 'Animal Magnet', duration: 6000 },
  { id: 'shield', emoji: '🛡️', label: 'Shield', duration: 8000 },
  { id: 'double', emoji: '✖️2️⃣', label: 'Double Points', duration: 12000 },
];

const COWBOY_SKINS = [
  { id: 'cowboy', emoji: '🤠', label: 'Cowboy' },
  { id: 'cowgirl', emoji: '👩‍🌾', label: 'Cowgirl' },
  { id: 'sheriff', emoji: '⭐', label: 'Sheriff' },
  { id: 'ranger', emoji: '🏇', label: 'Ranger' },
  { id: 'hunter', emoji: '🎯', label: 'Hunter' },
  { id: 'farmer', emoji: '👨‍🌾', label: 'Farmer' },
];

export default function StampedeGame({ navigation }) {
  const [scores, setScores] = useState({ player1: 0, player2: 0 });
  const [round, setRound] = useState(1);
  const [maxRounds] = useState(3);
  const [gameActive, setGameActive] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [currentPlayer, setCurrentPlayer] = useState(1);
  const [gamePhase, setGamePhase] = useState('select');
  const [gameTime, setGameTime] = useState(60);

  // Player
  const [selectedSkin, setSelectedSkin] = useState(null);
  const [playerLane, setPlayerLane] = useState(2);
  const [playerEnergy, setPlayerEnergy] = useState(100);
  const [selectedLasso, setSelectedLasso] = useState(LASSO_TYPES[0]);
  const [lassoCooldown, setLassoCooldown] = useState(false);
  const [coins, setCoins] = useState(0);

  // Active effects
  const [isSpeedBoost, setIsSpeedBoost] = useState(false);
  const [isStrength, setIsStrength] = useState(false);
  const [isFreezeAll, setIsFreezeAll] = useState(false);
  const [isMagnet, setIsMagnet] = useState(false);
  const [isShielded, setIsShielded] = useState(false);
  const [isDoublePoints, setIsDoublePoints] = useState(false);

  // Animals
  const [animals, setAnimals] = useState([]);
  const [capturedAnimals, setCapturedAnimals] = useState([]);

  // Collectibles on ground
  const [groundItems, setGroundItems] = useState([]);

  // Combo
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [lastCaptureTime, setLastCaptureTime] = useState(null);

  // Danger
  const [stampedeWarning, setStampedeWarning] = useState(false);
  const [dangerLevel, setDangerLevel] = useState(0);
  const [playerHit, setPlayerHit] = useState(false);
  const [health, setHealth] = useState(100);

  // Stats
  const [gameStats, setGameStats] = useState({
    player1: {
      animalsCaptured: 0,
      totalPoints: 0,
      maxCombo: 0,
      lassosThrown: 0,
      powerUpsUsed: 0,
      damagesTaken: 0,
      coinsEarned: 0,
      rareCaptures: 0,
    },
    player2: {
      animalsCaptured: 0,
      totalPoints: 0,
      maxCombo: 0,
      lassosThrown: 0,
      powerUpsUsed: 0,
      damagesTaken: 0,
      coinsEarned: 0,
      rareCaptures: 0,
    },
  });

  // Refs for game loop
  const animalsRef = useRef([]);
  const playerLaneRef = useRef(2);
  const isFreezeRef = useRef(false);
  const isMagnetRef = useRef(false);
  const isShieldedRef = useRef(false);
  const healthRef = useRef(100);
  const gameActiveRef = useRef(false);
  const comboRef = useRef(0);
  const lastCaptureRef = useRef(null);

  // Sync refs
  useEffect(() => { animalsRef.current = animals; }, [animals]);
  useEffect(() => { playerLaneRef.current = playerLane; }, [playerLane]);
  useEffect(() => { isFreezeRef.current = isFreezeAll; }, [isFreezeAll]);
  useEffect(() => { isMagnetRef.current = isMagnet; }, [isMagnet]);
  useEffect(() => { isShieldedRef.current = isShielded; }, [isShielded]);
  useEffect(() => { healthRef.current = health; }, [health]);
  useEffect(() => { gameActiveRef.current = gameActive; }, [gameActive]);
  useEffect(() => { comboRef.current = combo; }, [combo]);
  useEffect(() => { lastCaptureRef.current = lastCaptureTime; }, [lastCaptureTime]);

  // Animations
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const lassoAnim = useRef(new Animated.Value(0)).current;
  const comboAnim = useRef(new Animated.Value(1)).current;
  const warningAnim = useRef(new Animated.Value(0)).current;
  const captureFlashAnim = useRef(new Animated.Value(0)).current;
  const dangerPulseAnim = useRef(new Animated.Value(1)).current;
  const dustAnim = useRef(new Animated.Value(0)).current;

  const gameLoopRef = useRef(null);
  const timerRef = useRef(null);
  const spawnRef = useRef(null);
  const itemSpawnRef = useRef(null);
  const energyRef = useRef(null);
  const dangerRef = useRef(null);

  useEffect(() => {
    return () => clearAllTimers();
  }, []);

  const clearAllTimers = () => {
    if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    if (timerRef.current) clearInterval(timerRef.current);
    if (spawnRef.current) clearInterval(spawnRef.current);
    if (itemSpawnRef.current) clearInterval(itemSpawnRef.current);
    if (energyRef.current) clearInterval(energyRef.current);
    if (dangerRef.current) clearInterval(dangerRef.current);
  };

  // Combo reset
  useEffect(() => {
    if (!lastCaptureTime) return;
    const timer = setTimeout(() => setCombo(0), 3000);
    return () => clearTimeout(timer);
  }, [lastCaptureTime]);

  // Warning animation
  useEffect(() => {
    if (stampedeWarning) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(warningAnim, { toValue: 1, duration: 300, useNativeDriver: false }),
          Animated.timing(warningAnim, { toValue: 0, duration: 300, useNativeDriver: false }),
        ])
      );
      loop.start();
      return () => loop.stop();
    }
  }, [stampedeWarning]);

  // Danger pulse
  useEffect(() => {
    if (dangerLevel > 50) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(dangerPulseAnim, { toValue: 1.1, duration: 500, useNativeDriver: false }),
          Animated.timing(dangerPulseAnim, { toValue: 1, duration: 500, useNativeDriver: false }),
        ])
      );
      loop.start();
      return () => loop.stop();
    }
  }, [dangerLevel]);

  // Dust effect loop
  useEffect(() => {
    if (!gameActive) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(dustAnim, { toValue: 1, duration: 2000, useNativeDriver: false }),
        Animated.timing(dustAnim, { toValue: 0, duration: 2000, useNativeDriver: false }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [gameActive]);

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

  // Energy regen
  useEffect(() => {
    if (!gameActive) return;
    energyRef.current = setInterval(() => {
      setPlayerEnergy((prev) => Math.min(100, prev + 3));
    }, 500);
    return () => { if (energyRef.current) clearInterval(energyRef.current); };
  }, [gameActive]);

  // Danger level increase
  useEffect(() => {
    if (!gameActive) return;
    dangerRef.current = setInterval(() => {
      setDangerLevel((prev) => {
        const newLevel = Math.min(100, prev + 1 + round);
        if (newLevel >= 70 && !stampedeWarning) {
          setStampedeWarning(true);
        }
        if (newLevel >= 90) {
          triggerStampede();
          setStampedeWarning(false);
          return 30;
        }
        return newLevel;
      });
    }, 2000);
    return () => { if (dangerRef.current) clearInterval(dangerRef.current); };
  }, [gameActive, round, stampedeWarning]);

  // Animal spawning
  useEffect(() => {
    if (!gameActive) return;
    const rate = Math.max(500, 1500 - round * 200);

    spawnRef.current = setInterval(() => {
      const lane = Math.floor(Math.random() * LANES);
      const rand = Math.random();
      let animalType;

      if (rand < 0.03) animalType = ANIMAL_TYPES[9]; // mammoth
      else if (rand < 0.08) animalType = ANIMAL_TYPES[4]; // elephant
      else if (rand < 0.15) animalType = ANIMAL_TYPES[3]; // rhino
      else if (rand < 0.25) animalType = ANIMAL_TYPES[2]; // buffalo
      else if (rand < 0.35) animalType = ANIMAL_TYPES[7]; // boar
      else if (rand < 0.45) animalType = ANIMAL_TYPES[1]; // horse
      else if (rand < 0.55) animalType = ANIMAL_TYPES[0]; // bull
      else if (rand < 0.65) animalType = ANIMAL_TYPES[8]; // deer
      else if (rand < 0.80) animalType = ANIMAL_TYPES[6]; // goat
      else animalType = ANIMAL_TYPES[5]; // sheep

      const newAnimal = {
        id: Date.now() + Math.random(),
        lane,
        y: -50,
        type: animalType.id,
        emoji: animalType.emoji,
        label: animalType.label,
        speed: animalType.speed * (0.8 + Math.random() * 0.4),
        points: animalType.points,
        hp: animalType.hp,
        maxHP: animalType.hp,
        size: animalType.size,
        color: animalType.color,
        captured: false,
        lassoed: false,
        stunned: false,
      };

      setAnimals((prev) => [...prev.slice(-20), newAnimal]);
    }, rate);

    return () => { if (spawnRef.current) clearInterval(spawnRef.current); };
  }, [gameActive, round]);

  // Ground items spawning
  useEffect(() => {
    if (!gameActive) return;
    itemSpawnRef.current = setInterval(() => {
      if (Math.random() < 0.4) {
        const lane = Math.floor(Math.random() * LANES);
        const rand = Math.random();
        let item;

        if (rand < 0.3) {
          item = { type: 'coin', emoji: '🪙', points: 0, coins: 10, label: 'Coin' };
        } else if (rand < 0.5) {
          item = { type: 'gem', emoji: '💎', points: 30, coins: 0, label: 'Gem' };
        } else if (rand < 0.65) {
          item = { type: 'heart', emoji: '❤️', points: 0, coins: 0, heal: 20, label: 'Heart' };
        } else {
          const puType = POWERUP_TYPES[Math.floor(Math.random() * POWERUP_TYPES.length)];
          item = { type: 'powerup', emoji: puType.emoji, powerupId: puType.id, label: puType.label, duration: puType.duration, points: 0, coins: 0 };
        }

        setGroundItems((prev) => [
          ...prev.slice(-10),
          { ...item, id: Date.now() + Math.random(), lane, y: -40, collected: false },
        ]);
      }
    }, 3000);
    return () => { if (itemSpawnRef.current) clearInterval(itemSpawnRef.current); };
  }, [gameActive]);

  // Main game loop
  useEffect(() => {
    if (!gameActive) return;

    gameLoopRef.current = setInterval(() => {
      const frozen = isFreezeRef.current;
      const magnetActive = isMagnetRef.current;
      const shielded = isShieldedRef.current;
      const pLane = playerLaneRef.current;
      const currentHealth = healthRef.current;

      if (currentHealth <= 0) return;

      // Move animals
      setAnimals((prev) => {
        const updated = prev
          .map((animal) => {
            if (animal.captured) return animal;

            const moveSpeed = frozen && !animal.stunned ? 0 : animal.stunned ? animal.speed * 0.3 : animal.speed;

            let newLane = animal.lane;
            if (magnetActive && !animal.captured && !animal.stunned) {
              if (animal.lane < pLane) newLane = Math.min(animal.lane + 0.1, pLane);
              else if (animal.lane > pLane) newLane = Math.max(animal.lane - 0.1, pLane);
            }

            return {
              ...animal,
              y: animal.y + moveSpeed,
              lane: newLane,
            };
          })
          .filter((animal) => {
            if (animal.y > height * 0.6 && !animal.captured) {
              // Animal escaped - damage if in player lane
              if (Math.round(animal.lane) === pLane && !shielded) {
                const dmg = animal.size === 'huge' ? 20 : animal.size === 'large' ? 12 : animal.size === 'medium' ? 8 : 5;
                setHealth((prev) => {
                  const newHP = Math.max(0, prev - dmg);
                  healthRef.current = newHP;
                  if (newHP <= 0) {
                    handlePlayerDown();
                  }
                  return newHP;
                });
                setPlayerHit(true);
                setTimeout(() => setPlayerHit(false), 500);

                Animated.sequence([
                  Animated.timing(shakeAnim, { toValue: 12, duration: 50, useNativeDriver: false }),
                  Animated.timing(shakeAnim, { toValue: -12, duration: 50, useNativeDriver: false }),
                  Animated.timing(shakeAnim, { toValue: 6, duration: 50, useNativeDriver: false }),
                  Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: false }),
                ]).start();

                const playerKey = currentPlayer === 1 ? 'player1' : 'player2';
                setGameStats((p) => ({
                  ...p,
                  [playerKey]: { ...p[playerKey], damagesTaken: p[playerKey].damagesTaken + 1 },
                }));
              }
              return false;
            }
            return true;
          });

        return updated;
      });

      // Move ground items
      setGroundItems((prev) => {
        const updated = prev
          .map((item) => ({ ...item, y: item.y + 2.5 }))
          .filter((item) => {
            if (item.collected) return false;

            // Check collection
            if (
              Math.round(item.lane) === pLane &&
              item.y + 20 >= height * 0.42 &&
              item.y <= height * 0.42 + 40
            ) {
              collectGroundItem(item);
              return false;
            }

            return item.y < height * 0.65;
          });
        return updated;
      });
    }, 30);

    return () => { if (gameLoopRef.current) clearInterval(gameLoopRef.current); };
  }, [gameActive, currentPlayer]);

  const triggerStampede = useCallback(() => {
    // Spawn a wave of animals
    const wave = [];
    for (let i = 0; i < LANES; i++) {
      const animalType = ANIMAL_TYPES[Math.floor(Math.random() * 5)]; // bigger animals
      wave.push({
        id: Date.now() + Math.random() + i,
        lane: i,
        y: -60 - i * 20,
        type: animalType.id,
        emoji: animalType.emoji,
        label: animalType.label,
        speed: animalType.speed * 1.5,
        points: animalType.points * 2,
        hp: animalType.hp,
        maxHP: animalType.hp,
        size: animalType.size,
        color: animalType.color,
        captured: false,
        lassoed: false,
        stunned: false,
      });
    }
    setAnimals((prev) => [...prev, ...wave]);

    Alert.alert('🌪️ STAMPEDE!', 'A wave of animals is charging!', [
      { text: 'Brace!', onPress: () => {} },
    ]);
  }, []);

  const handlePlayerDown = useCallback(() => {
    clearAllTimers();
    setGameActive(false);
    gameActiveRef.current = false;

    const playerKey = currentPlayer === 1 ? 'player1' : 'player2';
    Alert.alert(
      '💀 Trampled!',
      `You were knocked down!\nScore: ${scores[playerKey]}\nAnimals Captured: ${capturedAnimals.length}`,
      [{ text: 'Continue', onPress: handleTurnEnd }]
    );
  }, [currentPlayer, scores, capturedAnimals]);

  // Throw lasso
  const throwLasso = useCallback(() => {
    if (!gameActive || lassoCooldown) return;

    const energyCost = 10 + selectedLasso.cost * 0.3;
    if (playerEnergy < energyCost) {
      Alert.alert('⚠️ Low Energy!', 'Wait for energy to recharge!');
      return;
    }

    setPlayerEnergy((prev) => Math.max(0, prev - energyCost));
    setLassoCooldown(true);

    const playerKey = currentPlayer === 1 ? 'player1' : 'player2';
    setGameStats((prev) => ({
      ...prev,
      [playerKey]: { ...prev[playerKey], lassosThrown: prev[playerKey].lassosThrown + 1 },
    }));

    // Lasso animation
    lassoAnim.setValue(0);
    Animated.sequence([
      Animated.timing(lassoAnim, { toValue: 1, duration: 300, useNativeDriver: false }),
      Animated.timing(lassoAnim, { toValue: 0, duration: 200, useNativeDriver: false }),
    ]).start();

    // Check for animals in range
    const lasso = selectedLasso;
    const range = lasso.range;
    const power = lasso.power * (isStrength ? 2 : 1);
    const pLane = playerLane;

    const targetLanes = [];
    for (let l = Math.max(0, pLane - Math.floor(range / 2)); l <= Math.min(LANES - 1, pLane + Math.floor(range / 2)); l++) {
      targetLanes.push(l);
    }

    let hitAny = false;

    setAnimals((prev) => {
      const updated = prev.map((animal) => {
        if (animal.captured || animal.y < 0) return animal;

        const animalLane = Math.round(animal.lane);
        const inLane = targetLanes.includes(animalLane);
        const inRange = animal.y > height * 0.25 && animal.y < height * 0.55;

        if (inLane && inRange) {
          hitAny = true;
          const newHP = animal.hp - power;

          if (newHP <= 0) {
            // Captured!
            handleCapture(animal);
            return { ...animal, captured: true };
          } else {
            // Damaged/stunned
            return { ...animal, hp: newHP, stunned: true, lassoed: true };
          }
        }
        return animal;
      });
      return updated;
    });

    if (!hitAny) {
      setCombo(0);
    }

    setTimeout(() => {
      setLassoCooldown(false);
    }, selectedLasso.cooldown);
  }, [gameActive, lassoCooldown, playerEnergy, selectedLasso, playerLane, isStrength, currentPlayer]);

  const handleCapture = useCallback((animal) => {
    const now = Date.now();
    const newCombo = lastCaptureRef.current && now - lastCaptureRef.current < 3000 ? comboRef.current + 1 : 1;
    setCombo(newCombo);
    comboRef.current = newCombo;
    if (newCombo > maxCombo) setMaxCombo(newCombo);
    setLastCaptureTime(now);
    lastCaptureRef.current = now;

    const comboBonus = (newCombo - 1) * 5;
    const multiplier = isDoublePoints ? 2 : 1;
    const totalPoints = (animal.points + comboBonus) * multiplier;
    const coinReward = Math.round(animal.points * 0.5);

    const playerKey = currentPlayer === 1 ? 'player1' : 'player2';
    setScores((prev) => ({
      ...prev,
      [playerKey]: prev[playerKey] + totalPoints,
    }));

    setCoins((prev) => prev + coinReward);
    setCapturedAnimals((prev) => [...prev, { ...animal, pointsEarned: totalPoints }]);

    const isRare = ['elephant', 'mammoth', 'rhino'].includes(animal.type);

    setGameStats((prev) => ({
      ...prev,
      [playerKey]: {
        ...prev[playerKey],
        animalsCaptured: prev[playerKey].animalsCaptured + 1,
        totalPoints: prev[playerKey].totalPoints + totalPoints,
        maxCombo: Math.max(prev[playerKey].maxCombo, newCombo),
        coinsEarned: prev[playerKey].coinsEarned + coinReward,
        rareCaptures: prev[playerKey].rareCaptures + (isRare ? 1 : 0),
      },
    }));

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

    // Capture flash
    captureFlashAnim.setValue(1);
    Animated.timing(captureFlashAnim, {
      toValue: 0,
      duration: 400,
      useNativeDriver: false,
    }).start();

    // Reduce danger
    setDangerLevel((prev) => Math.max(0, prev - 5));
  }, [isDoublePoints, currentPlayer, maxCombo]);

  const collectGroundItem = useCallback((item) => {
    const playerKey = currentPlayer === 1 ? 'player1' : 'player2';

    if (item.type === 'coin') {
      setCoins((prev) => prev + item.coins);
      setGameStats((prev) => ({
        ...prev,
        [playerKey]: { ...prev[playerKey], coinsEarned: prev[playerKey].coinsEarned + item.coins },
      }));
    } else if (item.type === 'gem') {
      setScores((prev) => ({
        ...prev,
        [playerKey]: prev[playerKey] + item.points,
      }));
    } else if (item.type === 'heart') {
      setHealth((prev) => {
        const newHP = Math.min(100, prev + item.heal);
        healthRef.current = newHP;
        return newHP;
      });
    } else if (item.type === 'powerup') {
      activatePowerUp(item.powerupId, item.duration);
      setGameStats((prev) => ({
        ...prev,
        [playerKey]: { ...prev[playerKey], powerUpsUsed: prev[playerKey].powerUpsUsed + 1 },
      }));
    }
  }, [currentPlayer]);

  const activatePowerUp = useCallback((id, duration) => {
    switch (id) {
      case 'speed':
        setIsSpeedBoost(true);
        setTimeout(() => setIsSpeedBoost(false), duration);
        break;
      case 'strength':
        setIsStrength(true);
        setTimeout(() => setIsStrength(false), duration);
        break;
      case 'freeze':
        setIsFreezeAll(true);
        isFreezeRef.current = true;
        setTimeout(() => {
          setIsFreezeAll(false);
          isFreezeRef.current = false;
        }, duration);
        break;
      case 'magnet':
        setIsMagnet(true);
        isMagnetRef.current = true;
        setTimeout(() => {
          setIsMagnet(false);
          isMagnetRef.current = false;
        }, duration);
        break;
      case 'shield':
        setIsShielded(true);
        isShieldedRef.current = true;
        setTimeout(() => {
          setIsShielded(false);
          isShieldedRef.current = false;
        }, duration);
        break;
      case 'double':
        setIsDoublePoints(true);
        setTimeout(() => setIsDoublePoints(false), duration);
        break;
    }
  }, []);

  const buyLasso = useCallback((lasso) => {
    if (coins < lasso.cost) {
      Alert.alert('⚠️ Not Enough Coins!', `Need ${lasso.cost} coins.`);
      return;
    }
    if (lasso.cost > 0) setCoins((prev) => prev - lasso.cost);
    setSelectedLasso(lasso);
  }, [coins]);

  const moveLane = useCallback((direction) => {
    if (!gameActive) return;
    const step = isSpeedBoost ? 2 : 1;
    setPlayerLane((prev) => {
      if (direction === 'left') return Math.max(0, prev - step);
      if (direction === 'right') return Math.min(LANES - 1, prev + step);
      return prev;
    });
  }, [gameActive, isSpeedBoost]);

  const startPlaying = () => {
    if (!selectedSkin) {
      Alert.alert('⚠️ Select a Character!', 'Choose your cowboy first!');
      return;
    }
    setGamePhase('playing');
    setGameActive(true);
    gameActiveRef.current = true;
    setGameTime(60);
    setHealth(100);
    healthRef.current = 100;
    setPlayerEnergy(100);
    setPlayerLane(2);
    playerLaneRef.current = 2;
    setAnimals([]);
    setGroundItems([]);
    setCapturedAnimals([]);
    setCombo(0);
    comboRef.current = 0;
    setMaxCombo(0);
    setCoins(0);
    setDangerLevel(0);
    setStampedeWarning(false);
    setSelectedLasso(LASSO_TYPES[0]);
    setLassoCooldown(false);
    setIsSpeedBoost(false);
    setIsStrength(false);
    setIsFreezeAll(false);
    isFreezeRef.current = false;
    setIsMagnet(false);
    isMagnetRef.current = false;
    setIsShielded(false);
    isShieldedRef.current = false;
    setIsDoublePoints(false);
    setGameStarted(true);
  };

  const endTurn = useCallback(() => {
    clearAllTimers();
    setGameActive(false);
    gameActiveRef.current = false;
    handleTurnEnd();
  }, []);

  const handleTurnEnd = useCallback(() => {
    const playerKey = currentPlayer === 1 ? 'player1' : 'player2';
    const distBonus = capturedAnimals.length * 5;
    setScores((prev) => ({ ...prev, [playerKey]: prev[playerKey] + distBonus }));

    if (currentPlayer === 1) {
      Alert.alert(
        '🏁 Turn Over!',
        `Player 1:\nScore: ${scores.player1 + distBonus}\nCaptured: ${capturedAnimals.length}\nMax Combo: x${maxCombo}`,
        [{ text: "Player 2's Turn!", onPress: switchPlayer }]
      );
    } else {
      handleEndRound();
    }
  }, [currentPlayer, scores, capturedAnimals, maxCombo]);

  const switchPlayer = useCallback(() => {
    setCurrentPlayer(2);
    setGamePhase('select');
    setSelectedSkin(null);
    setGameActive(false);
    gameActiveRef.current = false;
  }, []);

  const handleEndRound = useCallback(() => {
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
  }, [scores, round, maxRounds]);

  const handleGameOver = useCallback(() => {
    const p1 = gameStats.player1;
    const p2 = gameStats.player2;
    let champion = '';
    if (scores.player1 > scores.player2) champion = '🏆 Player 1 is Champion!';
    else if (scores.player2 > scores.player1) champion = '🏆 Player 2 is Champion!';
    else champion = "🤝 Tie!";

    Alert.alert(
      '🎮 Game Over!',
      `${champion}\n\nP1: ${scores.player1} | P2: ${scores.player2}\nCaptured: P1 ${p1.animalsCaptured} | P2 ${p2.animalsCaptured}\nRare: P1 ${p1.rareCaptures} | P2 ${p2.rareCaptures}\nCombo: P1 x${p1.maxCombo} | P2 x${p2.maxCombo}`,
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
    setSelectedSkin(null);
    setGameActive(false);
    gameActiveRef.current = false;
    setGameStarted(false);
  }, []);

  const resetGame = useCallback(() => {
    setScores({ player1: 0, player2: 0 });
    setRound(1);
    setCurrentPlayer(1);
    setGamePhase('select');
    setGameActive(false);
    gameActiveRef.current = false;
    setGameStarted(false);
    setSelectedSkin(null);
    setGameStats({
      player1: { animalsCaptured: 0, totalPoints: 0, maxCombo: 0, lassosThrown: 0, powerUpsUsed: 0, damagesTaken: 0, coinsEarned: 0, rareCaptures: 0 },
      player2: { animalsCaptured: 0, totalPoints: 0, maxCombo: 0, lassosThrown: 0, powerUpsUsed: 0, damagesTaken: 0, coinsEarned: 0, rareCaptures: 0 },
    });
  }, []);

  const playerKey = currentPlayer === 1 ? 'player1' : 'player2';
  const currentStats = gameStats[playerKey];
  const hpPercent = Math.round((health / 100) * 100);

  const getHPColor = () => {
    if (hpPercent > 60) return '#4ECDC4';
    if (hpPercent > 30) return '#FFD700';
    return '#FF6B6B';
  };

  const getDangerColor = () => {
    if (dangerLevel > 70) return '#FF0000';
    if (dangerLevel > 40) return '#FF6B6B';
    return '#FFD700';
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backBtn}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>🐂 Stampede</Text>
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
          <Text style={styles.coinText}>🪙 {coins}</Text>
        </View>
        <View style={styles.scoreTeam}>
          <Text style={styles.teamLabel}>{currentPlayer === 2 ? '►' : ''} P2</Text>
          <Text style={[styles.teamScore, { color: '#4ECDC4' }]}>{scores.player2}</Text>
        </View>
      </View>

      {/* Character Selection */}
      {gamePhase === 'select' && (
        <View style={styles.selectPhase}>
          <Text style={styles.selectTitle}>🎮 Player {currentPlayer} - Choose Cowboy:</Text>
          <View style={styles.skinGrid}>
            {COWBOY_SKINS.map((skin) => (
              <TouchableOpacity
                key={skin.id}
                style={[
                  styles.skinCard,
                  selectedSkin?.id === skin.id && styles.skinCardSelected,
                ]}
                onPress={() => setSelectedSkin(skin)}
              >
                <Text style={styles.skinEmoji}>{skin.emoji}</Text>
                <Text style={styles.skinName}>{skin.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
          {selectedSkin && (
            <TouchableOpacity style={styles.goBtn} onPress={startPlaying}>
              <Text style={styles.goBtnText}>🤠 START WRANGLING!</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Playing Phase */}
      {gamePhase === 'playing' && (
        <>
          {/* Status Bar */}
          <View style={styles.statusBar}>
            <View style={styles.statusLeft}>
              <Text style={styles.lassoLabel}>
                {selectedLasso.emoji} {selectedLasso.label}
              </Text>
              {combo > 1 && (
                <Animated.Text
                  style={[styles.comboText, { transform: [{ scale: comboAnim }] }]}
                >
                  🔥 x{combo}
                </Animated.Text>
              )}
            </View>
            <View style={styles.activeEffects}>
              {isSpeedBoost && <Text style={styles.effectEmoji}>👢</Text>}
              {isStrength && <Text style={styles.effectEmoji}>💪</Text>}
              {isFreezeAll && <Text style={styles.effectEmoji}>❄️</Text>}
              {isMagnet && <Text style={styles.effectEmoji}>🧲</Text>}
              {isShielded && <Text style={styles.effectEmoji}>🛡️</Text>}
              {isDoublePoints && <Text style={styles.effectEmoji}>✖️2️⃣</Text>}
            </View>
            <Text style={styles.capturedCount}>🎯 {capturedAnimals.length}</Text>
          </View>

          {/* HP & Energy & Danger */}
          <View style={styles.barsContainer}>
            <View style={styles.barRow}>
              <Text style={styles.barLabel}>❤️</Text>
              <View style={styles.bar}>
                <View style={[styles.barFill, { width: `${hpPercent}%`, backgroundColor: getHPColor() }]} />
              </View>
              <Text style={styles.barPercent}>{hpPercent}%</Text>
            </View>
            <View style={styles.barRow}>
              <Text style={styles.barLabel}>⚡</Text>
              <View style={styles.bar}>
                <View style={[styles.barFill, { width: `${playerEnergy}%`, backgroundColor: '#FFD700' }]} />
              </View>
              <Text style={styles.barPercent}>{Math.round(playerEnergy)}%</Text>
            </View>
            <View style={styles.barRow}>
              <Text style={styles.barLabel}>⚠️</Text>
              <Animated.View style={[styles.bar, { transform: [{ scaleX: dangerPulseAnim }] }]}>
                <View style={[styles.barFill, { width: `${dangerLevel}%`, backgroundColor: getDangerColor() }]} />
              </Animated.View>
              <Text style={styles.barPercent}>{dangerLevel}%</Text>
            </View>
          </View>

          {/* Stampede Warning */}
          {stampedeWarning && (
            <Animated.View style={[styles.warningBanner, { opacity: warningAnim }]}>
              <Text style={styles.warningText}>⚠️ STAMPEDE INCOMING! ⚠️</Text>
            </Animated.View>
          )}

          {/* Game Arena */}
          <Animated.View
            style={[
              styles.arena,
              { transform: [{ translateX: shakeAnim }] },
              isFreezeAll && styles.arenaFrozen,
            ]}
          >
            {/* Lane dividers */}
            {[...Array(LANES + 1)].map((_, i) => (
              <View key={`lane-${i}`} style={[styles.laneMarker, { left: 10 + i * LANE_WIDTH }]} />
            ))}

            {/* Dust effect */}
            <Animated.View
              style={[
                styles.dustLayer,
                {
                  opacity: dustAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.1, 0.3],
                  }),
                },
              ]}
            />

            {/* Animals */}
            {animals.map((animal) =>
              !animal.captured ? (
                <View
                  key={animal.id}
                  style={[
                    styles.animal,
                    {
                      left: 10 + Math.round(animal.lane) * LANE_WIDTH + LANE_WIDTH / 2 - 22,
                      top: animal.y,
                      borderColor: animal.lassoed ? '#FFD700' : animal.stunned ? '#87CEEB' : animal.color,
                      opacity: animal.stunned ? 0.7 : 1,
                    },
                  ]}
                >
                  <Text style={[
                    styles.animalEmoji,
                    animal.size === 'huge' && { fontSize: 28 },
                    animal.size === 'small' && { fontSize: 18 },
                  ]}>
                    {animal.emoji}
                  </Text>
                  {animal.lassoed && (
                    <View style={styles.animalHPBar}>
                      <View style={[styles.animalHPFill, { width: `${(animal.hp / animal.maxHP) * 100}%` }]} />
                    </View>
                  )}
                </View>
              ) : (
                <View
                  key={animal.id}
                  style={[
                    styles.capturedAnimal,
                    {
                      left: 10 + Math.round(animal.lane) * LANE_WIDTH + LANE_WIDTH / 2 - 15,
                      top: animal.y,
                    },
                  ]}
                >
                  <Text style={styles.capturedEmoji}>🪢✅</Text>
                </View>
              )
            )}

            {/* Ground items */}
            {groundItems.map((item) => (
              <View
                key={item.id}
                style={[
                  styles.groundItem,
                  {
                    left: 10 + item.lane * LANE_WIDTH + LANE_WIDTH / 2 - 15,
                    top: item.y,
                  },
                ]}
              >
                <Text style={styles.groundItemEmoji}>{item.emoji}</Text>
              </View>
            ))}

            {/* Player */}
            <View
              style={[
                styles.player,
                {
                  left: 10 + playerLane * LANE_WIDTH + LANE_WIDTH / 2 - 22,
                  bottom: 20,
                },
                playerHit && styles.playerHitStyle,
              ]}
            >
              {isShielded && <View style={styles.shieldBubble} />}
              <Text style={styles.playerEmoji}>{selectedSkin?.emoji || '🤠'}</Text>
              {lassoCooldown && <Text style={styles.cooldownIndicator}>⏳</Text>}
            </View>

            {/* Lasso animation */}
            <Animated.View
              style={[
                styles.lassoVisual,
                {
                  left: 10 + playerLane * LANE_WIDTH + LANE_WIDTH / 2 - 20,
                  bottom: 70,
                  opacity: lassoAnim,
                  transform: [{
                    translateY: lassoAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, -80],
                    }),
                  }],
                },
              ]}
            >
              <Text style={styles.lassoEmoji}>{selectedLasso.emoji}</Text>
            </Animated.View>

            {/* Capture flash */}
            <Animated.View style={[styles.captureFlash, { opacity: captureFlashAnim }]} />
          </Animated.View>

          {/* Controls */}
          <View style={styles.controls}>
            <TouchableOpacity style={styles.moveBtn} onPress={() => moveLane('left')}>
              <Text style={styles.moveBtnText}>◄</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.lassoBtn, lassoCooldown && styles.btnDisabled]}
              onPress={throwLasso}
              disabled={lassoCooldown}
            >
              <Text style={styles.lassoBtnText}>
                {lassoCooldown ? '⏳ Wait' : `${selectedLasso.emoji} LASSO!`}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.moveBtn} onPress={() => moveLane('right')}>
              <Text style={styles.moveBtnText}>►</Text>
            </TouchableOpacity>
          </View>

          {/* Lasso Shop */}
          <View style={styles.lassoShop}>
            <Text style={styles.shopTitle}>🪢 Lasso (🪙 {coins}):</Text>
            <View style={styles.shopRow}>
              {LASSO_TYPES.map((lasso) => (
                <TouchableOpacity
                  key={lasso.id}
                  style={[
                    styles.shopItem,
                    selectedLasso.id === lasso.id && styles.shopItemSelected,
                    coins < lasso.cost && lasso.cost > 0 && styles.shopItemDisabled,
                  ]}
                  onPress={() => buyLasso(lasso)}
                  disabled={coins < lasso.cost && lasso.cost > 0}
                >
                  <Text style={styles.shopEmoji}>{lasso.emoji}</Text>
                  <Text style={styles.shopLabel}>{lasso.label}</Text>
                  <Text style={styles.shopCost}>
                    {lasso.cost > 0 ? `🪙${lasso.cost}` : 'Free'}
                  </Text>
                  <Text style={styles.shopPower}>⚔️{lasso.power}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </>
      )}

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Captured</Text>
          <Text style={styles.statValue}>{currentStats.animalsCaptured}</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Lassoed</Text>
          <Text style={[styles.statValue, { color: '#FFD700' }]}>{currentStats.lassosThrown}</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Rare</Text>
          <Text style={[styles.statValue, { color: '#9B59B6' }]}>{currentStats.rareCaptures}</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Combo</Text>
          <Text style={[styles.statValue, { color: '#FF6B6B' }]}>x{Math.max(maxCombo, currentStats.maxCombo)}</Text>
        </View>
      </View>

      {/* Captured Animals Display */}
      {capturedAnimals.length > 0 && gamePhase === 'playing' && (
        <View style={styles.capturedBar}>
          <Text style={styles.capturedLabel}>🎯 Captured:</Text>
          <View style={styles.capturedList}>
            {capturedAnimals.slice(-8).map((a, i) => (
              <Text key={i} style={styles.capturedItemEmoji}>{a.emoji}</Text>
            ))}
          </View>
        </View>
      )}

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
    backgroundColor: '#1A0E05',
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg || 20,
    paddingVertical: SPACING.sm || 8,
    backgroundColor: '#2C1810',
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
    backgroundColor: '#3D2B1F',
    borderBottomWidth: 2,
    borderBottomColor: '#8B4513',
  },
  scoreTeam: { alignItems: 'center', width: 70 },
  teamLabel: { fontSize: 11, color: '#CDB79E', fontWeight: 'bold' },
  teamScore: { fontSize: 24, fontWeight: 'bold' },
  gameInfoCenter: { alignItems: 'center' },
  timerText: { fontSize: 18, fontWeight: 'bold' },
  coinText: { fontSize: 12, color: '#FFD700', fontWeight: 'bold' },

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
    borderColor: '#5C4033',
    backgroundColor: '#3D2B1F',
    alignItems: 'center',
  },
  skinCardSelected: {
    borderColor: '#FFD700',
    backgroundColor: '#FFD70022',
    borderWidth: 3,
  },
  skinEmoji: { fontSize: 32 },
  skinName: { fontSize: 11, fontWeight: 'bold', color: '#FFF', marginTop: 6 },
  goBtn: {
    backgroundColor: '#8B4513',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
    borderWidth: 2,
    borderColor: '#D2691E',
  },
  goBtnText: { fontSize: 18, fontWeight: 'bold', color: '#FFF' },

  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg || 20,
    paddingVertical: 4,
    backgroundColor: '#2C1810',
  },
  statusLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  lassoLabel: { fontSize: 11, fontWeight: 'bold', color: '#FFF' },
  comboText: { fontSize: 14, fontWeight: 'bold', color: '#FFD700' },
  activeEffects: { flexDirection: 'row', gap: 4 },
  effectEmoji: { fontSize: 14 },
  capturedCount: { fontSize: 13, fontWeight: 'bold', color: '#4ECDC4' },

  barsContainer: {
    paddingHorizontal: SPACING.lg || 20,
    paddingVertical: 3,
    backgroundColor: '#3D2B1F',
    gap: 2,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  barLabel: { fontSize: 10, width: 18 },
  bar: {
    flex: 1,
    height: 8,
    backgroundColor: '#1A0E05',
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: { height: '100%', borderRadius: 4 },
  barPercent: { fontSize: 9, color: '#CDB79E', width: 28, textAlign: 'right' },

  warningBanner: {
    backgroundColor: '#FF000066',
    paddingVertical: 4,
    alignItems: 'center',
  },
  warningText: { fontSize: 14, fontWeight: 'bold', color: '#FFD700' },

  arena: {
    flex: 1,
    backgroundColor: '#5C4033',
    marginHorizontal: 10,
    marginVertical: 4,
    borderRadius: BORDER_RADIUS.md || 10,
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#8B4513',
  },
  arenaFrozen: {
    borderColor: '#87CEEB',
    backgroundColor: '#4A6060',
  },

  laneMarker: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: '#FFFFFF11',
  },

  dustLayer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#D2B48C',
    zIndex: 0,
  },

  animal: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: 10,
    borderWidth: 2,
    backgroundColor: '#00000033',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 5,
  },
  animalEmoji: { fontSize: 22 },
  animalHPBar: {
    position: 'absolute',
    bottom: -6,
    width: 34,
    height: 4,
    backgroundColor: '#333',
    borderRadius: 2,
    overflow: 'hidden',
  },
  animalHPFill: {
    height: '100%',
    backgroundColor: '#FF6B6B',
    borderRadius: 2,
  },

  capturedAnimal: {
    position: 'absolute',
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 5,
    opacity: 0.6,
  },
  capturedEmoji: { fontSize: 14 },

  groundItem: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#FFD70033',
    borderWidth: 1,
    borderColor: '#FFD700',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 8,
  },
  groundItemEmoji: { fontSize: 16 },

  player: {
    position: 'absolute',
    width: 44,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  playerEmoji: { fontSize: 34 },
  playerHitStyle: { opacity: 0.5 },
  shieldBubble: {
    position: 'absolute',
    width: 52,
    height: 56,
    borderRadius: 28,
    borderWidth: 3,
    borderColor: '#4ECDC4',
    zIndex: -1,
  },
  cooldownIndicator: {
    position: 'absolute',
    top: -5,
    right: -5,
    fontSize: 12,
  },

  lassoVisual: {
    position: 'absolute',
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 15,
  },
  lassoEmoji: { fontSize: 28 },

  captureFlash: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#FFD70033',
    zIndex: 20,
  },

  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#2C1810',
  },
  moveBtn: {
    width: 60,
    height: 50,
    backgroundColor: '#5C4033',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#8B4513',
  },
  moveBtnText: { fontSize: 22, fontWeight: 'bold', color: '#FFF' },
  lassoBtn: {
    flex: 1,
    height: 50,
    backgroundColor: '#8B4513',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#D2691E',
  },
  lassoBtnText: { fontSize: 16, fontWeight: 'bold', color: '#FFF' },
  btnDisabled: { opacity: 0.4 },

  lassoShop: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: '#3D2B1F',
  },
  shopTitle: { fontSize: 10, color: '#CDB79E', marginBottom: 4 },
  shopRow: {
    flexDirection: 'row',
    gap: 4,
    justifyContent: 'center',
  },
  shopItem: {
    flex: 1,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#5C4033',
    backgroundColor: '#2C1810',
    alignItems: 'center',
  },
  shopItemSelected: {
    borderColor: '#FFD700',
    backgroundColor: '#FFD70022',
    borderWidth: 2,
  },
  shopItemDisabled: { opacity: 0.4 },
  shopEmoji: { fontSize: 14 },
  shopLabel: { fontSize: 7, color: '#FFF', fontWeight: 'bold' },
  shopCost: { fontSize: 7, color: '#FFD700' },
  shopPower: { fontSize: 7, color: '#FF6B6B' },

  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 5,
    paddingHorizontal: SPACING.md || 10,
    backgroundColor: '#2C1810',
  },
  statBox: { alignItems: 'center' },
  statLabel: { fontSize: 9, color: '#CDB79E', marginBottom: 1 },
  statValue: { fontSize: 14, fontWeight: 'bold', color: '#4ECDC4' },

  capturedBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg || 20,
    paddingVertical: 3,
    backgroundColor: '#3D2B1F',
    gap: 6,
  },
  capturedLabel: { fontSize: 10, color: '#CDB79E' },
  capturedList: { flexDirection: 'row', gap: 3, flexWrap: 'wrap' },
  capturedItemEmoji: { fontSize: 14 },

  gameOverButtons: {
    paddingHorizontal: SPACING.lg || 20,
    paddingBottom: SPACING.md || 12,
    gap: 8,
  },
  nextBtn: {
    backgroundColor: '#8B4513',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#D2691E',
  },
  nextBtnText: { fontSize: 16, fontWeight: 'bold', color: '#FFF' },
  exitBtn: {
    backgroundColor: '#5C4033',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  exitBtnText: { fontSize: 16, fontWeight: 'bold', color: '#FFF' },
});
