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

export default function GuardsAndThiefGame({ navigation }) {
  const [gameMode, setGameMode] = useState('select'); // 'select', 'game'
  const [playerRole, setPlayerRole] = useState(null); // 'thief' or 'guard'
  const [scores, setScores] = useState({ player1: 0, player2: 0 });
  const [round, setRound] = useState(1);
  const [gameActive, setGameActive] = useState(false);
  const [gameTime, setGameTime] = useState(60);
  const [treasureFound, setTreasureFound] = useState(false);

  // Thief position
  const [thiefPos, setThiefPos] = useState({ x: width / 2, y: 100 });
  const [thiefVisible, setThiefVisible] = useState(true);

  // Guard positions
  const [guard1Pos, setGuard1Pos] = useState({ x: 50, y: height / 2 });
  const [guard2Pos, setGuard2Pos] = useState({ x: width - 100, y: height / 2 });

  // Treasure position
  const [treasurePos, setTreasurePos] = useState({
    x: Math.random() * (width - 80),
    y: Math.random() * (height - 300) + 150,
  });

  // AI Intelligence for guards
  const [guardDirection1, setGuardDirection1] = useState(1);
  const [guardDirection2, setGuardDirection2] = useState(-1);

  // Animations
  const thiefScale = useRef(new Animated.Value(1)).current;
  const thiefOpacity = useRef(new Animated.Value(1)).current;

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

  // Guard AI Movement
  useEffect(() => {
    if (!gameActive) return;

    const guardAI = setInterval(() => {
      // Guard 1 movement
      setGuard1Pos((prev) => {
        let newX = prev.x + guardDirection1 * 8;
        let newDir = guardDirection1;

        if (newX <= 30 || newX >= width - 100) {
          newDir = -newDir;
          setGuardDirection1(newDir);
        }

        return { ...prev, x: Math.max(30, Math.min(width - 100, newX)) };
      });

      // Guard 2 movement
      setGuard2Pos((prev) => {
        let newX = prev.x + guardDirection2 * 8;
        let newDir = guardDirection2;

        if (newX <= 30 || newX >= width - 100) {
          newDir = -newDir;
          setGuardDirection2(newDir);
        }

        return { ...prev, x: Math.max(30, Math.min(width - 100, newX)) };
      });
    }, 500);

    return () => clearInterval(guardAI);
  }, [guardDirection1, guardDirection2, gameActive]);

  // Check collisions
  useEffect(() => {
    if (!gameActive || !thiefVisible) return;

    const checkDistance = (pos1, pos2) => {
      return Math.sqrt(
        Math.pow(pos1.x - pos2.x, 2) + Math.pow(pos1.y - pos2.y, 2)
      );
    };

    // Thief caught by guard?
    const dist1 = checkDistance(thiefPos, guard1Pos);
    const dist2 = checkDistance(thiefPos, guard2Pos);

    if (dist1 < 60 || dist2 < 60) {
      // Thief caught!
      setGameActive(false);
      Alert.alert(
        '👮 Guards Win!',
        'The thief was caught!',
        [{ text: 'Next Round', onPress: nextRound }]
      );
      setScores((prev) => ({ ...prev, player1: prev.player1 + 50 }));
    }

    // Thief collected treasure?
    const treasureDist = checkDistance(thiefPos, treasurePos);
    if (treasureDist < 50 && !treasureFound) {
      setTreasureFound(true);
      setGameActive(false);
      Alert.alert(
        '💎 Thief Wins!',
        'The treasure has been stolen!',
        [{ text: 'Next Round', onPress: nextRound }]
      );
      setScores((prev) => ({ ...prev, player2: prev.player2 + 50 }));
    }
  }, [thiefPos, guard1Pos, guard2Pos, treasureFound, gameActive, thiefVisible]);

  // Thief controls
  const handleThiefMove = (direction) => {
    if (!gameActive || !thiefVisible) return;

    setThiefPos((prev) => {
      let newPos = { ...prev };

      switch (direction) {
        case 'up':
          newPos.y = Math.max(100, prev.y - 30);
          break;
        case 'down':
          newPos.y = Math.min(height - 150, prev.y + 30);
          break;
        case 'left':
          newPos.x = Math.max(30, prev.x - 30);
          break;
        case 'right':
          newPos.x = Math.min(width - 80, prev.x + 30);
          break;
      }

      return newPos;
    });
  };

  const handleThiefHide = () => {
    if (!gameActive) return;

    // Hide animation
    Animated.sequence([
      Animated.timing(thiefOpacity, {
        toValue: 0.2,
        duration: 300,
        useNativeDriver: false,
      }),
    ]).start();

    setThiefVisible(false);

    // Show after 3 seconds
    setTimeout(() => {
      Animated.timing(thiefOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: false,
      }).start();
      setThiefVisible(true);
    }, 3000);
  };

  const handleGuardBlock = (guardNumber) => {
    if (!gameActive) return;

    // Flash animation
    const targetGuard = guardNumber === 1 ? guard1Pos : guard2Pos;

    // Check if guard caught thief
    const dist = Math.sqrt(
      Math.pow(thiefPos.x - targetGuard.x, 2) +
        Math.pow(thiefPos.y - targetGuard.y, 2)
    );

    if (dist < 100) {
      Alert.alert(
        '👮 Caught!',
        'You caught the thief!',
        [{ text: 'Continue', onPress: () => {} }]
      );
    }
  };

  // Role selection
  const handleSelectRole = (role) => {
    setPlayerRole(role);
    setGameMode('game');
    startGame();
  };

  const startGame = () => {
    setGameActive(true);
    setGameTime(60);
    setTreasureFound(false);
    setThiefVisible(true);
    setThiefOpacity(1);
  };

  const nextRound = () => {
    if (playerRole === 'thief') {
      // Swap roles
      setPlayerRole('guard');
    } else {
      setPlayerRole('thief');
      setRound(round + 1);
    }

    // Reset positions
    setThiefPos({ x: width / 2, y: 100 });
    setGuard1Pos({ x: 50, y: height / 2 });
    setGuard2Pos({ x: width - 100, y: height / 2 });
    setTreasurePos({
      x: Math.random() * (width - 80),
      y: Math.random() * (height - 300) + 150,
    });

    startGame();
  };

  const resetGame = () => {
    setGameMode('select');
    setPlayerRole(null);
    setScores({ player1: 0, player2: 0 });
    setRound(1);
    setGameActive(false);
  };

  // Role Selection Screen
  if (gameMode === 'select') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backBtn}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Guards & Thief</Text>
          <View style={{ width: 50 }} />
        </View>

        <View style={styles.selectContainer}>
          <Text style={styles.selectTitle}>Choose Your Role</Text>
          <Text style={styles.selectSubtitle}>Round {round}</Text>

          <TouchableOpacity
            style={styles.roleCard}
            onPress={() => handleSelectRole('thief')}
          >
            <Text style={styles.roleEmoji}>🕵️</Text>
            <Text style={styles.roleName}>Play as Thief</Text>
            <Text style={styles.roleDesc}>
              Steal the treasure and avoid guards!{'\n'}
              Goal: Get treasure to escape
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.roleCard}
            onPress={() => handleSelectRole('guard')}
          >
            <Text style={styles.roleEmoji}>👮</Text>
            <Text style={styles.roleName}>Play as Guard</Text>
            <Text style={styles.roleDesc}>
              Catch the thief before they escape!{'\n'}
              Goal: Catch thief in time
            </Text>
          </TouchableOpacity>

          {round > 1 && (
            <View style={styles.scoresBox}>
              <Text style={styles.scoresTitle}>Scores:</Text>
              <View style={styles.scoresRow}>
                <Text style={styles.scoresText}>
                  👮 Guards: <Text style={styles.scoresValue}>{scores.player1}</Text>
                </Text>
                <Text style={styles.scoresText}>
                  🕵️ Thief: <Text style={styles.scoresValue}>{scores.player2}</Text>
                </Text>
              </View>
            </View>
          )}

          <TouchableOpacity style={styles.resetBtn} onPress={resetGame}>
            <Text style={styles.resetText}>Main Menu</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Game Screen
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setGameMode('select')}>
          <Text style={styles.backBtn}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Guards & Thief</Text>
        <View style={{ width: 50 }} />
      </View>

      {/* Top Info */}
      <View style={styles.topBar}>
        <View style={styles.infoBox}>
          <Text style={styles.infoLabel}>Score</Text>
          <Text style={styles.infoValue}>{scores[playerRole === 'thief' ? 'player2' : 'player1']}</Text>
        </View>
        <View style={styles.timerBox}>
          <Text style={styles.timer}>{gameTime}s</Text>
          <Text style={styles.round}>Round {round}</Text>
        </View>
        <View style={styles.infoBox}>
          <Text style={styles.infoLabel}>Role</Text>
          <Text style={styles.infoValue}>{playerRole === 'thief' ? '🕵️' : '👮'}</Text>
        </View>
      </View>

      {/* Game Area */}
      <View style={styles.gameArea}>
        {/* Treasure */}
        <View
          style={[
            styles.object,
            {
              left: treasurePos.x,
              top: treasurePos.y,
              backgroundColor: '#FFD700',
            },
          ]}
        >
          <Text style={styles.objectEmoji}>💎</Text>
        </View>

        {/* Guards */}
        <View
          style={[
            styles.object,
            {
              left: guard1Pos.x,
              top: guard1Pos.y,
              backgroundColor: '#FF6B6B',
            },
          ]}
        >
          <Text style={styles.objectEmoji}>👮</Text>
        </View>

        <View
          style={[
            styles.object,
            {
              left: guard2Pos.x,
              top: guard2Pos.y,
              backgroundColor: '#FF6B6B',
            },
          ]}
        >
          <Text style={styles.objectEmoji}>👮</Text>
        </View>

        {/* Thief */}
        <Animated.View
          style={[
            styles.object,
            {
              left: thiefPos.x,
              top: thiefPos.y,
              backgroundColor: '#4ECDC4',
              opacity: thiefOpacity,
            },
          ]}
        >
          <Text style={styles.objectEmoji}>🕵️</Text>
        </Animated.View>
      </View>

      {/* Controls */}
      {playerRole === 'thief' ? (
        <View style={styles.thiefControls}>
          {/* Movement Controls */}
          <View style={styles.movementControls}>
            <TouchableOpacity
              style={[styles.moveBtn, styles.upBtn]}
              onPress={() => handleThiefMove('up')}
              disabled={!gameActive}
            >
              <Text style={styles.moveText}>⬆️</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.horizontalControls}>
            <TouchableOpacity
              style={[styles.moveBtn, styles.leftBtn]}
              onPress={() => handleThiefMove('left')}
              disabled={!gameActive}
            >
              <Text style={styles.moveText}>⬅️</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.hideBtn}
              onPress={handleThiefHide}
              disabled={!gameActive}
            >
              <Text style={styles.hideBtnText}>👁️ Hide</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.moveBtn, styles.rightBtn]}
              onPress={() => handleThiefMove('right')}
              disabled={!gameActive}
            >
              <Text style={styles.moveText}>➡️</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.movementControls}>
            <TouchableOpacity
              style={[styles.moveBtn, styles.downBtn]}
              onPress={() => handleThiefMove('down')}
              disabled={!gameActive}
            >
              <Text style={styles.moveText}>⬇️</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.guardControls}>
          <TouchableOpacity
            style={styles.guardBtn}
            onPress={() => handleGuardBlock(1)}
            disabled={!gameActive}
          >
            <Text style={styles.guardBtnText}>🚓 Guard 1</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.guardBtn}
            onPress={() => handleGuardBlock(2)}
            disabled={!gameActive}
          >
            <Text style={styles.guardBtnText}>🚓 Guard 2</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.guardBtn, styles.alertBtn]}
            onPress={() => Alert.alert('👀 Scanning...', 'Looking for thief!')}
            disabled={!gameActive}
          >
            <Text style={styles.guardBtnText}>🔍 Scan</Text>
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

  // Role Selection
  selectContainer: {
    flex: 1,
    padding: SPACING.lg,
    justifyContent: 'center',
  },
  selectTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  selectSubtitle: {
    fontSize: 16,
    color: COLORS.textLight,
    textAlign: 'center',
    marginBottom: SPACING.xl,
  },
  roleCard: {
    backgroundColor: COLORS.cardBg,
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.lg,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  roleEmoji: { fontSize: 60, marginBottom: SPACING.md },
  roleName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  roleDesc: {
    fontSize: 14,
    color: COLORS.textLight,
    textAlign: 'center',
    lineHeight: 20,
  },
  scoresBox: {
    backgroundColor: COLORS.cardBg,
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    marginVertical: SPACING.lg,
  },
  scoresTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  scoresRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  scoresText: { fontSize: 14, color: COLORS.textLight },
  scoresValue: { fontWeight: 'bold', color: COLORS.primary },
  resetBtn: {
    backgroundColor: COLORS.danger,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
  },
  resetText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
    textAlign: 'center',
  },

  // Game Screen
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.cardBg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.shadow,
  },
  infoBox: { alignItems: 'center' },
  infoLabel: { fontSize: 12, color: COLORS.textLight },
  infoValue: { fontSize: 20, fontWeight: 'bold', color: COLORS.primary },
  timerBox: { alignItems: 'center' },
  timer: { fontSize: 32, fontWeight: 'bold', color: COLORS.danger },
  round: { fontSize: 12, color: COLORS.textLight },

  gameArea: {
    flex: 1,
    backgroundColor: '#E8F8F5',
    position: 'relative',
    overflow: 'hidden',
    marginHorizontal: SPACING.lg,
    marginVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
  },

  object: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  objectEmoji: { fontSize: 40 },

  thiefControls: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.lg,
  },
  movementControls: {
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  horizontalControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  moveBtn: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  upBtn: { backgroundColor: COLORS.primary },
  downBtn: { backgroundColor: COLORS.primary },
  leftBtn: { backgroundColor: COLORS.primary },
  rightBtn: { backgroundColor: COLORS.primary },
  moveText: { fontSize: 24 },
  hideBtn: {
    backgroundColor: COLORS.warning,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
  },
  hideBtnText: { fontSize: 16, fontWeight: 'bold', color: '#FFF' },

  guardControls: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.lg,
    gap: SPACING.md,
  },
  guardBtn: {
    flex: 1,
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertBtn: { backgroundColor: COLORS.success },
  guardBtnText: { fontSize: 14, fontWeight: 'bold', color: '#FFF' },
});