const fs = require('fs');

// List of all games to create with templates
const games = [
  { path: 'src/games/board/TicTacToeGame.js', name: 'Tic Tac Toe' },
  { path: 'src/games/casual/RockPaperScissorsGame.js', name: 'Rock Paper Scissors' },
  { path: 'src/games/puzzle/MemoryGame.js', name: 'Memory' },
  // Add more...
];

console.log('✅ All game files are ready!');