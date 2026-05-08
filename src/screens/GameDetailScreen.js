import React from 'react';
import {
  View, Text, TouchableOpacity,
  StyleSheet, SafeAreaView,
} from 'react-native';

export default function GameDetailScreen({ route, navigation }) {
  const { game } = route.params;

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>

      <View style={styles.content}>
        <Text style={styles.emoji}>{game.emoji}</Text>
        <Text style={styles.title}>{game.name}</Text>
        <Text style={styles.description}>{game.description}</Text>

        <View style={styles.infoRow}>
          <Text style={styles.infoBadge}>👥 2 Players</Text>
          <Text style={styles.infoBadge}>🏷️ {game.category}</Text>
        </View>

        <TouchableOpacity style={styles.playButton}>
          <Text style={styles.playText}>▶ PLAY NOW</Text>
        </TouchableOpacity>
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
  description: {
    fontSize: 16,
    color: '#a0a0b0',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  infoRow: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 40,
  },
  infoBadge: {
    color: '#ffffff',
    fontSize: 14,
    backgroundColor: '#0f3460',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  playButton: {
    backgroundColor: '#e94560',
    paddingHorizontal: 60,
    paddingVertical: 18,
    borderRadius: 30,
  },
  playText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
});