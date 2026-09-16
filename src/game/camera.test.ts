import assert from "node:assert/strict";
import test from "node:test";
import { calculateCameraPosition } from "./camera";

const viewport = { width: 800, height: 450 };
const world = { x: 0, y: 0, width: 2400, height: 900 };

test("centers the camera on a target in the middle of the world", () => {
    assert.deepEqual(
        calculateCameraPosition({ x: 1200, y: 450 }, viewport, world),
        { x: 800, y: 225 },
    );
});

test("clamps the camera at the top-left world boundary", () => {
    assert.deepEqual(
        calculateCameraPosition({ x: 10, y: 20 }, viewport, world),
        { x: 0, y: 0 },
    );
});

test("clamps the camera at the bottom-right world boundary", () => {
    assert.deepEqual(
        calculateCameraPosition({ x: 2390, y: 890 }, viewport, world),
        { x: 1600, y: 450 },
    );
});

test("keeps a viewport inside a world smaller than the viewport", () => {
    assert.deepEqual(
        calculateCameraPosition(
            { x: 100, y: 100 },
            { width: 800, height: 600 },
            { x: 20, y: 30, width: 300, height: 200 },
        ),
        { x: 20, y: 30 },
    );
});
