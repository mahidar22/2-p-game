import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { GAMES_DATA } from '../data/gamesData';

const CATEGORIES = ['all', 'arcade', 'board', 'sports', 'action', 'puzzle', 'casual'];

export default function HomeScreen({ navigation }) {
  const [selectedCategory, setSelectedCategory] = useState('all');

  const filteredGames = selectedCategory === 'all'
    ? GAMES_DATA
    : GAMES_DATA.filter(g => g.category === selectedCategory);

  console.log('Total games:', GAMES_DATA.length);
  console.log('Filtered games:', filteredGames.length);

  const renderGame = ({ item }) => (
    <TouchableOpacity
      style={[styles.card, { borderColor: item.color }]}
      onPress={() => navigation.navigate('GameDetail', { game: item })}
    >
      <Text style={styles.emoji}>{item.icon}</Text>
      <Text style={styles.title}>{item.name}</Text>
      <Text style={[styles.category, { color: item.color }]}>
        {item.category.toUpperCase()}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>

      <Text style={styles.header}>🎮 2 Player Games</Text>
      <Text style={styles.subheader}>{GAMES_DATA.length} Games</Text>

      <FlatList
        data={CATEGORIES}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item}
        contentContainerStyle={styles.categoryList}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.categoryBtn,
              selectedCategory === item && styles.categoryBtnActive,
            ]}
            onPress={() => setSelectedCategory(item)}
          >
            <Text style={[
              styles.categoryBtnText,
              selectedCategory === item && styles.categoryBtnTextActive,
            ]}>
              {item.toUpperCase()}
            </Text>
          </TouchableOpacity>
        )}
      />

      {filteredGames.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No games found</Text>
        </View>
      ) : (
        <FlatList
          data={filteredGames}
          renderItem={renderGame}
          keyExtractor={(item) => item.id.toString()}
          numColumns={2}
          contentContainerStyle={styles.grid}
          showsVerticalScrollIndicator={false}
        />
      )}

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    paddingTop: 20,
    paddingBottom: 4,
  },
  subheader: {
    fontSize: 13,
    color: '#a0a0b0',
    textAlign: 'center',
    marginBottom: 12,
  },
  categoryList: {
    paddingHorizontal: 12,
    paddingBottom: 12,
    gap: 8,
  },
  categoryBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#16213e',
    borderWidth: 1,
    borderColor: '#0f3460',
    marginRight: 8,
  },
  categoryBtnActive: {
    backgroundColor: '#e94560',
    borderColor: '#e94560',
  },
  categoryBtnText: {
    color: '#a0a0b0',
    fontSize: 11,
    fontWeight: 'bold',
  },
  categoryBtnTextActive: {
    color: '#ffffff',
  },
  grid: {
    padding: 10,
  },
  card: {
    flex: 1,
    margin: 8,
    backgroundColor: '#16213e',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    minHeight: 110,
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 36,
    marginBottom: 8,
  },
  title: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
  },
  category: {
    fontSize: 10,
    marginTop: 4,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: '#ffffff',
    fontSize: 18,
  },
});