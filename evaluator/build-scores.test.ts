import assert from "node:assert/strict";
import test from "node:test";
import { artifactType, buildScoresFile, parseEvalResultsJsonl, parseScoresFile } from "./build-scores.js";

test("artifactType classifies .agent.md files as agents and everything else as skills", () => {
    assert.equal(artifactType(".github/agents/csharper.agent.md"), "agent");
    assert.equal(artifactType(".agents/skills/example/SKILL.md"), "skill");
});

test("parseEvalResultsJsonl parses valid lines and skips malformed ones", () => {
    const jsonl = [
        JSON.stringify({ fileName: "a.agent.md", score: 8, reasoning: "good" }),
        "not json",
        JSON.stringify({ fileName: "missing-score", reasoning: "bad" }),
        "",
        JSON.stringify({ fileName: "b/SKILL.md", score: 5, reasoning: "ok" }),
    ].join("\n");

    const results = parseEvalResultsJsonl(jsonl);

    assert.deepEqual(results, [
        { fileName: "a.agent.md", score: 8, reasoning: "good" },
        { fileName: "b/SKILL.md", score: 5, reasoning: "ok" },
    ]);
});

test("buildScoresFile keys entries by fileName and records artifact type", () => {
    const scoresFile = buildScoresFile(
        [
            { fileName: ".github/agents/csharper.agent.md", score: 7, reasoning: "solid" },
            { fileName: ".agents/skills/example/SKILL.md", score: 6, reasoning: "decent" },
        ],
        "2026-01-01T00:00:00.000Z"
    );

    assert.equal(scoresFile.generatedAt, "2026-01-01T00:00:00.000Z");
    assert.deepEqual(scoresFile.scores[".github/agents/csharper.agent.md"], {
        score: 7,
        reasoning: "solid",
        type: "agent",
    });
    assert.deepEqual(scoresFile.scores[".agents/skills/example/SKILL.md"], {
        score: 6,
        reasoning: "decent",
        type: "skill",
    });
});

test("parseScoresFile tolerates malformed or missing scores objects", () => {
    assert.deepEqual(parseScoresFile("not an object").scores, {});
    assert.deepEqual(parseScoresFile("{}").scores, {});
    assert.deepEqual(parseScoresFile('{"scores": null}').scores, {});

    const valid = parseScoresFile(
        JSON.stringify({ generatedAt: "2026-01-01T00:00:00.000Z", scores: { "a.agent.md": { score: 9, reasoning: "x", type: "agent" } } })
    );
    assert.equal(valid.scores["a.agent.md"]?.score, 9);
});
