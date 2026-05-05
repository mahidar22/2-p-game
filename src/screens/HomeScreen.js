import React, { useState } from 'react';
import { View, FlatList, StyleSheet, SafeAreaView } from 'react-native';
import Header from '../components/Header';
import GameCard from '../components/GameCard';
import PlayerScore from '../components/PlayerScore';
import GameButton from '../components/GameButton';
import { GAMES_DATA } from '../data/gamesData';
import { COLORS, SPACING } from '../styles/theme';

export default function HomeScreen({ navigation }) {
  const [player1Score, setPlayer1Score] = useState(0);
  const [player2Score, setPlayer2Score] = useState(0);

  const handleGamePress = (game) => {
    navigation.navigate('GameDetail', { game });
  };

  const renderGame = ({ item }) => (
    <View style={styles.gameCardContainer}>
      <GameCard game={item} onPress={() => handleGamePress(item)} />
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title="2 Player Games"
        onSettingsPress={() => {}}
        onLanguagePress={() => {}}
      />

      <View style={styles.scoreContainer}>
        <PlayerScore player={1} score={player1Score} color={COLORS.player1} />
        <PlayerScore player={2} score={player2Score} color={COLORS.player2} />
      </View>

      <FlatList
        data={GAMES_DATA}
        renderItem={renderGame}
        keyExtractor={(item) => item.id.toString()}
        numColumns={2}
        contentContainerStyle={styles.gamesList}
      />

      <View style={styles.tournamentContainer}>
        <GameButton
          title="Play Tournament"
          icon="🏆"
          onPress={() => navigation.navigate('Tournament')}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scoreContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: SPACING.lg,
    backgroundColor: COLORS.cardBg,
  },
  gamesList: { paddingHorizontal: SPACING.sm },
  gameCardContainer: { flex: 1, maxWidth: '50%' },
  tournamentContainer: { padding: SPACING.lg, backgroundColor: COLORS.cardBg },
});