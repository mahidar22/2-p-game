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

const SWORD_TYPES = [
  { id: 'dagger', emoji: '🗡️', label: 'Dagger', damage: 15, speed: 8, accuracy: 0.85, range: 'short', weight: 1, color: '#C0C0C0' },
  { id: 'katana', emoji: '⚔️', label: 'Katana', damage: 25, speed: 6, accuracy: 0.75, range: 'medium', weight: 2, color: '#FFD700' },
  { id: 'broadsword', emoji: '🔪', label: 'Broadsword', damage: 35, speed: 4, accuracy: 0.65, range: 'long', weight: 3, color: '#4ECDC4' },
  { id: 'axe', emoji: '🪓', label: 'Battle Axe', damage: 45, speed: 3, accuracy: 0.55, range: 'medium', weight: 4, color: '#FF6B6B' },
  { id: 'spear', emoji: '🔱', label: 'Trident', damage: 30, speed: 7, accuracy: 0.70, range: 'long', weight: 2, color: '#2ECC71' },
  { id: 'shuriken', emoji: '✦', label: 'Shuriken', damage: 10, speed: 10, accuracy: 0.90, range: 'long', weight: 1, color: '#9B59B6' },
];

const TARGET_TYPES = [
  { id: 'dummy', emoji: '🎯', label: 'Training Dummy', hp: 30, points: 10, size: 50, color: '#8B4513', speed: 0 },
  { id: 'barrel', emoji: '🛢️', label: 'Barrel', hp: 20, points: 15, size: 40, color: '#654321', speed: 0 },
  { id: 'shield', emoji: '🛡️', label: 'Shield', hp: 60, points: 25, size: 45, color: '#4682B4', speed: 0 },
  { id: 'goblin', emoji: '👺', label: 'Goblin', hp: 25, points: 20, size: 35, color: '#228B22', speed: 2 },
  { id: 'skeleton', emoji: '💀', label: 'Skeleton', hp: 35, points: 30, size: 40, color: '#F5F5DC', speed: 1.5 },
  { id: 'knight', emoji: '🤺', label: 'Knight', hp: 80, points: 50, size: 45, color: '#808080', speed: 1 },
  { id: 'dragon', emoji: '🐉', label: 'Dragon', hp: 120, points: 80, size: 55, color: '#FF4500', speed: 0.8 },
  { id: 'ghost', emoji: '👻', label: 'Ghost', hp: 15, points: 35, size: 30, color: '#E0E0E0', speed: 3 },
  { id: 'wizard', emoji: '🧙', label: 'Wizard', hp: 40, points: 45, size: 38, color: '#9B59B6', speed: 1.8 },
  { id: 'bomb', emoji: '💣', label: 'Bomb', hp: 10, points: -20, size: 35, color: '#FF0000', speed: 0 },
];

const POWERUP_TYPES = [
  { id: 'fire', emoji: '🔥', label: 'Fire Blade', duration: 10000, effect: 'damage_x2' },
  { id: 'ice', emoji: '❄️', label: 'Ice Blade', duration: 8000, effect: 'freeze_targets' },
  { id: 'multi', emoji: '🌟', label: 'Multi Throw', duration: 8000, effect: 'triple_throw' },
  { id: 'precision', emoji: '🎯', label: 'Precision', duration: 12000, effect: 'perfect_accuracy' },
  { id: 'speed', emoji: '⚡', label: 'Quick Draw', duration: 10000, effect: 'no_cooldown' },
  { id: 'heal', emoji: '💚', label: 'Heal', duration: 0, effect: 'restore_energy' },
];

const CHARACTER_SKINS = [
  { id: 'ninja', emoji: '🥷', label: 'Ninja' },
  { id: 'samurai', emoji: '⚔️', label: 'Samurai' },
  { id: 'viking', emoji: '🪖', label: 'Viking' },
  { id: 'pirate', emoji: '🏴‍☠️', label: 'Pirate' },
  { id: 'knight', emoji: '🛡️', label: 'Knight' },
  { id: 'wizard', emoji: '🧙‍♂️', label: 'Wizard' },
];

