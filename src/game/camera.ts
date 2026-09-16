import type { Bounds, Size, Vector2 } from "./types";

/**
 * Returns the top-left world coordinate visible in the viewport.
 * The result is clamped so the viewport never leaves the world bounds.
 */
export function calculateCameraPosition(
    target: Vector2,
    viewport: Size,
    world: Bounds,
): Vector2 {
    const desiredX = target.x - viewport.width / 2;
    const desiredY = target.y - viewport.height / 2;
    const minX = world.x;
    const minY = world.y;
    const maxX = Math.max(minX, world.x + world.width - viewport.width);
    const maxY = Math.max(minY, world.y + world.height - viewport.height);

    return {
        x: clamp(desiredX, minX, maxX),
        y: clamp(desiredY, minY, maxY),
    };
}

function clamp(value: number, minimum: number, maximum: number): number {
    return Math.min(Math.max(value, minimum), maximum);
}

export class FollowingCamera {
    readonly viewport: Size;
    readonly world: Bounds;
    position: Vector2;

    constructor(viewport: Size, world: Bounds) {
        this.viewport = { ...viewport };
        this.world = { ...world };
        this.position = { x: world.x, y: world.y };
    }

    follow(target: Vector2): void {
        this.position = calculateCameraPosition(target, this.viewport, this.world);
    }
}
