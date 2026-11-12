// Enforcement for sessions that loaded boring-mode, and only those.
// post: record which skills this session loaded or read. pre: refuse a code edit before
// poteto-mode was read, and a commit, push or ship before prove-it and ship were loaded.
// A session that never loaded boring-mode is never touched.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const phase = process.argv[2];
let input = {};
try { input = JSON.parse(readFileSync(0, "utf8") || "{}"); } catch { process.exit(0); }
const dir = join(process.env.CLAUDE_PLUGIN_DATA || join(tmpdir(), "boring-stack-guard"), "sessions");
const file = join(dir, `${String(input.session_id || "none").replace(/[^\w-]/g, "_")}.json`);
const state = existsSync(file) ? JSON.parse(readFileSync(file, "utf8")) : { seen: [] };
const tool = input.tool_name || "";
const ti = input.tool_input || {};

const SKILLS = ["boring-mode", "poteto-mode", "prove-it", "ship", "task-card"];
const named = (text) => SKILLS.filter((s) => new RegExp(`(^|[:/])${s}(/SKILL\\.md|$|\\b)`).test(text));

if (phase === "post") {
  const text = tool === "Skill" ? String(ti.skill || "") : tool === "Read" ? String(ti.file_path || "") : /SKILL\.md|playbooks\//.test(ti.command || "") ? String(ti.command) : "";
  const found = tool === "Read" || tool === "Bash" ? named(text).filter((s) => text.includes(`${s}/SKILL.md`)) : named(text);
  if ((tool === "Read" || tool === "Bash") && /poteto-mode\/playbooks\/[\w-]+\.md/.test(text)) found.push("playbook");
  if (found.length) {
    state.seen = [...new Set([...state.seen, ...found])];
    mkdirSync(dir, { recursive: true });
    writeFileSync(file, JSON.stringify(state));
  }
  process.exit(0);
}

if (phase !== "pre" || !state.seen.includes("boring-mode")) process.exit(0);
const deny = (why) => {
  process.stdout.write(JSON.stringify({ hookSpecificOutput: { hookEventName: "PreToolUse", permissionDecision: "deny", permissionDecisionReason: why } }));
  process.exit(0);
};
const cmd = String(ti.command || "");
const editing = ["Edit", "Write", "NotebookEdit"].includes(tool) && !/\.agent-handoff\//.test(String(ti.file_path || ti.notebook_path || ""));
const shipping = tool === "Bash" && /\b(git\s+commit|git\s+push|gh\s+pr\s+(create|merge)|boring\s+(ship|change\s+(preview|ship)))\b/.test(cmd);
if ((editing || shipping) && !state.seen.includes("poteto-mode"))
  deny("boring-mode: read pstack's poteto-mode in full first. Run `boring-stack where poteto-mode` and Read that file, then continue.");
if ((editing || shipping) && !state.seen.includes("playbook"))
  deny("boring-mode: read the playbook your route names (bug-fix.md, feature.md, ...) from the playbooks/ folder next to poteto-mode's SKILL.md, then continue.");
if (shipping) {
  const missing = ["prove-it", "ship"].filter((s) => !state.seen.includes(s));
  if (missing.length) deny(`boring-mode: load ${missing.map((s) => `boring-stack:${s}`).join(" and ")} before you commit, push or ship; the proof and the pull request follow them.`);
}
process.exit(0);
