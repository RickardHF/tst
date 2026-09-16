export interface Vector2 {
    x: number;
    y: number;
}

export interface Size {
    width: number;
    height: number;
}

export interface Bounds extends Size {
    x: number;
    y: number;
}

export interface MovingObject {
    position: Vector2;
    size: Size;
    velocity: Vector2;
}

export interface GameState {
    world: Bounds;
    player: MovingObject;
}

export interface Camera {
    position: Vector2;
    viewport: Size;
}
