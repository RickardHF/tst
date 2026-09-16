export interface GameLoopCallbacks {
    update: (deltaSeconds: number) => void;
    render: (context: CanvasRenderingContext2D) => void;
}

export interface AnimationFrameDriver {
    request: (callback: FrameRequestCallback) => number;
    cancel: (handle: number) => void;
}

const browserAnimationFrameDriver: AnimationFrameDriver = {
    request: (callback) => window.requestAnimationFrame(callback),
    cancel: (handle) => window.cancelAnimationFrame(handle),
};

export class GameLoop {
    private animationFrame: number | undefined;
    private previousTime: number | undefined;
    private running = false;

    constructor(
        private readonly context: CanvasRenderingContext2D,
        private readonly callbacks: GameLoopCallbacks,
        private readonly frameDriver: AnimationFrameDriver = browserAnimationFrameDriver,
        private readonly maxDeltaSeconds = 0.1,
    ) {}

    start(): void {
        if (this.running) {
            return;
        }
        this.running = true;
        this.previousTime = undefined;
        this.animationFrame = this.frameDriver.request((time) => this.frame(time));
    }

    stop(): void {
        this.running = false;
        if (this.animationFrame === undefined) {
            return;
        }
        this.frameDriver.cancel(this.animationFrame);
        this.animationFrame = undefined;
        this.previousTime = undefined;
    }

    private frame(time: number): void {
        this.animationFrame = undefined;
        if (!this.running) {
            return;
        }
        const deltaSeconds = this.previousTime === undefined
            ? 0
            : Math.min((time - this.previousTime) / 1000, this.maxDeltaSeconds);
        this.previousTime = time;
        this.callbacks.update(deltaSeconds);
        this.callbacks.render(this.context);
        if (this.running) {
            this.animationFrame = this.frameDriver.request((nextTime) => this.frame(nextTime));
        }
    }
}
