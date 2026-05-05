import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../screens/HomeScreen';
import GameDetailScreen from '../screens/GameDetailScreen';
import TournamentScreen from '../screens/TournamentScreen';

// Import all game screens
import ThrowGame from '../games/arcade/ThrowGame';
import TicTacToeGame from '../games/board/TicTacToeGame';
import AirHockeyGame from '../games/sports/AirHockeyGame';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="GameDetail" component={GameDetailScreen} />
        <Stack.Screen name="Tournament" component={TournamentScreen} />
        
        {/* Game Screens */}
        <Stack.Screen name="Throw" component={ThrowGame} />
        <Stack.Screen name="Tic Tac Toe" component={TicTacToeGame} />
        <Stack.Screen name="Air Hockey" component={AirHockeyGame} />
        {/* Add more game screens here */}
      </Stack.Navigator>
    </NavigationContainer>
  );
}