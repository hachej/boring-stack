import { existsSync, lstatSync, mkdirSync, readFileSync, readdirSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { PLUGIN, readProviders } from "./providers.mjs";
import { pluginRoot } from "./where.mjs";

const BEGIN = "<!-- boring-stack:begin -->", END = "<!-- boring-stack:end -->";

// Codex reads skills from <repo>/.agents/skills (or ~/.agents/skills with --user) and standing
// instructions from AGENTS.md (~/.codex/AGENTS.md with --user). The export links the same skill
// folders Claude Code loads, so nothing is copied and an update reaches both on the next export.
export function exportCodex(target, { user = false } = {}) {
  const skillsDir = user ? join(homedir(), ".agents", "skills") : join(target, ".agents", "skills");
  const agentsMd = user ? join(homedir(), ".codex", "AGENTS.md") : join(target, "AGENTS.md");
  mkdirSync(skillsDir, { recursive: true });
  const linked = [], missing = [];
  const link = (name, src) => {
    const dst = join(skillsDir, name);
    if (existsSync(dst) || isLink(dst)) {
      if (!isLink(dst)) { missing.push(`${name}: a real folder is already there, left alone`); return; }
      rmSync(dst);
    }
    symlinkSync(src, dst); linked.push(name);
  };
  for (const s of readdirSync(join(PLUGIN, "skills"))) link(s, join(PLUGIN, "skills", s));
  const prov = readProviders();
  for (const p of [...prov.providers, ...prov.ours_elsewhere]) {
    const root = pluginRoot(p.name);
    if (!root) { missing.push(`${p.name}: not installed (claude plugin install ${p.name}@boring-stack, or boring-stack update --dry-run fills the cache)`); continue; }
    const names = p.plugin?.skills || (existsSync(join(root, "skills")) ? readdirSync(join(root, "skills")) : [p.name]);
    for (const s of names) {
      const src = [join(root, "skills", s), join(root, s)].find((d) => existsSync(join(d, "SKILL.md"))) || (existsSync(join(root, "SKILL.md")) ? root : null);
      if (src) link(s, src); else missing.push(`${p.name}/${s}: no SKILL.md`);
    }
  }
  const block = [BEGIN, readFileSync(join(PLUGIN, "codex", "AGENTS.block.md"), "utf8").trim(), END].join("\n");
  mkdirSync(dirname(agentsMd), { recursive: true });
  const old = existsSync(agentsMd) ? readFileSync(agentsMd, "utf8") : "";
  const next = old.includes(BEGIN) ? old.replace(new RegExp(`${BEGIN}[\\s\\S]*?${END}`), block) : (old ? old.trimEnd() + "\n\n" : "") + block + "\n";
  writeFileSync(agentsMd, next);
  return { skillsDir, agentsMd, linked, missing };
}

const isLink = (p) => { try { return lstatSync(p).isSymbolicLink(); } catch { return false; } };
