// Compares freshly evaluated artifact scores against a stored baseline and flags regressions.
import { artifactType, type EvalResultLine, type ScoresFile } from "./build-scores.js";

export interface ScoreComparison {
    fileName: string;
    type: "agent" | "skill";
    currentScore: number;
    previousScore: number | null;
    delta: number | null;
}

export interface CompareOutcome {
    comparisons: ScoreComparison[];
    regressions: ScoreComparison[];
}

export const DEFAULT_REGRESSION_THRESHOLD = 2;

export function compareScores(
    current: EvalResultLine[],
    baseline: ScoresFile,
    threshold: number = DEFAULT_REGRESSION_THRESHOLD
): CompareOutcome {
    const comparisons: ScoreComparison[] = current.map((result) => {
        const previous = baseline.scores[result.fileName];
        const previousScore = previous ? previous.score : null;
        const delta = previousScore === null ? null : previousScore - result.score;
        return {
            fileName: result.fileName,
            type: artifactType(result.fileName),
            currentScore: result.score,
            previousScore,
            delta,
        };
    });

    const regressions = comparisons.filter((c) => c.delta !== null && c.delta > threshold);

    return { comparisons, regressions };
}

export function renderComparisonMarkdown(outcome: CompareOutcome): string {
    const lines = [
        "## Score comparison (changed artifacts)",
        "",
        "| Artifact | Type | Previous | Current | Delta |",
        "|---|---|---|---|---|",
    ];

    for (const c of outcome.comparisons) {
        const previous = c.previousScore === null ? "—" : `${c.previousScore}/10`;
        const delta = c.delta === null ? "—" : c.delta > 0 ? `-${c.delta}` : `+${-c.delta}`;
        const flag = outcome.regressions.includes(c) ? " ⚠️" : "";
        lines.push(`| \`${c.fileName}\` | ${c.type} | ${previous} | ${c.currentScore}/10 | ${delta}${flag} |`);
    }

    if (outcome.regressions.length > 0) {
        lines.push(
            "",
            `**${outcome.regressions.length} artifact(s) regressed by more than the allowed threshold.**`
        );
    } else {
        lines.push("", "No score regressions detected.");
    }

    return lines.join("\n");
}
