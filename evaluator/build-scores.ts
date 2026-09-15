// Converts newline-delimited evaluation results into a keyed baseline document.

export interface EvalResultLine {
    fileName: string;
    score: number;
    reasoning: string;
}

export type ArtifactType = "agent" | "skill";

export interface ScoreEntry {
    score: number;
    reasoning: string;
    type: ArtifactType;
}

export interface ScoresFile {
    generatedAt: string;
    scores: Record<string, ScoreEntry>;
}

export function artifactType(fileName: string): ArtifactType {
    return fileName.endsWith(".agent.md") ? "agent" : "skill";
}

export function parseEvalResultsJsonl(jsonl: string): EvalResultLine[] {
    return jsonl
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
        .flatMap((line) => {
            try {
                const obj = JSON.parse(line);
                if (obj && typeof obj.fileName === "string" && typeof obj.score === "number" && typeof obj.reasoning === "string") {
                    return [{ fileName: obj.fileName, score: obj.score, reasoning: obj.reasoning }];
                }
            } catch {
                // skip malformed lines
            }
            return [];
        });
}

export function buildScoresFile(results: EvalResultLine[], generatedAt: string = new Date().toISOString()): ScoresFile {
    const scores: Record<string, ScoreEntry> = {};
    for (const result of results) {
        scores[result.fileName] = {
            score: result.score,
            reasoning: result.reasoning,
            type: artifactType(result.fileName),
        };
    }
    return { generatedAt, scores };
}

export function parseScoresFile(json: string): ScoresFile {
    const empty: ScoresFile = { generatedAt: new Date(0).toISOString(), scores: {} };
    try {
        const parsed = JSON.parse(json);
        if (!parsed || typeof parsed !== "object" || typeof parsed.scores !== "object" || parsed.scores === null) {
            return empty;
        }
        return parsed as ScoresFile;
    } catch {
        return empty;
    }
}
