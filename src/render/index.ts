import type { GameState } from "../game";

export function renderGame(
  context: CanvasRenderingContext2D,
  state: GameState,
): void {
  context.clearRect(0, 0, context.canvas.width, context.canvas.height);
  context.fillStyle = "#f5d0fe";
  context.fillRect(0, 0, context.canvas.width, context.canvas.height);
  context.fillStyle = "#701a75";
  context.font = "24px sans-serif";
  context.fillText(`Ready! ${state.elapsedSeconds.toFixed(1)}s`, 24, 40);
}
