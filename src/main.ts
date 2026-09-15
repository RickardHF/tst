import { createGameState } from "./game";
import { createInputState } from "./input";
import { startingLevel } from "./levels";
import { renderGame } from "./render";

const canvas = document.querySelector<HTMLCanvasElement>("#game-canvas");

if (!canvas) {
  throw new Error("Game canvas was not found.");
}

const context = canvas.getContext("2d");

if (!context) {
  throw new Error("A 2D canvas context is required to run the game.");
}

const gameState = createGameState();
const inputState = createInputState();
void inputState;
void startingLevel;
renderGame(context, gameState);
