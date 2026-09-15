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

export { parseAgentFrontmatter, isKnownModel, validModels };
export type { AgentFrontmatter, FrontmatterParseResult };
