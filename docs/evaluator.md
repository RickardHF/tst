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

## GitHub Actions workflow

The [Evaluate Agents & Skills workflow](../.github/workflows/evaluate.yml) runs manually with `workflow_dispatch`. It installs the evaluator dependencies, evaluates the repository with `--json`, and separates stdout JSONL from stderr errors. It then:

- Adds workflow annotations for each result, with scores below 5 marked as warnings.
- Writes a Markdown table and rounded average to the job summary.
- Generates and uploads `eval-badge.svg` as an artifact.
- Commits a changed `eval-badge.svg` back to the repository with `[skip ci]`.

The workflow requires permission to make Copilot requests and write repository contents. A missing or empty result file prevents summary and badge data from being generated, while individual evaluation errors are surfaced as workflow warnings.