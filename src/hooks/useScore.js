import { useState } from 'react';

export const useScore = (initialScores = { player1: 0, player2: 0 }) => {
  const [scores, setScores] = useState(initialScores);

  const incrementScore = (player, points = 1) => {
    setScores(prev => ({ ...prev, [player]: prev[player] + points }));
  };

  const resetScores = () => setScores(initialScores);

  return { scores, incrementScore, resetScores };
};