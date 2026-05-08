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

const TANK_TYPES = [
  { id: 'light', emoji: '🏎️', label: 'Light Tank', hp: 80, speed: 4, damage: 15, reload: 1200, armor: 0.5, color: '#4ECDC4' },
  { id: 'medium', emoji: '🚛', label: 'Medium Tank', hp: 120, speed: 2.5, damage: 25, reload: 1800, armor: 1, color: '#FFD700' },
  { id: 'heavy', emoji: '🛡️', label: 'Heavy Tank', hp: 200, speed: 1.5, damage: 40, reload: 2500, armor: 2, color: '#FF6B6B' },
  { id: 'artillery', emoji: '💣', label: 'Artillery', hp: 60, speed: 1, damage: 55, reload: 3500, armor: 0.3, color: '#9B59B6' },
  { id: 'scout', emoji: '⚡', label: 'Scout', hp: 50, speed: 5, damage: 10, reload: 800, armor: 0.2, color: '#2ECC71' },
  { id: 'destroyer', emoji: '🔥', label: 'Destroyer', hp: 150, speed: 2, damage: 45, reload: 2200, armor: 1.5, color: '#E94560' },
];

const SHELL_TYPES = [
  { id: 'standard', emoji: '●', label: 'Standard', damageMod: 1.0, speedMod: 1.0, splashRadius: 0, cost: 0, color: '#FFD700' },
  { id: 'armor_piercing', emoji: '▶', label: 'Armor Piercing', damageMod: 1.5, speedMod: 0.8, splashRadius: 0, cost: 10, color: '#FF6B6B' },
  { id: 'explosive', emoji: '◆', label: 'Explosive', damageMod: 0.8, speedMod: 0.9, splashRadius: 40, cost: 15, color: '#FF4500' },
  { id: 'incendiary', emoji: '◈', label: 'Incendiary', damageMod: 0.7, speedMod: 1.0, splashRadius: 25, cost: 12, color: '#FF8C00' },
  { id: 'sniper', emoji: '◎', label: 'Sniper', damageMod: 2.0, speedMod: 1.5, splashRadius: 0, cost: 20, color: '#4ECDC4' },
];

const TERRAIN_TYPES = [
  { id: 'flat', label: 'Plains', emoji: '🟩', heightMap: 'flat', color: '#228B22' },
  { id: 'hills', label: 'Hills', emoji: '⛰️', heightMap: 'hilly', color: '#6B8E23' },
  { id: 'canyon', label: 'Canyon', emoji: '🏜️', heightMap: 'canyon', color: '#DEB887' },
  { id: 'fortress', label: 'Fortress', emoji: '🏰', heightMap: 'fortress', color: '#808080' },
];

const POWERUP_ITEMS = [
  { id: 'repair', emoji: '🔧', label: 'Repair Kit', effect: 'heal_30' },
  { id: 'shield', emoji: '🛡️', label: 'Shield', effect: 'shield_5s' },
  { id: 'double_dmg', emoji: '⚔️', label: 'Double Damage', effect: 'dmg_x2_10s' },
  { id: 'airstrike', emoji: '✈️', label: 'Airstrike', effect: 'airstrike' },
  { id: 'mine', emoji: '💥', label: 'Land Mine', effect: 'place_mine' },
  { id: 'teleport', emoji: '🌀', label: 'Teleport', effect: 'teleport' },
];

const WIND_DIRECTIONS = ['←', '→', '↗', '↘'];

