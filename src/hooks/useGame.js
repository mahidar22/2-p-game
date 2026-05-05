import { useState, useRef } from 'react';
import { GameEngine } from '../utils/gameEngine';

export const useGame = (initialState) => {
  const [gameState, setGameState] = useState(initialState);
  const [isPlaying, setIsPlaying] = useState(false);
  const gameEngine = useRef(new GameEngine());

  const startGame = (updateFunction, fps = 60) => {
    setIsPlaying(true);
    gameEngine.current.start(() => updateFunction(setGameState), fps);
  };

  const stopGame = () => {
    setIsPlaying(false);
    gameEngine.current.stop();
  };

  return { gameState, setGameState, isPlaying, startGame, stopGame };
};