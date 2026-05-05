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

export default function ShipBattleGame({ navigation }) {
  const [scores, setScores] = useState({ player1: 0, player2: 0 });
  const [round, setRound] = useState(1);
  const [gameActive, setGameActive] = useState(true);
  const [gameTime, setGameTime] = useState(90);
  const [currentPlayer, setCurrentPlayer] = useState(1);

  // Ship 1 (Player 1) - Left side
  const [ship1Pos, setShip1Pos] = useState({
    x: 60,
    y: height / 2 - 100,
  });
  const [ship1Health, setShip1Health] = useState(100);
  const [ship1Ammo, setShip1Ammo] = useState(100);
  const [ship1Shield, setShip1Shield] = useState(false);

  // Ship 2 (Player 2) - Right side
  const [ship2Pos, setShip2Pos] = useState({
    x: width - 100,
    y: height / 2 - 100,
  });
  const [ship2Health, setShip2Health] = useState(100);
  const [ship2Ammo, setShip2Ammo] = useState(100);
  const [ship2Shield, setShip2Shield] = useState(false);

  // Cannonballs (projectiles)
  const [cannonballs, setCannonballs] = useState([]);

  // Wave obstacles
  const [waves, setWaves] = useState([
    { id: 1, x: width / 2 - 100, y: 200, radius: 30 },
    { id: 2, x: width / 2 + 80, y: 300, radius: 30 },
    { id: 3, x: width / 2, y: 400, radius: 30 },
  ]);

  // Treasure/Power-ups
  const [treasures, setTreasures] = useState([
    { id: 1, x: 100, y: 150, type: 'ammo', collected: false },
    { id: 2, x: width - 100, y: 350, type: 'health', collected: false },
    { id: 3, x: width / 2, y: 250, type: 'shield', collected: false },
  ]);

  // Animations
  const ship1Shake = useRef(new Animated.Value(0)).current;
  const ship2Shake = useRef(new Animated.Value(0)).current;
  const ship1Fire = useRef(new Animated.Value(0)).current;
  const ship2Fire = useRef(new Animated.Value(0)).current;

  // Game timer
  useEffect(() => {
    if (!gameActive) return;

    const timer = setInterval(() => {
      setGameTime((prev) => {
        if (prev <= 1) {
          endRound();
          return 90;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameActive]);

  // Ammo regeneration
  useEffect(() => {
    if (!gameActive) return;

    const ammoTimer = setInterval(() => {
      setShip1Ammo((prev) => Math.min(100, prev + 1));
      setShip2Ammo((prev) => Math.min(100, prev + 1));
    }, 1000);

    return () => clearInterval(ammoTimer);
  }, [gameActive]);

  // Cannonball physics
  useEffect(() => {
    if (!gameActive || cannonballs.length === 0) return;

    const projectileInterval = setInterval(() => {
      setCannonballs((prevCannonballs) => {
        const updated = prevCannonballs
          .map((ball) => ({
            ...ball,
            x: ball.x + ball.vx,
            y: ball.y + ball.vy,
            vy: ball.vy + 0.2, // Gravity
          }))
          .filter((ball) => {
            // Remove cannonballs out of bounds
            return ball.x > 0 && ball.x < width && ball.y > 0 && ball.y < height;
          });

        // Check collisions with ships
        updated.forEach((ball) => {
          // Ship 1 collision
          if (
            ball.owner !== 1 &&
            ship1Pos.x - 30 < ball.x &&
            ball.x < ship1Pos.x + 30 &&
            ship1Pos.y - 30 < ball.y &&
            ball.y < ship1Pos.y + 30
          ) {
            handleShip1Hit(ball.damage);
            setCannonballs((prev) => prev.filter((p) => p.id !== ball.id));
          }

          // Ship 2 collision
          if (
            ball.owner !== 2 &&
            ship2Pos.x - 30 < ball.x &&
            ball.x < ship2Pos.x + 30 &&
            ship2Pos.y - 30 < ball.y &&
            ball.y < ship2Pos.y + 30
          ) {
            handleShip2Hit(ball.damage);
            setCannonballs((prev) => prev.filter((p) => p.id !== ball.id));
          }

          // Wave collision (bounce)
          waves.forEach((wave) => {
            const dist = Math.sqrt(
              Math.pow(ball.x - wave.x, 2) + Math.pow(ball.y - wave.y, 2)
            );
            if (dist < wave.radius + 10) {
              ball.vy = -Math.abs(ball.vy);
              ball.y = wave.y - wave.radius - 10;
            }
          });
        });

        return updated;
      });
    }, 30);

    return () => clearInterval(projectileInterval);
  }, [gameActive, cannonballs, ship1Pos, ship2Pos, waves, ship1Shield, ship2Shield]);

  // Ship 1 hit handler
  const handleShip1Hit = (damage) => {
    // Shake animation
    Animated.sequence([
      Animated.timing(ship1Shake, {
        toValue: 15,
        duration: 100,
        useNativeDriver: false,
      }),
      Animated.timing(ship1Shake, {
        toValue: -15,
        duration: 100,
        useNativeDriver: false,
      }),
      Animated.timing(ship1Shake, {
        toValue: 0,
        duration: 100,
        useNativeDriver: false,
      }),
    ]).start();

    // Damage calculation
    let actualDamage = damage;
    if (ship1Shield) {
      actualDamage = damage / 3; // Shield reduces damage
      setShip1Shield(false); // Shield breaks
    }

    setShip1Health((prev) => Math.max(0, prev - actualDamage));

    // Award points to ship 2
    setScores((prev) => ({ ...prev, player2: prev.player2 + Math.round(actualDamage * 3) }));

    Alert.alert('💥 Direct Hit!', `Ship 1 took ${Math.round(actualDamage)} damage!`, [
      { text: 'OK', onPress: () => {} },
    ]);
  };

  // Ship 2 hit handler
  const handleShip2Hit = (damage) => {
    // Shake animation
    Animated.sequence([
      Animated.timing(ship2Shake, {
        toValue: 15,
        duration: 100,
        useNativeDriver: false,
      }),
      Animated.timing(ship2Shake, {
        toValue: -15,
        duration: 100,
        useNativeDriver: false,
      }),
      Animated.timing(ship2Shake, {
        toValue: 0,
        duration: 100,
        useNativeDriver: false,
      }),
    ]).start();

    // Damage calculation
    let actualDamage = damage;
    if (ship2Shield) {
      actualDamage = damage / 3; // Shield reduces damage
      setShip2Shield(false); // Shield breaks
    }

    setShip2Health((prev) => Math.max(0, prev - actualDamage));

    // Award points to ship 1
    setScores((prev) => ({ ...prev, player1: prev.player1 + Math.round(actualDamage * 3) }));

    Alert.alert('💥 Direct Hit!', `Ship 2 took ${Math.round(actualDamage)} damage!`, [
      { text: 'OK', onPress: () => {} },
    ]);
  };

  // Ship 1 controls
  const handleShip1Move = (direction) => {
    if (!gameActive) return;

    const moveDistance = 40;
    setShip1Pos((prev) => {
      let newPos = { ...prev };

      switch (direction) {
        case 'up':
          newPos.y = Math.max(80, prev.y - moveDistance);
          break;
        case 'down':
          newPos.y = Math.min(height - 150, prev.y + moveDistance);
          break;
        case 'left':
          newPos.x = Math.max(40, prev.x - moveDistance);
          break;
        case 'right':
          newPos.x = Math.min(width / 2 - 60, prev.x + moveDistance);
          break;
      }

      return newPos;
    });
  };

  const handleShip1Fire = (power) => {
    if (!gameActive || ship1Ammo < 10) return;

    setShip1Ammo((prev) => prev - 10);

    // Fire animation
    Animated.sequence([
      Animated.timing(ship1Fire, {
        toValue: 1,
        duration: 200,
        useNativeDriver: false,
      }),
      Animated.timing(ship1Fire, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }),
    ]).start();

    // Create cannonball
    const angle = (Math.random() - 0.5) * 0.5;
    const cannonball = {
      id: Date.now() + Math.random(),
      owner: 1,
      x: ship1Pos.x + 30,
      y: ship1Pos.y,
      vx: 6 + power * 0.02,
      vy: angle,
      damage: 10 + power * 0.1,
    };

    setCannonballs((prev) => [...prev, cannonball]);

    Alert.alert('🔫 Cannonball Fired!', `Power: ${Math.round(power)}%`, [
      { text: 'OK', onPress: () => {} },
    ]);
  };

  const handleShip1Shield = () => {
    if (!gameActive || ship1Ammo < 20) return;

    setShip1Ammo((prev) => prev - 20);
    setShip1Shield(true);

    Alert.alert('🛡️ Shield Activated!', 'Protection for next hit', [
      { text: 'OK', onPress: () => {} },
    ]);

    setTimeout(() => setShip1Shield(false), 5000);
  };

  // Ship 2 controls
  const handleShip2Move = (direction) => {
    if (!gameActive) return;

    const moveDistance = 40;
    setShip2Pos((prev) => {
      let newPos = { ...prev };

      switch (direction) {
        case 'up':
          newPos.y = Math.max(80, prev.y - moveDistance);
          break;
        case 'down':
          newPos.y = Math.min(height - 150, prev.y + moveDistance);
          break;
        case 'left':
          newPos.x = Math.max(width / 2 + 60, prev.x - moveDistance);
          break;
        case 'right':
          newPos.x = Math.min(width - 40, prev.x + moveDistance);
          break;
      }

      return newPos;
    });
  };

  const handleShip2Fire = (power) => {
    if (!gameActive || ship2Ammo < 10) return;

    setShip2Ammo((prev) => prev - 10);

    // Fire animation
    Animated.sequence([
      Animated.timing(ship2Fire, {
        toValue: 1,
        duration: 200,
        useNativeDriver: false,
      }),
      Animated.timing(ship2Fire, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }),
    ]).start();

    // Create cannonball
    const angle = (Math.random() - 0.5) * 0.5;
    const cannonball = {
      id: Date.now() + Math.random(),
      owner: 2,
      x: ship2Pos.x - 30,
      y: ship2Pos.y,
      vx: -(6 + power * 0.02),
      vy: angle,
      damage: 10 + power * 0.1,
    };

    setCannonballs((prev) => [...prev, cannonball]);

    Alert.alert('🔫 Cannonball Fired!', `Power: ${Math.round(power)}%`, [
      { text: 'OK', onPress: () => {} },
    ]);
  };

  const handleShip2Shield = () => {
    if (!gameActive || ship2Ammo < 20) return;

    setShip2Ammo((prev) => prev - 20);
    setShip2Shield(true);

    Alert.alert('🛡️ Shield Activated!', 'Protection for next hit', [
      { text: 'OK', onPress: () => {} },
    ]);

    setTimeout(() => setShip2Shield(false), 5000);
  };

  // Treasure collection
  useEffect(() => {
    treasures.forEach((treasure) => {
      if (treasure.collected) return;

      // Ship 1 collision
      const dist1 = Math.sqrt(
        Math.pow(ship1Pos.x - treasure.x, 2) +
          Math.pow(ship1Pos.y - treasure.y, 2)
      );

      if (dist1 < 50) {
        setTreasures((prev) =>
          prev.map((t) => (t.id === treasure.id ? { ...t, collected: true } : t))
        );

        if (treasure.type === 'ammo') {
          setShip1Ammo(100);
          setScores((prev) => ({ ...prev, player1: prev.player1 + 25 }));
        } else if (treasure.type === 'health') {
          setShip1Health(100);
          setScores((prev) => ({ ...prev, player1: prev.player1 + 50 }));
        } else if (treasure.type === 'shield') {
          setShip1Shield(true);
          setScores((prev) => ({ ...prev, player1: prev.player1 + 35 }));
        }
      }

      // Ship 2 collision
      const dist2 = Math.sqrt(
        Math.pow(ship2Pos.x - treasure.x, 2) +
          Math.pow(ship2Pos.y - treasure.y, 2)
      );

      if (dist2 < 50) {
        setTreasures((prev) =>
          prev.map((t) => (t.id === treasure.id ? { ...t, collected: true } : t))
        );

        if (treasure.type === 'ammo') {
          setShip2Ammo(100);
          setScores((prev) => ({ ...prev, player2: prev.player2 + 25 }));
        } else if (treasure.type === 'health') {
          setShip2Health(100);
          setScores((prev) => ({ ...prev, player2: prev.player2 + 50 }));
        } else if (treasure.type === 'shield') {
          setShip2Shield(true);
          setScores((prev) => ({ ...prev, player2: prev.player2 + 35 }));
        }
      }
    });
  }, [ship1Pos, ship2Pos, treasures]);

  // Check win condition
  useEffect(() => {
    if (ship1Health <= 0 || ship2Health <= 0) {
      endRound();
    }
  }, [ship1Health, ship2Health]);

  const endRound = () => {
    setGameActive(false);

    let winner = '';
    if (ship1Health > ship2Health) {
      winner = 'Player 1 ⚓';
      setScores((prev) => ({ ...prev, player1: prev.player1 + 100 }));
    } else if (ship2Health > ship1Health) {
      winner = 'Player 2 ⚓';
      setScores((prev) => ({ ...prev, player2: prev.player2 + 100 }));
    } else {
      winner = 'Draw 🤝';
    }

    Alert.alert(`Round ${round} Over!`, `${winner}`, [
      { text: 'Next Round', onPress: nextRound },
      { text: 'End Game', onPress: () => navigation.goBack() },
    ]);
  };

  const nextRound = () => {
    setRound(round + 1);
    setGameTime(90);
    setShip1Health(100);
    setShip2Health(100);
    setShip1Ammo(100);
    setShip2Ammo(100);
    setShip1Shield(false);
    setShip2Shield(false);
    setShip1Pos({ x: 60, y: height / 2 - 100 });
    setShip2Pos({ x: width - 100, y: height / 2 - 100 });
    setCannonballs([]);
    setTreasures([
      { id: 1, x: 100, y: 150, type: 'ammo', collected: false },
      { id: 2, x: width - 100, y: 350, type: 'health', collected: false },
      { id: 3, x: width / 2, y: 250, type: 'shield', collected: false },
    ]);
    setGameActive(true);
  };

  const resetGame = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backBtn}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Ship Battle</Text>
        <View style={{ width: 50 }} />
      </View>

      {/* Scores and Time */}
      <View style={styles.topBar}>
        <View style={styles.scoreItem}>
          <Text style={styles.playerLabel}>Player 1</Text>
          <Text style={[styles.scoreValue, { color: COLORS.player1 }]}>
            {scores.player1}
          </Text>
        </View>

        <View style={styles.timerBox}>
          <Text style={styles.timer}>{gameTime}s</Text>
          <Text style={styles.round}>Round {round}</Text>
        </View>

        <View style={styles.scoreItem}>
          <Text style={styles.playerLabel}>Player 2</Text>
          <Text style={[styles.scoreValue, { color: COLORS.player2 }]}>
            {scores.player2}
          </Text>
        </View>
      </View>

      {/* Battle Arena */}
      <View style={styles.arena}>
        {/* Waves */}
        {waves.map((wave) => (
          <View
            key={wave.id}
            style={[
              styles.wave,
              {
                left: wave.x - wave.radius,
                top: wave.y - wave.radius,
                width: wave.radius * 2,
                height: wave.radius * 2,
              },
            ]}
          >
            <Text style={styles.waveEmoji}>〜</Text>
          </View>
        ))}

        {/* Treasures */}
        {treasures.map((treasure) => (
          !treasure.collected && (
            <View
              key={treasure.id}
              style={[
                styles.treasure,
                {
                  left: treasure.x - 15,
                  top: treasure.y - 15,
                },
              ]}
            >
              <Text style={styles.treasureEmoji}>
                {treasure.type === 'ammo'
                  ? '🔫'
                  : treasure.type === 'health'
                  ? '❤️'
                  : '🛡️'}
              </Text>
            </View>
          )
        ))}

        {/* Ship 1 */}
        <Animated.View
          style={[
            styles.ship,
            {
              left: ship1Pos.x,
              top: ship1Pos.y,
              transform: [{ translateX: ship1Shake }],
              backgroundColor: ship1Shield ? '#FFD700' : COLORS.player1,
            },
          ]}
        >
          <Text style={styles.shipEmoji}>🚢</Text>
        </Animated.View>

        {/* Ship 2 */}
        <Animated.View
          style={[
            styles.ship,
            {
              left: ship2Pos.x,
              top: ship2Pos.y,
              transform: [{ translateX: ship2Shake }],
              backgroundColor: ship2Shield ? '#FFD700' : COLORS.player2,
            },
          ]}
        >
          <Text style={styles.shipEmoji}>🚢</Text>
        </Animated.View>

        {/* Cannonballs */}
        {cannonballs.map((ball) => (
          <View
            key={ball.id}
            style={[
              styles.cannonball,
              {
                left: ball.x - 8,
                top: ball.y - 8,
                backgroundColor: ball.owner === 1 ? COLORS.player1 : COLORS.player2,
              },
            ]}
          />
        ))}
      </View>

      {/* Health and Ammo Bars */}
      <View style={styles.statusBars}>
        <View style={styles.statusBox}>
          <Text style={styles.statusLabel}>Health</Text>
          <View style={styles.healthBar}>
            <View
              style={[
                styles.healthFill,
                {
                  width: `${ship1Health}%`,
                  backgroundColor: COLORS.player1,
                },
              ]}
            />
          </View>
          <Text style={styles.statusValue}>{Math.round(ship1Health)}/100</Text>
        </View>

        <View style={styles.statusBox}>
          <Text style={styles.statusLabel}>Ammo</Text>
          <View style={styles.ammoBar}>
            <View
              style={[
                styles.ammoFill,
                {
                  width: `${ship1Ammo}%`,
                  backgroundColor: COLORS.warning,
                },
              ]}
            />
          </View>
          <Text style={styles.statusValue}>{Math.round(ship1Ammo)}/100</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.statusBox}>
          <Text style={styles.statusLabel}>Ammo</Text>
          <View style={styles.ammoBar}>
            <View
              style={[
                styles.ammoFill,
                {
                  width: `${ship2Ammo}%`,
                  backgroundColor: COLORS.warning,
                },
              ]}
            />
          </View>
          <Text style={styles.statusValue}>{Math.round(ship2Ammo)}/100</Text>
        </View>

        <View style={styles.statusBox}>
          <Text style={styles.statusLabel}>Health</Text>
          <View style={styles.healthBar}>
            <View
              style={[
                styles.healthFill,
                {
                  width: `${ship2Health}%`,
                  backgroundColor: COLORS.player2,
                },
              ]}
            />
          </View>
          <Text style={styles.statusValue}>{Math.round(ship2Health)}/100</Text>
        </View>
      </View>

      {/* Controls */}
      <View style={styles.controlsContainer}>
        {/* Player 1 Controls */}
        <View style={styles.playerControls}>
          <TouchableOpacity
            style={styles.moveBtn}
            onPress={() => handleShip1Move('up')}
          >
            <Text style={styles.arrow}>⬆️</Text>
          </TouchableOpacity>
          <View style={styles.rowControls}>
            <TouchableOpacity
              style={styles.moveBtn}
              onPress={() => handleShip1Move('left')}
            >
              <Text style={styles.arrow}>⬅️</Text>
            </TouchableOpacity>
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.fireBtn, { backgroundColor: COLORS.danger }]}
                onPress={() => handleShip1Fire(50)}
              >
                <Text style={styles.fireText}>🔫</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.fireBtn, { backgroundColor: COLORS.warning }]}
                onPress={() => handleShip1Fire(100)}
              >
                <Text style={styles.fireText}>💥</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.fireBtn, { backgroundColor: COLORS.success }]}
                onPress={handleShip1Shield}
              >
                <Text style={styles.fireText}>🛡️</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={styles.moveBtn}
              onPress={() => handleShip1Move('right')}
            >
              <Text style={styles.arrow}>➡️</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={styles.moveBtn}
            onPress={() => handleShip1Move('down')}
          >
            <Text style={styles.arrow}>⬇️</Text>
          </TouchableOpacity>
        </View>

        {/* Player 2 Controls */}
        <View style={styles.playerControls}>
          <TouchableOpacity
            style={styles.moveBtn}
            onPress={() => handleShip2Move('up')}
          >
            <Text style={styles.arrow}>⬆️</Text>
          </TouchableOpacity>
          <View style={styles.rowControls}>
            <TouchableOpacity
              style={styles.moveBtn}
              onPress={() => handleShip2Move('left')}
            >
              <Text style={styles.arrow}>⬅️</Text>
            </TouchableOpacity>
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.fireBtn, { backgroundColor: COLORS.danger }]}
                onPress={() => handleShip2Fire(50)}
              >
                <Text style={styles.fireText}>🔫</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.fireBtn, { backgroundColor: COLORS.warning }]}
                onPress={() => handleShip2Fire(100)}
              >
                <Text style={styles.fireText}>💥</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.fireBtn, { backgroundColor: COLORS.success }]}
                onPress={handleShip2Shield}
              >
                <Text style={styles.fireText}>🛡️</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={styles.moveBtn}
              onPress={() => handleShip2Move('right')}
            >
              <Text style={styles.arrow}>➡️</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={styles.moveBtn}
            onPress={() => handleShip2Move('down')}
          >
            <Text style={styles.arrow}>⬇️</Text>
          </TouchableOpacity>
        </View>
      </View>

      {!gameActive && (
        <View style={styles.gameOverButtons}>
          <TouchableOpacity style={styles.nextRoundBtn} onPress={nextRound}>
            <Text style={styles.nextRoundText}>Next Round</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.endGameBtn} onPress={resetGame}>
            <Text style={styles.endGameText}>End Game</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.primary,
  },
  backBtn: { fontSize: 18, color: '#FFF', fontWeight: 'bold' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#FFF' },

  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.cardBg,
  },
  scoreItem: { alignItems: 'center' },
  playerLabel: { fontSize: 12, color: COLORS.textLight },
  scoreValue: { fontSize: 24, fontWeight: 'bold' },
  timerBox: { alignItems: 'center' },
  timer: { fontSize: 28, fontWeight: 'bold', color: COLORS.danger },
  round: { fontSize: 12, color: COLORS.textLight },

  arena: {
    flex: 1,
    backgroundColor: '#0A3D5C',
    marginHorizontal: SPACING.lg,
    marginVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    position: 'relative',
  },

  wave: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#1E90FF',
    borderRadius: 50,
  },
  waveEmoji: { fontSize: 24, color: '#1E90FF' },

  treasure: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFD700',
  },
  treasureEmoji: { fontSize: 20 },

  ship: {
    position: 'absolute',
    width: 50,
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  shipEmoji: { fontSize: 40 },

  cannonball: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderRadius: 8,
  },

  statusBars: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    gap: SPACING.xs,
  },
  statusBox: { flex: 1 },
  statusLabel: { fontSize: 10, fontWeight: 'bold', color: COLORS.text, marginBottom: SPACING.xs },
  healthBar: {
    height: 12,
    backgroundColor: '#DDD',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: SPACING.xs,
  },
  healthFill: { height: '100%' },
  ammoBar: {
    height: 12,
    backgroundColor: '#DDD',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: SPACING.xs,
  },
  ammoFill: { height: '100%' },
  statusValue: { fontSize: 9, color: COLORS.textLight, textAlign: 'center' },
  divider: {
    width: 1,
    height: '100%',
    backgroundColor: '#DDD',
  },

  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.lg,
    gap: SPACING.md,
  },
  playerControls: { alignItems: 'center', gap: SPACING.xs },
  moveBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.cardBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  arrow: { fontSize: 18 },
  rowControls: { flexDirection: 'row', gap: SPACING.xs, alignItems: 'center' },
  actionButtons: { gap: SPACING.xs },
  fireBtn: {
    width: 35,
    height: 35,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fireText: { fontSize: 16 },

  gameOverButtons: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.lg,
    gap: SPACING.sm,
  },
  nextRoundBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
  },
  nextRoundText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
    textAlign: 'center',
  },
  endGameBtn: {
    backgroundColor: COLORS.secondary,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
  },
  endGameText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
    textAlign: 'center',
  },
});