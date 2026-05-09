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
import { COLORS, SPACING, BORDER_RADIUS } from '../../styles/theme';

const { width, height } = Dimensions.get('window');

export default function RobotArenaGame({ navigation }) {
  const [scores, setScores] = useState({ player1: 0, player2: 0 });
  const [round, setRound] = useState(1);
  const [gameActive, setGameActive] = useState(true);
  const [gameTime, setGameTime] = useState(60);

  // Robot 1 (Player 1) - Red
  const [robot1Pos, setRobot1Pos] = useState({
    x: 80,
    y: height / 2 - 100,
  });
  const [robot1Health, setRobot1Health] = useState(100);
  const [robot1Power, setRobot1Power] = useState(100);
  const [robot1Armor, setRobot1Armor] = useState(false);

  // Robot 2 (Player 2) - Blue
  const [robot2Pos, setRobot2Pos] = useState({
    x: width - 120,
    y: height / 2 - 100,
  });
  const [robot2Health, setRobot2Health] = useState(100);
  const [robot2Power, setRobot2Power] = useState(100);
  const [robot2Armor, setRobot2Armor] = useState(false);

  // Projectiles
  const [projectiles, setProjectiles] = useState([]);

  // Energy regeneration
  const [energyTick, setEnergyTick] = useState(0);

  // Animations
  const robot1Scale = useRef(new Animated.Value(1)).current;
  const robot2Scale = useRef(new Animated.Value(1)).current;
  const robot1HitFlash = useRef(new Animated.Value(0)).current;
  const robot2HitFlash = useRef(new Animated.Value(0)).current;

  // Game timer
  useEffect(() => {
    if (!gameActive) return;

    const timer = setInterval(() => {
      setGameTime((prev) => {
        if (prev <= 1) {
          endRound();
          return 60;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameActive]);

  // Energy regeneration
  useEffect(() => {
    if (!gameActive) return;

    const energyInterval = setInterval(() => {
      setEnergyTick((prev) => prev + 1);

      setRobot1Power((prev) => Math.min(100, prev + 1));
      setRobot2Power((prev) => Math.min(100, prev + 1));
    }, 500);

    return () => clearInterval(energyInterval);
  }, [gameActive]);

  // Projectile physics
  useEffect(() => {
    if (!gameActive || projectiles.length === 0) return;

    const projectileInterval = setInterval(() => {
      setProjectiles((prevProjectiles) => {
        const updated = prevProjectiles
          .map((proj) => ({
            ...proj,
            x: proj.x + proj.vx,
            y: proj.y + proj.vy,
          }))
          .filter((proj) => {
            // Remove projectiles out of bounds
            return proj.x > 0 && proj.x < width && proj.y > 0 && proj.y < height;
          });

        // Check collisions with robots
        updated.forEach((proj) => {
          // Robot 1 collision
          if (
            proj.owner !== 1 &&
            robot1Pos.x - 20 < proj.x &&
            proj.x < robot1Pos.x + 20 &&
            robot1Pos.y - 20 < proj.y &&
            proj.y < robot1Pos.y + 20
          ) {
            handleRobot1Hit(proj.damage);
            // Remove projectile
            setProjectiles((prev) => prev.filter((p) => p.id !== proj.id));
          }

          // Robot 2 collision
          if (
            proj.owner !== 2 &&
            robot2Pos.x - 20 < proj.x &&
            proj.x < robot2Pos.x + 20 &&
            robot2Pos.y - 20 < proj.y &&
            proj.y < robot2Pos.y + 20
          ) {
            handleRobot2Hit(proj.damage);
            // Remove projectile
            setProjectiles((prev) => prev.filter((p) => p.id !== proj.id));
          }
        });

        return updated;
      });
    }, 50);

    return () => clearInterval(projectileInterval);
  }, [gameActive, projectiles, robot1Pos, robot2Pos, robot1Armor, robot2Armor]);

  // Robot 1 hit handler
  const handleRobot1Hit = (damage) => {
    // Flash animation
    Animated.sequence([
      Animated.timing(robot1HitFlash, {
        toValue: 1,
        duration: 100,
        useNativeDriver: false,
      }),
      Animated.timing(robot1HitFlash, {
        toValue: 0,
        duration: 100,
        useNativeDriver: false,
      }),
    ]).start();

    // Damage calculation
    let actualDamage = damage;
    if (robot1Armor) {
      actualDamage = damage / 2; // Armor reduces damage
      setRobot1Armor(false); // Armor breaks after one hit
    }

    setRobot1Health((prev) => Math.max(0, prev - actualDamage));

    // Award points to robot 2
    setScores((prev) => ({ ...prev, player2: prev.player2 + Math.round(actualDamage * 2) }));

    // Scale animation
    Animated.sequence([
      Animated.timing(robot1Scale, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: false,
      }),
      Animated.timing(robot1Scale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: false,
      }),
    ]).start();
  };

  // Robot 2 hit handler
  const handleRobot2Hit = (damage) => {
    // Flash animation
    Animated.sequence([
      Animated.timing(robot2HitFlash, {
        toValue: 1,
        duration: 100,
        useNativeDriver: false,
      }),
      Animated.timing(robot2HitFlash, {
        toValue: 0,
        duration: 100,
        useNativeDriver: false,
      }),
    ]).start();

    // Damage calculation
    let actualDamage = damage;
    if (robot2Armor) {
      actualDamage = damage / 2; // Armor reduces damage
      setRobot2Armor(false); // Armor breaks after one hit
    }

    setRobot2Health((prev) => Math.max(0, prev - actualDamage));

    // Award points to robot 1
    setScores((prev) => ({ ...prev, player1: prev.player1 + Math.round(actualDamage * 2) }));

    // Scale animation
    Animated.sequence([
      Animated.timing(robot2Scale, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: false,
      }),
      Animated.timing(robot2Scale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: false,
      }),
    ]).start();
  };

  // Robot 1 controls
  const handleRobot1Move = (direction) => {
    if (!gameActive) return;

    const moveDistance = 30;
    setRobot1Pos((prev) => {
      let newPos = { ...prev };

      switch (direction) {
        case 'up':
          newPos.y = Math.max(100, prev.y - moveDistance);
          break;
        case 'down':
          newPos.y = Math.min(height - 150, prev.y + moveDistance);
          break;
        case 'left':
          newPos.x = Math.max(40, prev.x - moveDistance);
          break;
        case 'right':
          newPos.x = Math.min(width / 2 - 40, prev.x + moveDistance);
          break;
      }

      return newPos;
    });
  };

  const handleRobot1Attack = (attackType) => {
    if (!gameActive) return;

    if (attackType === 'laser') {
      if (robot1Power < 20) return;
      setRobot1Power((prev) => prev - 20);

      // Create projectile
      const projectile = {
        id: Date.now() + Math.random(),
        owner: 1,
        x: robot1Pos.x + 20,
        y: robot1Pos.y,
        vx: 8,
        vy: (Math.random() - 0.5) * 2,
        damage: 15,
        type: 'laser',
      };

      setProjectiles((prev) => [...prev, projectile]);

      Alert.alert('⚡ Laser Fired!', 'Damage: 15', [
        { text: 'OK', onPress: () => {} },
      ]);
    } else if (attackType === 'missile') {
      if (robot1Power < 40) return;
      setRobot1Power((prev) => prev - 40);

      // Create projectile with tracking
      const projectile = {
        id: Date.now() + Math.random(),
        owner: 1,
        x: robot1Pos.x + 20,
        y: robot1Pos.y,
        vx: 6,
        vy: (Math.random() - 0.5) * 3,
        damage: 30,
        type: 'missile',
      };

      setProjectiles((prev) => [...prev, projectile]);

      Alert.alert('🚀 Missile Fired!', 'Damage: 30', [
        { text: 'OK', onPress: () => {} },
      ]);
    }
  };

  const handleRobot1Shield = () => {
    if (!gameActive || robot1Power < 30) return;
    setRobot1Power((prev) => prev - 30);
    setRobot1Armor(true);

    Alert.alert('🛡️ Shield Activated!', 'Reduced damage for 1 hit', [
      { text: 'OK', onPress: () => {} },
    ]);
  };

  // Robot 2 controls
  const handleRobot2Move = (direction) => {
    if (!gameActive) return;

    const moveDistance = 30;
    setRobot2Pos((prev) => {
      let newPos = { ...prev };

      switch (direction) {
        case 'up':
          newPos.y = Math.max(100, prev.y - moveDistance);
          break;
        case 'down':
          newPos.y = Math.min(height - 150, prev.y + moveDistance);
          break;
        case 'left':
          newPos.x = Math.max(width / 2 + 40, prev.x - moveDistance);
          break;
        case 'right':
          newPos.x = Math.min(width - 40, prev.x + moveDistance);
          break;
      }

      return newPos;
    });
  };

  const handleRobot2Attack = (attackType) => {
    if (!gameActive) return;

    if (attackType === 'laser') {
      if (robot2Power < 20) return;
      setRobot2Power((prev) => prev - 20);

      // Create projectile
      const projectile = {
        id: Date.now() + Math.random(),
        owner: 2,
        x: robot2Pos.x - 20,
        y: robot2Pos.y,
        vx: -8,
        vy: (Math.random() - 0.5) * 2,
        damage: 15,
        type: 'laser',
      };

      setProjectiles((prev) => [...prev, projectile]);

      Alert.alert('⚡ Laser Fired!', 'Damage: 15', [
        { text: 'OK', onPress: () => {} },
      ]);
    } else if (attackType === 'missile') {
      if (robot2Power < 40) return;
      setRobot2Power((prev) => prev - 40);

      // Create projectile with tracking
      const projectile = {
        id: Date.now() + Math.random(),
        owner: 2,
        x: robot2Pos.x - 20,
        y: robot2Pos.y,
        vx: -6,
        vy: (Math.random() - 0.5) * 3,
        damage: 30,
        type: 'missile',
      };

      setProjectiles((prev) => [...prev, projectile]);

      Alert.alert('🚀 Missile Fired!', 'Damage: 30', [
        { text: 'OK', onPress: () => {} },
      ]);
    }
  };

  const handleRobot2Shield = () => {
    if (!gameActive || robot2Power < 30) return;
    setRobot2Power((prev) => prev - 30);
    setRobot2Armor(true);

    Alert.alert('🛡️ Shield Activated!', 'Reduced damage for 1 hit', [
      { text: 'OK', onPress: () => {} },
    ]);
  };

  // Check win condition
  useEffect(() => {
    if (robot1Health <= 0 || robot2Health <= 0) {
      endRound();
    }
  }, [robot1Health, robot2Health]);

  const endRound = () => {
    setGameActive(false);

    let winner = '';
    if (robot1Health > robot2Health) {
      winner = 'Player 1 (Red) 🤖';
      setScores((prev) => ({ ...prev, player1: prev.player1 + 100 }));
    } else if (robot2Health > robot1Health) {
      winner = 'Player 2 (Blue) 🤖';
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
    setGameTime(60);
    setRobot1Health(100);
    setRobot2Health(100);
    setRobot1Power(100);
    setRobot2Power(100);
    setRobot1Armor(false);
    setRobot2Armor(false);
    setRobot1Pos({ x: 80, y: height / 2 - 100 });
    setRobot2Pos({ x: width - 120, y: height / 2 - 100 });
    setProjectiles([]);
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
        <Text style={styles.title}>Robot Arena</Text>
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

      {/* Arena */}
      <View style={styles.arena}>
        {/* Robot 1 */}
        <Animated.View
          style={[
            styles.robot,
            {
              left: robot1Pos.x,
              top: robot1Pos.y,
              transform: [{ scale: robot1Scale }],
              backgroundColor: robot1Armor ? '#FFD700' : COLORS.player1,
              opacity: robot1HitFlash.interpolate({
                inputRange: [0, 1],
                outputRange: [1, 0.5],
              }),
            },
          ]}
        >
          <Text style={styles.robotEmoji}>🤖</Text>
        </Animated.View>

        {/* Robot 2 */}
        <Animated.View
          style={[
            styles.robot,
            {
              left: robot2Pos.x,
              top: robot2Pos.y,
              transform: [{ scale: robot2Scale }],
              backgroundColor: robot2Armor ? '#FFD700' : COLORS.player2,
              opacity: robot2HitFlash.interpolate({
                inputRange: [0, 1],
                outputRange: [1, 0.5],
              }),
            },
          ]}
        >
          <Text style={styles.robotEmoji}>🤖</Text>
        </Animated.View>

        {/* Projectiles */}
        {projectiles.map((proj) => (
          <View
            key={proj.id}
            style={[
              styles.projectile,
              {
                left: proj.x - 8,
                top: proj.y - 8,
                backgroundColor: proj.owner === 1 ? '#FF6B6B' : '#4ECDC4',
              },
            ]}
          >
            <Text style={styles.projectileEmoji}>
              {proj.type === 'laser' ? '⚡' : '🚀'}
            </Text>
          </View>
        ))}

        {/* Center divider */}
        <View style={styles.divider} />
      </View>

      {/* Health and Power Bars */}
      <View style={styles.statusBars}>
        <View style={styles.statusBox}>
          <Text style={styles.statusLabel}>Health</Text>
          <View style={styles.healthBar}>
            <View
              style={[
                styles.healthFill,
                {
                  width: `${robot1Health}%`,
                  backgroundColor: COLORS.player1,
                },
              ]}
            />
          </View>
          <Text style={styles.statusValue}>{Math.round(robot1Health)}/100</Text>
        </View>

        <View style={styles.statusBox}>
          <Text style={styles.statusLabel}>Power</Text>
          <View style={styles.powerBar}>
            <View
              style={[
                styles.powerFill,
                {
                  width: `${robot1Power}%`,
                  backgroundColor: COLORS.warning,
                },
              ]}
            />
          </View>
          <Text style={styles.statusValue}>{Math.round(robot1Power)}/100</Text>
        </View>

        <View style={styles.dividerSmall} />

        <View style={styles.statusBox}>
          <Text style={styles.statusLabel}>Power</Text>
          <View style={styles.powerBar}>
            <View
              style={[
                styles.powerFill,
                {
                  width: `${robot2Power}%`,
                  backgroundColor: COLORS.warning,
                },
              ]}
            />
          </View>
          <Text style={styles.statusValue}>{Math.round(robot2Power)}/100</Text>
        </View>

        <View style={styles.statusBox}>
          <Text style={styles.statusLabel}>Health</Text>
          <View style={styles.healthBar}>
            <View
              style={[
                styles.healthFill,
                {
                  width: `${robot2Health}%`,
                  backgroundColor: COLORS.player2,
                },
              ]}
            />
          </View>
          <Text style={styles.statusValue}>{Math.round(robot2Health)}/100</Text>
        </View>
      </View>

      {/* Controls */}
      <View style={styles.controlsContainer}>
        {/* Player 1 Controls */}
        <View style={styles.playerControls}>
          <TouchableOpacity
            style={styles.moveBtn}
            onPress={() => handleRobot1Move('up')}
          >
            <Text style={styles.arrow}>⬆️</Text>
          </TouchableOpacity>
          <View style={styles.rowControls}>
            <TouchableOpacity
              style={styles.moveBtn}
              onPress={() => handleRobot1Move('left')}
            >
              <Text style={styles.arrow}>⬅️</Text>
            </TouchableOpacity>
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.attackBtn, { backgroundColor: '#FF6B6B' }]}
                onPress={() => handleRobot1Attack('laser')}
              >
                <Text style={styles.actionText}>⚡</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.attackBtn, { backgroundColor: '#FF8C42' }]}
                onPress={() => handleRobot1Attack('missile')}
              >
                <Text style={styles.actionText}>🚀</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.attackBtn, { backgroundColor: '#FFD700' }]}
                onPress={handleRobot1Shield}
              >
                <Text style={styles.actionText}>🛡️</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={styles.moveBtn}
              onPress={() => handleRobot1Move('right')}
            >
              <Text style={styles.arrow}>➡️</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={styles.moveBtn}
            onPress={() => handleRobot1Move('down')}
          >
            <Text style={styles.arrow}>⬇️</Text>
          </TouchableOpacity>
        </View>

        {/* Player 2 Controls */}
        <View style={styles.playerControls}>
          <TouchableOpacity
            style={styles.moveBtn}
            onPress={() => handleRobot2Move('up')}
          >
            <Text style={styles.arrow}>⬆️</Text>
          </TouchableOpacity>
          <View style={styles.rowControls}>
            <TouchableOpacity
              style={styles.moveBtn}
              onPress={() => handleRobot2Move('left')}
            >
              <Text style={styles.arrow}>⬅️</Text>
            </TouchableOpacity>
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.attackBtn, { backgroundColor: '#4ECDC4' }]}
                onPress={() => handleRobot2Attack('laser')}
              >
                <Text style={styles.actionText}>⚡</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.attackBtn, { backgroundColor: '#1E90FF' }]}
                onPress={() => handleRobot2Attack('missile')}
              >
                <Text style={styles.actionText}>🚀</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.attackBtn, { backgroundColor: '#FFD700' }]}
                onPress={handleRobot2Shield}
              >
                <Text style={styles.actionText}>🛡️</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={styles.moveBtn}
              onPress={() => handleRobot2Move('right')}
            >
              <Text style={styles.arrow}>➡️</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={styles.moveBtn}
            onPress={() => handleRobot2Move('down')}
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
    flexDirection: 'row',
    backgroundColor: '#1a1a1a',
    marginHorizontal: SPACING.lg,
    marginVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    position: 'relative',
  },

  robot: {
    position: 'absolute',
    width: 50,
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  robotEmoji: { fontSize: 32 },

  projectile: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  projectileEmoji: { fontSize: 14 },

  divider: {
    position: 'absolute',
    left: '50%',
    width: 2,
    height: '100%',
    backgroundColor: '#333',
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
  powerBar: {
    height: 12,
    backgroundColor: '#DDD',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: SPACING.xs,
  },
  powerFill: { height: '100%' },
  statusValue: { fontSize: 9, color: COLORS.textLight, textAlign: 'center' },
  dividerSmall: {
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
  attackBtn: {
    width: 35,
    height: 35,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionText: { fontSize: 16 },

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
