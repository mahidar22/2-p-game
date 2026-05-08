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

const GRID_COLS = 8;
const GRID_ROWS = 6;
const BRICK_WIDTH = (width - 60) / GRID_COLS;
const BRICK_HEIGHT = 28;

const BRICK_TYPES = {
  normal: { hits: 1, points: 10, color: '#4ECDC4', label: 'Normal' },
  strong: { hits: 2, points: 25, color: '#FFD700', label: 'Strong' },
  super: { hits: 3, points: 50, color: '#FF6B6B', label: 'Super' },
  metal: { hits: 4, points: 75, color: '#C0C0C0', label: 'Metal' },
  diamond: { hits: 5, points: 100, color: '#E0E7FF', label: 'Diamond' },
  explosive: { hits: 1, points: 40, color: '#FF4500', label: 'Explosive' },
  mystery: { hits: 1, points: 0, color: '#9B59B6', label: 'Mystery' },
};

const POWERUPS = [
  { id: 'multiball', emoji: '⚾', label: 'Multi Ball', description: '+2 balls' },
  { id: 'fireball', emoji: '🔥', label: 'Fire Ball', description: 'Break anything' },
  { id: 'expand', emoji: '📏', label: 'Expand Paddle', description: 'Wider paddle' },
  { id: 'laser', emoji: '🔫', label: 'Laser', description: 'Shoot bricks' },
  { id: 'slow', emoji: '🐢', label: 'Slow Ball', description: 'Slower speed' },
  { id: 'bonus', emoji: '💰', label: 'Bonus Points', description: '+50 points' },
  { id: 'shrink', emoji: '📐', label: 'Shrink Paddle', description: 'Smaller paddle (bad!)' },
  { id: 'speed', emoji: '⚡', label: 'Speed Up', description: 'Faster ball (bad!)' },
];

