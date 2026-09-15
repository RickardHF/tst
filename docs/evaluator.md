# Evaluator

The evaluator uses the GitHub Copilot SDK to score agent and skill definitions from 1 to 10. It judges correctness, efficiency, readability, and maintainability, and returns a short justification with each score.

## Run an evaluation

From the `evaluator/` directory:

```bash
npm ci
npx tsx cli.ts evaluate --directory .. --json > eval_results.jsonl
```

Local runs require an authenticated GitHub Copilot SDK environment. The command must be able to make Copilot requests with the current credentials.

The `evaluate` command has two input modes:

| Argument | Description |
| --- | --- |
| `--directory <path>` | Root directory to search when `--files` is omitted. Defaults to the current directory. |
| `--files <files...>` | Explicit agent files and/or skill directories. Values may be separate arguments or comma-separated in one argument. |
| `--json` | Emit only newline-delimited JSON results on stdout. Diagnostics and discovery messages go to stderr. |

### Automatic discovery

When no `--files` are supplied, the evaluator searches the selected directory for:

- Agent files in `.github/agents/*.agent.md` and `.agents/agents/*.agent.md`.
- Skill directories in `.agents/skills/*/` and `.github/skills/*/`.

Every discovered skill directory must have a root `SKILL.md`. A missing `SKILL.md` is reported and skipped. In normal mode, discovery and processing messages are printed to stdout; in JSON mode, stdout is reserved for result records.

### Explicit inputs

Explicit inputs are validated before any evaluation begins. An agent input must be an existing `.agent.md` file. A directory input must exist and contain a root `SKILL.md`; other files and invalid directories cause the command to fail.

The path resolver also accepts repository-style paths with `agents/` or `github/` in place of `.agents/` or `.github/`. This makes paths copied from tools that omit hidden-directory prefixes work as expected.

For example, evaluate one agent and one skill:

```bash
npx tsx cli.ts evaluate --files \
  ../.github/agents/csharper.agent.md \
  ../.agents/skills/generic-skill-name \
  --json
```

## Evaluation flow

1. The CLI reads each agent definition, or reads `SKILL.md` plus every other file under the skill directory.
2. The definition and, for skills, the collected artifact paths and contents are placed in a structured evaluation prompt.
3. A Copilot SDK session is created with a fixed evaluator role and a 1–10 scoring rubric.
4. The model must call the terminal `evaluate` tool with a numeric `score` from 1 to 10 and non-empty `reasoning` of at most 500 characters. Zod validates the tool parameters.
5. The first valid evaluation tool request is returned as `{ score, reasoning }`.
6. If the session returns no tool request, no `evaluate` request, or incomplete arguments, the attempt is treated as an evaluation failure and retried up to three total attempts. Other errors are rethrown immediately.

The rubric labels scores as follows: 1 failing, 2 poor, 3 below average, 4 average, 5 above average, 6 good, 7 very good, 8 excellent, 9 outstanding, and 10 exceptional. Scores are model judgments rather than deterministic static-analysis results, so they can vary between runs.

The evaluator also exposes `evaluatePerformance(userPrompt, processOutput, expectations)` for code-level callers. It applies the same rubric to an interaction’s prompt, output, and expectations; the CLI currently uses the agent- and skill-definition functions.

## Result format and errors

With `--json`, each successful evaluation is one JSON object per line. The `fileName` is relative to the evaluation directory used by the CLI:

```json
{"fileName":".agents/skills/example/SKILL.md","score":8,"reasoning":"Clear procedure with explicit safety checks."}
```

The CLI waits for all evaluation promises with `Promise.allSettled`. Successful results are printed; an individual evaluation failure is reported to stderr without creating a JSON result for that item. Invalid explicit inputs fail before evaluation starts. A malformed or empty badge input is also rejected.

## Create a badge

Pass the JSONL results to the `badge` command:

```bash
npx tsx cli.ts badge \
  --input eval_results.jsonl \
  --output ../eval-badge.svg \
  --date "$(date -u +%Y-%m-%d)"
```

| Argument | Default | Description |
| --- | --- | --- |
| `--input <file>` | `eval_results.jsonl` | JSONL file. Lines that are not valid JSON or lack `fileName`, numeric `score`, or string `reasoning` are ignored. |
| `--output <file>` | `../eval-badge.svg` | SVG file to create; parent directories are created automatically. |
| `--date <date>` | Today in UTC | Date shown in the badge header. |

The badge contains one score row per valid result and a rounded average. Score colors are red for 1–4, amber for 5–6, teal-green for 7–8, and bright green for 9–10.

## Build a per-artifact score baseline

`build-scores` turns an `eval_results.jsonl` file into a keyed JSON document, one entry per artifact (a skill folder is one entry, keyed by its `SKILL.md` path):

```bash
npx tsx cli.ts build-scores \
  --input eval_results.jsonl \
  --output ../eval-scores.json
```

```json
{
  "generatedAt": "2026-09-15T00:00:00.000Z",
  "scores": {
    ".github/agents/csharper.agent.md": { "score": 8, "reasoning": "...", "type": "agent" },
    ".agents/skills/example/SKILL.md": { "score": 6, "reasoning": "...", "type": "skill" }
  }
}
```

This file is committed to `main` (see the workflow section below) and acts as the baseline the PR check compares against.

## Compare scores against a baseline

`compare-scores` evaluates only the artifacts changed in a PR and fails if any artifact's score dropped by more than the threshold (default 2 points) versus a baseline `eval-scores.json`:

```bash
npx tsx cli.ts compare-scores \
  --current pr_eval_results.jsonl \
  --baseline baseline.json \
  --summary "$GITHUB_STEP_SUMMARY" \
  --threshold 2
```

Artifacts with no prior baseline entry (new files) are never treated as regressions. The command prints a Markdown comparison table and exits non-zero only when at least one artifact regressed past the threshold; evaluation errors captured separately (e.g. in `eval_errors.txt`) are non-fatal and only reported as warnings.

## GitHub Actions workflows

Two workflows cooperate to keep the baseline current and gate pull requests:

- [Evaluate Agents & Skills](../.github/workflows/evaluate.yml) runs on `push` to `main` and on `workflow_dispatch`. It evaluates the whole repository with `--json`, separates stdout JSONL from stderr errors, then:
  - Adds workflow annotations for each result, with scores below 5 marked as warnings.
  - Writes a Markdown table and rounded average to the job summary.
  - Generates and uploads `eval-badge.svg` as an artifact.
  - Builds `eval-scores.json` with `build-scores` from the same results.
  - Commits a changed `eval-badge.svg` and/or `eval-scores.json` back to `main` with `[skip ci]`.
- [Evaluate Changed Agents & Skills](../.github/workflows/evaluate-pr.yml) runs on `pull_request` targeting `main`. It diffs the PR against its base to find changed `.agent.md` files and changed skill directories (deduplicated to one artifact per folder), evaluates only those with `--files`, fetches `eval-scores.json` from `origin/main` as the baseline, and runs `compare-scores` to fail the check on a >2-point regression. If no agent/skill files changed, the job reports that and does not call the evaluator.

Both workflows require permission to make Copilot requests; the push-triggered workflow additionally needs `contents: write` to commit the badge and score baseline. A missing or empty result file prevents summary and badge/score data from being generated, while individual evaluation errors are surfaced as workflow warnings rather than failures.

Branch protection on `main` (requiring the PR workflow's check and PR review before merge) is configured manually by a repo admin — see [Branch protection on `main`](agent-orchestration.md#branch-protection-on-main).