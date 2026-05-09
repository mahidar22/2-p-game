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
  PanResponder,
} from 'react-native';
import { COLORS, SPACING, BORDER_RADIUS } from '../../styles/theme';

const { width, height } = Dimensions.get('window');

export default function HandSlapGame({ navigation }) {
  const [scores, setScores] = useState({ player1: 0, player2: 0 });
  const [round, setRound] = useState(1);
  const [gameActive, setGameActive] = useState(true);
  const [gameTime, setGameTime] = useState(30);
  const [turnPlayer, setTurnPlayer] = useState(1); // Who's attacking this turn
  const [slappedCount, setSlappedCount] = useState(0);
  const [roundWinner, setRoundWinner] = useState(null);
  const [gamePhase, setGamePhase] = useState('ready'); // 'ready', 'attacking', 'defending'

  // Hand positions
  const [attackerHand, setAttackerHand] = useState({
    x: turnPlayer === 1 ? 50 : width - 100,
    y: height / 2,
    attacking: false,
  });

  const [defenderHand, setDefenderHand] = useState({
    x: turnPlayer === 1 ? width - 100 : 50,
    y: height / 2,
    dodged: false,
  });

  // Animation values
  const attackScale = useRef(new Animated.Value(1)).current;
  const defenderShake = useRef(new Animated.Value(0)).current;
  const slapFlash = useRef(new Animated.Value(0)).current;

  // Game timer
  useEffect(() => {
    if (!gameActive) return;

    const timer = setInterval(() => {
      setGameTime((prev) => {
        if (prev <= 1) {
          endRound();
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameActive]);

  // Auto switch turns
  useEffect(() => {
    if (!gameActive || gamePhase !== 'defending') return;

    const turnTimer = setTimeout(() => {
      switchTurns();
    }, 3000);

    return () => clearTimeout(turnTimer);
  }, [gamePhase]);

  const handleAttack = () => {
    if (gamePhase !== 'ready' || !gameActive) return;

    setGamePhase('attacking');

    // Attack animation
    Animated.sequence([
      Animated.timing(attackScale, {
        toValue: 0.8,
        duration: 150,
        useNativeDriver: false,
      }),
      Animated.timing(attackScale, {
        toValue: 1.2,
        duration: 150,
        useNativeDriver: false,
      }),
      Animated.timing(attackScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: false,
      }),
    ]).start();

    // Move hand toward defender
    Animated.timing(attackerHand, {
      toValue: {
        ...attackerHand,
        x: turnPlayer === 1 ? width - 120 : 50,
      },
      duration: 300,
      useNativeDriver: false,
    });

    setTimeout(() => {
      // Check if defender dodged
      if (defenderHand.dodged) {
        // Miss!
        setGamePhase('defending');
        resetDefenderDodge();
      } else {
        // Hit!
        triggerSlap();
      }
    }, 300);
  };

  const triggerSlap = () => {
    // Flash animation
    Animated.sequence([
      Animated.timing(slapFlash, {
        toValue: 1,
        duration: 100,
        useNativeDriver: false,
      }),
      Animated.timing(slapFlash, {
        toValue: 0,
        duration: 100,
        useNativeDriver: false,
      }),
    ]).start();

    // Shake animation
    Animated.sequence([
      Animated.timing(defenderShake, {
        toValue: 20,
        duration: 100,
        useNativeDriver: false,
      }),
      Animated.timing(defenderShake, {
        toValue: -20,
        duration: 100,
        useNativeDriver: false,
      }),
      Animated.timing(defenderShake, {
        toValue: 0,
        duration: 100,
        useNativeDriver: false,
      }),
    ]).start();

    // Award points
    const pointsEarned = 10;
    if (turnPlayer === 1) {
      setScores((prev) => ({ ...prev, player1: prev.player1 + pointsEarned }));
    } else {
      setScores((prev) => ({ ...prev, player2: prev.player2 + pointsEarned }));
    }

    setSlappedCount((prev) => prev + 1);

    // Haptic feedback
    Alert.alert('👋 Slapped!', `Player ${turnPlayer} scored 10 points!`, [
      { text: 'Continue', onPress: () => {} },
    ]);

    setGamePhase('defending');
  };

  const handleDefenderDodge = () => {
    if (gamePhase !== 'attacking' || !gameActive) return;

    // Dodge animation
    Animated.sequence([
      Animated.timing(defenderShake, {
        toValue: -30,
        duration: 200,
        useNativeDriver: false,
      }),
      Animated.timing(defenderShake, {
        toValue: 0,
        duration: 100,
        useNativeDriver: false,
      }),
    ]).start();

    setDefenderHand((prev) => ({ ...prev, dodged: true }));
  };

  const resetDefenderDodge = () => {
    setDefenderHand((prev) => ({ ...prev, dodged: false }));
  };

  const switchTurns = () => {
    // Reset defender dodge
    resetDefenderDodge();

    // Reset attacker hand position
    if (turnPlayer === 1) {
      setAttackerHand({
        x: 50,
        y: height / 2,
        attacking: false,
      });
    } else {
      setAttackerHand({
        x: width - 100,
        y: height / 2,
        attacking: false,
      });
    }

    // Switch turns
    setTurnPlayer(turnPlayer === 1 ? 2 : 1);
    setGamePhase('ready');
  };

  const endRound = () => {
    setGameActive(false);

    let winner = '';
    if (scores.player1 > scores.player2) {
      winner = 'Player 1 🎉';
      setRoundWinner(1);
    } else if (scores.player2 > scores.player1) {
      winner = 'Player 2 🎉';
      setRoundWinner(2);
    } else {
      winner = 'Draw 🤝';
      setRoundWinner(0);
    }

    Alert.alert(`Round ${round} Over!`, `${winner}`, [
      { text: 'Next Round', onPress: nextRound },
      { text: 'End Game', onPress: () => navigation.goBack() },
    ]);
  };

  const nextRound = () => {
    setRound(round + 1);
    setScores({ player1: 0, player2: 0 });
    setGameTime(30);
    setTurnPlayer(1);
    setSlappedCount(0);
    setRoundWinner(null);
    setGamePhase('ready');
    setGameActive(true);
    setDefenderHand({ x: width - 100, y: height / 2, dodged: false });
    setAttackerHand({ x: 50, y: height / 2, attacking: false });
  };

  const resetGame = () => {
    navigation.goBack();
  };

  // Get attacking player hand position
  const getAttackingHandX = () => {
    return turnPlayer === 1 ? 80 : width - 80;
  };

  const getDefenderHandX = () => {
    return turnPlayer === 1 ? width - 80 : 80;
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backBtn}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Hand Slap</Text>
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

      {/* Game Status */}
      <View style={styles.statusBar}>
        <Text style={styles.statusText}>
          {turnPlayer === 1 ? '👋 Player 1 Attacking' : '👋 Player 2 Attacking'}
        </Text>
        <Text style={styles.phaseText}>
          {gamePhase === 'ready' && '⏳ Ready to attack'}
          {gamePhase === 'attacking' && '⚡ Attacking!'}
          {gamePhase === 'defending' && '🛡️ Defending'}
        </Text>
      </View>

      {/* Game Area */}
      <View style={styles.gameArea}>
        {/* Flash effect */}
        <Animated.View
          style={[
            styles.flashEffect,
            {
              opacity: slapFlash,
            },
          ]}
        />

        {/* Attacker (Left or Right based on turnPlayer) */}
        <View style={styles.playerSection}>
          <Text style={styles.playerName}>
            {turnPlayer === 1 ? 'Player 1' : 'Player 2'}
          </Text>
          <Text style={styles.roleBadge}>🎯 ATTACKER</Text>

          {/* Attacker Hand */}
          <Animated.View
            style={[
              styles.hand,
              styles.attackerHand,
              {
                transform: [{ scale: attackScale }],
              },
            ]}
          >
            <Text style={styles.handEmoji}>👋</Text>
          </Animated.View>
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Defender (Right or Left based on turnPlayer) */}
        <View style={styles.playerSection}>
          <Text style={styles.playerName}>
            {turnPlayer === 2 ? 'Player 1' : 'Player 2'}
          </Text>
          <Text style={styles.roleBadge}>🛡️ DEFENDER</Text>

          {/* Defender Hand */}
          <Animated.View
            style={[
              styles.hand,
              styles.defenderHand,
              {
                transform: [{ translateX: defenderShake }],
              },
            ]}
          >
            <Text style={styles.handEmoji}>👋</Text>
            {defenderHand.dodged && (
              <Text style={styles.dodgeIndicator}>✓</Text>
            )}
          </Animated.View>
        </View>
      </View>

      {/* Controls */}
      <View style={styles.controlsArea}>
        {gamePhase === 'ready' && (
          <TouchableOpacity
            style={styles.attackBtn}
            onPress={handleAttack}
            disabled={!gameActive}
          >
            <Text style={styles.controlBtnText}>👋 SLAP!</Text>
          </TouchableOpacity>
        )}

        {gamePhase === 'attacking' && (
          <TouchableOpacity
            style={styles.dodgeBtn}
            onPress={handleDefenderDodge}
            disabled={!gameActive}
          >
            <Text style={styles.controlBtnText}>⚡ DODGE!</Text>
          </TouchableOpacity>
        )}

        {gamePhase === 'defending' && (
          <View style={styles.waitingContainer}>
            <Text style={styles.waitingText}>⏳ Waiting for next attack...</Text>
          </View>
        )}
      </View>

      {/* Instructions */}
      <View style={styles.instructionsBox}>
        <Text style={styles.instructionsTitle}>📋 Rules:</Text>
        <Text style={styles.instructionText}>
          👋 Attacker: Tap SLAP to hit the opponent{'\n'}
          🛡️ Defender: Tap DODGE to avoid the hit{'\n'}
          ✨ Successfully hitting = +10 points{'\n'}
          ⏱️ 30 seconds per round
        </Text>
      </View>

      {!gameActive && (
        <View style={styles.gameOverContainer}>
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
    borderBottomWidth: 1,
    borderBottomColor: COLORS.shadow,
  },
  scoreItem: { alignItems: 'center' },
  playerLabel: { fontSize: 12, color: COLORS.textLight, marginBottom: SPACING.xs },
  scoreValue: { fontSize: 32, fontWeight: 'bold' },
  timerBox: { alignItems: 'center' },
  timer: { fontSize: 32, fontWeight: 'bold', color: COLORS.danger },
  round: { fontSize: 12, color: COLORS.textLight },

  statusBar: {
    paddingVertical: SPACING.md,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
  },
  statusText: { fontSize: 18, fontWeight: 'bold', color: COLORS.text },
  phaseText: { fontSize: 14, color: COLORS.textLight, marginTop: SPACING.xs },

  gameArea: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#FFF',
    marginHorizontal: SPACING.lg,
    marginVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
  },

  playerSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.lg,
  },
  playerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  roleBadge: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFF',
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.lg,
  },

  hand: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  attackerHand: {
    backgroundColor: COLORS.player1,
  },
  defenderHand: {
    backgroundColor: COLORS.player2,
  },
  handEmoji: { fontSize: 60 },
  dodgeIndicator: {
    position: 'absolute',
    top: 5,
    right: 5,
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.success,
  },

  divider: {
    width: 3,
    height: '100%',
    backgroundColor: COLORS.primary,
  },

  flashEffect: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: '#FFD700',
    zIndex: 10,
  },

  controlsArea: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    minHeight: 70,
  },
  attackBtn: {
    backgroundColor: COLORS.danger,
    paddingVertical: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
  },
  dodgeBtn: {
    backgroundColor: COLORS.success,
    paddingVertical: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
  },
  controlBtnText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
    textAlign: 'center',
  },
  waitingContainer: {
    paddingVertical: SPACING.lg,
    alignItems: 'center',
  },
  waitingText: {
    fontSize: 16,
    color: COLORS.textLight,
  },

  instructionsBox: {
    backgroundColor: COLORS.cardBg,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
  },
  instructionsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  instructionText: {
    fontSize: 12,
    color: COLORS.textLight,
    lineHeight: 18,
  },

  gameOverContainer: {
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
