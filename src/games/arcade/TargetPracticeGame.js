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

const WEAPON_TYPES = [
  { id: 'pistol', emoji: '🔫', label: 'Pistol', damage: 15, fireRate: 600, accuracy: 0.80, ammo: 12, reload: 1500, recoil: 2, color: '#4ECDC4' },
  { id: 'rifle', emoji: '🎯', label: 'Rifle', damage: 30, fireRate: 1000, accuracy: 0.90, ammo: 8, reload: 2000, recoil: 5, color: '#FFD700' },
  { id: 'shotgun', emoji: '💥', label: 'Shotgun', damage: 40, fireRate: 1200, accuracy: 0.60, ammo: 6, reload: 2500, recoil: 8, color: '#FF6B6B' },
  { id: 'sniper', emoji: '🔭', label: 'Sniper', damage: 60, fireRate: 2000, accuracy: 0.95, ammo: 5, reload: 3000, recoil: 10, color: '#9B59B6' },
  { id: 'smg', emoji: '⚡', label: 'SMG', damage: 10, fireRate: 200, accuracy: 0.55, ammo: 30, reload: 1800, recoil: 3, color: '#2ECC71' },
  { id: 'crossbow', emoji: '🏹', label: 'Crossbow', damage: 45, fireRate: 1500, accuracy: 0.88, ammo: 1, reload: 800, recoil: 1, color: '#E67E22' },
];

const TARGET_TYPES = [
  { id: 'bullseye', emoji: '🎯', label: 'Bullseye', points: 50, size: 30, speed: 0, hp: 1, color: '#FF0000' },
  { id: 'can', emoji: '🥫', label: 'Tin Can', points: 15, size: 25, speed: 0, hp: 1, color: '#C0C0C0' },
  { id: 'bottle', emoji: '🍾', label: 'Bottle', points: 20, size: 22, speed: 0, hp: 1, color: '#228B22' },
  { id: 'plate', emoji: '🍽️', label: 'Clay Plate', points: 25, size: 28, speed: 2.5, hp: 1, color: '#D2691E' },
  { id: 'balloon', emoji: '🎈', label: 'Balloon', points: 30, size: 26, speed: 1.5, hp: 1, color: '#FF69B4' },
  { id: 'duck', emoji: '🦆', label: 'Duck', points: 35, size: 30, speed: 3, hp: 1, color: '#FFD700' },
  { id: 'bird', emoji: '🐦', label: 'Bird', points: 40, size: 20, speed: 5, hp: 1, color: '#87CEEB' },
  { id: 'bat', emoji: '🦇', label: 'Bat', points: 45, size: 22, speed: 6, hp: 1, color: '#2C3E50' },
  { id: 'ufo', emoji: '🛸', label: 'UFO', points: 60, size: 32, speed: 4, hp: 2, color: '#4ECDC4' },
  { id: 'drone', emoji: '🤖', label: 'Drone', points: 55, size: 28, speed: 3.5, hp: 2, color: '#95A5A6' },
  { id: 'golden', emoji: '⭐', label: 'Golden Star', points: 100, size: 20, speed: 7, hp: 1, color: '#FFD700' },
  { id: 'bomb', emoji: '💣', label: 'Bomb', points: -30, size: 26, speed: 2, hp: 1, color: '#FF0000' },
];

const CHALLENGE_MODES = [
  { id: 'classic', emoji: '🎯', label: 'Classic', description: 'Hit targets for points', timeLimit: 60 },
  { id: 'speed', emoji: '⚡', label: 'Speed Round', description: 'Rapid targets, less time', timeLimit: 30 },
  { id: 'accuracy', emoji: '🔭', label: 'Accuracy', description: 'Fewer shots, higher stakes', timeLimit: 45 },
  { id: 'survival', emoji: '💀', label: 'Survival', description: 'Miss 5 and game over', timeLimit: 90 },
];

const POWERUP_TYPES = [
  { id: 'slow_motion', emoji: '⏳', label: 'Slow Motion', duration: 6000 },
  { id: 'explosive_rounds', emoji: '💣', label: 'Explosive Rounds', duration: 8000 },
  { id: 'rapid_fire', emoji: '🔥', label: 'Rapid Fire', duration: 5000 },
  { id: 'perfect_aim', emoji: '🎯', label: 'Perfect Aim', duration: 7000 },
  { id: 'double_points', emoji: '✖️2️⃣', label: 'Double Points', duration: 10000 },
  { id: 'infinite_ammo', emoji: '♾️', label: 'Infinite Ammo', duration: 8000 },
];

const SCOPE_TYPES = [
  { id: 'iron', emoji: '⊕', label: 'Iron Sights', zoom: 1.0, aimBonus: 0 },
  { id: 'red_dot', emoji: '🔴', label: 'Red Dot', zoom: 1.2, aimBonus: 0.05 },
  { id: 'acog', emoji: '🔬', label: 'ACOG', zoom: 1.5, aimBonus: 0.10 },
  { id: 'scope', emoji: '🔭', label: 'Scope', zoom: 2.0, aimBonus: 0.15 },
];

