import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  SafeAreaView,
  Dimensions,
  ScrollView,
  Animated,
} from 'react-native';
import { COLORS, SPACING, BORDER_RADIUS } from '../../styles/theme';

const { width, height } = Dimensions.get('window');

export default function SeaBattleGame({ navigation }) {
  const [gamePhase, setGamePhase] = useState('placement'); // 'placement', 'playing', 'gameover'
  const [gameMode, setGameMode] = useState(null); // 'pvp' or 'bot'
  const [currentPlayer, setCurrentPlayer] = useState(1);
  const [scores, setScores] = useState({ player1: 0, player2: 0 });

  // Grid size
  const GRID_SIZE = 10;
  const CELL_SIZE = 25;

  // Ships configuration
  const SHIPS = [
    { id: 1, size: 4, name: 'Battleship', emoji: '🚢' },
    { id: 2, size: 3, name: 'Cruiser', emoji: '🚤' },
    { id: 3, size: 3, name: 'Cruiser', emoji: '🚤' },
    { id: 4, size: 2, name: 'Destroyer', emoji: '⛵' },
    { id: 5, size: 2, name: 'Destroyer', emoji: '⛵' },
  ];

  // Game state
  const [player1Board, setPlayer1Board] = useState(Array(100).fill(null));
  const [player2Board, setPlayer2Board] = useState(Array(100).fill(null));
  const [player1Ships, setPlayer1Ships] = useState([]);
  const [player2Ships, setPlayer2Ships] = useState([]);

  // Shots
  const [player1Shots, setPlayer1Shots] = useState(Array(100).fill(null));
  const [player2Shots, setPlayer2Shots] = useState(Array(100).fill(null));

  // Placement
  const [placementShips, setPlacementShips] = useState([...SHIPS]);
  const [selectedShip, setSelectedShip] = useState(null);
  const [shipOrientation, setShipOrientation] = useState('horizontal');

  // Game stats
  const [player1Hits, setPlayer1Hits] = useState(0);
  const [player2Hits, setPlayer2Hits] = useState(0);
  const [round, setRound] = useState(1);

  // Animations
  const hitFlash = useRef(new Animated.Value(0)).current;

  // Generate random ship placement
  const generateRandomBoard = () => {
    const board = Array(100).fill(null);
    const ships = [];

    SHIPS.forEach((ship) => {
      let placed = false;
      while (!placed) {
        const isHorizontal = Math.random() > 0.5;
        const row = Math.floor(Math.random() * GRID_SIZE);
        const col = Math.floor(Math.random() * GRID_SIZE);

        if (canPlaceShip(board, row, col, ship.size, isHorizontal)) {
          placeShipOnBoard(board, row, col, ship.size, isHorizontal, ship.id);
          ships.push({
            ...ship,
            positions: getShipPositions(row, col, ship.size, isHorizontal),
          });
          placed = true;
        }
      }
    });

    return { board, ships };
  };

  const canPlaceShip = (board, row, col, size, isHorizontal) => {
    if (isHorizontal) {
      if (col + size > GRID_SIZE) return false;
      for (let i = 0; i < size; i++) {
        if (board[row * GRID_SIZE + col + i] !== null) return false;
      }
    } else {
      if (row + size > GRID_SIZE) return false;
      for (let i = 0; i < size; i++) {
        if (board[(row + i) * GRID_SIZE + col] !== null) return false;
      }
    }
    return true;
  };

  const placeShipOnBoard = (board, row, col, size, isHorizontal, shipId) => {
    if (isHorizontal) {
      for (let i = 0; i < size; i++) {
        board[row * GRID_SIZE + col + i] = shipId;
      }
    } else {
      for (let i = 0; i < size; i++) {
        board[(row + i) * GRID_SIZE + col] = shipId;
      }
    }
  };

  const getShipPositions = (row, col, size, isHorizontal) => {
    const positions = [];
    if (isHorizontal) {
      for (let i = 0; i < size; i++) {
        positions.push(row * GRID_SIZE + col + i);
      }
    } else {
      for (let i = 0; i < size; i++) {
        positions.push((row + i) * GRID_SIZE + col);
      }
    }
    return positions;
  };

  // Placement phase
  const handlePlaceShip = (index) => {
    if (!selectedShip) {
      setSelectedShip(index);
      return;
    }

    if (selectedShip === index) {
      setShipOrientation(shipOrientation === 'horizontal' ? 'vertical' : 'horizontal');
      return;
    }

    setSelectedShip(null);
  };

  const handleAutoPlace = () => {
    const { board, ships } = generateRandomBoard();
    setPlayer1Board(board);
    setPlayer1Ships(ships);

    // Auto-place player 2 (or bot)
    const { board: board2, ships: ships2 } = generateRandomBoard();
    setPlayer2Board(board2);
    setPlayer2Ships(ships2);

    setGamePhase('playing');
    setCurrentPlayer(1);
  };

  // Shooting phase
  const handleShot = (cellIndex) => {
    if (gamePhase !== 'playing') return;

    const targetBoard = currentPlayer === 1 ? player2Board : player1Board;
    const targetShots = currentPlayer === 1 ? player2Shots : player1Shots;

    // Check if already shot here
    if (targetShots[cellIndex] !== null) {
      Alert.alert('⚠️ Already Shot Here!', 'Choose another cell', [
        { text: 'OK', onPress: () => {} },
      ]);
      return;
    }

    // Flash animation
    Animated.sequence([
      Animated.timing(hitFlash, {
        toValue: 1,
        duration: 100,
        useNativeDriver: false,
      }),
      Animated.timing(hitFlash, {
        toValue: 0,
        duration: 100,
        useNativeDriver: false,
      }),
    ]).start();

    // Check for hit or miss
    const isHit = targetBoard[cellIndex] !== null;

    if (isHit) {
      const shipId = targetBoard[cellIndex];
      targetShots[cellIndex] = 'hit';

      if (currentPlayer === 1) {
        setPlayer2Shots([...targetShots]);
        setPlayer1Hits((prev) => prev + 1);

        // Check if ship sunk
        const targetShip = player2Ships.find((s) => s.id === shipId);
        if (targetShip) {
          const sunkPositions = targetShip.positions.filter(
            (pos) => player2Shots[pos] === 'hit' || pos === cellIndex
          );
          if (sunkPositions.length === targetShip.size) {
            Alert.alert('⚓ Ship Sunk!', `${targetShip.name} Destroyed!`, [
              { text: 'Continue', onPress: () => {} },
            ]);
            setScores((prev) => ({ ...prev, player1: prev.player1 + 50 }));
          } else {
            Alert.alert('💥 Hit!', 'Direct hit!', [
              { text: 'Continue', onPress: () => {} },
            ]);
            setScores((prev) => ({ ...prev, player1: prev.player1 + 10 }));
          }
        }
      } else {
        setPlayer1Shots([...targetShots]);
        setPlayer2Hits((prev) => prev + 1);

        const targetShip = player1Ships.find((s) => s.id === shipId);
        if (targetShip) {
          const sunkPositions = targetShip.positions.filter(
            (pos) => player1Shots[pos] === 'hit' || pos === cellIndex
          );
          if (sunkPositions.length === targetShip.size) {
            Alert.alert('⚓ Ship Sunk!', `${targetShip.name} Destroyed!`, [
              { text: 'Continue', onPress: () => {} },
            ]);
            setScores((prev) => ({ ...prev, player2: prev.player2 + 50 }));
          } else {
            Alert.alert('💥 Hit!', 'Direct hit!', [
              { text: 'Continue', onPress: () => {} },
            ]);
            setScores((prev) => ({ ...prev, player2: prev.player2 + 10 }));
          }
        }
      }
    } else {
      targetShots[cellIndex] = 'miss';
      if (currentPlayer === 1) {
        setPlayer2Shots([...targetShots]);
      } else {
        setPlayer1Shots([...targetShots]);
      }

      Alert.alert('❌ Miss!', 'Water splash!', [
        { text: 'Continue', onPress: () => switchTurn() },
      ]);
    }

    // Check win condition
    const hitsNeeded = SHIPS.reduce((sum, ship) => sum + ship.size, 0);
    if (currentPlayer === 1 && player1Hits + 1 >= hitsNeeded) {
      endGame('Player 1');
    } else if (currentPlayer === 2 && player2Hits + 1 >= hitsNeeded) {
      endGame('Player 2');
    }
  };

  const switchTurn = () => {
    setCurrentPlayer(currentPlayer === 1 ? 2 : 1);
  };

  const endGame = (winner) => {
    setGamePhase('gameover');

    const winnerNum = winner === 'Player 1' ? 1 : 2;
    setScores((prev) => ({
      ...prev,
      [winnerNum === 1 ? 'player1' : 'player2']:
        prev[winnerNum === 1 ? 'player1' : 'player2'] + 100,
    }));

    Alert.alert(`🎉 ${winner} Wins!`, `Game Over!`, [
      { text: 'New Game', onPress: resetGame },
      { text: 'Main Menu', onPress: () => navigation.goBack() },
    ]);
  };

  const resetGame = () => {
    setGamePhase('placement');
    setCurrentPlayer(1);
    setPlayer1Board(Array(100).fill(null));
    setPlayer2Board(Array(100).fill(null));
    setPlayer1Ships([]);
    setPlayer2Ships([]);
    setPlayer1Shots(Array(100).fill(null));
    setPlayer2Shots(Array(100).fill(null));
    setPlayer1Hits(0);
    setPlayer2Hits(0);
    setPlacementShips([...SHIPS]);
    setSelectedShip(null);
    setRound(round + 1);
  };

  // Render grid
  const renderGrid = (shots, isOpponent = false) => {
    return (
      <View style={styles.grid}>
        {Array.from({ length: GRID_SIZE }).map((_, row) => (
          <View key={row} style={styles.gridRow}>
            {Array.from({ length: GRID_SIZE }).map((_, col) => {
              const cellIndex = row * GRID_SIZE + col;
              const shot = shots[cellIndex];

              return (
                <TouchableOpacity
                  key={cellIndex}
                  style={[
                    styles.gridCell,
                    {
                      backgroundColor:
                        shot === 'hit'
                          ? '#FF6B6B'
                          : shot === 'miss'
                          ? '#4ECDC4'
                          : '#1a1a1a',
                    },
                  ]}
                  onPress={() => handleShot(cellIndex)}
                  disabled={gamePhase !== 'playing'}
                >
                  {shot === 'hit' && <Text style={styles.cellEmoji}>💥</Text>}
                  {shot === 'miss' && <Text style={styles.cellEmoji}>💧</Text>}
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>
    );
  };

  // Placement phase UI
  if (gamePhase === 'placement') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backBtn}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Sea Battle</Text>
          <View style={{ width: 50 }} />
        </View>

        <ScrollView contentContainerStyle={styles.placementContent}>
          <Text style={styles.placementTitle}>⚓ Place Your Ships</Text>
          <Text style={styles.placementSubtitle}>
            Arrange your fleet on the grid
          </Text>

          <View style={styles.shipsList}>
            {SHIPS.map((ship, index) => (
              <TouchableOpacity
                key={ship.id}
                style={[
                  styles.shipCard,
                  selectedShip === index && styles.shipCardSelected,
                ]}
                onPress={() => handlePlaceShip(index)}
              >
                <Text style={styles.shipEmoji}>{ship.emoji}</Text>
                <View style={styles.shipInfo}>
                  <Text style={styles.shipName}>{ship.name}</Text>
                  <Text style={styles.shipSize}>Size: {ship.size}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={styles.autoPlaceBtn}
            onPress={handleAutoPlace}
          >
            <Text style={styles.autoPlaceBtnText}>🎲 Auto Place Ships</Text>
          </TouchableOpacity>

          <Text style={styles.instructionText}>
            💡 Tap "Auto Place" to randomly position your ships and start the
            game!
          </Text>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Playing phase UI
  if (gamePhase === 'playing') {
    const targetShots = currentPlayer === 1 ? player2Shots : player1Shots;

    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backBtn}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Sea Battle</Text>
          <View style={{ width: 50 }} />
        </View>

        {/* Scores */}
        <View style={styles.scoreBar}>
          <View style={styles.scoreItem}>
            <Text style={styles.scoreLabel}>P1 Hits</Text>
            <Text style={[styles.scoreValue, { color: COLORS.player1 }]}>
              {player1Hits}
            </Text>
          </View>

          <View style={styles.turnBox}>
            <Text style={styles.turnText}>
              Player {currentPlayer}'s Turn
            </Text>
            <Text style={styles.roundText}>Round {round}</Text>
          </View>

          <View style={styles.scoreItem}>
            <Text style={styles.scoreLabel}>P2 Hits</Text>
            <Text style={[styles.scoreValue, { color: COLORS.player2 }]}>
              {player2Hits}
            </Text>
          </View>
        </View>

        {/* Battle Grid */}
        <View style={styles.battleContainer}>
          <Text style={styles.gridTitle}>
            {currentPlayer === 1 ? 'Attack Player 2' : 'Attack Player 1'}
          </Text>
          <Animated.View
            style={[
              styles.gridWrapper,
              {
                opacity: hitFlash.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, 0.7],
                }),
              },
            ]}
          >
            {renderGrid(targetShots, true)}
          </Animated.View>
        </View>

        {/* Stats */}
        <View style={styles.statsBox}>
          <Text style={styles.statsText}>
            💣 Shots Fired: {targetShots.filter((s) => s !== null).length}
          </Text>
          <Text style={styles.statsText}>
            💥 Hits: {currentPlayer === 1 ? player1Hits : player2Hits}
          </Text>
          <Text style={styles.statsText}>
            📊 Accuracy:{' '}
            {Math.round(
              (((currentPlayer === 1 ? player1Hits : player2Hits) /
                Math.max(
                  1,
                  targetShots.filter((s) => s !== null).length
                )) *
                100) ||
                0
            )}
            %
          </Text>
        </View>

        {/* Turn Switch Button */}
        <View style={styles.actionContainer}>
          <TouchableOpacity
            style={styles.switchTurnBtn}
            onPress={switchTurn}
            disabled={gamePhase !== 'playing'}
          >
            <Text style={styles.switchTurnText}>⏭️ Next Turn</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Game over phase
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backBtn}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Sea Battle</Text>
        <View style={{ width: 50 }} />
      </View>

      <View style={styles.gameOverContainer}>
        <Text style={styles.gameOverTitle}>🎉 Game Over!</Text>

        <View style={styles.finalScores}>
          <View style={styles.finalScoreItem}>
            <Text style={styles.finalLabel}>Player 1</Text>
            <Text style={[styles.finalScore, { color: COLORS.player1 }]}>
              {scores.player1}
            </Text>
          </View>

          <View style={styles.finalScoreItem}>
            <Text style={styles.finalLabel}>Player 2</Text>
            <Text style={[styles.finalScore, { color: COLORS.player2 }]}>
              {scores.player2}
            </Text>
          </View>
        </View>

        <TouchableOpacity style={styles.newGameBtn} onPress={resetGame}>
          <Text style={styles.newGameBtnText}>New Game</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuBtn}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.menuBtnText}>Main Menu</Text>
        </TouchableOpacity>
      </View>
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

  // Placement phase
  placementContent: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xl,
  },
  placementTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  placementSubtitle: {
    fontSize: 16,
    color: COLORS.textLight,
    textAlign: 'center',
    marginBottom: SPACING.xl,
  },
  shipsList: {
    gap: SPACING.md,
    marginBottom: SPACING.xl,
  },
  shipCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.cardBg,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  shipCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: '#F0F0FF',
  },
  shipEmoji: { fontSize: 40, marginRight: SPACING.md },
  shipInfo: { flex: 1 },
  shipName: { fontSize: 16, fontWeight: 'bold', color: COLORS.text },
  shipSize: { fontSize: 12, color: COLORS.textLight },
  autoPlaceBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.lg,
  },
  autoPlaceBtnText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
    textAlign: 'center',
  },
  instructionText: {
    fontSize: 14,
    color: COLORS.textLight,
    textAlign: 'center',
    lineHeight: 22,
  },

  // Playing phase
  scoreBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.cardBg,
  },
  scoreItem: { alignItems: 'center' },
  scoreLabel: { fontSize: 12, color: COLORS.textLight },
  scoreValue: { fontSize: 24, fontWeight: 'bold' },
  turnBox: { alignItems: 'center' },
  turnText: { fontSize: 16, fontWeight: 'bold', color: COLORS.text },
  roundText: { fontSize: 12, color: COLORS.textLight },

  battleContainer: {
    flex: 1,
    padding: SPACING.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  gridWrapper: {},
  grid: {
    backgroundColor: '#1a1a1a',
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.lg,
  },
  gridRow: {
    flexDirection: 'row',
    gap: SPACING.xs,
  },
  gridCell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xs,
    borderWidth: 1,
    borderColor: '#333',
  },
  cellEmoji: { fontSize: 12 },

  statsBox: {
    backgroundColor: COLORS.cardBg,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    gap: SPACING.xs,
  },
  statsText: { fontSize: 12, color: COLORS.textLight },

  actionContainer: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.lg,
  },
  switchTurnBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
  },
  switchTurnText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
    textAlign: 'center',
  },

  // Game over
  gameOverContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
  },
  gameOverTitle: {
    fontSize: 40,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: SPACING.xl,
  },
  finalScores: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: SPACING.xl,
  },
  finalScoreItem: { alignItems: 'center' },
  finalLabel: { fontSize: 18, color: COLORS.textLight, marginBottom: SPACING.md },
  finalScore: { fontSize: 48, fontWeight: 'bold' },
  newGameBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.xl,
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.md,
  },
  newGameBtnText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
    textAlign: 'center',
  },
  menuBtn: {
    backgroundColor: COLORS.secondary,
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.xl,
    borderRadius: BORDER_RADIUS.lg,
  },
  menuBtnText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
    textAlign: 'center',
  },
});
