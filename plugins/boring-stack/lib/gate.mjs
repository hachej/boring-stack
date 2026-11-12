import { execFileSync, spawnSync } from "node:child_process";
import { copyFileSync, cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import { join } from "node:path";
import { PLUGIN, REPO } from "./providers.mjs";

const frontmatter = (text) => {
  const m = text.match(/^---\n([\s\S]*?)\n---/);
  const get = (k) => (m?.[1].match(new RegExp(`^${k}:\\s*(.*(?:\\n[ \\t]+.*)*)`, "m"))?.[1] || "").replace(/^["'>-]+|["']$/g, "").replace(/\s+/g, " ").trim();
  return { name: get("name"), description: get("description") };
};

// Every skill boring-mode routes to still exists under the same name, and its description
// still carries the trigger the router relies on.
export function routing(p, root) {
  const broken = [];
  for (const [skill, trigger] of Object.entries(p.routes || {})) {
    const file = [join(root, "skills", skill, "SKILL.md"), join(root, skill, "SKILL.md"), join(root, "SKILL.md")].find(existsSync);
    if (!file) { broken.push(`${skill}: missing`); continue; }
    const fm = frontmatter(readFileSync(file, "utf8"));
    if (fm.name !== skill) broken.push(`${skill}: renamed to ${fm.name || "(none)"}`);
    else if (!new RegExp(trigger, "i").test(fm.description + " " + readFileSync(file, "utf8").slice(0, 3000))) broken.push(`${skill}: trigger /${trigger}/ no longer in its description`);
  }
  for (const pb of p.playbooks || []) if (!existsSync(join(root, "skills", "poteto-mode", "playbooks", `${pb}.md`))) broken.push(`playbook ${pb}: missing`);
  for (const a of p.agents || []) if (!existsSync(join(root, "agents", `${a}.md`))) broken.push(`agent ${a}: missing`);
  return broken;
}

// The library's own checks and the plugin manifest check.
export function checks() {
  const out = [];
  const py = spawnSync("python3", [join(REPO, "scripts", "check.py")], { encoding: "utf8" });
  if (py.status !== 0) out.push(`scripts/check.py: ${(py.stderr || py.stdout).trim().split("\n").slice(0, 5).join(" | ")}`);
  const v = spawnSync("claude", ["plugin", "validate", PLUGIN], { encoding: "utf8" });
  if (v.error) out.push("claude plugin validate: claude not found");
  else if (v.status !== 0) out.push(`claude plugin validate: ${(v.stdout + v.stderr).trim().split("\n").slice(-3).join(" | ")}`);
  return out;
}

// The fixed card: a fresh headless worker, only this plugin and the candidate providers loaded
// for that run (--plugin-dir), a throwaway fixture app in a temp folder. Pass = the facts in
// evals/gate/README.md, read from the files and the transcript, not from the worker's reply.
export function card(pluginDirs, { model = "sonnet", budgetMinutes = 20 } = {}) {
  const work = mkdtempSync(join(tmpdir(), "boring-stack-gate-"));
  cpSync(join(PLUGIN, "evals", "gate", "fixture"), work, { recursive: true });
  const sh = (cmd, args) => execFileSync(cmd, args, { cwd: work, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  sh("git", ["init", "-q", "-b", "main"]);
  sh("git", ["-c", "user.email=gate@example.invalid", "-c", "user.name=gate", "add", "-A"]);
  sh("git", ["-c", "user.email=gate@example.invalid", "-c", "user.name=gate", "commit", "-qm", "fixture"]);
  const prompt = readFileSync(join(PLUGIN, "evals", "gate", "prompt.md"), "utf8");
  const args = ["-p", prompt, "--model", model, "--output-format", "stream-json", "--verbose",
    "--allowedTools", "Bash,Read,Edit,Write,Glob,Grep,Skill,TodoWrite,Agent", "--permission-mode", "acceptEdits"];
  for (const d of [PLUGIN, ...pluginDirs]) args.push("--plugin-dir", d);
  const t0 = Date.now();
  const run = spawnSync("claude", args, { cwd: work, encoding: "utf8", timeout: budgetMinutes * 60000, maxBuffer: 256 * 1024 * 1024, env: { ...process.env, CLAUDE_CODE_SYNC_PLUGIN_INSTALL: "1" } });
  const seconds = Math.round((Date.now() - t0) / 1000);
  const trace = run.stdout || "";
  writeFileSync(join(work, ".gate-trace.jsonl"), trace);
  const facts = grade(work, trace);
  const pass = facts.every((f) => f.ok);
  if (pass && !process.env.BORING_STACK_KEEP) rmSync(work, { recursive: true, force: true });
  return { pass, seconds, facts, work: pass && !process.env.BORING_STACK_KEEP ? null : work, exit: run.status };
}

// What the worker did, from its own tool calls only (a skill's text in a tool result must not count).
export function calls(trace) {
  const out = [];
  for (const line of trace.split("\n")) {
    let m; try { m = JSON.parse(line); } catch { continue; }
    if (m.type !== "assistant") continue;
    for (const c of m.message?.content || []) if (c.type === "tool_use") out.push(`${c.name} ${c.input?.skill || c.input?.file_path || c.input?.command || ""}`);
  }
  return out.join("\n");
}

// A typed `/boring-mode` expands without a tool call and stream-json leaves the expansion out;
// the session's own transcript keeps the command line.
export function typed(trace, skill) {
  let sid; try { sid = JSON.parse(trace.split("\n")[0]).session_id; } catch { return false; }
  const root = join(homedir(), ".claude", "projects");
  if (!sid || !existsSync(root)) return false;
  for (const d of readdirSync(root)) {
    const f = join(root, d, `${sid}.jsonl`);
    if (existsSync(f)) return readFileSync(f, "utf8").includes(`<command-name>/${skill}<`);
  }
  return false;
}

export function grade(work, trace) {
  const did = calls(trace);
  const has = (re) => re.test(did);
  const test = spawnSync("node", ["--test"], { cwd: work, encoding: "utf8" });
  mkdirSync(join(work, ".gate"), { recursive: true });
  copyFileSync(join(PLUGIN, "evals", "gate", "hidden.test.mjs"), join(work, ".gate", "hidden.test.mjs"));
  const hidden = spawnSync("node", ["--test", ".gate/hidden.test.mjs"], { cwd: work, encoding: "utf8" });
  const proof = existsSync(join(work, ".agent-handoff", "proof.md")) ? readFileSync(join(work, ".agent-handoff", "proof.md"), "utf8") : "";
  const log = spawnSync("git", ["log", "--all", "--format=%s%n%b"], { cwd: work, encoding: "utf8" }).stdout || "";
  return [
    { fact: "loaded boring-mode", ok: has(/boring-stack:boring-mode|boring-mode\/SKILL\.md/) || typed(trace, "boring-stack:boring-mode") },
    { fact: "read poteto-mode in full", ok: has(/poteto-mode\/SKILL\.md/) },
    { fact: "followed a poteto playbook", ok: has(/playbooks\/(bug-fix|feature)\.md/) },
    { fact: "loaded prove-it and ship", ok: has(/(boring-stack:prove-it|prove-it\/SKILL\.md)/) && has(/(boring-stack:ship\b|skills\/ship\/SKILL\.md)/) },
    { fact: "the worker's tests pass (run by the gate)", ok: test.status === 0 },
    { fact: "the gate's own AC test passes (AC-1 to AC-3)", ok: hidden.status === 0 },
    { fact: "a failing run was recorded before the fix", ok: /fail|FAIL|not ok/.test(proof) && /pass|PASS|\bok\b/.test(proof) },
    { fact: "one evidence row per acceptance line", ok: ["AC-1", "AC-2", "AC-3"].every((a) => new RegExp(`\\|\\s*${a}\\b`).test(proof)) },
    { fact: "shipped (a commit on a branch other than main, naming the card)", ok: /G-1/.test(log) && spawnSync("git", ["branch", "--list"], { cwd: work, encoding: "utf8" }).stdout.split("\n").some((b) => b.trim() && !/\bmain$/.test(b.trim())) },
    { fact: "no change outside the fixture (no settings, no CLAUDE.md written)", ok: !/^(Edit|Write) .*(settings(\.local)?\.json|CLAUDE\.md|AGENTS\.md)$/m.test(did) },
  ];
}