export default function TargetPracticeGame({ navigation }) {
  const [scores, setScores] = useState({ player1: 0, player2: 0 });
  const [round, setRound] = useState(1);
  const [maxRounds] = useState(3);
  const [gameActive, setGameActive] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [currentPlayer, setCurrentPlayer] = useState(1);
  const [gamePhase, setGamePhase] = useState('select');
  const [gameTime, setGameTime] = useState(60);

  // Mode
  const [selectedMode, setSelectedMode] = useState(CHALLENGE_MODES[0]);

  // Weapon
  const [selectedWeapon, setSelectedWeapon] = useState(null);
  const [selectedScope, setSelectedScope] = useState(SCOPE_TYPES[0]);
  const [currentAmmo, setCurrentAmmo] = useState(12);
  const [maxAmmo, setMaxAmmo] = useState(12);
  const [isReloading, setIsReloading] = useState(false);
  const [canFire, setCanFire] = useState(true);

  // Crosshair
  const [crosshairX, setCrosshairX] = useState(width / 2);
  const [crosshairY, setCrosshairY] = useState(height * 0.25);
  const [recoilOffset, setRecoilOffset] = useState(0);

  // Active effects
  const [isSlowMotion, setIsSlowMotion] = useState(false);
  const [isExplosiveRounds, setIsExplosiveRounds] = useState(false);
  const [isRapidFire, setIsRapidFire] = useState(false);
  const [isPerfectAim, setIsPerfectAim] = useState(false);
  const [isDoublePoints, setIsDoublePoints] = useState(false);
  const [isInfiniteAmmo, setIsInfiniteAmmo] = useState(false);

  // Targets
  const [targets, setTargets] = useState([]);
  const [hitEffects, setHitEffects] = useState([]);

  // Field power-ups
  const [fieldPowerUps, setFieldPowerUps] = useState([]);

  // Combo & streaks
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [lastHitTime, setLastHitTime] = useState(null);
  const [consecutiveHits, setConsecutiveHits] = useState(0);
  const [consecutiveMisses, setConsecutiveMisses] = useState(0);

  // Survival mode
  const [missesAllowed, setMissesAllowed] = useState(5);

  // Stats
  const [gameStats, setGameStats] = useState({
    player1: {
      shotsFired: 0, shotsHit: 0, headshots: 0, maxCombo: 0,
      powerUpsUsed: 0, totalDamage: 0, targetsDestroyed: 0,
      bullseyes: 0, goldenStars: 0,
    },
    player2: {
      shotsFired: 0, shotsHit: 0, headshots: 0, maxCombo: 0,
      powerUpsUsed: 0, totalDamage: 0, targetsDestroyed: 0,
      bullseyes: 0, goldenStars: 0,
    },
  });

  // Refs
  const isSlowRef = useRef(false);
  const isExplosiveRef = useRef(false);
  const isPerfectRef = useRef(false);
  const isDoubleRef = useRef(false);
  const isInfiniteRef = useRef(false);
  const isRapidRef = useRef(false);
  const comboRef = useRef(0);
  const lastHitRef = useRef(null);
  const gameActiveRef = useRef(false);
  const crosshairXRef = useRef(width / 2);
  const crosshairYRef = useRef(height * 0.25);
  const weaponRef = useRef(null);

  useEffect(() => { isSlowRef.current = isSlowMotion; }, [isSlowMotion]);
  useEffect(() => { isExplosiveRef.current = isExplosiveRounds; }, [isExplosiveRounds]);
  useEffect(() => { isPerfectRef.current = isPerfectAim; }, [isPerfectAim]);
  useEffect(() => { isDoubleRef.current = isDoublePoints; }, [isDoublePoints]);
  useEffect(() => { isInfiniteRef.current = isInfiniteAmmo; }, [isInfiniteAmmo]);
  useEffect(() => { isRapidRef.current = isRapidFire; }, [isRapidFire]);
  useEffect(() => { comboRef.current = combo; }, [combo]);
  useEffect(() => { lastHitRef.current = lastHitTime; }, [lastHitTime]);
  useEffect(() => { gameActiveRef.current = gameActive; }, [gameActive]);
  useEffect(() => { crosshairXRef.current = crosshairX; }, [crosshairX]);
  useEffect(() => { crosshairYRef.current = crosshairY; }, [crosshairY]);
  useEffect(() => { weaponRef.current = selectedWeapon; }, [selectedWeapon]);

  // Animations
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const recoilAnim = useRef(new Animated.Value(0)).current;
  const comboAnim = useRef(new Animated.Value(1)).current;
  const flashAnim = useRef(new Animated.Value(0)).current;
  const crosshairPulse = useRef(new Animated.Value(1)).current;
  const scorePopAnim = useRef(new Animated.Value(0)).current;
  const slowMoAnim = useRef(new Animated.Value(1)).current;

  const timerRef = useRef(null);
  const gameLoopRef = useRef(null);
  const spawnRef = useRef(null);
  const puSpawnRef = useRef(null);
  const swayRef = useRef(null);

  useEffect(() => {
    return () => clearAllTimers();
  }, []);

  const clearAllTimers = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    if (spawnRef.current) clearInterval(spawnRef.current);
    if (puSpawnRef.current) clearInterval(puSpawnRef.current);
    if (swayRef.current) clearInterval(swayRef.current);
  };

  // Combo reset
  useEffect(() => {
    if (!lastHitTime) return;
    const timer = setTimeout(() => setCombo(0), 2500);
    return () => clearTimeout(timer);
  }, [lastHitTime]);

  // Crosshair pulse
  useEffect(() => {
    if (!gameActive) return;
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(crosshairPulse, { toValue: 1.15, duration: 600, useNativeDriver: false }),
      Animated.timing(crosshairPulse, { toValue: 1, duration: 600, useNativeDriver: false }),
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

  // Crosshair sway
  useEffect(() => {
    if (!gameActive) return;
    swayRef.current = setInterval(() => {
      if (isPerfectRef.current) return;
      const swayAmount = weaponRef.current ? weaponRef.current.recoil * 0.3 : 1;
      setCrosshairX((prev) => {
        const sway = (Math.random() - 0.5) * swayAmount;
        return Math.max(30, Math.min(width - 30, prev + sway));
      });
      setCrosshairY((prev) => {
        const sway = (Math.random() - 0.5) * swayAmount * 0.5;
        return Math.max(20, Math.min(height * 0.4, prev + sway));
      });
    }, 100);
    return () => { if (swayRef.current) clearInterval(swayRef.current); };
  }, [gameActive]);

  // Target spawning
  useEffect(() => {
    if (!gameActive) return;
    const baseRate = selectedMode.id === 'speed' ? 800 : selectedMode.id === 'accuracy' ? 2500 : 1500;
    const rate = Math.max(500, baseRate - round * 150);

    spawnRef.current = setInterval(() => {
      const rand = Math.random();
      let targetType;

      if (rand < 0.02) targetType = TARGET_TYPES[10]; // golden
      else if (rand < 0.08) targetType = TARGET_TYPES[11]; // bomb
      else if (rand < 0.13) targetType = TARGET_TYPES[8]; // ufo
      else if (rand < 0.18) targetType = TARGET_TYPES[9]; // drone
      else if (rand < 0.25) targetType = TARGET_TYPES[7]; // bat
      else if (rand < 0.33) targetType = TARGET_TYPES[6]; // bird
      else if (rand < 0.42) targetType = TARGET_TYPES[5]; // duck
      else if (rand < 0.52) targetType = TARGET_TYPES[4]; // balloon
      else if (rand < 0.62) targetType = TARGET_TYPES[3]; // plate
      else if (rand < 0.75) targetType = TARGET_TYPES[0]; // bullseye
      else if (rand < 0.87) targetType = TARGET_TYPES[2]; // bottle
      else targetType = TARGET_TYPES[1]; // can

      const side = Math.random() > 0.5 ? 'left' : 'right';
      const startX = side === 'left' ? -30 : width + 30;
      const targetY = 30 + Math.random() * (height * 0.28);
      const speedMod = isSlowRef.current ? 0.3 : 1;

      const newTarget = {
        id: Date.now() + Math.random(),
        type: targetType.id,
        emoji: targetType.emoji,
        label: targetType.label,
        hp: targetType.hp,
        maxHP: targetType.hp,
        points: targetType.points,
        size: targetType.size,
        color: targetType.color,
        x: startX,
        y: targetY,
        vx: (side === 'left' ? 1 : -1) * targetType.speed * speedMod * (0.8 + Math.random() * 0.4),
        vy: (Math.random() - 0.5) * 0.5,
        destroyed: false,
      };

      setTargets((prev) => [...prev.slice(-18), newTarget]);
    }, rate);

    return () => { if (spawnRef.current) clearInterval(spawnRef.current); };
  }, [gameActive, selectedMode, round]);

  // Power-up spawning
  useEffect(() => {
    if (!gameActive) return;
    puSpawnRef.current = setInterval(() => {
      if (Math.random() < 0.25) {
        const puType = POWERUP_TYPES[Math.floor(Math.random() * POWERUP_TYPES.length)];
        setFieldPowerUps((prev) => [
          ...prev.slice(-4),
          {
            id: Date.now() + Math.random(),
            type: puType.id,
            emoji: puType.emoji,
            label: puType.label,
            duration: puType.duration,
            x: 40 + Math.random() * (width - 80),
            y: 20 + Math.random() * (height * 0.3),
            collected: false,
          },
        ]);
      }
    }, 6000);
    return () => { if (puSpawnRef.current) clearInterval(puSpawnRef.current); };
  }, [gameActive]);

  // Main game loop - move targets
  useEffect(() => {
    if (!gameActive) return;

    gameLoopRef.current = setInterval(() => {
      const slow = isSlowRef.current;

      setTargets((prev) =>
        prev
          .map((t) => {
            if (t.destroyed) return t;
            const speedMod = slow ? 0.3 : 1;
            let newY = t.y + t.vy * speedMod;
            if (newY < 15 || newY > height * 0.38) t.vy = -t.vy;
            return { ...t, x: t.x + t.vx * speedMod, y: Math.max(15, Math.min(height * 0.38, newY)) };
          })
          .filter((t) => t.x > -60 && t.x < width + 60)
      );

      // Move hit effects
      setHitEffects((prev) =>
        prev.map((e) => ({ ...e, opacity: e.opacity - 0.03, y: e.y - 1 })).filter((e) => e.opacity > 0)
      );
    }, slow ? 40 : 20);

    return () => { if (gameLoopRef.current) clearInterval(gameLoopRef.current); };
  }, [gameActive]);

  // Aim movement
  const moveAim = useCallback((dx, dy) => {
    if (!gameActive || isReloading) return;
    const zoom = selectedScope.zoom;
    const moveSpeed = 8 / zoom;
    setCrosshairX((prev) => Math.max(20, Math.min(width - 20, prev + dx * moveSpeed)));
    setCrosshairY((prev) => Math.max(10, Math.min(height * 0.42, prev + dy * moveSpeed)));
  }, [gameActive, isReloading, selectedScope]);

  // Fire weapon
  const fireWeapon = useCallback(() => {
    if (!gameActive || !canFire || isReloading) return;
    if (currentAmmo <= 0 && !isInfiniteRef.current) {
      reloadWeapon();
      return;
    }

    const weapon = selectedWeapon;
    if (!weapon) return;

    setCanFire(false);

    // Use ammo
    if (!isInfiniteRef.current) {
      setCurrentAmmo((prev) => prev - 1);
    }

    const playerKey = currentPlayer === 1 ? 'player1' : 'player2';
    setGameStats((prev) => ({
      ...prev,
      [playerKey]: { ...prev[playerKey], shotsFired: prev[playerKey].shotsFired + 1 },
    }));

    // Flash effect
    flashAnim.setValue(1);
    Animated.timing(flashAnim, { toValue: 0, duration: 150, useNativeDriver: false }).start();

    // Recoil animation
    recoilAnim.setValue(0);
    Animated.sequence([
      Animated.timing(recoilAnim, { toValue: 1, duration: 50, useNativeDriver: false }),
      Animated.timing(recoilAnim, { toValue: 0, duration: 200, useNativeDriver: false }),
    ]).start();

    // Apply recoil to crosshair
    if (!isPerfectRef.current) {
      setCrosshairY((prev) => Math.max(10, prev - weapon.recoil));
      setCrosshairX((prev) => prev + (Math.random() - 0.5) * weapon.recoil * 2);
    }

    // Calculate hit
    const aimX = crosshairX;
    const aimY = crosshairY;
    const accuracy = weapon.accuracy + selectedScope.aimBonus + (isPerfectRef.current ? 0.5 : 0);
    const hitDeviation = (1 - accuracy) * 20;
    const finalX = aimX + (Math.random() - 0.5) * hitDeviation;
    const finalY = aimY + (Math.random() - 0.5) * hitDeviation;

    let hitAny = false;
    const explosiveRadius = isExplosiveRef.current ? 40 : 0;

    setTargets((prev) => {
      return prev.map((target) => {
        if (target.destroyed) return target;

        const dist = Math.sqrt(Math.pow(finalX - target.x, 2) + Math.pow(finalY - target.y, 2));
        const hitRadius = target.size * 0.6 + explosiveRadius;

        if (dist <= hitRadius) {
          hitAny = true;
          const newHP = target.hp - 1;

          if (newHP <= 0) {
            handleTargetHit(target, dist, finalX, finalY);
            return { ...target, destroyed: true, hp: 0 };
          } else {
            return { ...target, hp: newHP };
          }
        }
        return target;
      });
    });

    // Check power-up hits
    setFieldPowerUps((prev) =>
      prev.map((pu) => {
        if (pu.collected) return pu;
        const dist = Math.sqrt(Math.pow(finalX - pu.x, 2) + Math.pow(finalY - pu.y, 2));
        if (dist < 25) {
          activatePowerUp(pu.type, pu.duration);
          return { ...pu, collected: true };
        }
        return pu;
      }).filter((pu) => !pu.collected)
    );

    if (!hitAny) {
      handleMiss();
    }

    // Fire rate cooldown
    const fireRate = isRapidRef.current ? weapon.fireRate * 0.3 : weapon.fireRate;
    setTimeout(() => setCanFire(true), fireRate);
  }, [gameActive, canFire, isReloading, currentAmmo, selectedWeapon, selectedScope, crosshairX, crosshairY, currentPlayer]);

  const handleTargetHit = useCallback((target, distance, hitX, hitY) => {
    const now = Date.now();
    const newCombo = lastHitRef.current && now - lastHitRef.current < 2500 ? comboRef.current + 1 : 1;
    setCombo(newCombo);
    comboRef.current = newCombo;
    if (newCombo > maxCombo) setMaxCombo(newCombo);
    setLastHitTime(now);
    lastHitRef.current = now;
    setConsecutiveHits((prev) => prev + 1);
    setConsecutiveMisses(0);

    // Distance bonus (closer to center = more bonus)
    const distanceBonus = Math.max(0, Math.round((1 - distance / (target.size * 0.6)) * 10));
    const isHeadshot = distance < target.size * 0.2;
    const headshotBonus = isHeadshot ? 20 : 0;

    const comboBonus = (newCombo - 1) * 5;
    const multiplier = isDoubleRef.current ? 2 : 1;
    const basePoints = target.points;
    const totalPoints = basePoints > 0 ? (basePoints + distanceBonus + headshotBonus + comboBonus) * multiplier : basePoints;

    const playerKey = currentPlayer === 1 ? 'player1' : 'player2';
    setScores((prev) => ({
      ...prev,
      [playerKey]: Math.max(0, prev[playerKey] + totalPoints),
    }));

    setGameStats((prev) => ({
      ...prev,
      [playerKey]: {
        ...prev[playerKey],
        shotsHit: prev[playerKey].shotsHit + 1,
        targetsDestroyed: prev[playerKey].targetsDestroyed + 1,
        headshots: prev[playerKey].headshots + (isHeadshot ? 1 : 0),
        maxCombo: Math.max(prev[playerKey].maxCombo, newCombo),
        totalDamage: prev[playerKey].totalDamage + totalPoints,
        bullseyes: prev[playerKey].bullseyes + (target.type === 'bullseye' ? 1 : 0),
        goldenStars: prev[playerKey].goldenStars + (target.type === 'golden' ? 1 : 0),
      },
    }));

    // Hit effect
    const effectEmoji = target.points < 0 ? '💣💥' : isHeadshot ? '💥🎯' : '💥';
    setHitEffects((prev) => [
      ...prev.slice(-10),
      {
        id: Date.now() + Math.random(),
        x: hitX,
        y: hitY,
        emoji: effectEmoji,
        text: totalPoints > 0 ? `+${totalPoints}` : `${totalPoints}`,
        color: totalPoints > 0 ? '#FFD700' : '#FF0000',
        opacity: 1,
      },
    ]);

    // Combo animation
    if (newCombo > 1) {
      comboAnim.setValue(0.5);
      Animated.spring(comboAnim, { toValue: 1, friction: 3, tension: 200, useNativeDriver: false }).start();
    }

    // Score popup
    scorePopAnim.setValue(0);
    Animated.sequence([
      Animated.spring(scorePopAnim, { toValue: 1, friction: 4, tension: 200, useNativeDriver: false }),
      Animated.timing(scorePopAnim, { toValue: 0, duration: 500, delay: 300, useNativeDriver: false }),
    ]).start();

    if (target.points < 0) {
      // Bomb hit - screen shake
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: 15, duration: 50, useNativeDriver: false }),
        Animated.timing(shakeAnim, { toValue: -15, duration: 50, useNativeDriver: false }),
        Animated.timing(shakeAnim, { toValue: 8, duration: 50, useNativeDriver: false }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: false }),
      ]).start();
    }
  }, [currentPlayer, maxCombo]);

  const handleMiss = useCallback(() => {
    setCombo(0);
    comboRef.current = 0;
    setConsecutiveHits(0);
    setConsecutiveMisses((prev) => {
      const newMisses = prev + 1;
      if (selectedMode.id === 'survival') {
        setMissesAllowed((ma) => {
          const remaining = ma - 1;
          if (remaining <= 0) {
            Alert.alert('💀 Game Over!', 'Too many misses!', [
              { text: 'Continue', onPress: () => endTurn() },
            ]);
          }
          return remaining;
        });
      }
      return newMisses;
    });
  }, [selectedMode]);

  const reloadWeapon = useCallback(() => {
    if (isReloading || !selectedWeapon) return;
    setIsReloading(true);
    setCanFire(false);

    const reloadTime = selectedWeapon.reload;
    setTimeout(() => {
      setCurrentAmmo(selectedWeapon.ammo);
      setIsReloading(false);
      setCanFire(true);
    }, reloadTime);
  }, [isReloading, selectedWeapon]);

  const activatePowerUp = useCallback((type, duration) => {
    const playerKey = currentPlayer === 1 ? 'player1' : 'player2';
    setGameStats((prev) => ({
      ...prev,
      [playerKey]: { ...prev[playerKey], powerUpsUsed: prev[playerKey].powerUpsUsed + 1 },
    }));

    switch (type) {
      case 'slow_motion':
        setIsSlowMotion(true); isSlowRef.current = true;
        Animated.timing(slowMoAnim, { toValue: 0.5, duration: 500, useNativeDriver: false }).start();
        setTimeout(() => {
          setIsSlowMotion(false); isSlowRef.current = false;
          Animated.timing(slowMoAnim, { toValue: 1, duration: 500, useNativeDriver: false }).start();
        }, duration);
        break;
      case 'explosive_rounds':
        setIsExplosiveRounds(true); isExplosiveRef.current = true;
        setTimeout(() => { setIsExplosiveRounds(false); isExplosiveRef.current = false; }, duration);
        break;
      case 'rapid_fire':
        setIsRapidFire(true); isRapidRef.current = true;
        setTimeout(() => { setIsRapidFire(false); isRapidRef.current = false; }, duration);
        break;
      case 'perfect_aim':
        setIsPerfectAim(true); isPerfectRef.current = true;
        setTimeout(() => { setIsPerfectAim(false); isPerfectRef.current = false; }, duration);
        break;
      case 'double_points':
        setIsDoublePoints(true); isDoubleRef.current = true;
        setTimeout(() => { setIsDoublePoints(false); isDoubleRef.current = false; }, duration);
        break;
      case 'infinite_ammo':
        setIsInfiniteAmmo(true); isInfiniteRef.current = true;
        setTimeout(() => { setIsInfiniteAmmo(false); isInfiniteRef.current = false; }, duration);
        break;
    }
  }, [currentPlayer]);

  const startPlaying = () => {
    if (!selectedWeapon) {
      Alert.alert('⚠️ Select a Weapon!');
      return;
    }
    setGamePhase('playing');
    setGameActive(true);
    gameActiveRef.current = true;
    setGameTime(selectedMode.timeLimit);
    setCurrentAmmo(selectedWeapon.ammo);
    setMaxAmmo(selectedWeapon.ammo);
    setCanFire(true);
    setIsReloading(false);
    setCrosshairX(width / 2);
    setCrosshairY(height * 0.25);
    setTargets([]);
    setHitEffects([]);
    setFieldPowerUps([]);
    setCombo(0); comboRef.current = 0;
    setMaxCombo(0);
    setConsecutiveHits(0);
    setConsecutiveMisses(0);
    setMissesAllowed(5);
    setRecoilOffset(0);
    setIsSlowMotion(false); isSlowRef.current = false;
    setIsExplosiveRounds(false); isExplosiveRef.current = false;
    setIsRapidFire(false); isRapidRef.current = false;
    setIsPerfectAim(false); isPerfectRef.current = false;
    setIsDoublePoints(false); isDoubleRef.current = false;
    setIsInfiniteAmmo(false); isInfiniteRef.current = false;
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
    const stats = gameStats[playerKey];
    const accuracy = stats.shotsFired > 0 ? Math.round((stats.shotsHit / stats.shotsFired) * 100) : 0;

    if (currentPlayer === 1) {
      Alert.alert(
        '⏱️ Turn Over!',
        `Player 1:\nScore: ${scores.player1}\nAccuracy: ${accuracy}%\nHeadshots: ${stats.headshots}\nMax Combo: x${maxCombo}`,
        [{ text: "Player 2's Turn!", onPress: switchPlayer }]
      );
    } else {
      handleEndRound();
    }
  }, [currentPlayer, scores, gameStats, maxCombo]);

  const switchPlayer = useCallback(() => {
    setCurrentPlayer(2);
    setGamePhase('select');
    setSelectedWeapon(null);
    setGameActive(false);
    gameActiveRef.current = false;
  }, []);

  const handleEndRound = useCallback(() => {
    setGamePhase('ended');
    let winner = scores.player1 > scores.player2 ? '🏆 Player 1!' : scores.player2 > scores.player1 ? '🏆 Player 2!' : "🤝 Tie!";

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
    const p1Acc = p1.shotsFired > 0 ? Math.round((p1.shotsHit / p1.shotsFired) * 100) : 0;
    const p2Acc = p2.shotsFired > 0 ? Math.round((p2.shotsHit / p2.shotsFired) * 100) : 0;
    let champion = scores.player1 > scores.player2 ? '🏆 Player 1!' : scores.player2 > scores.player1 ? '🏆 Player 2!' : '🤝 Tie!';

    Alert.alert(
      '🎮 Game Over!',
      `${champion}\n\nP1: ${scores.player1} | P2: ${scores.player2}\nAccuracy: P1 ${p1Acc}% | P2 ${p2Acc}%\nHeadshots: P1 ${p1.headshots} | P2 ${p2.headshots}\n⭐ Gold Stars: P1 ${p1.goldenStars} | P2 ${p2.goldenStars}\nCombo: P1 x${p1.maxCombo} | P2 x${p2.maxCombo}`,
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
    setSelectedWeapon(null);
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
    setSelectedWeapon(null);
    setGameStats({
      player1: { shotsFired: 0, shotsHit: 0, headshots: 0, maxCombo: 0, powerUpsUsed: 0, totalDamage: 0, targetsDestroyed: 0, bullseyes: 0, goldenStars: 0 },
      player2: { shotsFired: 0, shotsHit: 0, headshots: 0, maxCombo: 0, powerUpsUsed: 0, totalDamage: 0, targetsDestroyed: 0, bullseyes: 0, goldenStars: 0 },
    });
  }, []);

  const playerKey = currentPlayer === 1 ? 'player1' : 'player2';
  const currentStats = gameStats[playerKey];
  const accuracy = currentStats.shotsFired > 0 ? Math.round((currentStats.shotsHit / currentStats.shotsFired) * 100) : 0;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backBtn}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>🎯 Target Practice</Text>
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
          {selectedMode.id === 'survival' && gameActive && (
            <Text style={styles.missesText}>❌ Misses: {5 - missesAllowed}/5</Text>
          )}
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

          {/* Mode selection */}
          <Text style={styles.sectionLabel}>📋 Mode:</Text>
          <View style={styles.modeRow}>
            {CHALLENGE_MODES.map((mode) => (
              <TouchableOpacity
                key={mode.id}
                style={[styles.modeCard, selectedMode.id === mode.id && styles.modeCardSelected]}
                onPress={() => setSelectedMode(mode)}
              >
                <Text style={styles.modeEmoji}>{mode.emoji}</Text>
                <Text style={styles.modeName}>{mode.label}</Text>
                <Text style={styles.modeTime}>{mode.timeLimit}s</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Weapon selection */}
          <Text style={styles.sectionLabel}>🔫 Weapon:</Text>
          <View style={styles.weaponGrid}>
            {WEAPON_TYPES.map((w) => (
              <TouchableOpacity
                key={w.id}
                style={[
                  styles.weaponCard,
                  { borderColor: w.color },
                  selectedWeapon?.id === w.id && { backgroundColor: w.color + '33', borderWidth: 3 },
                ]}
                onPress={() => setSelectedWeapon(w)}
              >
                <Text style={styles.weaponEmoji}>{w.emoji}</Text>
                <Text style={styles.weaponName}>{w.label}</Text>
                <Text style={styles.weaponStat}>⚔️{w.damage} 🎯{Math.round(w.accuracy * 100)}%</Text>
                <Text style={styles.weaponStat}>📎{w.ammo} ⚡{w.fireRate}ms</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Scope selection */}
          <Text style={styles.sectionLabel}>🔭 Scope:</Text>
          <View style={styles.scopeRow}>
            {SCOPE_TYPES.map((s) => (
              <TouchableOpacity
                key={s.id}
                style={[styles.scopeCard, selectedScope.id === s.id && styles.scopeCardSelected]}
                onPress={() => setSelectedScope(s)}
              >
                <Text style={styles.scopeEmoji}>{s.emoji}</Text>
                <Text style={styles.scopeName}>{s.label}</Text>
                <Text style={styles.scopeStat}>{s.zoom}x +{Math.round(s.aimBonus * 100)}%</Text>
              </TouchableOpacity>
            ))}
          </View>

          {selectedWeapon && (
            <TouchableOpacity style={styles.goBtn} onPress={startPlaying}>
              <Text style={styles.goBtnText}>🎯 START SHOOTING!</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Playing Phase */}
      {gamePhase === 'playing' && (
        <>
          {/* Status Bar */}
          <View style={[styles.statusBar, isSlowMotion && styles.statusSlow]}>
            <Text style={styles.weaponLabel}>{selectedWeapon?.emoji} {selectedWeapon?.label}</Text>
            {combo > 1 && (
              <Animated.Text style={[styles.comboText, { transform: [{ scale: comboAnim }] }]}>
                🔥 x{combo}
              </Animated.Text>
            )}
            <View style={styles.activeEffects}>
              {isSlowMotion && <Text style={styles.effectIcon}>⏳</Text>}
              {isExplosiveRounds && <Text style={styles.effectIcon}>💣</Text>}
              {isRapidFire && <Text style={styles.effectIcon}>🔥</Text>}
              {isPerfectAim && <Text style={styles.effectIcon}>🎯</Text>}
              {isDoublePoints && <Text style={styles.effectIcon}>✖️2️⃣</Text>}
              {isInfiniteAmmo && <Text style={styles.effectIcon}>♾️</Text>}
            </View>
          </View>

          {/* Ammo Bar */}
          <View style={styles.ammoBar}>
            <Text style={styles.ammoLabel}>
              {isReloading ? '🔄 Reloading...' : `📎 ${isInfiniteAmmo ? '∞' : currentAmmo}/${maxAmmo}`}
            </Text>
            <View style={styles.ammoIndicator}>
              {!isInfiniteAmmo && [...Array(maxAmmo)].map((_, i) => (
                <View key={i} style={[styles.ammoDot, i >= currentAmmo && styles.ammoDotEmpty]} />
              ))}
            </View>
            <Text style={styles.scopeLabel}>{selectedScope.emoji} {selectedScope.zoom}x</Text>
          </View>

          {/* Shooting Range */}
          <Animated.View style={[styles.range, { transform: [{ translateX: shakeAnim }] }]}>
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
                      borderColor: target.color,
                    },
                  ]}
                >
                  <Text style={[styles.targetEmoji, target.size < 25 && { fontSize: 16 }, target.size > 30 && { fontSize: 24 }]}>
                    {target.emoji}
                  </Text>
                  {target.hp > 1 && (
                    <View style={styles.targetHPBar}>
                      <View style={[styles.targetHPFill, { width: `${(target.hp / target.maxHP) * 100}%` }]} />
                    </View>
                  )}
                </View>
              ) : null
            )}

            {/* Power-ups */}
            {fieldPowerUps.map((pu) => (
              <View key={pu.id} style={[styles.fieldPU, { left: pu.x - 15, top: pu.y - 15 }]}>
                <Text style={styles.fieldPUEmoji}>{pu.emoji}</Text>
              </View>
            ))}

            {/* Hit effects */}
            {hitEffects.map((e) => (
              <View key={e.id} style={[styles.hitEffect, { left: e.x - 20, top: e.y - 15, opacity: e.opacity }]}>
                <Text style={styles.hitEmoji}>{e.emoji}</Text>
                <Text style={[styles.hitText, { color: e.color }]}>{e.text}</Text>
              </View>
            ))}

            {/* Crosshair */}
            <Animated.View
              style={[
                styles.crosshair,
                {
                  left: crosshairX - 18,
                  top: crosshairY - 18,
                  transform: [{ scale: crosshairPulse }],
                },
              ]}
            >
              <Text style={[styles.crosshairEmoji, isPerfectAim && { color: '#FFD700' }]}>
                {selectedScope.emoji}
              </Text>
            </Animated.View>

            {/* Muzzle flash */}
            <Animated.View style={[styles.muzzleFlash, { opacity: flashAnim }]} />

            {/* Score popup */}
            <Animated.View
              style={[
                styles.scorePop,
                {
                  opacity: scorePopAnim,
                  transform: [{
                    translateY: scorePopAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -30] }),
                  }],
                },
              ]}
            >
              <Text style={styles.scorePopText}>🎯 HIT!</Text>
            </Animated.View>
          </Animated.View>

          {/* Aim Controls */}
          <View style={styles.aimControls}>
            <View style={styles.aimPad}>
              <TouchableOpacity style={styles.aimBtn} onPress={() => moveAim(0, -10)}>
                <Text style={styles.aimBtnText}>▲</Text>
              </TouchableOpacity>
              <View style={styles.aimMiddle}>
                <TouchableOpacity style={styles.aimBtn} onPress={() => moveAim(-10, 0)}>
                  <Text style={styles.aimBtnText}>◄</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.fireBtn, (!canFire || isReloading) && styles.fireBtnDisabled]}
                  onPress={fireWeapon}
                  disabled={!canFire || isReloading}
                >
                  <Animated.Text
                    style={[
                      styles.fireBtnText,
                      {
                        transform: [{
                          translateY: recoilAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -5] }),
                        }],
                      },
                    ]}
                  >
                    {isReloading ? '🔄' : currentAmmo <= 0 && !isInfiniteAmmo ? '📎' : '🔥 FIRE'}
                  </Animated.Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.aimBtn} onPress={() => moveAim(10, 0)}>
                  <Text style={styles.aimBtnText}>►</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity style={styles.aimBtn} onPress={() => moveAim(0, 10)}>
                <Text style={styles.aimBtnText}>▼</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.quickActions}>
              <TouchableOpacity
                style={[styles.reloadBtn, isReloading && styles.btnDisabledStyle]}
                onPress={reloadWeapon}
                disabled={isReloading || currentAmmo === maxAmmo}
              >
                <Text style={styles.reloadBtnText}>🔄 Reload</Text>
              </TouchableOpacity>
              <View style={styles.fineAim}>
                <TouchableOpacity style={styles.fineBtn} onPress={() => moveAim(-3, 0)}>
                  <Text style={styles.fineBtnText}>◁</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.fineBtn} onPress={() => moveAim(3, 0)}>
                  <Text style={styles.fineBtnText}>▷</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.fineBtn} onPress={() => moveAim(0, -3)}>
                  <Text style={styles.fineBtnText}>△</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.fineBtn} onPress={() => moveAim(0, 3)}>
                  <Text style={styles.fineBtnText}>▽</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </>
      )}

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Fired</Text>
          <Text style={styles.statValue}>{currentStats.shotsFired}</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Hits</Text>
          <Text style={[styles.statValue, { color: '#4ECDC4' }]}>{currentStats.shotsHit}</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Acc</Text>
          <Text style={[styles.statValue, { color: '#FFD700' }]}>{accuracy}%</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>🎯</Text>
          <Text style={[styles.statValue, { color: '#FF6B6B' }]}>{currentStats.headshots}</Text>
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
  container: { flex: 1, backgroundColor: '#0A0A1A' },

  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: SPACING.lg || 20, paddingVertical: SPACING.sm || 8,
    backgroundColor: '#1A1A2E',
  },
  backBtn: { fontSize: 16, color: '#FFF', fontWeight: 'bold' },
  title: { fontSize: 19, fontWeight: 'bold', color: '#FFF' },
  roundInfo: { fontSize: 13, color: '#FFD700', fontWeight: 'bold' },

  scoreboard: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: SPACING.lg || 20, paddingVertical: 6,
    backgroundColor: '#16213E', borderBottomWidth: 2, borderBottomColor: '#E94560',
  },
  scoreTeam: { alignItems: 'center', width: 70 },
  teamLabel: { fontSize: 11, color: '#AAA', fontWeight: 'bold' },
  teamScore: { fontSize: 24, fontWeight: 'bold' },
  gameInfoCenter: { alignItems: 'center' },
  timerText: { fontSize: 18, fontWeight: 'bold' },
  missesText: { fontSize: 10, color: '#FF6B6B', fontWeight: 'bold' },

  selectPhase: { flex: 1, paddingHorizontal: 10, paddingTop: 6 },
  selectTitle: { fontSize: 16, fontWeight: 'bold', color: '#FFF', textAlign: 'center', marginBottom: 8 },
  sectionLabel: { fontSize: 12, fontWeight: 'bold', color: '#AAA', marginBottom: 4, marginTop: 6 },

  modeRow: { flexDirection: 'row', gap: 6, justifyContent: 'center' },
  modeCard: {
    flex: 1, paddingVertical: 8, borderRadius: 8, borderWidth: 2,
    borderColor: '#2A3A5C', backgroundColor: '#1B2A4A', alignItems: 'center',
  },
  modeCardSelected: { borderColor: '#FFD700', backgroundColor: '#FFD70022', borderWidth: 3 },
  modeEmoji: { fontSize: 18 },
  modeName: { fontSize: 9, fontWeight: 'bold', color: '#FFF', marginTop: 2 },
  modeTime: { fontSize: 8, color: '#888' },

  weaponGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'center' },
  weaponCard: {
    width: (width - 50) / 3, paddingVertical: 6, borderRadius: 8,
    borderWidth: 2, backgroundColor: '#1B2A4A', alignItems: 'center',
  },
  weaponEmoji: { fontSize: 18 },
  weaponName: { fontSize: 8, fontWeight: 'bold', color: '#FFF', marginTop: 2 },
  weaponStat: { fontSize: 7, color: '#888' },

  scopeRow: { flexDirection: 'row', gap: 6, justifyContent: 'center' },
  scopeCard: {
    flex: 1, paddingVertical: 6, borderRadius: 8, borderWidth: 2,
    borderColor: '#2A3A5C', backgroundColor: '#1B2A4A', alignItems: 'center',
  },
  scopeCardSelected: { borderColor: '#4ECDC4', backgroundColor: '#4ECDC422', borderWidth: 3 },
  scopeEmoji: { fontSize: 16 },
  scopeName: { fontSize: 8, fontWeight: 'bold', color: '#FFF' },
  scopeStat: { fontSize: 7, color: '#888' },

  goBtn: {
    backgroundColor: '#E94560', paddingVertical: 14, borderRadius: 12,
    alignItems: 'center', marginTop: 10, borderWidth: 2, borderColor: '#FF6B8A',
  },
  goBtnText: { fontSize: 18, fontWeight: 'bold', color: '#FFF' },

  statusBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg || 20, paddingVertical: 4, backgroundColor: '#0F3460',
  },
  statusSlow: { backgroundColor: '#1A3A6A' },
  weaponLabel: { fontSize: 11, fontWeight: 'bold', color: '#FFF' },
  comboText: { fontSize: 14, fontWeight: 'bold', color: '#FFD700' },
  activeEffects: { flexDirection: 'row', gap: 4 },
  effectIcon: { fontSize: 14 },

  ammoBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg || 20, paddingVertical: 3, backgroundColor: '#16213E', gap: 6,
  },
  ammoLabel: { fontSize: 10, color: '#FFD700', fontWeight: 'bold', width: 80 },
  ammoIndicator: { flexDirection: 'row', gap: 2, flex: 1, flexWrap: 'wrap' },
  ammoDot: { width: 6, height: 10, borderRadius: 2, backgroundColor: '#FFD700' },
  ammoDotEmpty: { backgroundColor: '#333' },
  scopeLabel: { fontSize: 10, color: '#4ECDC4', width: 50, textAlign: 'right' },

  range: {
    flex: 1, backgroundColor: '#1B4332', marginHorizontal: 8, marginVertical: 4,
    borderRadius: BORDER_RADIUS.md || 10, position: 'relative', overflow: 'hidden',
    borderWidth: 2, borderColor: '#2D6A4F',
  },

  target: {
    position: 'absolute', borderRadius: 20, borderWidth: 2,
    backgroundColor: '#00000033', justifyContent: 'center', alignItems: 'center', zIndex: 5,
  },
  targetEmoji: { fontSize: 20 },
  targetHPBar: {
    position: 'absolute', bottom: -5, width: '80%', height: 3,
    backgroundColor: '#333', borderRadius: 2, overflow: 'hidden',
  },
  targetHPFill: { height: '100%', backgroundColor: '#FF6B6B', borderRadius: 2 },

  fieldPU: {
    position: 'absolute', width: 30, height: 30, borderRadius: 15,
    backgroundColor: '#FFD70033', borderWidth: 2, borderColor: '#FFD700',
    justifyContent: 'center', alignItems: 'center', zIndex: 8,
  },
  fieldPUEmoji: { fontSize: 16 },

  hitEffect: { position: 'absolute', alignItems: 'center', zIndex: 15 },
  hitEmoji: { fontSize: 18 },
  hitText: { fontSize: 12, fontWeight: 'bold' },

  crosshair: { position: 'absolute', width: 36, height: 36, justifyContent: 'center', alignItems: 'center', zIndex: 20 },
  crosshairEmoji: { fontSize: 30, color: '#FF0000' },

  muzzleFlash: { ...StyleSheet.absoluteFillObject, backgroundColor: '#FFFFFF22', zIndex: 25 },

  scorePop: { position: 'absolute', top: '40%', left: '35%', zIndex: 30 },
  scorePopText: { fontSize: 22, fontWeight: 'bold', color: '#FFD700', textShadowColor: '#000', textShadowRadius: 4, textShadowOffset: { width: 1, height: 1 } },

  aimControls: {
    flexDirection: 'row', paddingHorizontal: 10, paddingVertical: 6, gap: 8,
  },
  aimPad: { alignItems: 'center', gap: 2 },
  aimMiddle: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  aimBtn: {
    width: 42, height: 42, backgroundColor: '#2A3A5C', borderRadius: 10,
    justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#4A5A7C',
  },
  aimBtnText: { fontSize: 18, fontWeight: 'bold', color: '#FFF' },
  fireBtn: {
    width: 60, height: 42, backgroundColor: '#E94560', borderRadius: 10,
    justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#FF6B8A',
  },
  fireBtnDisabled: { opacity: 0.4 },
  fireBtnText: { fontSize: 13, fontWeight: 'bold', color: '#FFF' },

  quickActions: { flex: 1, justifyContent: 'center', gap: 6 },
  reloadBtn: {
    backgroundColor: '#2A3A5C', paddingVertical: 8, borderRadius: 8,
    alignItems: 'center', borderWidth: 1, borderColor: '#4A5A7C',
  },
  reloadBtnText: { fontSize: 12, fontWeight: 'bold', color: '#FFF' },
  btnDisabledStyle: { opacity: 0.4 },
  fineAim: { flexDirection: 'row', gap: 4, justifyContent: 'center' },
  fineBtn: {
    width: 30, height: 30, backgroundColor: '#1E2D4D', borderRadius: 6,
    justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#3A4A6C',
  },
  fineBtnText: { fontSize: 14, color: '#AAA' },

  statsContainer: {
    flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 5,
    paddingHorizontal: SPACING.md || 10, backgroundColor: '#1A1A2E',
  },
  statBox: { alignItems: 'center' },
  statLabel: { fontSize: 8, color: '#888', marginBottom: 1 },
  statValue: { fontSize: 13, fontWeight: 'bold', color: '#FFF' },

  gameOverButtons: { paddingHorizontal: SPACING.lg || 20, paddingBottom: SPACING.md || 12, gap: 8 },
  nextBtn: {
    backgroundColor: '#E94560', paddingVertical: 12, borderRadius: 10,
    alignItems: 'center', borderWidth: 2, borderColor: '#FF6B8A',
  },
  nextBtnText: { fontSize: 16, fontWeight: 'bold', color: '#FFF' },
  exitBtn: { backgroundColor: '#533483', paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  exitBtnText: { fontSize: 16, fontWeight: 'bold', color: '#FFF' },
});
