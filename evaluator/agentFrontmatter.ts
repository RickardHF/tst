import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { parse as parseYaml } from "yaml";

type AgentFrontmatter = {
    name: string;
    description: string;
    model?: string;
    tools?: string[];
    [key: string]: unknown;
};

type FrontmatterParseResult =
    | { ok: true; frontmatter: AgentFrontmatter }
    | { ok: false; error: string };

const frontmatterPattern = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/;

function parseAgentFrontmatter(content: string): FrontmatterParseResult {
    const match = frontmatterPattern.exec(content);
    if (!match) {
        return { ok: false, error: "missing a '---' delimited frontmatter block" };
    }

    let parsed: unknown;
    try {
        parsed = parseYaml(match[1] ?? "");
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return { ok: false, error: `frontmatter is not valid YAML (${message})` };
    }

    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
        return { ok: false, error: "frontmatter must be a YAML mapping of key/value pairs" };
    }

    const record = parsed as Record<string, unknown>;

    if (typeof record.name !== "string" || record.name.trim().length === 0) {
        return { ok: false, error: "'name' is required and must be a non-empty string" };
    }

    if (typeof record.description !== "string" || record.description.trim().length === 0) {
        return { ok: false, error: "'description' is required and must be a non-empty string" };
    }

    if (record.tools !== undefined) {
        if (!Array.isArray(record.tools) || !record.tools.every((tool) => typeof tool === "string")) {
            return { ok: false, error: "'tools' must be an array of strings when present" };
        }
    }

    if (record.model !== undefined && typeof record.model !== "string") {
        return { ok: false, error: "'model' must be a string when present" };
    }

    return { ok: true, frontmatter: record as AgentFrontmatter };
}

const validModelsPath = fileURLToPath(new URL("./valid-models.json", import.meta.url));
const validModels: string[] = JSON.parse(readFileSync(validModelsPath, "utf-8"));

function isKnownModel(model: string): boolean {
    return validModels.includes(model);
}

type SkillFrontmatter = {
    name: string;
    description: string;
    "argument-hint"?: string;
    "user-invocable"?: boolean;
    "disable-model-invocation"?: boolean;
    [key: string]: unknown;
};

function parseSkillFrontmatter(content: string): { ok: true; frontmatter: SkillFrontmatter } | { ok: false; error: string } {
    const match = frontmatterPattern.exec(content);
    if (!match) {
        return { ok: false, error: "missing a '---' delimited frontmatter block" };
    }

    let parsed: unknown;
    try {
        parsed = parseYaml(match[1] ?? "");
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return { ok: false, error: `frontmatter is not valid YAML (${message})` };
    }

    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
        return { ok: false, error: "frontmatter must be a YAML mapping of key/value pairs" };
    }

    const record = parsed as Record<string, unknown>;

    if (typeof record.name !== "string" || record.name.trim().length === 0) {
        return { ok: false, error: "'name' is required and must be a non-empty string" };
    }

    if (typeof record.description !== "string" || record.description.trim().length === 0) {
        return { ok: false, error: "'description' is required and must be a non-empty string" };
    }

    if (record["argument-hint"] !== undefined && typeof record["argument-hint"] !== "string") {
        return { ok: false, error: "'argument-hint' must be a string when present" };
    }

    if (record["user-invocable"] !== undefined && typeof record["user-invocable"] !== "boolean") {
        return { ok: false, error: "'user-invocable' must be a boolean when present" };
    }

    if (record["disable-model-invocation"] !== undefined && typeof record["disable-model-invocation"] !== "boolean") {
        return { ok: false, error: "'disable-model-invocation' must be a boolean when present" };
    }

    return { ok: true, frontmatter: record as SkillFrontmatter };
}

export { parseAgentFrontmatter, parseSkillFrontmatter, isKnownModel, validModels };
export type { AgentFrontmatter, FrontmatterParseResult, SkillFrontmatter };
