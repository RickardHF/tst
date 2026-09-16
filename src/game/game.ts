import { FollowingCamera } from "./camera";
import type { GameState } from "./types";

export function createGameState(): GameState {
    return {
        world: { x: 0, y: 0, width: 2400, height: 900 },
        player: {
            position: { x: 120, y: 390 },
            size: { width: 48, height: 48 },
            velocity: { x: 150, y: 0 },
        },
    };
}

export function updateGame(
    state: GameState,
    camera: FollowingCamera,
    deltaSeconds: number,
): void {
    const player = state.player;
    player.position.x += player.velocity.x * deltaSeconds;
    const minimumX = state.world.x + 30;
    const maximumX = state.world.x + state.world.width - player.size.width - 30;

    if (player.position.x <= minimumX || player.position.x >= maximumX) {
        player.position.x = Math.min(Math.max(player.position.x, minimumX), maximumX);
        player.velocity.x *= -1;
    }

    camera.follow({
        x: player.position.x + player.size.width / 2,
        y: player.position.y + player.size.height / 2,
    });
}
