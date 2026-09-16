import type { Camera, GameState } from "./types";

/** Draws the current state only; movement and camera decisions belong elsewhere. */
export function renderGame(
    context: CanvasRenderingContext2D,
    state: GameState,
    camera: Camera,
): void {
    context.clearRect(0, 0, camera.viewport.width, camera.viewport.height);
    context.fillStyle = "#b8e8ff";
    context.fillRect(0, 0, camera.viewport.width, camera.viewport.height);

    context.save();
    context.translate(-camera.position.x, -camera.position.y);

    context.fillStyle = "#8bd17c";
    context.fillRect(state.world.x, state.world.y + state.world.height - 80, state.world.width, 80);
    context.strokeStyle = "#295c3a";
    context.lineWidth = 6;
    context.strokeRect(state.world.x, state.world.y, state.world.width, state.world.height);

    context.fillStyle = "#e95d8b";
    context.beginPath();
    context.arc(
        state.player.position.x + state.player.size.width / 2,
        state.player.position.y + state.player.size.height / 2,
        Math.min(state.player.size.width, state.player.size.height) / 2,
        0,
        Math.PI * 2,
    );
    context.fill();
    context.restore();
}
