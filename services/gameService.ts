
import { doc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore';

export type Player = 'X' | 'O';
export type SquareValue = Player | null;
export type Difficulty = 'easy' | 'medium' | 'hard';

export interface GameState {
  board: SquareValue[];
  isXNext: boolean;
  winner: Player | 'Draw' | null;
  winningLine: number[] | null;
}

// Winning combinations indices
const WIN_LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // Cols
  [0, 4, 8], [2, 4, 6]             // Diagonals
];

export const calculateWinner = (squares: SquareValue[]) => {
  for (let i = 0; i < WIN_LINES.length; i++) {
    const [a, b, c] = WIN_LINES[i];
    if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
      return { winner: squares[a], line: WIN_LINES[i] };
    }
  }
  return null;
};

// --- AI Logic with Difficulty ---
export const getBestMove = (squares: SquareValue[], aiPlayer: Player, difficulty: Difficulty): number => {
  const availableMoves = squares.map((v, i) => v === null ? i : -1).filter(i => i !== -1);
  
  if (availableMoves.length === 0) return -1;

  // 1. Easy: 100% Random
  if (difficulty === 'easy') {
    return availableMoves[Math.floor(Math.random() * availableMoves.length)];
  }

  // 2. Medium: 30% Random, 70% Smart (Or block immediate threats)
  if (difficulty === 'medium') {
    // Chance to make a mistake
    if (Math.random() > 0.4) {
       return availableMoves[Math.floor(Math.random() * availableMoves.length)];
    }
    // Otherwise fall through to Minimax (Smart)
  }

  // 3. Hard: Minimax (Impossible to beat perfectly)
  // Optimization: If center is open, take it (saves computation)
  if (!squares[4]) return 4;

  const opponent = aiPlayer === 'X' ? 'O' : 'X';
  
  const minimax = (board: SquareValue[], depth: number, isMaximizing: boolean): number => {
    const result = calculateWinner(board);
    if (result?.winner === aiPlayer) return 10 - depth;
    if (result?.winner === opponent) return depth - 10;
    if (!board.includes(null)) return 0;

    if (isMaximizing) {
      let bestScore = -Infinity;
      for (let i = 0; i < 9; i++) {
        if (!board[i]) {
          board[i] = aiPlayer;
          const score = minimax(board, depth + 1, false);
          board[i] = null;
          bestScore = Math.max(score, bestScore);
        }
      }
      return bestScore;
    } else {
      let bestScore = Infinity;
      for (let i = 0; i < 9; i++) {
        if (!board[i]) {
          board[i] = opponent;
          const score = minimax(board, depth + 1, true);
          board[i] = null;
          bestScore = Math.min(score, bestScore);
        }
      }
      return bestScore;
    }
  };

  let bestScore = -Infinity;
  let move = -1;

  for (let i = 0; i < 9; i++) {
    if (!squares[i]) {
      squares[i] = aiPlayer;
      const score = minimax(squares, 0, false);
      squares[i] = null;
      if (score > bestScore) {
        bestScore = score;
        move = i;
      }
    }
  }
  
  // If minimax finds no better move (shouldn't happen on empty squares), pick random
  return move !== -1 ? move : availableMoves[0];
};