export default function SwordThrowerGame({ navigation }) {
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
  const [selectedSword, setSelectedSword] = useState(SWORD_TYPES[0]);
  const [playerEnergy, setPlayerEnergy] = useState(100);
  const [throwCooldown, setThrowCooldown] = useState(false);

  // Aim
  const [aimAngle, setAimAngle] = useState(0);
  const [powerLevel, setPowerLevel] = useState(50);
  const [powerCharging, setPowerCharging] = useState(false);
  const [powerIncreasing, setPowerIncreasing] = useState(true);

  // Active effects
  const [isFireBlade, setIsFireBlade] = useState(false);
  const [isIceBlade, setIsIceBlade] = useState(false);
  const [isMultiThrow, setIsMultiThrow] = useState(false);
  const [isPrecision, setIsPrecision] = useState(false);
  const [isQuickDraw, setIsQuickDraw] = useState(false);

  // Targets
  const [targets, setTargets] = useState([]);
  const [flyingSwords, setFlyingSwords] = useState([]);
  const [destroyedTargets, setDestroyedTargets] = useState(0);

  // Power-ups on field
  const [fieldPowerUps, setFieldPowerUps] = useState([]);

  // Combo
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [lastHitTime, setLastHitTime] = useState(null);

  // Stats
  const [gameStats, setGameStats] = useState({
    player1: {
      swordsThrown: 0,
      targetsHit: 0,
      targetsMissed: 0,
      criticalHits: 0,
      maxCombo: 0,
      powerUpsUsed: 0,
      totalDamage: 0,
      bossesKilled: 0,
    },
    player2: {
      swordsThrown: 0,
      targetsHit: 0,
      targetsMissed: 0,
      criticalHits: 0,
      maxCombo: 0,
      powerUpsUsed: 0,
      totalDamage: 0,
      bossesKilled: 0,
    },
  });

  // Refs
  const targetsRef = useRef([]);
  const flyingSwordsRef = useRef([]);
  const gameActiveRef = useRef(false);
  const comboRef = useRef(0);
  const lastHitRef = useRef(null);
  const isFireRef = useRef(false);
  const isIceRef = useRef(false);
  const isMultiRef = useRef(false);
  const isPrecisionRef = useRef(false);
  const isQuickDrawRef = useRef(false);
  const selectedSwordRef = useRef(SWORD_TYPES[0]);

  // Sync refs
  useEffect(() => { targetsRef.current = targets; }, [targets]);
  useEffect(() => { flyingSwordsRef.current = flyingSwords; }, [flyingSwords]);
  useEffect(() => { gameActiveRef.current = gameActive; }, [gameActive]);
  useEffect(() => { comboRef.current = combo; }, [combo]);
  useEffect(() => { lastHitRef.current = lastHitTime; }, [lastHitTime]);
  useEffect(() => { isFireRef.current = isFireBlade; }, [isFireBlade]);
  useEffect(() => { isIceRef.current = isIceBlade; }, [isIceBlade]);
  useEffect(() => { isMultiRef.current = isMultiThrow; }, [isMultiThrow]);
  useEffect(() => { isPrecisionRef.current = isPrecision; }, [isPrecision]);
  useEffect(() => { isQuickDrawRef.current = isQuickDraw; }, [isQuickDraw]);
  useEffect(() => { selectedSwordRef.current = selectedSword; }, [selectedSword]);

  // Animations
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const throwAnim = useRef(new Animated.Value(0)).current;
  const comboAnim = useRef(new Animated.Value(1)).current;
  const hitFlashAnim = useRef(new Animated.Value(0)).current;
  const fireGlowAnim = useRef(new Animated.Value(0)).current;
  const iceGlowAnim = useRef(new Animated.Value(0)).current;
  const aimLineAnim = useRef(new Animated.Value(1)).current;
  const powerPulseAnim = useRef(new Animated.Value(1)).current;

  const gameLoopRef = useRef(null);
  const timerRef = useRef(null);
  const spawnRef = useRef(null);
  const puSpawnRef = useRef(null);
  const energyRef = useRef(null);
  const powerRef = useRef(null);

  useEffect(() => {
    return () => clearAllTimers();
  }, []);

  const clearAllTimers = () => {
    if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    if (timerRef.current) clearInterval(timerRef.current);
    if (spawnRef.current) clearInterval(spawnRef.current);
    if (puSpawnRef.current) clearInterval(puSpawnRef.current);
    if (energyRef.current) clearInterval(energyRef.current);
    if (powerRef.current) clearInterval(powerRef.current);
  };

  // Combo reset
  useEffect(() => {
    if (!lastHitTime) return;
    const timer = setTimeout(() => setCombo(0), 3000);
    return () => clearTimeout(timer);
  }, [lastHitTime]);

  // Fire glow
  useEffect(() => {
    if (isFireBlade) {
      const loop = Animated.loop(Animated.sequence([
        Animated.timing(fireGlowAnim, { toValue: 1, duration: 300, useNativeDriver: false }),
        Animated.timing(fireGlowAnim, { toValue: 0, duration: 300, useNativeDriver: false }),
      ]));
      loop.start();
      return () => loop.stop();
    }
  }, [isFireBlade]);

  // Ice glow
  useEffect(() => {
    if (isIceBlade) {
      const loop = Animated.loop(Animated.sequence([
        Animated.timing(iceGlowAnim, { toValue: 1, duration: 500, useNativeDriver: false }),
        Animated.timing(iceGlowAnim, { toValue: 0, duration: 500, useNativeDriver: false }),
      ]));
      loop.start();
      return () => loop.stop();
    }
  }, [isIceBlade]);

  // Aim line pulse
  useEffect(() => {
    if (!gameActive) return;
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(aimLineAnim, { toValue: 0.5, duration: 800, useNativeDriver: false }),
      Animated.timing(aimLineAnim, { toValue: 1, duration: 800, useNativeDriver: false }),
    ]));
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
      setPlayerEnergy((prev) => Math.min(100, prev + 2));
    }, 400);
    return () => { if (energyRef.current) clearInterval(energyRef.current); };
  }, [gameActive]);

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
          return prev + 2;
        } else {
          if (prev <= 0) { setPowerIncreasing(true); return 0; }
          return prev - 2;
        }
      });
    }, 25);
    return () => { if (powerRef.current) clearInterval(powerRef.current); };
  }, [powerCharging, powerIncreasing]);

  // Target spawning
  useEffect(() => {
    if (!gameActive) return;
    const rate = Math.max(800, 2000 - round * 300);

    spawnRef.current = setInterval(() => {
      const rand = Math.random();
      let targetType;

      if (rand < 0.03) targetType = TARGET_TYPES[6]; // dragon
      else if (rand < 0.08) targetType = TARGET_TYPES[5]; // knight
      else if (rand < 0.13) targetType = TARGET_TYPES[8]; // wizard
      else if (rand < 0.20) targetType = TARGET_TYPES[7]; // ghost
      else if (rand < 0.28) targetType = TARGET_TYPES[4]; // skeleton
      else if (rand < 0.38) targetType = TARGET_TYPES[3]; // goblin
      else if (rand < 0.48) targetType = TARGET_TYPES[2]; // shield
      else if (rand < 0.56) targetType = TARGET_TYPES[9]; // bomb
      else if (rand < 0.72) targetType = TARGET_TYPES[1]; // barrel
      else targetType = TARGET_TYPES[0]; // dummy

      const side = Math.random() > 0.5 ? 'left' : 'right';
      const startX = side === 'left' ? -30 : width - 10;
      const targetY = 50 + Math.random() * (height * 0.25);

      const newTarget = {
        id: Date.now() + Math.random(),
        type: targetType.id,
        emoji: targetType.emoji,
        label: targetType.label,
        hp: targetType.hp + round * 5,
        maxHP: targetType.hp + round * 5,
        points: targetType.points,
        size: targetType.size,
        color: targetType.color,
        x: startX,
        y: targetY,
        vx: side === 'left' ? targetType.speed + Math.random() : -(targetType.speed + Math.random()),
        vy: (Math.random() - 0.5) * 0.5,
        destroyed: false,
        frozen: false,
        hitCount: 0,
      };

      setTargets((prev) => [...prev.slice(-15), newTarget]);
    }, rate);

    return () => { if (spawnRef.current) clearInterval(spawnRef.current); };
  }, [gameActive, round]);

  // Power-up spawning
  useEffect(() => {
    if (!gameActive) return;
    puSpawnRef.current = setInterval(() => {
      if (Math.random() < 0.3) {
        const puType = POWERUP_TYPES[Math.floor(Math.random() * POWERUP_TYPES.length)];
        setFieldPowerUps((prev) => [
          ...prev.slice(-5),
          {
            id: Date.now() + Math.random(),
            type: puType.id,
            emoji: puType.emoji,
            label: puType.label,
            duration: puType.duration,
            effect: puType.effect,
            x: 30 + Math.random() * (width - 80),
            y: 30 + Math.random() * (height * 0.2),
            collected: false,
          },
        ]);
      }
    }, 5000);
    return () => { if (puSpawnRef.current) clearInterval(puSpawnRef.current); };
  }, [gameActive]);

  // Main game loop
  useEffect(() => {
    if (!gameActive) return;

    gameLoopRef.current = setInterval(() => {
      // Move targets
      setTargets((prev) => {
        return prev
          .map((target) => {
            if (target.destroyed) return target;

            const speedMod = target.frozen ? 0.2 : 1;
            let newX = target.x + target.vx * speedMod;
            let newY = target.y + target.vy * speedMod;

            // Bounce Y
            if (newY < 20 || newY > height * 0.3) {
              target.vy = -target.vy;
              newY = Math.max(20, Math.min(height * 0.3, newY));
            }

            return { ...target, x: newX, y: newY };
          })
          .filter((target) => {
            if (target.destroyed) return true;
            return target.x > -60 && target.x < width + 60;
          });
      });

      // Move flying swords
      setFlyingSwords((prev) => {
        const updated = prev
          .map((sword) => ({
            ...sword,
            x: sword.x + sword.vx,
            y: sword.y + sword.vy,
            rotation: (sword.rotation + 15) % 360,
          }))
          .filter((sword) => {
            return sword.x > -20 && sword.x < width + 20 && sword.y > -20 && sword.y < height;
          });

        // Check collisions
        updated.forEach((sword) => {
          if (sword.hit) return;

          // Check target hits
          setTargets((prevTargets) => {
            let hitTarget = false;
            const newTargets = prevTargets.map((target) => {
              if (target.destroyed || hitTarget) return target;

              const dist = Math.sqrt(
                Math.pow(sword.x - target.x, 2) + Math.pow(sword.y - target.y, 2)
              );

              if (dist < target.size * 0.6) {
                hitTarget = true;
                sword.hit = true;

                const fireDmg = isFireRef.current ? 2 : 1;
                const totalDmg = sword.damage * fireDmg;
                const newHP = target.hp - totalDmg;
                const isCrit = Math.random() < 0.15;
                const critDmg = isCrit ? totalDmg : 0;
                const finalHP = newHP - critDmg;

                // Record hit
                handleSwordHit(target, totalDmg + critDmg, isCrit, finalHP <= 0);

                if (finalHP <= 0) {
                  return { ...target, destroyed: true, hp: 0 };
                } else {
                  return {
                    ...target,
                    hp: finalHP,
                    hitCount: target.hitCount + 1,
                    frozen: isIceRef.current ? true : target.frozen,
                  };
                }
              }
              return target;
            });
            return newTargets;
          });

          // Check power-up collection
          setFieldPowerUps((prevPU) => {
            return prevPU.map((pu) => {
              if (pu.collected) return pu;
              const dist = Math.sqrt(
                Math.pow(sword.x - pu.x, 2) + Math.pow(sword.y - pu.y, 2)
              );
              if (dist < 30) {
                activatePowerUp(pu.effect, pu.duration);
                return { ...pu, collected: true };
              }
              return pu;
            }).filter((pu) => !pu.collected);
          });
        });

        return updated.filter((s) => !s.hit);
      });
    }, 25);

    return () => { if (gameLoopRef.current) clearInterval(gameLoopRef.current); };
  }, [gameActive]);

  const handleSwordHit = useCallback((target, damage, isCrit, isKill) => {
    const now = Date.now();
    const newCombo = lastHitRef.current && now - lastHitRef.current < 3000 ? comboRef.current + 1 : 1;
    setCombo(newCombo);
    comboRef.current = newCombo;
    if (newCombo > maxCombo) setMaxCombo(newCombo);
    setLastHitTime(now);
    lastHitRef.current = now;

    const playerKey = currentPlayer === 1 ? 'player1' : 'player2';
    const comboBonus = (newCombo - 1) * 5;

    // Hit flash
    hitFlashAnim.setValue(1);
    Animated.timing(hitFlashAnim, { toValue: 0, duration: 300, useNativeDriver: false }).start();

    // Combo animation
    if (newCombo > 1) {
      comboAnim.setValue(0.5);
      Animated.spring(comboAnim, { toValue: 1, friction: 3, tension: 200, useNativeDriver: false }).start();
    }

    setGameStats((prev) => ({
      ...prev,
      [playerKey]: {
        ...prev[playerKey],
        targetsHit: prev[playerKey].targetsHit + 1,
        totalDamage: prev[playerKey].totalDamage + damage,
        criticalHits: prev[playerKey].criticalHits + (isCrit ? 1 : 0),
        maxCombo: Math.max(prev[playerKey].maxCombo, newCombo),
        bossesKilled: prev[playerKey].bossesKilled + (isKill && ['dragon', 'knight', 'wizard'].includes(target.type) ? 1 : 0),
      },
    }));

    if (isKill) {
      const points = target.points + comboBonus;

      if (target.points < 0) {
        // Bomb hit
        setScores((prev) => ({
          ...prev,
          [playerKey]: Math.max(0, prev[playerKey] + target.points),
        }));

        Animated.sequence([
          Animated.timing(shakeAnim, { toValue: 15, duration: 50, useNativeDriver: false }),
          Animated.timing(shakeAnim, { toValue: -15, duration: 50, useNativeDriver: false }),
          Animated.timing(shakeAnim, { toValue: 8, duration: 50, useNativeDriver: false }),
          Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: false }),
        ]).start();
      } else {
        setScores((prev) => ({
          ...prev,
          [playerKey]: prev[playerKey] + points,
        }));
        setDestroyedTargets((prev) => prev + 1);
      }
    }
  }, [currentPlayer, maxCombo]);

  const activatePowerUp = useCallback((effect, duration) => {
    const playerKey = currentPlayer === 1 ? 'player1' : 'player2';
    setGameStats((prev) => ({
      ...prev,
      [playerKey]: { ...prev[playerKey], powerUpsUsed: prev[playerKey].powerUpsUsed + 1 },
    }));

    switch (effect) {
      case 'damage_x2':
        setIsFireBlade(true);
        isFireRef.current = true;
        setTimeout(() => { setIsFireBlade(false); isFireRef.current = false; }, duration);
        break;
      case 'freeze_targets':
        setIsIceBlade(true);
        isIceRef.current = true;
        setTimeout(() => { setIsIceBlade(false); isIceRef.current = false; }, duration);
        break;
      case 'triple_throw':
        setIsMultiThrow(true);
        isMultiRef.current = true;
        setTimeout(() => { setIsMultiThrow(false); isMultiRef.current = false; }, duration);
        break;
      case 'perfect_accuracy':
        setIsPrecision(true);
        isPrecisionRef.current = true;
        setTimeout(() => { setIsPrecision(false); isPrecisionRef.current = false; }, duration);
        break;
      case 'no_cooldown':
        setIsQuickDraw(true);
        isQuickDrawRef.current = true;
        setTimeout(() => { setIsQuickDraw(false); isQuickDrawRef.current = false; }, duration);
        break;
      case 'restore_energy':
        setPlayerEnergy(100);
        break;
    }
  }, [currentPlayer]);

  // Aim controls
  const adjustAim = useCallback((direction) => {
    if (!gameActive) return;
    setAimAngle((prev) => {
      if (direction === 'left') return Math.max(-60, prev - 3);
      if (direction === 'right') return Math.min(60, prev + 3);
      return prev;
    });
  }, [gameActive]);

  const adjustAimFine = useCallback((direction) => {
    if (!gameActive) return;
    setAimAngle((prev) => {
      if (direction === 'left') return Math.max(-60, prev - 1);
      if (direction === 'right') return Math.min(60, prev + 1);
      return prev;
    });
  }, [gameActive]);

  // Start power charge
  const startCharge = useCallback(() => {
    if (!gameActive || throwCooldown || playerEnergy < 10) return;
    setPowerCharging(true);
    setPowerLevel(0);
    setPowerIncreasing(true);
  }, [gameActive, throwCooldown, playerEnergy]);

  // Release throw
  const releaseThrow = useCallback(() => {
    if (!powerCharging) return;
    setPowerCharging(false);

    const sword = selectedSwordRef.current;
    const power = powerLevel;
    const angle = aimAngle;
    const precise = isPrecisionRef.current;

    // Energy cost
    const energyCost = 8 + sword.weight * 3;
    setPlayerEnergy((prev) => Math.max(0, prev - energyCost));

    const playerKey = currentPlayer === 1 ? 'player1' : 'player2';
    setGameStats((prev) => ({
      ...prev,
      [playerKey]: { ...prev[playerKey], swordsThrown: prev[playerKey].swordsThrown + 1 },
    }));

    // Throw animation
    throwAnim.setValue(0);
    Animated.timing(throwAnim, { toValue: 1, duration: 300, useNativeDriver: false }).start();

    // Calculate trajectory
    const speedMultiplier = (power / 100) * sword.speed;
    const radians = ((90 + angle) * Math.PI) / 180;

    // Accuracy deviation
    const accuracyFactor = precise ? 0 : (1 - sword.accuracy) * 15;
    const deviation = (Math.random() - 0.5) * accuracyFactor;

    const baseVX = Math.cos(radians + deviation * 0.1) * speedMultiplier;
    const baseVY = -Math.sin(radians + deviation * 0.1) * speedMultiplier;

    const createSword = (offsetAngle) => ({
      id: Date.now() + Math.random() + offsetAngle,
      x: width / 2,
      y: height * 0.55,
      vx: Math.cos(radians + offsetAngle * 0.15 + deviation * 0.1) * speedMultiplier,
      vy: -Math.sin(radians + offsetAngle * 0.15 + deviation * 0.1) * speedMultiplier,
      rotation: 0,
      emoji: sword.emoji,
      damage: sword.damage,
      hit: false,
    });

    const newSwords = [createSword(0)];
    if (isMultiRef.current) {
      newSwords.push(createSword(-1));
      newSwords.push(createSword(1));
    }

    setFlyingSwords((prev) => [...prev, ...newSwords]);

    // Cooldown
    if (!isQuickDrawRef.current) {
      setThrowCooldown(true);
      const cooldownTime = Math.max(300, 1000 - sword.speed * 80);
      setTimeout(() => setThrowCooldown(false), cooldownTime);
    }
  }, [powerCharging, powerLevel, aimAngle, currentPlayer, selectedSword]);

  // Select sword
  const selectSword = useCallback((sword) => {
    setSelectedSword(sword);
    selectedSwordRef.current = sword;
  }, []);

  const startPlaying = () => {
    if (!selectedSkin) {
      Alert.alert('⚠️ Select a Character!');
      return;
    }
    setGamePhase('playing');
    setGameActive(true);
    gameActiveRef.current = true;
    setGameTime(60);
    setPlayerEnergy(100);
    setTargets([]);
    setFlyingSwords([]);
    setFieldPowerUps([]);
    setDestroyedTargets(0);
    setCombo(0);
    comboRef.current = 0;
    setMaxCombo(0);
    setAimAngle(0);
    setPowerLevel(50);
    setThrowCooldown(false);
    setIsFireBlade(false); isFireRef.current = false;
    setIsIceBlade(false); isIceRef.current = false;
    setIsMultiThrow(false); isMultiRef.current = false;
    setIsPrecision(false); isPrecisionRef.current = false;
    setIsQuickDraw(false); isQuickDrawRef.current = false;
    setSelectedSword(SWORD_TYPES[0]); selectedSwordRef.current = SWORD_TYPES[0];
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
    const bonus = destroyedTargets * 3;
    setScores((prev) => ({ ...prev, [playerKey]: prev[playerKey] + bonus }));

    if (currentPlayer === 1) {
      Alert.alert(
        '⏱️ Turn Over!',
        `Player 1:\nScore: ${scores.player1 + bonus}\nDestroyed: ${destroyedTargets}\nMax Combo: x${maxCombo}`,
        [{ text: "Player 2's Turn!", onPress: switchPlayer }]
      );
    } else {
      handleEndRound();
    }
  }, [currentPlayer, scores, destroyedTargets, maxCombo]);

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
    else winner = "🤝 Tie!";

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
    let champion = scores.player1 > scores.player2 ? '🏆 Player 1!' : scores.player2 > scores.player1 ? '🏆 Player 2!' : "🤝 Tie!";

    Alert.alert(
      '🎮 Game Over!',
      `${champion}\n\nP1: ${scores.player1} | P2: ${scores.player2}\nHits: P1 ${p1.targetsHit} | P2 ${p2.targetsHit}\nCrits: P1 ${p1.criticalHits} | P2 ${p2.criticalHits}\nBosses: P1 ${p1.bossesKilled} | P2 ${p2.bossesKilled}\nCombo: P1 x${p1.maxCombo} | P2 x${p2.maxCombo}`,
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
      player1: { swordsThrown: 0, targetsHit: 0, targetsMissed: 0, criticalHits: 0, maxCombo: 0, powerUpsUsed: 0, totalDamage: 0, bossesKilled: 0 },
      player2: { swordsThrown: 0, targetsHit: 0, targetsMissed: 0, criticalHits: 0, maxCombo: 0, powerUpsUsed: 0, totalDamage: 0, bossesKilled: 0 },
    });
  }, []);

  const playerKey = currentPlayer === 1 ? 'player1' : 'player2';
  const currentStats = gameStats[playerKey];
  const accuracy = currentStats.swordsThrown > 0 ? Math.round((currentStats.targetsHit / currentStats.swordsThrown) * 100) : 0;

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
    return '🔴 WEAK';
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backBtn}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>🗡️ Sword Thrower</Text>
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
          <Text style={styles.destroyedText}>💀 {destroyedTargets}</Text>
        </View>
        <View style={styles.scoreTeam}>
          <Text style={styles.teamLabel}>{currentPlayer === 2 ? '►' : ''} P2</Text>
          <Text style={[styles.teamScore, { color: '#4ECDC4' }]}>{scores.player2}</Text>
        </View>
      </View>

      {/* Character Selection */}
      {gamePhase === 'select' && (
        <View style={styles.selectPhase}>
          <Text style={styles.selectTitle}>🎮 Player {currentPlayer} - Choose Warrior:</Text>
          <View style={styles.skinGrid}>
            {CHARACTER_SKINS.map((skin) => (
              <TouchableOpacity
                key={skin.id}
                style={[styles.skinCard, selectedSkin?.id === skin.id && styles.skinCardSelected]}
                onPress={() => setSelectedSkin(skin)}
              >
                <Text style={styles.skinEmoji}>{skin.emoji}</Text>
                <Text style={styles.skinName}>{skin.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
          {selectedSkin && (
            <TouchableOpacity style={styles.goBtn} onPress={startPlaying}>
              <Text style={styles.goBtnText}>⚔️ START THROWING!</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Playing Phase */}
      {gamePhase === 'playing' && (
        <>
          {/* Status */}
          <View style={[styles.statusBar, isFireBlade && styles.statusFire, isIceBlade && styles.statusIce]}>
            <View style={styles.statusLeft}>
              <Text style={styles.swordLabel}>{selectedSword.emoji} {selectedSword.label}</Text>
              {combo > 1 && (
                <Animated.Text style={[styles.comboText, { transform: [{ scale: comboAnim }] }]}>
                  🔥 x{combo}
                </Animated.Text>
              )}
            </View>
            <View style={styles.activeEffects}>
              {isFireBlade && <Text style={styles.effectEmoji}>🔥</Text>}
              {isIceBlade && <Text style={styles.effectEmoji}>❄️</Text>}
              {isMultiThrow && <Text style={styles.effectEmoji}>🌟</Text>}
              {isPrecision && <Text style={styles.effectEmoji}>🎯</Text>}
              {isQuickDraw && <Text style={styles.effectEmoji}>⚡</Text>}
            </View>
          </View>

          {/* Energy Bar */}
          <View style={styles.energyContainer}>
            <Text style={styles.energyLabel}>⚡ {Math.round(playerEnergy)}%</Text>
            <View style={styles.energyBar}>
              <View style={[styles.energyFill, { width: `${playerEnergy}%` }]} />
            </View>
          </View>

          {/* Arena */}
          <Animated.View style={[styles.arena, { transform: [{ translateX: shakeAnim }] }]}>
            {/* Targets */}
            {targets.map((target) =>
              !target.destroyed ? (
                <View
                  key={target.id}
                  style={[
                    styles.target,
                    {
                      left: target.x - target.size / 2,
                      top: target.y - target.size / 2,
                      width: target.size,
                      height: target.size,
                      borderColor: target.frozen ? '#87CEEB' : target.color,
                      opacity: target.frozen ? 0.7 : 1,
                    },
                  ]}
                >
                  <Text style={[
                    styles.targetEmoji,
                    target.size > 45 && { fontSize: 28 },
                    target.size < 35 && { fontSize: 18 },
                  ]}>{target.emoji}</Text>
                  {target.hitCount > 0 && (
                    <View style={styles.targetHPBar}>
                      <View style={[styles.targetHPFill, { width: `${(target.hp / target.maxHP) * 100}%` }]} />
                    </View>
                  )}
                  <Text style={styles.targetPts}>{target.points > 0 ? `+${target.points}` : target.points}</Text>
                </View>
              ) : (
                <View key={target.id} style={[styles.destroyedTarget, { left: target.x - 15, top: target.y - 15 }]}>
                  <Text style={styles.destroyedEmoji}>💥</Text>
                </View>
              )
            )}

            {/* Power-ups */}
            {fieldPowerUps.map((pu) => (
              <View key={pu.id} style={[styles.fieldPU, { left: pu.x - 15, top: pu.y - 15 }]}>
                <Text style={styles.fieldPUEmoji}>{pu.emoji}</Text>
              </View>
            ))}

            {/* Flying swords */}
            {flyingSwords.map((sword) => (
              <View
                key={sword.id}
                style={[
                  styles.flyingSword,
                  {
                    left: sword.x - 12,
                    top: sword.y - 12,
                    transform: [{ rotate: `${sword.rotation}deg` }],
                  },
                ]}
              >
                <Text style={styles.swordEmoji}>{sword.emoji}</Text>
              </View>
            ))}

            {/* Player */}
            <View style={[styles.player, { left: width / 2 - 22 }]}>
              <Text style={styles.playerEmoji}>{selectedSkin?.emoji || '🥷'}</Text>
            </View>

            {/* Aim line */}
            <Animated.View
              style={[
                styles.aimLine,
                {
                  left: width / 2 - 1,
                  bottom: 70,
                  opacity: aimLineAnim,
                  transform: [{ rotate: `${-aimAngle}deg` }],
                },
              ]}
            />

            {/* Hit flash */}
            <Animated.View style={[styles.hitFlash, { opacity: hitFlashAnim }]} />
          </Animated.View>

          {/* Aim Controls */}
          <View style={styles.aimControls}>
            <TouchableOpacity style={styles.aimBtn} onPress={() => adjustAim('left')}>
              <Text style={styles.aimBtnText}>◄◄</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.aimBtnFine} onPress={() => adjustAimFine('left')}>
              <Text style={styles.aimFineBtnText}>◄</Text>
            </TouchableOpacity>

            <View style={styles.aimDisplay}>
              <Text style={styles.aimAngleText}>
                {aimAngle === 0 ? '↑ Center' : aimAngle < 0 ? `↰ ${Math.abs(aimAngle)}°` : `↱ ${aimAngle}°`}
              </Text>
            </View>

            <TouchableOpacity style={styles.aimBtnFine} onPress={() => adjustAimFine('right')}>
              <Text style={styles.aimFineBtnText}>►</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.aimBtn} onPress={() => adjustAim('right')}>
              <Text style={styles.aimBtnText}>►►</Text>
            </TouchableOpacity>
          </View>

          {/* Power & Throw */}
          <View style={styles.throwSection}>
            {powerCharging && (
              <View style={styles.powerContainer}>
                <View style={styles.powerHeader}>
                  <Text style={styles.powerLabel}>Power: {Math.round(powerLevel)}%</Text>
                  <Text style={[styles.powerQuality, { color: getPowerColor() }]}>{getPowerLabel()}</Text>
                </View>
                <View style={styles.powerBar}>
                  <View style={[styles.powerFill, { width: `${powerLevel}%`, backgroundColor: getPowerColor() }]} />
                  <View style={styles.sweetSpot} />
                </View>
              </View>
            )}

            {!powerCharging ? (
              <TouchableOpacity
                style={[styles.chargeBtn, (throwCooldown || playerEnergy < 10) && styles.btnDisabled]}
                onPress={startCharge}
                disabled={throwCooldown || playerEnergy < 10}
              >
                <Text style={styles.chargeBtnText}>
                  {throwCooldown ? '⏳ Cooldown...' : playerEnergy < 10 ? '⚡ Low Energy' : `⚡ Charge ${selectedSword.emoji}`}
                </Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.throwBtn, { backgroundColor: getPowerColor() }]}
                onPress={releaseThrow}
              >
                <Text style={styles.throwBtnText}>🗡️ THROW! ({Math.round(powerLevel)}%)</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Sword Selection */}
          <View style={styles.swordShop}>
            <View style={styles.swordRow}>
              {SWORD_TYPES.map((sword) => (
                <TouchableOpacity
                  key={sword.id}
                  style={[
                    styles.swordItem,
                    selectedSword.id === sword.id && styles.swordItemSelected,
                  ]}
                  onPress={() => selectSword(sword)}
                >
                  <Text style={styles.swordItemEmoji}>{sword.emoji}</Text>
                  <Text style={styles.swordItemName}>{sword.label}</Text>
                  <Text style={styles.swordItemStat}>⚔️{sword.damage} 🎯{Math.round(sword.accuracy * 100)}%</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </>
      )}

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Thrown</Text>
          <Text style={styles.statValue}>{currentStats.swordsThrown}</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Hits</Text>
          <Text style={[styles.statValue, { color: '#4ECDC4' }]}>{currentStats.targetsHit}</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Accuracy</Text>
          <Text style={[styles.statValue, { color: '#FFD700' }]}>{accuracy}%</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Crits</Text>
          <Text style={[styles.statValue, { color: '#FF6B6B' }]}>{currentStats.criticalHits}</Text>
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
    backgroundColor: '#1A1A2E',
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
    backgroundColor: '#16213E',
    borderBottomWidth: 2,
    borderBottomColor: '#C0C0C0',
  },
  scoreTeam: { alignItems: 'center', width: 70 },
  teamLabel: { fontSize: 11, color: '#AAA', fontWeight: 'bold' },
  teamScore: { fontSize: 24, fontWeight: 'bold' },
  gameInfoCenter: { alignItems: 'center' },
  timerText: { fontSize: 18, fontWeight: 'bold' },
  destroyedText: { fontSize: 12, color: '#FF6B6B', fontWeight: 'bold' },

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
    borderColor: '#2A3A5C',
    backgroundColor: '#1B2A4A',
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
    backgroundColor: '#C0392B',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
    borderWidth: 2,
    borderColor: '#E74C3C',
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
  statusFire: { backgroundColor: '#8B0000' },
  statusIce: { backgroundColor: '#1A5276' },
  statusLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  swordLabel: { fontSize: 11, fontWeight: 'bold', color: '#FFF' },
  comboText: { fontSize: 14, fontWeight: 'bold', color: '#FFD700' },
  activeEffects: { flexDirection: 'row', gap: 4 },
  effectEmoji: { fontSize: 14 },

  energyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg || 20,
    paddingVertical: 3,
    backgroundColor: '#16213E',
    gap: 6,
  },
  energyLabel: { fontSize: 10, color: '#FFD700', width: 42 },
  energyBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#333',
    borderRadius: 4,
    overflow: 'hidden',
  },
  energyFill: { height: '100%', backgroundColor: '#FFD700', borderRadius: 4 },

  arena: {
    flex: 1,
    backgroundColor: '#1B2A4A',
    marginHorizontal: 10,
    marginVertical: 4,
    borderRadius: BORDER_RADIUS.md || 10,
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#2A3A5C',
  },

  target: {
    position: 'absolute',
    borderRadius: 10,
    borderWidth: 2,
    backgroundColor: '#00000033',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 5,
  },
  targetEmoji: { fontSize: 22 },
  targetHPBar: {
    position: 'absolute',
    bottom: -6,
    width: '80%',
    height: 4,
    backgroundColor: '#333',
    borderRadius: 2,
    overflow: 'hidden',
  },
  targetHPFill: {
    height: '100%',
    backgroundColor: '#FF6B6B',
    borderRadius: 2,
  },
  targetPts: { fontSize: 7, color: '#CCC', position: 'absolute', top: -10 },

  destroyedTarget: {
    position: 'absolute',
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 5,
  },
  destroyedEmoji: { fontSize: 24 },

  fieldPU: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#FFD70033',
    borderWidth: 2,
    borderColor: '#FFD700',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 8,
  },
  fieldPUEmoji: { fontSize: 16 },

  flyingSword: {
    position: 'absolute',
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 15,
  },
  swordEmoji: { fontSize: 20 },

  player: {
    position: 'absolute',
    bottom: 15,
    width: 44,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  playerEmoji: { fontSize: 34 },

  aimLine: {
    position: 'absolute',
    width: 2,
    height: 80,
    backgroundColor: '#FF6B6B66',
    zIndex: 12,
    transformOrigin: 'bottom center',
  },

  hitFlash: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#FFD70022',
    zIndex: 20,
  },

  aimControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 10,
    gap: 4,
  },
  aimBtn: {
    width: 45,
    height: 36,
    backgroundColor: '#2A3A5C',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#4A5A7C',
  },
  aimBtnText: { fontSize: 14, fontWeight: 'bold', color: '#FFF' },
  aimBtnFine: {
    width: 35,
    height: 36,
    backgroundColor: '#1E2D4D',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#3A4A6C',
  },
  aimFineBtnText: { fontSize: 14, color: '#AAA', fontWeight: 'bold' },
  aimDisplay: {
    flex: 1,
    alignItems: 'center',
  },
  aimAngleText: { fontSize: 13, fontWeight: 'bold', color: '#FFD700' },

  throwSection: {
    paddingHorizontal: SPACING.lg || 20,
    paddingVertical: 4,
  },
  powerContainer: { marginBottom: 6 },
  powerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  powerLabel: { fontSize: 11, fontWeight: 'bold', color: '#FFF' },
  powerQuality: { fontSize: 11, fontWeight: 'bold' },
  powerBar: {
    height: 16,
    backgroundColor: '#333',
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  powerFill: { height: '100%', borderRadius: 8 },
  sweetSpot: {
    position: 'absolute',
    left: '75%',
    width: '10%',
    height: '100%',
    borderWidth: 2,
    borderColor: '#4ECDC466',
    borderRadius: 8,
  },

  chargeBtn: {
    backgroundColor: '#2A3A5C',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#4A5A7C',
  },
  chargeBtnText: { fontSize: 14, fontWeight: 'bold', color: '#FFF' },
  throwBtn: {
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF33',
  },
  throwBtnText: { fontSize: 16, fontWeight: 'bold', color: '#FFF' },
  btnDisabled: { opacity: 0.4 },

  swordShop: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#16213E',
  },
  swordRow: {
    flexDirection: 'row',
    gap: 4,
    justifyContent: 'center',
  },
  swordItem: {
    flex: 1,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#2A3A5C',
    backgroundColor: '#0F1A2E',
    alignItems: 'center',
  },
  swordItemSelected: {
    borderColor: '#FFD700',
    backgroundColor: '#FFD70015',
    borderWidth: 2,
  },
  swordItemEmoji: { fontSize: 14 },
  swordItemName: { fontSize: 7, color: '#FFF', fontWeight: 'bold' },
  swordItemStat: { fontSize: 6, color: '#888' },

  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 5,
    paddingHorizontal: SPACING.md || 10,
    backgroundColor: '#1A1A2E',
  },
  statBox: { alignItems: 'center' },
  statLabel: { fontSize: 8, color: '#888', marginBottom: 1 },
  statValue: { fontSize: 13, fontWeight: 'bold', color: '#FFF' },

  gameOverButtons: {
    paddingHorizontal: SPACING.lg || 20,
    paddingBottom: SPACING.md || 12,
    gap: 8,
  },
  nextBtn: {
    backgroundColor: '#C0392B',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E74C3C',
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
