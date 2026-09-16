import { FollowingCamera } from "./game/camera";
import { createGameState, updateGame } from "./game/game";
import { GameLoop } from "./game/loop";
import { renderGame } from "./game/renderer";

const canvas = document.querySelector<HTMLCanvasElement>("#game-canvas");
if (!canvas) {
    throw new Error("Game canvas was not found.");
}

const context = canvas.getContext("2d");
if (!context) {
    throw new Error("A 2D canvas context is required.");
}

const state = createGameState();
const camera = new FollowingCamera(
    { width: canvas.width, height: canvas.height },
    state.world,
);
const loop = new GameLoop(context, {
    update: (deltaSeconds) => updateGame(state, camera, deltaSeconds),
    render: () => renderGame(context, state, camera),
});

loop.start();
