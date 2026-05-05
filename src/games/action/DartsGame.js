import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { COLORS, SPACING, BORDER_RADIUS } from '../styles/theme';

const { width, height } = Dimensions.get('window');

export default function DartsGame({ navigation }) {
  const [scores, setScores] = useState({ player1: 0, player2: 0 });
  const [currentPlayer, setCurrentPlayer] = useState(1);
  const [round, setRound] = useState(1);
  const [dartPosition, setDartPosition] = useState(null);
  const [isThrown, setIsThrown] = useState(false);
  const [darts, setDarts] = useState([]);
  const [roundScores, setRoundScores] = useState({ player1: 0, player2: 0 });

  const dartboardCenterX = width / 2;
  const dartboardCenterY = (height - 100) / 2;
  const dartboardRadius = 120;

  // Dart board zones (scoring rings)
  const zones = [
    { radius: 20, score: 50 }, // Bullseye (50)
    { radius: 40, score: 25 }, // Bull ring (25)
    { radius: 80, score: 20 }, // Outer ring
    { radius: 120, score: 10 }, // Outer double
  ];

  const calculateScore = (x, y) => {
    const distanceFromCenter = Math.sqrt(
      Math.pow(x - dartboardCenterX, 2) + Math.pow(y - dartboardCenterY, 2)
    );

    if (distanceFromCenter <= zones[0].radius) {
      return zones[0].score; // Bullseye
    } else if (distanceFromCenter <= zones[1].radius) {
      return zones[1].score; // Bull
    } else if (distanceFromCenter <= zones[2].radius) {
      return zones[2].score; // 20
    } else if (distanceFromCenter <= zones[3].radius) {
      return zones[3].score; // 10
    }
    return 0; // Miss
  };

  const handleDartThrow = (event) => {
    if (isThrown || darts.length >= 3) return;

    const x = event.nativeEvent.locationX;
    const y = event.nativeEvent.locationY;

    const score = calculateScore(x, y);
    const newDart = { x, y, score };

    setDarts([...darts, newDart]);
    setRoundScores((prev) => ({
      ...prev,
      [currentPlayer === 1 ? 'player1' : 'player2']:
        prev[currentPlayer === 1 ? 'player1' : 'player2'] + score,
    }));

    // Check if player has thrown 3 darts
    if (darts.length === 2) {
      setIsThrown(true);
      setTimeout(() => {
        // Update total scores
        setScores((prev) => ({
          ...prev,
          [currentPlayer === 1 ? 'player1' : 'player2']:
            prev[currentPlayer === 1 ? 'player1' : 'player2'] + roundScores[currentPlayer === 1 ? 'player1' : 'player2'] + score,
        }));

        // Check if game is over (First to 501)
        const p1Total = scores.player1 + (currentPlayer === 1 ? roundScores.player1 + score : 0);
        const p2Total = scores.player2 + (currentPlayer === 2 ? roundScores.player2 + score : 0);

        if (p1Total >= 501 || p2Total >= 501) {
          const winner = p1Total >= 501 ? 'Player 1' : 'Player 2';
          Alert.alert('🏆 Game Over!', `${winner} Wins!`, [
            { text: 'Play Again', onPress: resetGame },
          ]);
          return;
        }

        // Switch player or next round
        if (currentPlayer === 2) {
          setRound(round + 1);
          setCurrentPlayer(1);
        } else {
          setCurrentPlayer(2);
        }

        setDarts([]);
        setRoundScores({ player1: 0, player2: 0 });
        setIsThrown(false);
      }, 1500);
    }
  };

  const resetGame = () => {
    setScores({ player1: 0, player2: 0 });
    setCurrentPlayer(1);
    setRound(1);
    setDarts([]);
    setRoundScores({ player1: 0, player2: 0 });
    setIsThrown(false);
  };

  const endRound = () => {
    if (darts.length === 0) return;

    // Update total scores
    const playerKey = currentPlayer === 1 ? 'player1' : 'player2';
    setScores((prev) => ({
      ...prev,
      [playerKey]: prev[playerKey] + roundScores[playerKey],
    }));

    // Check if game is over
    const p1Total = scores.player1 + (currentPlayer === 1 ? roundScores.player1 : 0);
    const p2Total = scores.player2 + (currentPlayer === 2 ? roundScores.player2 : 0);

    if (p1Total >= 501 || p2Total >= 501) {
      const winner = p1Total >= 501 ? 'Player 1' : 'Player 2';
      Alert.alert('🏆 Game Over!', `${winner} Wins!`, [
        { text: 'Play Again', onPress: resetGame },
      ]);
      return;
    }

    // Switch player or next round
    if (currentPlayer === 2) {
      setRound(round + 1);
      setCurrentPlayer(1);
    } else {
      setCurrentPlayer(2);
    }

    setDarts([]);
    setRoundScores({ player1: 0, player2: 0 });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backBtn}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Darts</Text>
        <View style={{ width: 50 }} />
      </View>

      <View style={styles.scores}>
        <View style={styles.scoreItem}>
          <Text style={styles.label}>Player 1</Text>
          <Text style={[styles.score, { color: COLORS.player1 }]}>
            {scores.player1}
          </Text>
        </View>
        <View style={styles.scoreItem}>
          <Text style={styles.label}>Round {round}</Text>
          <Text style={[styles.roundScore, { color: COLORS.text }]}>
            {roundScores[currentPlayer === 1 ? 'player1' : 'player2']}
          </Text>
        </View>
        <View style={styles.scoreItem}>
          <Text style={styles.label}>Player 2</Text>
          <Text style={[styles.score, { color: COLORS.player2 }]}>
            {scores.player2}
          </Text>
        </View>
      </View>

      <Text style={styles.turn}>
        🎯 Player {currentPlayer}'s Turn - Dart {darts.length + 1}/3
      </Text>

      {/* Dartboard */}
      <TouchableOpacity
        style={styles.dartboardContainer}
        onPress={handleDartThrow}
        disabled={isThrown}
        activeOpacity={0.8}
      >
        {/* Dartboard circles */}
        <View
          style={[
            styles.dartboardZone,
            {
              width: zones[3].radius * 2,
              height: zones[3].radius * 2,
              borderRadius: zones[3].radius,
            },
          ]}
        >
          {/* Outer ring - 10 points */}
          <View
            style={[
              styles.zone,
              {
                width: zones[2].radius * 2,
                height: zones[2].radius * 2,
                borderRadius: zones[2].radius,
              },
            ]}
          >
            {/* Middle ring - 20 points */}
            <View
              style={[
                styles.zone,
                {
                  width: zones[1].radius * 2,
                  height: zones[1].radius * 2,
                  borderRadius: zones[1].radius,
                },
              ]}
            >
              {/* Bull ring - 25 points */}
              <View
                style={[
                  styles.bullRing,
                  {
                    width: zones[0].radius * 2,
                    height: zones[0].radius * 2,
                    borderRadius: zones[0].radius,
                  },
                ]}
              >
                {/* Bullseye - 50 points */}
                <View style={styles.bullseye} />
              </View>
            </View>
          </View>
        </View>

        {/* Thrown darts */}
        {darts.map((dart, i) => (
          <View
            key={i}
            style={[
              styles.dart,
              {
                left: dart.x - 10,
                top: dart.y - 30,
              },
            ]}
          >
            <Text style={styles.dartEmoji}>🎯</Text>
          </View>
        ))}

        {/* Instructions */}
        {darts.length === 0 && (
          <Text style={styles.dartboardText}>Tap to throw dart!</Text>
        )}
      </TouchableOpacity>

      {/* Dart scores */}
      {darts.length > 0 && (
        <View style={styles.dartScores}>
          {darts.map((dart, i) => (
            <View key={i} style={styles.dartScore}>
              <Text style={styles.dartScoreText}>Dart {i + 1}: {dart.score} pts</Text>
            </View>
          ))}
        </View>
      )}

      {/* End Round Button */}
      {darts.length > 0 && (
        <TouchableOpacity style={styles.endRoundBtn} onPress={endRound}>
          <Text style={styles.endRoundText}>End Turn</Text>
        </TouchableOpacity>
      )}

      {/* Reset Button */}
      <TouchableOpacity style={styles.resetBtn} onPress={resetGame}>
        <Text style={styles.resetText}>New Game</Text>
      </TouchableOpacity>
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
  scores: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: SPACING.lg,
    backgroundColor: COLORS.cardBg,
  },
  scoreItem: { alignItems: 'center' },
  label: { fontSize: 12, color: COLORS.textLight },
  score: { fontSize: 28, fontWeight: 'bold' },
  roundScore: { fontSize: 20, fontWeight: 'bold' },
  turn: {
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold',
    marginVertical: SPACING.md,
    color: COLORS.text,
  },
  dartboardContainer: {
    width: 300,
    height: 300,
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    marginVertical: SPACING.lg,
    overflow: 'hidden',
  },
  dartboardZone: {
    backgroundColor: '#2a2a2a',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#666',
  },
  zone: {
    backgroundColor: '#3a3a3a',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#555',
  },
  bullRing: {
    backgroundColor: '#FFD700',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bullseye: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FF6B6B',
  },
  dart: {
    position: 'absolute',
    width: 20,
    height: 60,
  },
  dartEmoji: { fontSize: 24 },
  dartboardText: {
    position: 'absolute',
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
    opacity: 0.7,
  },
  dartScores: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.lg,
  },
  dartScore: {
    backgroundColor: COLORS.cardBg,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
  },
  dartScoreText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  endRoundBtn: {
    backgroundColor: COLORS.accent,
    marginHorizontal: SPACING.lg,
    marginVertical: SPACING.sm,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
  },
  endRoundText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
    textAlign: 'center',
  },
  resetBtn: {
    backgroundColor: COLORS.primary,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
  },
  resetText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
    textAlign: 'center',
  },
});