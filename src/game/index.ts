export interface GameState {
  elapsedSeconds: number;
}

export function createGameState(): GameState {
  return { elapsedSeconds: 0 };
}