export default function BrickBlastGame({ navigation }) {
  const [scores, setScores] = useState({ player1: 0, player2: 0 });
  const [round, setRound] = useState(1);
  const [maxRounds] = useState(3);
  const [gameActive, setGameActive] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [currentPlayer, setCurrentPlayer] = useState(1);
  const [gameTime, setGameTime] = useState(90);

  // Bricks grid
  const [bricks, setBricks] = useState([]);
  const [totalBricks, setTotalBricks] = useState(0);

  // Ball
  const [ballPos, setBallPos] = useState({ x: width / 2 - 8, y: height * 0.55 });
  const [ballVel, setBallVel] = useState({ vx: 3, vy: -3 });
  const [ballSpeed, setBallSpeed] = useState(3);
  const [ballActive, setBallActive] = useState(false);
  const [isFireBall, setIsFireBall] = useState(false);

  // Paddle
  const [paddleX, setPaddleX] = useState(width / 2 - 40);
  const [paddleWidth, setPaddleWidth] = useState(80);

  // Lives
  const [lives, setLives] = useState(3);

  // Power-ups
  const [activePowerUps, setActivePowerUps] = useState([]);
  const [fallingPowerUps, setFallingPowerUps] = useState([]);

  // Combo
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [lastHitTime, setLastHitTime] = useState(null);

  // Stats
  const [gameStats, setGameStats] = useState({
    player1: {
      bricksDestroyed: 0,
      powerUpsCollected: 0,
      maxCombo: 0,
      livesLost: 0,
      totalScore: 0,
    },
    player2: {
      bricksDestroyed: 0,
      powerUpsCollected: 0,
      maxCombo: 0,
      livesLost: 0,
      totalScore: 0,
    },
  });

  // Animations
  const ballAnim = useRef(new Animated.Value(1)).current;
  const paddleAnim = useRef(new Animated.Value(1)).current;
  const comboAnim = useRef(new Animated.Value(1)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const scoreFlashAnim = useRef(new Animated.Value(0)).current;
  const fireGlowAnim = useRef(new Animated.Value(0)).current;

  const gameLoopRef = useRef(null);
  const gameTimerRef = useRef(null);
  const powerUpTimerRef = useRef(null);

  // Cleanup
  useEffect(() => {
    return () => {
      clearAllTimers();
    };
  }, []);

  const clearAllTimers = () => {
    if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    if (gameTimerRef.current) clearInterval(gameTimerRef.current);
    if (powerUpTimerRef.current) clearInterval(powerUpTimerRef.current);
  };

  // Generate brick layout
  const generateBricks = (level) => {
    const newBricks = [];
    let id = 0;

    for (let row = 0; row < GRID_ROWS; row++) {
      for (let col = 0; col < GRID_COLS; col++) {
        // Some empty spaces
        if (Math.random() < 0.12) continue;

        let type = 'normal';
        const rand = Math.random();

        if (level >= 3) {
          if (rand < 0.05) type = 'diamond';
          else if (rand < 0.10) type = 'mystery';
          else if (rand < 0.18) type = 'explosive';
          else if (rand < 0.28) type = 'metal';
          else if (rand < 0.45) type = 'super';
          else if (rand < 0.65) type = 'strong';
          else type = 'normal';
        } else if (level >= 2) {
          if (rand < 0.05) type = 'mystery';
          else if (rand < 0.12) type = 'explosive';
          else if (rand < 0.22) type = 'metal';
          else if (rand < 0.40) type = 'super';
          else if (rand < 0.60) type = 'strong';
          else type = 'normal';
        } else {
          if (rand < 0.05) type = 'mystery';
          else if (rand < 0.10) type = 'explosive';
          else if (rand < 0.20) type = 'super';
          else if (rand < 0.40) type = 'strong';
          else type = 'normal';
        }

        const brickData = BRICK_TYPES[type];
        newBricks.push({
          id: id++,
          row,
          col,
          x: 20 + col * BRICK_WIDTH,
          y: 10 + row * (BRICK_HEIGHT + 4),
          width: BRICK_WIDTH - 4,
          height: BRICK_HEIGHT,
          type,
          hitsLeft: brickData.hits,
          maxHits: brickData.hits,
          points: brickData.points,
          color: brickData.color,
          destroyed: false,
        });
      }
    }

    setBricks(newBricks);
    setTotalBricks(newBricks.length);
    return newBricks;
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

  // Game loop - ball physics
  useEffect(() => {
    if (!gameActive || !ballActive) return;

    gameLoopRef.current = setInterval(() => {
      setBallPos((prevPos) => {
        let newX = prevPos.x + ballVel.vx;
        let newY = prevPos.y + ballVel.vy;
        let newVx = ballVel.vx;
        let newVy = ballVel.vy;

        // Wall collisions
        if (newX <= 20 || newX >= width - 36) {
          newVx = -newVx;
          newX = newX <= 20 ? 21 : width - 37;
        }

        // Top wall
        if (newY <= 0) {
          newVy = -newVy;
          newY = 1;
        }

        // Bottom - lose life
        if (newY >= height * 0.62) {
          handleBallLost();
          return { x: width / 2 - 8, y: height * 0.55 };
        }

        // Paddle collision
        const paddleTop = height * 0.58;
        const paddleBottom = paddleTop + 16;

        if (
          newY + 16 >= paddleTop &&
          newY + 16 <= paddleBottom + 5 &&
          newX + 8 >= paddleX &&
          newX + 8 <= paddleX + paddleWidth
        ) {
          newVy = -Math.abs(newVy);

          // Angle based on where ball hits paddle
          const hitPos = (newX + 8 - paddleX) / paddleWidth;
          const angle = (hitPos - 0.5) * 2;
          newVx = angle * ballSpeed * 1.5;

          newY = paddleTop - 17;

          // Paddle bounce animation
          Animated.sequence([
            Animated.timing(paddleAnim, {
              toValue: 0.9,
              duration: 50,
              useNativeDriver: false,
            }),
            Animated.spring(paddleAnim, {
              toValue: 1,
              friction: 3,
              tension: 300,
              useNativeDriver: false,
            }),
          ]).start();
        }

        // Brick collisions
        setBricks((prevBricks) => {
          let brickHit = false;
          const updatedBricks = prevBricks.map((brick) => {
            if (brick.destroyed || brickHit) return brick;

            const brickLeft = brick.x;
            const brickRight = brick.x + brick.width;
            const brickTop = brick.y;
            const brickBottom = brick.y + brick.height;

            if (
              newX + 16 >= brickLeft &&
              newX <= brickRight &&
              newY + 16 >= brickTop &&
              newY <= brickBottom
            ) {
              brickHit = true;

              if (!isFireBall) {
                // Determine bounce direction
                const overlapLeft = newX + 16 - brickLeft;
                const overlapRight = brickRight - newX;
                const overlapTop = newY + 16 - brickTop;
                const overlapBottom = brickBottom - newY;

                const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);

                if (minOverlap === overlapLeft || minOverlap === overlapRight) {
                  newVx = -newVx;
                } else {
                  newVy = -newVy;
                }
              }

              const newHitsLeft = isFireBall ? 0 : brick.hitsLeft - 1;

              if (newHitsLeft <= 0) {
                // Brick destroyed
                handleBrickDestroyed(brick);
                return { ...brick, destroyed: true, hitsLeft: 0 };
              } else {
                // Brick damaged
                handleBrickDamaged(brick);
                return { ...brick, hitsLeft: newHitsLeft };
              }
            }
            return brick;
          });

          return updatedBricks;
        });

        setBallVel({ vx: newVx, vy: newVy });
        return { x: newX, y: newY };
      });
    }, 16);

    return () => {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    };
  }, [gameActive, ballActive, ballVel, paddleX, paddleWidth, ballSpeed, isFireBall]);

  // Falling power-ups
  useEffect(() => {
    if (!gameActive || fallingPowerUps.length === 0) return;

    powerUpTimerRef.current = setInterval(() => {
      setFallingPowerUps((prev) => {
        const updated = prev
          .map((pu) => ({ ...pu, y: pu.y + 2 }))
          .filter((pu) => {
            // Check paddle collision
            const paddleTop = height * 0.58;
            if (
              pu.y + 20 >= paddleTop &&
              pu.y <= paddleTop + 16 &&
              pu.x + 15 >= paddleX &&
              pu.x <= paddleX + paddleWidth
            ) {
              collectPowerUp(pu);
              return false;
            }
            // Remove if off screen
            return pu.y < height * 0.65;
          });
        return updated;
      });
    }, 30);

    return () => {
      if (powerUpTimerRef.current) clearInterval(powerUpTimerRef.current);
    };
  }, [gameActive, fallingPowerUps, paddleX, paddleWidth]);

  // Fire ball animation
  useEffect(() => {
    if (isFireBall) {
      const fireLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(fireGlowAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: false,
          }),
          Animated.timing(fireGlowAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: false,
          }),
        ])
      );
      fireLoop.start();
      return () => fireLoop.stop();
    }
  }, [isFireBall]);

  // Combo timeout reset
  useEffect(() => {
    if (!lastHitTime) return;
    const timer = setTimeout(() => {
      setCombo(0);
    }, 3000);
    return () => clearTimeout(timer);
  }, [lastHitTime]);

  const handleBrickDestroyed = (brick) => {
    const now = Date.now();
    const newCombo = lastHitTime && now - lastHitTime < 3000 ? combo + 1 : 1;
    setCombo(newCombo);
    if (newCombo > maxCombo) setMaxCombo(newCombo);
    setLastHitTime(now);

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

    // Calculate points
    const comboBonus = (newCombo - 1) * 5;
    const totalPoints = brick.points + comboBonus;

    const playerKey = currentPlayer === 1 ? 'player1' : 'player2';
    setScores((prev) => ({
      ...prev,
      [playerKey]: prev[playerKey] + totalPoints,
    }));

    setGameStats((prev) => ({
      ...prev,
      [playerKey]: {
        ...prev[playerKey],
        bricksDestroyed: prev[playerKey].bricksDestroyed + 1,
        totalScore: prev[playerKey].totalScore + totalPoints,
      },
    }));

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
        duration: 600,
        delay: 300,
        useNativeDriver: false,
      }),
    ]).start();

    // Explosive brick chain reaction
    if (brick.type === 'explosive') {
      handleExplosion(brick);
    }

    // Mystery brick power-up
    if (brick.type === 'mystery') {
      spawnPowerUp(brick.x + brick.width / 2, brick.y);
    }

    // Random power-up drop chance
    if (Math.random() < 0.15 && brick.type !== 'mystery') {
      spawnPowerUp(brick.x + brick.width / 2, brick.y);
    }

    // Screen shake for strong hits
    if (brick.maxHits >= 3 || brick.type === 'explosive') {
      Animated.sequence([
        Animated.timing(shakeAnim, {
          toValue: 8,
          duration: 50,
          useNativeDriver: false,
        }),
        Animated.timing(shakeAnim, {
          toValue: -8,
          duration: 50,
          useNativeDriver: false,
        }),
        Animated.timing(shakeAnim, {
          toValue: 4,
          duration: 50,
          useNativeDriver: false,
        }),
        Animated.timing(shakeAnim, {
          toValue: 0,
          duration: 50,
          useNativeDriver: false,
        }),
      ]).start();
    }

    // Check if all bricks destroyed
    setTimeout(() => {
      setBricks((currentBricks) => {
        const remaining = currentBricks.filter((b) => !b.destroyed);
        if (remaining.length === 0) {
          handleAllBricksCleared();
        }
        return currentBricks;
      });
    }, 100);
  };

  const handleBrickDamaged = (brick) => {
    const playerKey = currentPlayer === 1 ? 'player1' : 'player2';
    const damagePoints = 5;
    setScores((prev) => ({
      ...prev,
      [playerKey]: prev[playerKey] + damagePoints,
    }));
  };

  const handleExplosion = (brick) => {
    setBricks((prev) =>
      prev.map((b) => {
        if (b.destroyed) return b;
        const dist = Math.sqrt(
          Math.pow(b.x - brick.x, 2) + Math.pow(b.y - brick.y, 2)
        );
        if (dist < BRICK_WIDTH * 2.5 && b.id !== brick.id) {
          const newHits = b.hitsLeft - 2;
          if (newHits <= 0) {
            handleBrickDestroyed(b);
            return { ...b, destroyed: true, hitsLeft: 0 };
          }
          return { ...b, hitsLeft: newHits };
        }
        return b;
      })
    );
  };

  const spawnPowerUp = (x, y) => {
    const powerUp = POWERUPS[Math.floor(Math.random() * POWERUPS.length)];
    setFallingPowerUps((prev) => [
      ...prev,
      {
        id: Date.now() + Math.random(),
        x: x - 15,
        y,
        type: powerUp.id,
        emoji: powerUp.emoji,
        label: powerUp.label,
      },
    ]);
  };

  const collectPowerUp = (powerUp) => {
    const playerKey = currentPlayer === 1 ? 'player1' : 'player2';
    setGameStats((prev) => ({
      ...prev,
      [playerKey]: {
        ...prev[playerKey],
        powerUpsCollected: prev[playerKey].powerUpsCollected + 1,
      },
    }));

    setActivePowerUps((prev) => [...prev, powerUp.type]);

    switch (powerUp.type) {
      case 'multiball':
        Alert.alert('⚾ Multi Ball!', 'Ball speed increased!', [
          { text: 'Go!', onPress: () => {} },
        ]);
        break;
      case 'fireball':
        setIsFireBall(true);
        setTimeout(() => setIsFireBall(false), 8000);
        Alert.alert('🔥 Fire Ball!', 'Breaks any brick for 8 seconds!', [
          { text: 'Burn!', onPress: () => {} },
        ]);
        break;
      case 'expand':
        setPaddleWidth((prev) => Math.min(160, prev + 30));
        setTimeout(() => setPaddleWidth(80), 10000);
        Alert.alert('📏 Expanded!', 'Wider paddle for 10 seconds!', [
          { text: 'Nice!', onPress: () => {} },
        ]);
        break;
      case 'laser':
        Alert.alert('🔫 Laser!', '+25 bonus points!', [
          { text: 'Zap!', onPress: () => {} },
        ]);
        setScores((prev) => ({
          ...prev,
          [playerKey]: prev[playerKey] + 25,
        }));
        break;
      case 'slow':
        setBallSpeed(2);
        setTimeout(() => setBallSpeed(3), 8000);
        Alert.alert('🐢 Slow Ball!', 'Ball slowed for 8 seconds!', [
          { text: 'Easy!', onPress: () => {} },
        ]);
        break;
      case 'bonus':
        setScores((prev) => ({
          ...prev,
          [playerKey]: prev[playerKey] + 50,
        }));
        Alert.alert('💰 Bonus!', '+50 points!', [
          { text: 'Cha-ching!', onPress: () => {} },
        ]);
        break;
      case 'shrink':
        setPaddleWidth((prev) => Math.max(40, prev - 20));
        setTimeout(() => setPaddleWidth(80), 8000);
        Alert.alert('📐 Shrink!', 'Paddle shrunk for 8 seconds!', [
          { text: 'Uh oh!', onPress: () => {} },
        ]);
        break;
      case 'speed':
        setBallSpeed(5);
        setTimeout(() => setBallSpeed(3), 6000);
        Alert.alert('⚡ Speed Up!', 'Ball faster for 6 seconds!', [
          { text: 'Whoa!', onPress: () => {} },
        ]);
        break;
    }
  };

  const handleBallLost = () => {
    setBallActive(false);
    const newLives = lives - 1;
    setLives(newLives);
    setCombo(0);
    setIsFireBall(false);

    const playerKey = currentPlayer === 1 ? 'player1' : 'player2';
    setGameStats((prev) => ({
      ...prev,
      [playerKey]: {
        ...prev[playerKey],
        livesLost: prev[playerKey].livesLost + 1,
      },
    }));

    if (newLives <= 0) {
      endTurn();
    } else {
      Alert.alert('💔 Ball Lost!', `${newLives} lives remaining`, [
        { text: 'Launch Ball', onPress: launchBall },
      ]);
    }
  };

  const handleAllBricksCleared = () => {
    setBallActive(false);
    const playerKey = currentPlayer === 1 ? 'player1' : 'player2';
    const clearBonus = 200;

    setScores((prev) => ({
      ...prev,
      [playerKey]: prev[playerKey] + clearBonus,
    }));

    Alert.alert(
      '🎉 ALL BRICKS CLEARED!',
      `+${clearBonus} bonus points!\nAmazing!`,
      [{ text: 'Continue', onPress: endTurn }]
    );
  };

  // Start game
  const startGame = () => {
    generateBricks(round);
    setLives(3);
    setPaddleX(width / 2 - 40);
    setPaddleWidth(80);
    setBallPos({ x: width / 2 - 8, y: height * 0.55 });
    setBallSpeed(3);
    setIsFireBall(false);
    setCombo(0);
    setMaxCombo(0);
    setGameTime(90);
    setActivePowerUps([]);
    setFallingPowerUps([]);
    setGameActive(true);
    setGameStarted(true);
  };

  // Launch ball
  const launchBall = () => {
    const angle = (Math.random() * 60 + 60) * (Math.PI / 180);
    const direction = Math.random() > 0.5 ? 1 : -1;
    setBallPos({ x: paddleX + paddleWidth / 2 - 8, y: height * 0.55 });
    setBallVel({
      vx: Math.cos(angle) * ballSpeed * direction,
      vy: -Math.sin(angle) * ballSpeed,
    });
    setBallActive(true);
  };

  // Move paddle
  const movePaddle = (direction) => {
    if (!gameActive) return;
    setPaddleX((prev) => {
      const step = 20;
      if (direction === 'left') {
        return Math.max(20, prev - step);
      } else {
        return Math.min(width - paddleWidth - 20, prev + step);
      }
    });
  };

  const movePaddleFine = (direction) => {
    if (!gameActive) return;
    setPaddleX((prev) => {
      const step = 8;
      if (direction === 'left') {
        return Math.max(20, prev - step);
      } else {
        return Math.min(width - paddleWidth - 20, prev + step);
      }
    });
  };

  const endTurn = () => {
    clearAllTimers();
    setGameActive(false);
    setBallActive(false);

    const playerKey = currentPlayer === 1 ? 'player1' : 'player2';
    const stats = gameStats[playerKey];

    setGameStats((prev) => ({
      ...prev,
      [playerKey]: {
        ...prev[playerKey],
        maxCombo: Math.max(prev[playerKey].maxCombo, maxCombo),
      },
    }));

    if (currentPlayer === 1) {
      Alert.alert(
        '⏱️ Turn Over!',
        `Player 1 Results:\nScore: ${scores.player1}\nBricks: ${stats.bricksDestroyed}\nMax Combo: x${maxCombo}\nLives Lost: ${stats.livesLost}`,
        [{ text: "Player 2's Turn!", onPress: switchPlayer }]
      );
    } else {
      handleEndRound();
    }
  };

  const switchPlayer = () => {
    setCurrentPlayer(2);
    generateBricks(round);
    setLives(3);
    setPaddleX(width / 2 - 40);
    setPaddleWidth(80);
    setBallPos({ x: width / 2 - 8, y: height * 0.55 });
    setBallSpeed(3);
    setIsFireBall(false);
    setCombo(0);
    setMaxCombo(0);
    setGameTime(90);
    setActivePowerUps([]);
    setFallingPowerUps([]);
    setBallActive(false);

    setTimeout(() => {
      setGameActive(true);
    }, 300);
  };

  const handleEndRound = () => {
    setGameActive(false);

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
        `📋 Round ${round} Complete!`,
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
      champion = '🏆🥇 Player 1 is the Champion!';
    } else if (scores.player2 > scores.player1) {
      champion = '🏆🥇 Player 2 is the Champion!';
    } else {
      champion = "🤝 It's a Perfect Tie!";
    }

    Alert.alert(
      '🎮 Game Over!',
      `${champion}\n\nFinal Scores:\nP1: ${scores.player1} | P2: ${scores.player2}\n\nBricks Destroyed:\nP1: ${p1.bricksDestroyed} | P2: ${p2.bricksDestroyed}\n\nBest Combo:\nP1: x${p1.maxCombo} | P2: x${p2.maxCombo}`,
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
    setBallActive(false);
    setCombo(0);
    setMaxCombo(0);
    setActivePowerUps([]);
    setFallingPowerUps([]);
  };

  const resetGame = () => {
    setScores({ player1: 0, player2: 0 });
    setRound(1);
    setCurrentPlayer(1);
    setGameActive(false);
    setGameStarted(false);
    setBallActive(false);
    setLives(3);
    setCombo(0);
    setMaxCombo(0);
    setActivePowerUps([]);
    setFallingPowerUps([]);
    setIsFireBall(false);
    setPaddleWidth(80);
    setBallSpeed(3);
    setGameStats({
      player1: { bricksDestroyed: 0, powerUpsCollected: 0, maxCombo: 0, livesLost: 0, totalScore: 0 },
      player2: { bricksDestroyed: 0, powerUpsCollected: 0, maxCombo: 0, livesLost: 0, totalScore: 0 },
    });
  };

  const bricksRemaining = bricks.filter((b) => !b.destroyed).length;
  const bricksDestroyed = totalBricks - bricksRemaining;
  const clearPercent = totalBricks > 0 ? Math.round((bricksDestroyed / totalBricks) * 100) : 0;

  const playerKey = currentPlayer === 1 ? 'player1' : 'player2';
  const currentStats = gameStats[playerKey];

  const getBrickColor = (brick) => {
    if (brick.destroyed) return 'transparent';
    const hitPercent = brick.hitsLeft / brick.maxHits;
    if (hitPercent <= 0.33) return '#FF634780';
    if (hitPercent <= 0.66) return brick.color + 'AA';
    return brick.color;
  };

  const getBrickEmoji = (brick) => {
    if (brick.type === 'explosive') return '💣';
    if (brick.type === 'mystery') return '❓';
    if (brick.type === 'diamond') return '💎';
    if (brick.type === 'metal') return '🔩';
    if (brick.hitsLeft > 1) return `${brick.hitsLeft}`;
    return '';
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backBtn}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>🧱 Brick Blast</Text>
        <Text style={styles.roundInfo}>
          Rd {round}/{maxRounds}
        </Text>
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
            ]}
          >
            {scores.player1}
          </Animated.Text>
        </View>

        <View style={styles.gameInfo}>
          <Text style={[styles.timerText, { color: gameTime <= 15 ? '#FF6B6B' : '#FFF' }]}>
            ⏱️ {gameTime}s
          </Text>
          <View style={styles.livesRow}>
            {[...Array(3)].map((_, i) => (
              <Text key={i} style={styles.lifeIcon}>
                {i < lives ? '❤️' : '🖤'}
              </Text>
            ))}
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
            ]}
          >
            {scores.player2}
          </Animated.Text>
        </View>
      </View>

      {/* Player & Combo */}
      <View style={[styles.playerBar, isFireBall && styles.playerBarFire]}>
        <Text style={styles.playerName}>🎮 Player {currentPlayer}</Text>
        {combo > 1 && (
          <Animated.Text
            style={[
              styles.comboText,
              { transform: [{ scale: comboAnim }] },
            ]}
          >
            🔥 x{combo} COMBO!
          </Animated.Text>
        )}
        {isFireBall && <Text style={styles.fireIndicator}>🔥 FIRE BALL</Text>}
        <Text style={styles.progressText}>
          {clearPercent}% cleared
        </Text>
      </View>

      {/* Game Arena */}
      <Animated.View
        style={[
          styles.arena,
          { transform: [{ translateX: shakeAnim }] },
        ]}
      >
        {/* Bricks */}
        {bricks.map((brick) =>
          !brick.destroyed ? (
            <View
              key={brick.id}
              style={[
                styles.brick,
                {
                  left: brick.x,
                  top: brick.y,
                  width: brick.width,
                  height: brick.height,
                  backgroundColor: getBrickColor(brick),
                  borderColor: brick.color,
                },
              ]}
            >
              <Text style={styles.brickText}>{getBrickEmoji(brick)}</Text>
            </View>
          ) : null
        )}

        {/* Ball */}
        {ballActive && (
          <Animated.View
            style={[
              styles.ball,
              {
                left: ballPos.x,
                top: ballPos.y,
              },
              isFireBall && {
                shadowColor: '#FF4500',
                shadowRadius: fireGlowAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [4, 12],
                }),
              },
            ]}
          >
            <Text style={styles.ballEmoji}>
              {isFireBall ? '🔥' : '⚪'}
            </Text>
          </Animated.View>
        )}

        {/* Paddle */}
        <Animated.View
          style={[
            styles.paddle,
            {
              left: paddleX,
              width: paddleWidth,
              transform: [{ scaleY: paddleAnim }],
            },
          ]}
        >
          <View style={styles.paddleInner} />
        </Animated.View>

        {/* Falling power-ups */}
        {fallingPowerUps.map((pu) => (
          <View
            key={pu.id}
            style={[
              styles.powerUpFalling,
              { left: pu.x, top: pu.y },
            ]}
          >
            <Text style={styles.powerUpEmoji}>{pu.emoji}</Text>
          </View>
        ))}

        {/* Score flash */}
        <Animated.View
          style={[
            styles.scoreFlash,
            {
              opacity: scoreFlashAnim,
              transform: [
                {
                  translateY: scoreFlashAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -30],
                  }),
                },
                {
                  scale: scoreFlashAnim.interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange: [0.5, 1.3, 1],
                  }),
                },
              ],
            },
          ]}
        >
          <Text style={styles.scoreFlashText}>💥</Text>
        </Animated.View>
      </Animated.View>

      {/* Controls */}
      {gameActive && (
        <View style={styles.controls}>
          <View style={styles.moveControls}>
            <TouchableOpacity
              style={styles.moveBtn}
              onPress={() => movePaddle('left')}
            >
              <Text style={styles.moveBtnText}>◄◄</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.fineMoveBtn}
              onPress={() => movePaddleFine('left')}
            >
              <Text style={styles.fineMoveBtnText}>◄</Text>
            </TouchableOpacity>

            {!ballActive ? (
              <TouchableOpacity
                style={styles.launchBtn}
                onPress={launchBall}
              >
                <Text style={styles.launchBtnText}>🚀 LAUNCH</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.statusCenter}>
                <Text style={styles.ballSpeedText}>
                  Speed: {ballSpeed.toFixed(1)}x
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={styles.fineMoveBtn}
              onPress={() => movePaddleFine('right')}
            >
              <Text style={styles.fineMoveBtnText}>►</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.moveBtn}
              onPress={() => movePaddle('right')}
            >
              <Text style={styles.moveBtnText}>►►</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Brick Legend */}
      <View style={styles.legendContainer}>
        <View style={styles.legendRow}>
          {Object.entries(BRICK_TYPES).slice(0, 4).map(([key, val]) => (
            <View key={key} style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: val.color }]} />
              <Text style={styles.legendText}>
                {val.label}({val.points})
              </Text>
            </View>
          ))}
        </View>
        <View style={styles.legendRow}>
          {Object.entries(BRICK_TYPES).slice(4).map(([key, val]) => (
            <View key={key} style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: val.color }]} />
              <Text style={styles.legendText}>
                {val.label}({val.points})
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Destroyed</Text>
          <Text style={styles.statValue}>{currentStats.bricksDestroyed}</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Remaining</Text>
          <Text style={[styles.statValue, { color: '#FFD700' }]}>
            {bricksRemaining}
          </Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Power-Ups</Text>
          <Text style={[styles.statValue, { color: '#9B59B6' }]}>
            {currentStats.powerUpsCollected}
          </Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Max Combo</Text>
          <Text style={[styles.statValue, { color: '#FF6B6B' }]}>
            x{Math.max(maxCombo, currentStats.maxCombo)}
          </Text>
        </View>
      </View>

      {/* Active Power-Ups */}
      {activePowerUps.length > 0 && (
        <View style={styles.activePowerUpsBar}>
          <Text style={styles.activePULabel}>Active: </Text>
          {activePowerUps.slice(-4).map((pu, i) => (
            <Text key={i} style={styles.activePUEmoji}>
              {POWERUPS.find((p) => p.id === pu)?.emoji || '?'}
            </Text>
          ))}
        </View>
      )}

      {/* Start / Action Buttons */}
      {!gameStarted && (
        <View style={styles.actionContainer}>
          <TouchableOpacity style={styles.startBtn} onPress={startGame}>
            <Text style={styles.startBtnText}>
              🧱 Start Round {round} - Player {currentPlayer}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {!gameActive && gameStarted && (
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
  roundInfo: {
    fontSize: 13,
    color: '#FFD700',
    fontWeight: 'bold',
  },

  scoreboard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg || 20,
    paddingVertical: 6,
    backgroundColor: '#16213E',
    borderBottomWidth: 2,
    borderBottomColor: '#4ECDC4',
  },
  scoreTeam: {
    alignItems: 'center',
    width: 70,
  },
  teamLabel: {
    fontSize: 11,
    color: '#AAA',
    fontWeight: 'bold',
  },
  teamScore: {
    fontSize: 26,
    fontWeight: 'bold',
  },
  gameInfo: {
    alignItems: 'center',
  },
  timerText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  livesRow: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 2,
  },
  lifeIcon: {
    fontSize: 14,
  },

  playerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg || 20,
    paddingVertical: 4,
    backgroundColor: '#0F3460',
  },
  playerBarFire: {
    backgroundColor: '#8B0000',
  },
  playerName: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#FFF',
  },
  comboText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#FFD700',
  },
  fireIndicator: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#FF4500',
  },
  progressText: {
    fontSize: 11,
    color: '#AAA',
  },

  arena: {
    flex: 1,
    backgroundColor: '#0D1B2A',
    marginHorizontal: 10,
    marginVertical: 4,
    borderRadius: BORDER_RADIUS.md || 10,
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#1B2A4A',
  },

  brick: {
    position: 'absolute',
    borderWidth: 1.5,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  brickText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFF',
  },

  ball: {
    position: 'absolute',
    width: 16,
    height: 16,
    zIndex: 10,
  },
  ballEmoji: {
    fontSize: 14,
  },

  paddle: {
    position: 'absolute',
    bottom: 8,
    height: 14,
    backgroundColor: '#4ECDC4',
    borderRadius: 7,
    zIndex: 10,
    borderWidth: 1,
    borderColor: '#FFF',
  },
  paddleInner: {
    flex: 1,
    backgroundColor: '#4ECDC455',
    borderRadius: 7,
    marginHorizontal: 2,
    marginVertical: 1,
  },

  powerUpFalling: {
    position: 'absolute',
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 15,
    backgroundColor: '#9B59B633',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#9B59B6',
  },
  powerUpEmoji: {
    fontSize: 18,
  },

  scoreFlash: {
    position: 'absolute',
    top: '40%',
    left: '42%',
    zIndex: 20,
  },
  scoreFlashText: {
    fontSize: 36,
  },

  controls: {
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  moveControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  moveBtn: {
    width: 55,
    height: 44,
    backgroundColor: '#2A3A5C',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#4A5A7C',
  },
  moveBtnText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
  },
  fineMoveBtn: {
    width: 40,
    height: 44,
    backgroundColor: '#1E2D4D',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#3A4A6C',
  },
  fineMoveBtnText: {
    fontSize: 16,
    color: '#AAA',
    fontWeight: 'bold',
  },
  launchBtn: {
    paddingHorizontal: 20,
    height: 44,
    backgroundColor: '#E94560',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FF6B8A',
  },
  launchBtnText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFF',
  },
  statusCenter: {
    paddingHorizontal: 16,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ballSpeedText: {
    fontSize: 11,
    color: '#AAA',
  },

  legendContainer: {
    paddingHorizontal: SPACING.md || 10,
    paddingVertical: 4,
    backgroundColor: '#0F3460',
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 2,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: '#FFF33',
  },
  legendText: {
    fontSize: 9,
    color: '#CCC',
    fontWeight: 'bold',
  },

  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 6,
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
    color: '#4ECDC4',
  },

  activePowerUpsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    backgroundColor: '#1B2A4A',
    gap: 4,
  },
  activePULabel: {
    fontSize: 10,
    color: '#AAA',
  },
  activePUEmoji: {
    fontSize: 16,
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