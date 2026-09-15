import assert from "node:assert/strict";
import test from "node:test";
import { compareScores, DEFAULT_REGRESSION_THRESHOLD, renderComparisonMarkdown } from "./compare-scores.js";
import type { ScoresFile } from "./build-scores.js";

const baseline: ScoresFile = {
    generatedAt: "2026-01-01T00:00:00.000Z",
    scores: {
        ".github/agents/csharper.agent.md": { score: 9, reasoning: "great", type: "agent" },
        ".agents/skills/example/SKILL.md": { score: 8, reasoning: "great", type: "skill" },
        ".github/agents/stable.agent.md": { score: 6, reasoning: "fine", type: "agent" },
    },
};

test("compareScores flags a regression greater than the threshold for agents and skills", () => {
    const outcome = compareScores(
        [
            { fileName: ".github/agents/csharper.agent.md", score: 6, reasoning: "dropped" },
            { fileName: ".agents/skills/example/SKILL.md", score: 5, reasoning: "dropped" },
        ],
        baseline
    );

    assert.equal(outcome.regressions.length, 2);
    assert.equal(outcome.regressions[0]?.delta, 3);
    assert.equal(outcome.regressions[1]?.delta, 3);
});

test("compareScores does not flag a drop at or below the threshold", () => {
    const outcome = compareScores(
        [{ fileName: ".github/agents/stable.agent.md", score: 4, reasoning: "slightly lower" }],
        baseline,
        DEFAULT_REGRESSION_THRESHOLD
    );

    assert.equal(outcome.regressions.length, 0);
    assert.equal(outcome.comparisons[0]?.delta, 2);
});

test("compareScores treats artifacts with no baseline entry as non-regressions", () => {
    const outcome = compareScores(
        [{ fileName: ".github/agents/new.agent.md", score: 3, reasoning: "first evaluation" }],
        baseline
    );

    assert.equal(outcome.regressions.length, 0);
    assert.equal(outcome.comparisons[0]?.previousScore, null);
    assert.equal(outcome.comparisons[0]?.delta, null);
});

test("renderComparisonMarkdown reports regressions and includes a summary line", () => {
    const outcome = compareScores(
        [{ fileName: ".github/agents/csharper.agent.md", score: 4, reasoning: "dropped a lot" }],
        baseline
    );

    const markdown = renderComparisonMarkdown(outcome);

    assert.match(markdown, /csharper\.agent\.md/);
    assert.match(markdown, /1 artifact\(s\) regressed/);
});