export default function TanksGame({ navigation }) {
  const [scores, setScores] = useState({ player1: 0, player2: 0 });
  const [round, setRound] = useState(1);
  const [maxRounds] = useState(5);
  const [gameActive, setGameActive] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [gamePhase, setGamePhase] = useState('setup');
  const [currentTurn, setCurrentTurn] = useState(1);
  const [turnTimer, setTurnTimer] = useState(30);
  const [isFiring, setIsFiring] = useState(false);

  // Map
  const [selectedTerrain, setSelectedTerrain] = useState(null);
  const [terrainHeights, setTerrainHeights] = useState([]);

  // Wind
  const [windSpeed, setWindSpeed] = useState(0);
  const [windDirection, setWindDirection] = useState('→');

  // Player 1 tank
  const [p1Tank, setP1Tank] = useState(null);
  const [p1X, setP1X] = useState(width * 0.15);
  const [p1HP, setP1HP] = useState(100);
  const [p1MaxHP, setP1MaxHP] = useState(100);
  const [p1Angle, setP1Angle] = useState(45);
  const [p1Power, setP1Power] = useState(50);
  const [p1Shell, setP1Shell] = useState(SHELL_TYPES[0]);
  const [p1Coins, setP1Coins] = useState(0);
  const [p1Shield, setP1Shield] = useState(false);
  const [p1DoubleDmg, setP1DoubleDmg] = useState(false);
  const [p1Reloaded, setP1Reloaded] = useState(true);
  const [p1Mines, setP1Mines] = useState([]);

  // Player 2 tank
  const [p2Tank, setP2Tank] = useState(null);
  const [p2X, setP2X] = useState(width * 0.85);
  const [p2HP, setP2HP] = useState(100);
  const [p2MaxHP, setP2MaxHP] = useState(100);
  const [p2Angle, setP2Angle] = useState(135);
  const [p2Power, setP2Power] = useState(50);
  const [p2Shell, setP2Shell] = useState(SHELL_TYPES[0]);
  const [p2Coins, setP2Coins] = useState(0);
  const [p2Shield, setP2Shield] = useState(false);
  const [p2DoubleDmg, setP2DoubleDmg] = useState(false);
  const [p2Reloaded, setP2Reloaded] = useState(true);
  const [p2Mines, setP2Mines] = useState([]);

  // Projectile
  const [projectile, setProjectile] = useState(null);
  const [explosions, setExplosions] = useState([]);

  // Power-ups on map
  const [mapPowerUps, setMapPowerUps] = useState([]);

  // Stats
  const [gameStats, setGameStats] = useState({
    player1: { shotsFired: 0, shotsHit: 0, damageDealt: 0, roundsWon: 0, powerUpsUsed: 0, criticalHits: 0 },
    player2: { shotsFired: 0, shotsHit: 0, damageDealt: 0, roundsWon: 0, powerUpsUsed: 0, criticalHits: 0 },
  });

  // Refs
  const projectileRef = useRef(null);
  const timerRef = useRef(null);
  const projectileLoopRef = useRef(null);

  // Animations
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const explosionAnim = useRef(new Animated.Value(0)).current;
  const turnFlashAnim = useRef(new Animated.Value(0)).current;
  const p1HitAnim = useRef(new Animated.Value(1)).current;
  const p2HitAnim = useRef(new Animated.Value(1)).current;
  const shieldGlowP1 = useRef(new Animated.Value(0)).current;
  const shieldGlowP2 = useRef(new Animated.Value(0)).current;
  const fireFlashAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    return () => clearAllTimers();
  }, []);

  const clearAllTimers = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (projectileLoopRef.current) clearInterval(projectileLoopRef.current);
  };

  // Shield glow animations
  useEffect(() => {
    if (p1Shield) {
      const loop = Animated.loop(Animated.sequence([
        Animated.timing(shieldGlowP1, { toValue: 1, duration: 500, useNativeDriver: false }),
        Animated.timing(shieldGlowP1, { toValue: 0, duration: 500, useNativeDriver: false }),
      ]));
      loop.start();
      return () => loop.stop();
    }
  }, [p1Shield]);

  useEffect(() => {
    if (p2Shield) {
      const loop = Animated.loop(Animated.sequence([
        Animated.timing(shieldGlowP2, { toValue: 1, duration: 500, useNativeDriver: false }),
        Animated.timing(shieldGlowP2, { toValue: 0, duration: 500, useNativeDriver: false }),
      ]));
      loop.start();
      return () => loop.stop();
    }
  }, [p2Shield]);

  // Turn timer
  useEffect(() => {
    if (!gameActive || isFiring) return;
    timerRef.current = setInterval(() => {
      setTurnTimer((prev) => {
        if (prev <= 1) {
          handleAutoEndTurn();
          return 30;
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [gameActive, isFiring, currentTurn]);

  // Generate terrain
  const generateTerrain = useCallback((type) => {
    const points = 30;
    const heights = [];
    const baseHeight = height * 0.45;

    for (let i = 0; i < points; i++) {
      const x = (i / (points - 1)) * width;
      let h = baseHeight;

      switch (type) {
        case 'flat':
          h = baseHeight + Math.sin(i * 0.3) * 10;
          break;
        case 'hilly':
          h = baseHeight + Math.sin(i * 0.5) * 40 + Math.cos(i * 0.3) * 20;
          break;
        case 'canyon':
          h = baseHeight + (i > 10 && i < 20 ? 60 : -20) + Math.sin(i * 0.4) * 15;
          break;
        case 'fortress':
          h = baseHeight + (i > 12 && i < 18 ? -50 : 20) + Math.sin(i * 0.6) * 10;
          break;
        default:
          h = baseHeight;
      }

      heights.push({ x, y: h });
    }

    setTerrainHeights(heights);
    return heights;
  }, []);

  // Generate wind
  const generateWind = useCallback(() => {
    const speed = Math.round(Math.random() * 15);
    const dir = WIND_DIRECTIONS[Math.floor(Math.random() * WIND_DIRECTIONS.length)];
    setWindSpeed(speed);
    setWindDirection(dir);
  }, []);

  // Spawn power-ups on map
  const spawnMapPowerUps = useCallback(() => {
    const pus = [];
    const count = 2 + Math.floor(Math.random() * 2);
    for (let i = 0; i < count; i++) {
      const puType = POWERUP_ITEMS[Math.floor(Math.random() * POWERUP_ITEMS.length)];
      pus.push({
        id: Date.now() + Math.random() + i,
        type: puType.id,
        emoji: puType.emoji,
        label: puType.label,
        effect: puType.effect,
        x: width * 0.2 + Math.random() * width * 0.6,
        y: height * 0.35 + Math.random() * height * 0.1,
        collected: false,
      });
    }
    setMapPowerUps(pus);
  }, []);

  // Start game
  const startGame = () => {
    if (!selectedTerrain || !p1Tank || !p2Tank) {
      Alert.alert('⚠️ Setup Incomplete!', 'Select terrain and both tanks!');
      return;
    }

    generateTerrain(selectedTerrain.heightMap);
    generateWind();
    spawnMapPowerUps();

    const tank1HP = p1Tank.hp;
    const tank2HP = p2Tank.hp;
    setP1HP(tank1HP); setP1MaxHP(tank1HP);
    setP2HP(tank2HP); setP2MaxHP(tank2HP);
    setP1X(width * 0.15); setP2X(width * 0.85);
    setP1Angle(45); setP2Angle(135);
    setP1Power(50); setP2Power(50);
    setP1Shell(SHELL_TYPES[0]); setP2Shell(SHELL_TYPES[0]);
    setP1Coins(30); setP2Coins(30);
    setP1Shield(false); setP2Shield(false);
    setP1DoubleDmg(false); setP2DoubleDmg(false);
    setP1Reloaded(true); setP2Reloaded(true);
    setP1Mines([]); setP2Mines([]);
    setProjectile(null);
    setExplosions([]);
    setCurrentTurn(1);
    setTurnTimer(30);
    setIsFiring(false);

    setGamePhase('battle');
    setGameActive(true);
    setGameStarted(true);

    turnFlashAnim.setValue(1);
    Animated.timing(turnFlashAnim, { toValue: 0, duration: 800, useNativeDriver: false }).start();
  };

  // Adjust angle
  const adjustAngle = useCallback((delta) => {
    if (!gameActive || isFiring) return;
    if (currentTurn === 1) {
      setP1Angle((prev) => Math.max(0, Math.min(180, prev + delta)));
    } else {
      setP2Angle((prev) => Math.max(0, Math.min(180, prev + delta)));
    }
  }, [gameActive, isFiring, currentTurn]);

  // Adjust power
  const adjustPower = useCallback((delta) => {
    if (!gameActive || isFiring) return;
    if (currentTurn === 1) {
      setP1Power((prev) => Math.max(10, Math.min(100, prev + delta)));
    } else {
      setP2Power((prev) => Math.max(10, Math.min(100, prev + delta)));
    }
  }, [gameActive, isFiring, currentTurn]);

  // Select shell
  const selectShell = useCallback((shell) => {
    if (!gameActive || isFiring) return;
    const playerCoins = currentTurn === 1 ? p1Coins : p2Coins;
    if (playerCoins < shell.cost) {
      Alert.alert('⚠️ Not Enough Coins!', `Need ${shell.cost} coins.`);
      return;
    }
    if (currentTurn === 1) {
      if (shell.cost > 0) setP1Coins((prev) => prev - shell.cost);
      setP1Shell(shell);
    } else {
      if (shell.cost > 0) setP2Coins((prev) => prev - shell.cost);
      setP2Shell(shell);
    }
  }, [gameActive, isFiring, currentTurn, p1Coins, p2Coins]);

  // Move tank
  const moveTank = useCallback((direction) => {
    if (!gameActive || isFiring) return;
    const tank = currentTurn === 1 ? p1Tank : p2Tank;
    if (!tank) return;
    const step = tank.speed * 3;

    if (currentTurn === 1) {
      setP1X((prev) => Math.max(20, Math.min(width * 0.45, prev + (direction === 'left' ? -step : step))));
    } else {
      setP2X((prev) => Math.max(width * 0.55, Math.min(width - 20, prev + (direction === 'left' ? -step : step))));
    }
  }, [gameActive, isFiring, currentTurn, p1Tank, p2Tank]);

  // Fire
  const fireShot = useCallback(() => {
    if (!gameActive || isFiring) return;

    const isP1 = currentTurn === 1;
    const tank = isP1 ? p1Tank : p2Tank;
    const shell = isP1 ? p1Shell : p2Shell;
    const tankX = isP1 ? p1X : p2X;
    const angle = isP1 ? p1Angle : p2Angle;
    const power = isP1 ? p1Power : p2Power;

    if (!tank) return;

    setIsFiring(true);

    const playerKey = isP1 ? 'player1' : 'player2';
    setGameStats((prev) => ({
      ...prev,
      [playerKey]: { ...prev[playerKey], shotsFired: prev[playerKey].shotsFired + 1 },
    }));

    // Fire flash
    fireFlashAnim.setValue(1);
    Animated.timing(fireFlashAnim, { toValue: 0, duration: 400, useNativeDriver: false }).start();

    const radians = (angle * Math.PI) / 180;
    const speedMod = shell.speedMod;
    const velocity = power * 0.08 * speedMod;

    // Wind effect
    let windVX = 0;
    if (windDirection === '→') windVX = windSpeed * 0.02;
    else if (windDirection === '←') windVX = -windSpeed * 0.02;
    else if (windDirection === '↗') windVX = windSpeed * 0.015;
    else if (windDirection === '↘') windVX = windSpeed * 0.015;

    const proj = {
      x: tankX,
      y: height * 0.43,
      vx: Math.cos(radians) * velocity * (isP1 ? 1 : -1) + windVX,
      vy: -Math.sin(radians) * velocity,
      shell,
      firedBy: currentTurn,
      tank,
      trail: [],
    };

    setProjectile(proj);

    // Projectile physics loop
    let currentProj = { ...proj };

    projectileLoopRef.current = setInterval(() => {
      currentProj = {
        ...currentProj,
        x: currentProj.x + currentProj.vx,
        y: currentProj.y + currentProj.vy,
        vy: currentProj.vy + 0.15, // gravity
        trail: [...currentProj.trail.slice(-15), { x: currentProj.x, y: currentProj.y }],
      };

      setProjectile({ ...currentProj });

      // Check bounds
      if (currentProj.x < -50 || currentProj.x > width + 50 || currentProj.y > height * 0.55) {
        handleProjectileImpact(currentProj);
        clearInterval(projectileLoopRef.current);
      }

      // Check tank hit P1
      if (currentProj.firedBy === 2) {
        const dist = Math.sqrt(Math.pow(currentProj.x - p1X, 2) + Math.pow(currentProj.y - height * 0.43, 2));
        if (dist < 30) {
          handleTankHit(currentProj, 1);
          clearInterval(projectileLoopRef.current);
          return;
        }
      }

      // Check tank hit P2
      if (currentProj.firedBy === 1) {
        const dist = Math.sqrt(Math.pow(currentProj.x - p2X, 2) + Math.pow(currentProj.y - height * 0.43, 2));
        if (dist < 30) {
          handleTankHit(currentProj, 2);
          clearInterval(projectileLoopRef.current);
          return;
        }
      }

      // Check power-up hits
      setMapPowerUps((prev) =>
        prev.map((pu) => {
          if (pu.collected) return pu;
          const dist = Math.sqrt(Math.pow(currentProj.x - pu.x, 2) + Math.pow(currentProj.y - pu.y, 2));
          if (dist < 25) {
            collectPowerUp(pu, currentProj.firedBy);
            return { ...pu, collected: true };
          }
          return pu;
        })
      );

      // Check mine hits
      const mines = currentProj.firedBy === 1 ? p2Mines : p1Mines;
      mines.forEach((mine) => {
        const dist = Math.sqrt(Math.pow(currentProj.x - mine.x, 2) + Math.pow(currentProj.y - mine.y, 2));
        if (dist < 30) {
          createExplosion(mine.x, mine.y);
          // Mine damages the tank that didn't place it
          if (currentProj.firedBy === 1) {
            setP2Mines((prev) => prev.filter((m) => m.id !== mine.id));
          } else {
            setP1Mines((prev) => prev.filter((m) => m.id !== mine.id));
          }
        }
      });
    }, 20);
  }, [gameActive, isFiring, currentTurn, p1Tank, p2Tank, p1Shell, p2Shell, p1X, p2X, p1Angle, p2Angle, p1Power, p2Power, windSpeed, windDirection, p1Mines, p2Mines]);

  const handleTankHit = useCallback((proj, targetPlayer) => {
    setProjectile(null);

    const shell = proj.shell;
    const tank = proj.tank;
    const isDoubleDmg = proj.firedBy === 1 ? p1DoubleDmg : p2DoubleDmg;
    const targetShield = targetPlayer === 1 ? p1Shield : p2Shield;
    const targetTank = targetPlayer === 1 ? p1Tank : p2Tank;
    const targetArmor = targetTank ? targetTank.armor : 0;

    // Damage calculation
    let baseDamage = tank.damage * shell.damageMod;
    if (isDoubleDmg) baseDamage *= 2;

    const armorReduction = targetArmor * 5;
    const shieldReduction = targetShield ? baseDamage * 0.5 : 0;
    const finalDamage = Math.max(5, Math.round(baseDamage - armorReduction - shieldReduction));

    const isCrit = Math.random() < 0.12;
    const totalDamage = isCrit ? Math.round(finalDamage * 1.5) : finalDamage;

    const targetX = targetPlayer === 1 ? p1X : p2X;
    createExplosion(targetX, height * 0.43);

    // Apply damage
    if (targetPlayer === 1) {
      setP1HP((prev) => {
        const newHP = Math.max(0, prev - totalDamage);
        if (newHP <= 0) {
          setTimeout(() => handleTankDestroyed(1), 500);
        }
        return newHP;
      });
      if (targetShield) setP1Shield(false);

      Animated.sequence([
        Animated.timing(p1HitAnim, { toValue: 0.3, duration: 100, useNativeDriver: false }),
        Animated.timing(p1HitAnim, { toValue: 1, duration: 200, useNativeDriver: false }),
      ]).start();
    } else {
      setP2HP((prev) => {
        const newHP = Math.max(0, prev - totalDamage);
        if (newHP <= 0) {
          setTimeout(() => handleTankDestroyed(2), 500);
        }
        return newHP;
      });
      if (targetShield) setP2Shield(false);

      Animated.sequence([
        Animated.timing(p2HitAnim, { toValue: 0.3, duration: 100, useNativeDriver: false }),
        Animated.timing(p2HitAnim, { toValue: 1, duration: 200, useNativeDriver: false }),
      ]).start();
    }

    // Screen shake
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 12, duration: 50, useNativeDriver: false }),
      Animated.timing(shakeAnim, { toValue: -12, duration: 50, useNativeDriver: false }),
      Animated.timing(shakeAnim, { toValue: 6, duration: 50, useNativeDriver: false }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: false }),
    ]).start();

    // Update stats
    const attackerKey = proj.firedBy === 1 ? 'player1' : 'player2';
    setGameStats((prev) => ({
      ...prev,
      [attackerKey]: {
        ...prev[attackerKey],
        shotsHit: prev[attackerKey].shotsHit + 1,
        damageDealt: prev[attackerKey].damageDealt + totalDamage,
        criticalHits: prev[attackerKey].criticalHits + (isCrit ? 1 : 0),
      },
    }));

    // Award coins
    const coinReward = 5 + Math.round(totalDamage * 0.2);
    if (proj.firedBy === 1) {
      setP1Coins((prev) => prev + coinReward);
    } else {
      setP2Coins((prev) => prev + coinReward);
    }

    const hitMsg = isCrit
      ? `💥 CRITICAL HIT! ${totalDamage} damage!`
      : `🎯 Hit! ${totalDamage} damage!`;

    const shieldMsg = targetShield ? '\n🛡️ Shield absorbed some damage!' : '';

    Alert.alert(
      isCrit ? '💥 Critical!' : '🎯 Direct Hit!',
      `Player ${proj.firedBy} → Player ${targetPlayer}\n${hitMsg}${shieldMsg}\n🪙 +${coinReward} coins`,
      [{ text: 'Continue', onPress: () => endTurn() }]
    );
  }, [p1DoubleDmg, p2DoubleDmg, p1Shield, p2Shield, p1Tank, p2Tank, p1X, p2X]);

  const handleProjectileImpact = useCallback((proj) => {
    setProjectile(null);
    createExplosion(proj.x, proj.y);

    // Splash damage check
    if (proj.shell.splashRadius > 0) {
      const splashR = proj.shell.splashRadius;

      const dist1 = Math.sqrt(Math.pow(proj.x - p1X, 2) + Math.pow(proj.y - height * 0.43, 2));
      if (dist1 < splashR && proj.firedBy === 2) {
        const splashDmg = Math.round(proj.tank.damage * proj.shell.damageMod * 0.5 * (1 - dist1 / splashR));
        if (splashDmg > 0) {
          setP1HP((prev) => {
            const newHP = Math.max(0, prev - splashDmg);
            if (newHP <= 0) setTimeout(() => handleTankDestroyed(1), 500);
            return newHP;
          });
        }
      }

      const dist2 = Math.sqrt(Math.pow(proj.x - p2X, 2) + Math.pow(proj.y - height * 0.43, 2));
      if (dist2 < splashR && proj.firedBy === 1) {
        const splashDmg = Math.round(proj.tank.damage * proj.shell.damageMod * 0.5 * (1 - dist2 / splashR));
        if (splashDmg > 0) {
          setP2HP((prev) => {
            const newHP = Math.max(0, prev - splashDmg);
            if (newHP <= 0) setTimeout(() => handleTankDestroyed(2), 500);
            return newHP;
          });
        }
      }
    }

    Alert.alert('💨 Miss!', 'Shot missed the target!', [
      { text: 'Continue', onPress: () => endTurn() },
    ]);
  }, [p1X, p2X]);

  const createExplosion = useCallback((x, y) => {
    const id = Date.now() + Math.random();
    setExplosions((prev) => [...prev, { id, x, y }]);

    explosionAnim.setValue(0);
    Animated.sequence([
      Animated.timing(explosionAnim, { toValue: 1, duration: 300, useNativeDriver: false }),
      Animated.timing(explosionAnim, { toValue: 0, duration: 200, useNativeDriver: false }),
    ]).start(() => {
      setExplosions((prev) => prev.filter((e) => e.id !== id));
    });
  }, []);

  const collectPowerUp = useCallback((pu, player) => {
    const playerKey = player === 1 ? 'player1' : 'player2';
    setGameStats((prev) => ({
      ...prev,
      [playerKey]: { ...prev[playerKey], powerUpsUsed: prev[playerKey].powerUpsUsed + 1 },
    }));

    switch (pu.effect) {
      case 'heal_30':
        if (player === 1) setP1HP((prev) => Math.min(p1MaxHP, prev + 30));
        else setP2HP((prev) => Math.min(p2MaxHP, prev + 30));
        break;
      case 'shield_5s':
        if (player === 1) {
          setP1Shield(true);
          setTimeout(() => setP1Shield(false), 15000);
        } else {
          setP2Shield(true);
          setTimeout(() => setP2Shield(false), 15000);
        }
        break;
      case 'dmg_x2_10s':
        if (player === 1) {
          setP1DoubleDmg(true);
          setTimeout(() => setP1DoubleDmg(false), 20000);
        } else {
          setP2DoubleDmg(true);
          setTimeout(() => setP2DoubleDmg(false), 20000);
        }
        break;
      case 'airstrike':
        const targetX = player === 1 ? p2X : p1X;
        createExplosion(targetX, height * 0.43);
        if (player === 1) {
          setP2HP((prev) => Math.max(0, prev - 30));
        } else {
          setP1HP((prev) => Math.max(0, prev - 30));
        }
        break;
      case 'place_mine':
        const mineX = width * 0.3 + Math.random() * width * 0.4;
        const mine = { id: Date.now() + Math.random(), x: mineX, y: height * 0.47 };
        if (player === 1) setP1Mines((prev) => [...prev, mine]);
        else setP2Mines((prev) => [...prev, mine]);
        break;
      case 'teleport':
        if (player === 1) setP1X(width * 0.1 + Math.random() * width * 0.35);
        else setP2X(width * 0.55 + Math.random() * width * 0.35);
        break;
    }
  }, [p1MaxHP, p2MaxHP, p1X, p2X]);

  const handleTankDestroyed = useCallback((player) => {
    clearAllTimers();
    setGameActive(false);
    setIsFiring(false);

    const winner = player === 1 ? 2 : 1;
    const winnerKey = winner === 1 ? 'player1' : 'player2';
    const winPoints = 100;

    setScores((prev) => ({
      ...prev,
      [winnerKey]: prev[winnerKey] + winPoints,
    }));

    setGameStats((prev) => ({
      ...prev,
      [winnerKey]: { ...prev[winnerKey], roundsWon: prev[winnerKey].roundsWon + 1 },
    }));

    Alert.alert(
      '💥 Tank Destroyed!',
      `Player ${winner} wins the battle!\n+${winPoints} points!\n\nP1: ${winner === 1 ? scores.player1 + winPoints : scores.player1} | P2: ${winner === 2 ? scores.player2 + winPoints : scores.player2}`,
      round < maxRounds
        ? [
            { text: '🔄 Next Round', onPress: nextRound },
            { text: '🚪 End', onPress: () => navigation.goBack() },
          ]
        : [
            { text: '🏆 Final Results', onPress: handleGameOver },
          ]
    );
  }, [scores, round, maxRounds]);

  const handleAutoEndTurn = useCallback(() => {
    Alert.alert('⏰ Time\'s Up!', `Player ${currentTurn} ran out of time!`, [
      { text: 'Continue', onPress: () => endTurn() },
    ]);
  }, [currentTurn]);

  const endTurn = useCallback(() => {
    setIsFiring(false);
    setProjectile(null);

    generateWind();

    setCurrentTurn((prev) => (prev === 1 ? 2 : 1));
    setTurnTimer(30);

    turnFlashAnim.setValue(1);
    Animated.timing(turnFlashAnim, { toValue: 0, duration: 800, useNativeDriver: false }).start();
  }, []);

  const nextRound = useCallback(() => {
    setRound((prev) => prev + 1);
    setGamePhase('setup');
    setGameActive(false);
    setGameStarted(false);
    setSelectedTerrain(null);
    setP1Tank(null); setP2Tank(null);
  }, []);

  const handleGameOver = useCallback(() => {
    setGameActive(false);
    const p1 = gameStats.player1;
    const p2 = gameStats.player2;
    let champion = scores.player1 > scores.player2 ? '🏆 Player 1!' : scores.player2 > scores.player1 ? '🏆 Player 2!' : '🤝 Tie!';

    Alert.alert(
      '🎮 Game Over!',
      `${champion}\n\nScores: P1 ${scores.player1} | P2 ${scores.player2}\nRounds Won: P1 ${p1.roundsWon} | P2 ${p2.roundsWon}\nAccuracy: P1 ${p1.shotsFired > 0 ? Math.round((p1.shotsHit / p1.shotsFired) * 100) : 0}% | P2 ${p2.shotsFired > 0 ? Math.round((p2.shotsHit / p2.shotsFired) * 100) : 0}%\nDamage: P1 ${p1.damageDealt} | P2 ${p2.damageDealt}\nCrits: P1 ${p1.criticalHits} | P2 ${p2.criticalHits}`,
      [
        { text: '🔄 New Game', onPress: resetGame },
        { text: '🚪 Exit', onPress: () => navigation.goBack() },
      ]
    );
  }, [scores, gameStats]);

  const resetGame = useCallback(() => {
    setScores({ player1: 0, player2: 0 });
    setRound(1);
    setGamePhase('setup');
    setGameActive(false);
    setGameStarted(false);
    setSelectedTerrain(null);
    setP1Tank(null); setP2Tank(null);
    setGameStats({
      player1: { shotsFired: 0, shotsHit: 0, damageDealt: 0, roundsWon: 0, powerUpsUsed: 0, criticalHits: 0 },
      player2: { shotsFired: 0, shotsHit: 0, damageDealt: 0, roundsWon: 0, powerUpsUsed: 0, criticalHits: 0 },
    });
  }, []);

  const currentPlayerKey = currentTurn === 1 ? 'player1' : 'player2';
  const currentStats = gameStats[currentPlayerKey];
  const p1HPPercent = p1MaxHP > 0 ? Math.round((p1HP / p1MaxHP) * 100) : 0;
  const p2HPPercent = p2MaxHP > 0 ? Math.round((p2HP / p2MaxHP) * 100) : 0;

  const getHPColor = (percent) => {
    if (percent > 60) return '#4ECDC4';
    if (percent > 30) return '#FFD700';
    return '#FF6B6B';
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backBtn}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>🎯 Tanks Battle</Text>
        <Text style={styles.roundInfo}>Rd {round}/{maxRounds}</Text>
      </View>

      {/* Scoreboard */}
      <View style={styles.scoreboard}>
        <View style={styles.scoreTeam}>
          <Text style={[styles.teamLabel, currentTurn === 1 && styles.activeTeam]}>
            {currentTurn === 1 ? '► ' : ''}P1 {p1Tank?.emoji || ''}
          </Text>
          <Text style={[styles.teamScore, { color: '#FF6B6B' }]}>{scores.player1}</Text>
        </View>
        <View style={styles.gameInfoCenter}>
          {gamePhase === 'battle' && (
            <>
              <Text style={[styles.turnTimer, { color: turnTimer <= 10 ? '#FF6B6B' : '#FFF' }]}>
                ⏱️ {turnTimer}s
              </Text>
              <Text style={styles.windInfo}>🌬️ {windDirection} {windSpeed}mph</Text>
            </>
          )}
          {gamePhase === 'setup' && <Text style={styles.setupLabel}>⚙️ Setup</Text>}
        </View>
        <View style={styles.scoreTeam}>
          <Text style={[styles.teamLabel, currentTurn === 2 && styles.activeTeam]}>
            {currentTurn === 2 ? '► ' : ''}P2 {p2Tank?.emoji || ''}
          </Text>
          <Text style={[styles.teamScore, { color: '#4ECDC4' }]}>{scores.player2}</Text>
        </View>
      </View>

      {/* Setup Phase */}
      {gamePhase === 'setup' && (
        <View style={styles.setupContainer}>
          <Text style={styles.sectionTitle}>🗺️ Select Terrain:</Text>
          <View style={styles.optionRow}>
            {TERRAIN_TYPES.map((t) => (
              <TouchableOpacity
                key={t.id}
                style={[
                  styles.optionCard,
                  { borderColor: t.color },
                  selectedTerrain?.id === t.id && { backgroundColor: t.color + '33', borderWidth: 3 },
                ]}
                onPress={() => setSelectedTerrain(t)}
              >
                <Text style={styles.optionEmoji}>{t.emoji}</Text>
                <Text style={styles.optionName}>{t.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.sectionTitle}>🔴 P1 Tank:</Text>
          <View style={styles.tankGrid}>
            {TANK_TYPES.map((tank) => (
              <TouchableOpacity
                key={tank.id}
                style={[
                  styles.tankCard,
                  { borderColor: tank.color },
                  p1Tank?.id === tank.id && { backgroundColor: tank.color + '33', borderWidth: 3 },
                ]}
                onPress={() => setP1Tank(tank)}
              >
                <Text style={styles.tankEmoji}>{tank.emoji}</Text>
                <Text style={styles.tankName}>{tank.label}</Text>
                <Text style={styles.tankStat}>❤️{tank.hp} ⚔️{tank.damage} 🛡️{tank.armor}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.sectionTitle}>🔵 P2 Tank:</Text>
          <View style={styles.tankGrid}>
            {TANK_TYPES.map((tank) => (
              <TouchableOpacity
                key={tank.id}
                style={[
                  styles.tankCard,
                  { borderColor: tank.color },
                  p2Tank?.id === tank.id && { backgroundColor: tank.color + '33', borderWidth: 3 },
                ]}
                onPress={() => setP2Tank(tank)}
              >
                <Text style={styles.tankEmoji}>{tank.emoji}</Text>
                <Text style={styles.tankName}>{tank.label}</Text>
                <Text style={styles.tankStat}>❤️{tank.hp} ⚔️{tank.damage} 🛡️{tank.armor}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={styles.startBtn} onPress={startGame}>
            <Text style={styles.startBtnText}>⚔️ START BATTLE!</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Battle Phase */}
      {gamePhase === 'battle' && (
        <>
          {/* HP Bars */}
          <View style={styles.hpBars}>
            <View style={styles.hpRow}>
              <Text style={styles.hpLabel}>P1 ❤️{p1HP}/{p1MaxHP}</Text>
              <View style={styles.hpBar}>
                <View style={[styles.hpFill, { width: `${p1HPPercent}%`, backgroundColor: getHPColor(p1HPPercent) }]} />
              </View>
              {p1Shield && <Text style={styles.shieldIcon}>🛡️</Text>}
              {p1DoubleDmg && <Text style={styles.dmgIcon}>⚔️x2</Text>}
            </View>
            <View style={styles.hpRow}>
              <Text style={styles.hpLabel}>P2 ❤️{p2HP}/{p2MaxHP}</Text>
              <View style={styles.hpBar}>
                <View style={[styles.hpFill, { width: `${p2HPPercent}%`, backgroundColor: getHPColor(p2HPPercent) }]} />
              </View>
              {p2Shield && <Text style={styles.shieldIcon}>🛡️</Text>}
              {p2DoubleDmg && <Text style={styles.dmgIcon}>⚔️x2</Text>}
            </View>
          </View>

          {/* Battlefield */}
          <Animated.View style={[styles.battlefield, { transform: [{ translateX: shakeAnim }] }]}>
            {/* Sky */}
            <View style={styles.sky}>
              <Text style={styles.skyElement}>☁️</Text>
              <Text style={styles.skyElement}>☀️</Text>
              <Text style={styles.skyElement}>☁️</Text>
            </View>

            {/* Turn indicator */}
            <Animated.View style={[styles.turnIndicator, { opacity: turnFlashAnim }]}>
              <Text style={styles.turnText}>Player {currentTurn}'s Turn!</Text>
            </Animated.View>

            {/* Map power-ups */}
            {mapPowerUps.map((pu) =>
              !pu.collected ? (
                <View key={pu.id} style={[styles.mapPU, { left: pu.x - 15, top: pu.y - 15 }]}>
                  <Text style={styles.mapPUEmoji}>{pu.emoji}</Text>
                </View>
              ) : null
            )}

            {/* Mines */}
            {[...p1Mines, ...p2Mines].map((mine) => (
              <View key={mine.id} style={[styles.mine, { left: mine.x - 10, top: mine.y - 10 }]}>
                <Text style={styles.mineEmoji}>💥</Text>
              </View>
            ))}

            {/* Tank 1 */}
            <Animated.View
              style={[
                styles.tank,
                { left: p1X - 22, bottom: 25, opacity: p1HitAnim },
              ]}
            >
              {p1Shield && (
                <Animated.View
                  style={[styles.shieldBubble, {
                    borderColor: shieldGlowP1.interpolate({ inputRange: [0, 1], outputRange: ['#4ECDC466', '#4ECDC4'] }),
                  }]}
                />
              )}
              <Text style={styles.tankBigEmoji}>{p1Tank?.emoji || '🏎️'}</Text>
              <View style={[styles.barrel, { transform: [{ rotate: `${-(p1Angle - 90)}deg` }] }]}>
                <Text style={styles.barrelText}>━━</Text>
              </View>
            </Animated.View>

            {/* Tank 2 */}
            <Animated.View
              style={[
                styles.tank,
                { left: p2X - 22, bottom: 25, opacity: p2HitAnim },
              ]}
            >
              {p2Shield && (
                <Animated.View
                  style={[styles.shieldBubble, {
                    borderColor: shieldGlowP2.interpolate({ inputRange: [0, 1], outputRange: ['#4ECDC466', '#4ECDC4'] }),
                  }]}
                />
              )}
              <Text style={[styles.tankBigEmoji, { transform: [{ scaleX: -1 }] }]}>{p2Tank?.emoji || '🏎️'}</Text>
              <View style={[styles.barrel, { transform: [{ rotate: `${-(p2Angle - 90)}deg` }] }]}>
                <Text style={styles.barrelText}>━━</Text>
              </View>
            </Animated.View>

            {/* Projectile trail */}
            {projectile?.trail.map((t, i) => (
              <View key={i} style={[styles.trailDot, { left: t.x - 2, top: t.y - 2, opacity: (i / 15) }]} />
            ))}

            {/* Projectile */}
            {projectile && (
              <View style={[styles.projectile, { left: projectile.x - 6, top: projectile.y - 6 }]}>
                <Text style={[styles.projEmoji, { color: projectile.shell.color }]}>{projectile.shell.emoji}</Text>
              </View>
            )}

            {/* Explosions */}
            {explosions.map((exp) => (
              <Animated.View
                key={exp.id}
                style={[
                  styles.explosion,
                  {
                    left: exp.x - 25,
                    top: exp.y - 25,
                    opacity: explosionAnim,
                    transform: [{
                      scale: explosionAnim.interpolate({ inputRange: [0, 1], outputRange: [0.5, 2] }),
                    }],
                  },
                ]}
              >
                <Text style={styles.explosionEmoji}>💥🔥💥</Text>
              </Animated.View>
            ))}

            {/* Fire flash */}
            <Animated.View style={[styles.fireFlash, { opacity: fireFlashAnim }]} />

            {/* Ground */}
            <View style={[styles.ground, { backgroundColor: selectedTerrain?.color || '#228B22' }]} />
          </Animated.View>

          {/* Controls */}
          {!isFiring && (
            <View style={styles.controlsSection}>
              {/* Current player info */}
              <View style={styles.playerInfo}>
                <Text style={styles.playerInfoText}>
                  🎮 Player {currentTurn} | 🪙 {currentTurn === 1 ? p1Coins : p2Coins} |
                  Angle: {currentTurn === 1 ? p1Angle : p2Angle}° | Power: {currentTurn === 1 ? p1Power : p2Power}%
                </Text>
              </View>

              {/* Angle & Power */}
              <View style={styles.controlRow}>
                <View style={styles.controlGroup}>
                  <Text style={styles.controlLabel}>📐 Angle</Text>
                  <View style={styles.controlBtns}>
                    <TouchableOpacity style={styles.ctrlBtn} onPress={() => adjustAngle(-5)}>
                      <Text style={styles.ctrlBtnText}>-5</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.ctrlBtn} onPress={() => adjustAngle(-1)}>
                      <Text style={styles.ctrlBtnText}>-1</Text>
                    </TouchableOpacity>
                    <Text style={styles.ctrlValue}>{currentTurn === 1 ? p1Angle : p2Angle}°</Text>
                    <TouchableOpacity style={styles.ctrlBtn} onPress={() => adjustAngle(1)}>
                      <Text style={styles.ctrlBtnText}>+1</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.ctrlBtn} onPress={() => adjustAngle(5)}>
                      <Text style={styles.ctrlBtnText}>+5</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                <View style={styles.controlGroup}>
                  <Text style={styles.controlLabel}>💪 Power</Text>
                  <View style={styles.controlBtns}>
                    <TouchableOpacity style={styles.ctrlBtn} onPress={() => adjustPower(-10)}>
                      <Text style={styles.ctrlBtnText}>-10</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.ctrlBtn} onPress={() => adjustPower(-5)}>
                      <Text style={styles.ctrlBtnText}>-5</Text>
                    </TouchableOpacity>
                    <Text style={styles.ctrlValue}>{currentTurn === 1 ? p1Power : p2Power}%</Text>
                    <TouchableOpacity style={styles.ctrlBtn} onPress={() => adjustPower(5)}>
                      <Text style={styles.ctrlBtnText}>+5</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.ctrlBtn} onPress={() => adjustPower(10)}>
                      <Text style={styles.ctrlBtnText}>+10</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              {/* Move & Fire */}
              <View style={styles.actionRow}>
                <TouchableOpacity style={styles.moveBtn} onPress={() => moveTank('left')}>
                  <Text style={styles.moveBtnText}>◄ Move</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.fireBtn} onPress={fireShot}>
                  <Text style={styles.fireBtnText}>🔥 FIRE!</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.moveBtn} onPress={() => moveTank('right')}>
                  <Text style={styles.moveBtnText}>Move ►</Text>
                </TouchableOpacity>
              </View>

              {/* Shell Selection */}
              <View style={styles.shellSection}>
                <Text style={styles.shellTitle}>💎 Ammo:</Text>
                <View style={styles.shellRow}>
                  {SHELL_TYPES.map((shell) => {
                    const currentShell = currentTurn === 1 ? p1Shell : p2Shell;
                    const playerCoins = currentTurn === 1 ? p1Coins : p2Coins;
                    return (
                      <TouchableOpacity
                        key={shell.id}
                        style={[
                          styles.shellItem,
                          currentShell.id === shell.id && styles.shellItemSelected,
                          playerCoins < shell.cost && shell.cost > 0 && styles.shellDisabled,
                        ]}
                        onPress={() => selectShell(shell)}
                        disabled={playerCoins < shell.cost && shell.cost > 0}
                      >
                        <Text style={[styles.shellEmoji, { color: shell.color }]}>{shell.emoji}</Text>
                        <Text style={styles.shellName}>{shell.label}</Text>
                        <Text style={styles.shellCost}>{shell.cost > 0 ? `🪙${shell.cost}` : 'Free'}</Text>
                        <Text style={styles.shellDmg}>x{shell.damageMod}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </View>
          )}
        </>
      )}

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Fired</Text>
          <Text style={styles.statValue}>{currentStats.shotsFired}</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Hit</Text>
          <Text style={[styles.statValue, { color: '#4ECDC4' }]}>{currentStats.shotsHit}</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Accuracy</Text>
          <Text style={[styles.statValue, { color: '#FFD700' }]}>
            {currentStats.shotsFired > 0 ? Math.round((currentStats.shotsHit / currentStats.shotsFired) * 100) : 0}%
          </Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Damage</Text>
          <Text style={[styles.statValue, { color: '#FF6B6B' }]}>{currentStats.damageDealt}</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Crits</Text>
          <Text style={[styles.statValue, { color: '#9B59B6' }]}>{currentStats.criticalHits}</Text>
        </View>
      </View>

      {/* Game Over */}
      {!gameActive && gameStarted && gamePhase !== 'setup' && gamePhase !== 'battle' && (
        <View style={styles.gameOverButtons}>
          <TouchableOpacity style={styles.nextBtn} onPress={round < maxRounds ? nextRound : resetGame}>
            <Text style={styles.nextBtnText}>{round < maxRounds ? '🔄 Next Round' : '🔄 New Game'}</Text>
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
  container: { flex: 1, backgroundColor: '#0A0A1A' },

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
    borderBottomColor: '#E94560',
  },
  scoreTeam: { alignItems: 'center', width: 80 },
  teamLabel: { fontSize: 11, color: '#AAA', fontWeight: 'bold' },
  activeTeam: { color: '#FFD700' },
  teamScore: { fontSize: 22, fontWeight: 'bold' },
  gameInfoCenter: { alignItems: 'center' },
  turnTimer: { fontSize: 18, fontWeight: 'bold' },
  windInfo: { fontSize: 11, color: '#87CEEB' },
  setupLabel: { fontSize: 16, color: '#AAA', fontWeight: 'bold' },

  setupContainer: { flex: 1, paddingHorizontal: 10, paddingTop: 6 },
  sectionTitle: { fontSize: 13, fontWeight: 'bold', color: '#FFF', marginBottom: 6, marginTop: 8 },
  optionRow: { flexDirection: 'row', gap: 6, justifyContent: 'center' },
  optionCard: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 2,
    backgroundColor: '#1A1A3A',
    alignItems: 'center',
  },
  optionEmoji: { fontSize: 22 },
  optionName: { fontSize: 9, fontWeight: 'bold', color: '#FFF', marginTop: 2 },
  tankGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'center' },
  tankCard: {
    width: (width - 50) / 3,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 2,
    backgroundColor: '#1A1A3A',
    alignItems: 'center',
  },
  tankEmoji: { fontSize: 18 },
  tankName: { fontSize: 8, fontWeight: 'bold', color: '#FFF', marginTop: 2 },
  tankStat: { fontSize: 7, color: '#888' },
  startBtn: {
    backgroundColor: '#E94560',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 12,
    borderWidth: 2,
    borderColor: '#FF6B8A',
  },
  startBtnText: { fontSize: 18, fontWeight: 'bold', color: '#FFF' },

  hpBars: {
    paddingHorizontal: SPACING.lg || 20,
    paddingVertical: 3,
    backgroundColor: '#16213E',
    gap: 3,
  },
  hpRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  hpLabel: { fontSize: 9, color: '#AAA', width: 75 },
  hpBar: { flex: 1, height: 10, backgroundColor: '#333', borderRadius: 5, overflow: 'hidden' },
  hpFill: { height: '100%', borderRadius: 5 },
  shieldIcon: { fontSize: 12 },
  dmgIcon: { fontSize: 9, color: '#FF6B6B', fontWeight: 'bold' },

  battlefield: {
    height: height * 0.28,
    backgroundColor: '#87CEEB',
    marginHorizontal: 10,
    marginVertical: 4,
    borderRadius: BORDER_RADIUS.md || 10,
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#2A3A5C',
  },
  sky: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 8,
  },
  skyElement: { fontSize: 18 },

  turnIndicator: { position: 'absolute', top: 8, left: 0, right: 0, alignItems: 'center', zIndex: 25 },
  turnText: { fontSize: 14, fontWeight: 'bold', color: '#FFD700', backgroundColor: '#00000066', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 10 },

  mapPU: { position: 'absolute', width: 30, height: 30, borderRadius: 15, backgroundColor: '#FFD70033', borderWidth: 2, borderColor: '#FFD700', justifyContent: 'center', alignItems: 'center', zIndex: 8 },
  mapPUEmoji: { fontSize: 16 },

  mine: { position: 'absolute', width: 20, height: 20, justifyContent: 'center', alignItems: 'center', zIndex: 4 },
  mineEmoji: { fontSize: 12 },

  tank: { position: 'absolute', width: 44, height: 50, justifyContent: 'center', alignItems: 'center', zIndex: 10 },
  tankBigEmoji: { fontSize: 30 },
  shieldBubble: { position: 'absolute', width: 52, height: 56, borderRadius: 28, borderWidth: 3, zIndex: -1 },
  barrel: { position: 'absolute', top: -5, transformOrigin: 'bottom center' },
  barrelText: { fontSize: 8, color: '#333', fontWeight: 'bold' },

  trailDot: { position: 'absolute', width: 4, height: 4, borderRadius: 2, backgroundColor: '#FFD70088', zIndex: 12 },
  projectile: { position: 'absolute', width: 12, height: 12, justifyContent: 'center', alignItems: 'center', zIndex: 15 },
  projEmoji: { fontSize: 12, fontWeight: 'bold' },

  explosion: { position: 'absolute', zIndex: 20 },
  explosionEmoji: { fontSize: 24 },

  fireFlash: { ...StyleSheet.absoluteFillObject, backgroundColor: '#FFFFFF33', zIndex: 25 },

  ground: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 30, borderTopWidth: 2, borderTopColor: '#444' },

  controlsSection: { paddingHorizontal: 8, paddingVertical: 2 },

  playerInfo: {
    backgroundColor: '#0F3460',
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderRadius: 6,
    marginBottom: 4,
  },
  playerInfoText: { fontSize: 10, color: '#FFD700', fontWeight: 'bold', textAlign: 'center' },

  controlRow: { flexDirection: 'row', gap: 6, marginBottom: 4 },
  controlGroup: { flex: 1 },
  controlLabel: { fontSize: 9, color: '#AAA', textAlign: 'center', marginBottom: 2 },
  controlBtns: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 3 },
  ctrlBtn: {
    width: 30,
    height: 28,
    backgroundColor: '#2A3A5C',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#4A5A7C',
  },
  ctrlBtnText: { fontSize: 9, fontWeight: 'bold', color: '#FFF' },
  ctrlValue: { fontSize: 13, fontWeight: 'bold', color: '#FFD700', width: 35, textAlign: 'center' },

  actionRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 4,
    justifyContent: 'center',
  },
  moveBtn: {
    width: 70,
    height: 40,
    backgroundColor: '#2A3A5C',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#4A5A7C',
  },
  moveBtnText: { fontSize: 11, fontWeight: 'bold', color: '#FFF' },
  fireBtn: {
    flex: 1,
    height: 40,
    backgroundColor: '#E94560',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FF6B8A',
  },
  fireBtnText: { fontSize: 16, fontWeight: 'bold', color: '#FFF' },

  shellSection: { paddingVertical: 2 },
  shellTitle: { fontSize: 9, color: '#AAA', marginBottom: 3 },
  shellRow: { flexDirection: 'row', gap: 3, justifyContent: 'center' },
  shellItem: {
    flex: 1,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#2A3A5C',
    backgroundColor: '#0F1A2E',
    alignItems: 'center',
  },
  shellItemSelected: { borderColor: '#FFD700', backgroundColor: '#FFD70015', borderWidth: 2 },
  shellDisabled: { opacity: 0.3 },
  shellEmoji: { fontSize: 12, fontWeight: 'bold' },
  shellName: { fontSize: 6, color: '#FFF', fontWeight: 'bold' },
  shellCost: { fontSize: 6, color: '#FFD700' },
  shellDmg: { fontSize: 6, color: '#FF6B6B' },

  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 4,
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
    backgroundColor: '#E94560',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FF6B8A',
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