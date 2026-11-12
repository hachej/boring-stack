import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const guard = join(dirname(fileURLToPath(import.meta.url)), "..", "hooks", "guard.mjs");
const data = mkdtempSync(join(tmpdir(), "guard-"));
const hook = (phase, session, tool_name, tool_input, extra = {}) => {
  const r = spawnSync("node", [guard, phase], { input: JSON.stringify({ session_id: session, tool_name, tool_input, ...extra }), encoding: "utf8", env: { ...process.env, CLAUDE_PLUGIN_DATA: data } });
  return r.stdout ? JSON.parse(r.stdout).hookSpecificOutput.permissionDecisionReason : "allow";
};

test("a typed /boring-mode arms the guard like a Skill load", () => {
  hook("loaded", "t", "", {}, { hook_event_name: "UserPromptExpansion", command_name: "boring-stack:boring-mode", command_args: "coach-max D-12" });
  assert.match(hook("pre", "t", "Write", { file_path: "src/x.mjs" }), /poteto-mode/);
  hook("loaded", "u", "", {}, { hook_event_name: "UserPromptExpansion", command_name: "deploy" });
  assert.equal(hook("pre", "u", "Write", { file_path: "src/x.mjs" }), "allow");
});

test("a builder sub-agent is armed at start; its conductor is not", () => {
  hook("loaded", "v", "", {}, { hook_event_name: "SubagentStart", agent_id: "b1", agent_type: "boring-stack:builder" });
  assert.match(hook("pre", "v", "Write", { file_path: "src/x.mjs" }, { agent_id: "b1", agent_type: "boring-stack:builder" }), /poteto-mode/);
  assert.equal(hook("pre", "v", "Write", { file_path: "src/x.mjs" }), "allow");
  hook("loaded", "v", "", {}, { hook_event_name: "SubagentStart", agent_id: "p1", agent_type: "pstack:poteto-agent" });
  assert.equal(hook("pre", "v", "Write", { file_path: "src/x.mjs" }, { agent_id: "p1", agent_type: "pstack:poteto-agent" }), "allow");
});

test("a session that never loaded boring-mode is untouched", () => {
  assert.equal(hook("pre", "a", "Edit", { file_path: "src/x.mjs" }), "allow");
  assert.equal(hook("pre", "a", "Bash", { command: "git commit -m x" }), "allow");
});

test("after boring-mode, a code edit waits for poteto-mode", () => {
  hook("post", "b", "Skill", { skill: "boring-stack:boring-mode" });
  assert.match(hook("pre", "b", "Edit", { file_path: "src/x.mjs" }), /poteto-mode/);
  assert.equal(hook("pre", "b", "Write", { file_path: ".agent-handoff/proof.md" }), "allow");
  hook("post", "b", "Read", { file_path: "/c/pstack/0.15.36/skills/poteto-mode/SKILL.md" });
  assert.match(hook("pre", "b", "Edit", { file_path: "src/x.mjs" }), /playbook/);
  hook("post", "b", "Read", { file_path: "/c/pstack/0.15.36/skills/poteto-mode/playbooks/bug-fix.md" });
  assert.equal(hook("pre", "b", "Edit", { file_path: "src/x.mjs" }), "allow");
});

test("a commit or ship waits for prove-it and ship", () => {
  hook("post", "c", "Skill", { skill: "boring-stack:boring-mode" });
  hook("post", "c", "Bash", { command: "cat /c/pstack/skills/poteto-mode/SKILL.md /c/pstack/skills/poteto-mode/playbooks/feature.md" });
  assert.match(hook("pre", "c", "Bash", { command: "git commit -m fix" }), /prove-it and boring-stack:ship/);
  hook("post", "c", "Skill", { skill: "boring-stack:prove-it" });
  hook("post", "c", "Skill", { skill: "boring-stack:ship" });
  assert.equal(hook("pre", "c", "Bash", { command: "git commit -m fix" }), "allow");
  assert.equal(hook("pre", "c", "Bash", { command: "ls" }), "allow");
});
