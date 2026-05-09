import React from 'react';
import {
  View, Text, TouchableOpacity,
  StyleSheet, SafeAreaView,
} from 'react-native';

// Action Games
import DartsGame from '../games/action/DartsGame';
import WhackAMoleGame from '../games/action/WhackAMoleGame';
import HandSlapGame from '../games/action/HandSlapGame';
import PaintFightGame from '../games/action/PaintFightGame';
import KnifeThrowGame from '../games/action/KnifeThrowGame';
import SumoGame from '../games/action/SumoGame';
import PinballGame from '../games/action/PinballGame';
import ShipBattleGame from '../games/action/ShipBattleGame';
import SeaBattleGame from '../games/action/SeaBattleGame';
import RobotArenaGame from '../games/action/RobotArenaGame';
import FrogFightGame from '../games/action/FrogFightGame';
import DiscoBattleGame from '../games/action/DiscoBattleGame';
import GuardsAndThiefGame from '../games/action/GuardsAndThiefGame';
import ShurikenBambooGame from '../games/action/ShurikenBambooGame';
import StopCatcherGame from '../games/action/StopCatcherGame';
import TheBatSmashGame from '../games/action/TheBatSmashGame';

// Arcade Games
import ThrowGame from '../games/arcade/ThrowGame';
import CrashItGame from '../games/arcade/CrashItGame';
import SlotCarsGame from '../games/arcade/SlotCarsGame';
import ArcheryGame from '../games/arcade/ArcheryGame';
import StampedeGame from '../games/arcade/StampedeGame';
import TargetPracticeGame from '../games/arcade/TargetPracticeGame';
import GravityRunGame from '../games/arcade/GravityRunGame';
import GolfFootballGame from '../games/arcade/GolfFootballGame';
import BrickBlastGame from '../games/arcade/BrickBlastGame';
import TanksGame from '../games/arcade/TanksGame';
import BasketballGame from '../games/arcade/BasketballGame';
import SwordThrowerGame from '../games/arcade/SwordThrowerGame';

const GAME_COMPONENTS = {
  // Action
  46: DartsGame,
  43: WhackAMoleGame,
  52: HandSlapGame,
  45: PaintFightGame,
  47: KnifeThrowGame,
  53: SumoGame,
  54: PinballGame,
  39: ShipBattleGame,
  40: SeaBattleGame,
  50: RobotArenaGame,
  49: FrogFightGame,
  51: DiscoBattleGame,
  48: GuardsAndThiefGame,
  44: ShurikenBambooGame,
  42: StopCatcherGame,
  41: TheBatSmashGame,

  // Arcade
  1: ThrowGame,
  2: CrashItGame,
  3: SlotCarsGame,
  4: ArcheryGame,
  5: StampedeGame,
  6: TargetPracticeGame,
  7: GravityRunGame,
  8: GolfFootballGame,
  9: BrickBlastGame,
  10: TanksGame,
  11: BasketballGame,
  12: SwordThrowerGame,
};

export default function GameDetailScreen({ route, navigation }) {
  const { game } = route.params;
  const GameComponent = GAME_COMPONENTS[game.id];

  if (GameComponent) {
    return (
      <SafeAreaView style={styles.container}>
        <GameComponent navigation={navigation} />
      </SafeAreaView>
    );
  }

  // Coming soon screen for unimplemented games
  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>

      <View style={styles.content}>
        <Text style={styles.emoji}>{game.icon}</Text>
        <Text style={styles.title}>{game.name}</Text>
        <View style={styles.comingSoonBadge}>
          <Text style={styles.comingSoonText}>🚧 Coming Soon</Text>
        </View>
        <Text style={styles.description}>
          This game is under development. Check back soon!
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  backButton: {
    padding: 16,
  },
  backText: {
    color: '#e94560',
    fontSize: 16,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emoji: {
    fontSize: 80,
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 16,
    textAlign: 'center',
  },
  comingSoonBadge: {
    backgroundColor: '#e94560',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 16,
  },
  comingSoonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  description: {
    fontSize: 16,
    color: '#a0a0b0',
    textAlign: 'center',
    lineHeight: 24,
  },
});