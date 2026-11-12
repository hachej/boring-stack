import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { PLUGIN, readProviders } from "./providers.mjs";

// Where an installed plugin lives. Prefers the copy from the boring-stack marketplace,
// then any other marketplace (pstack@cursor-plugins today), then the provider cache.
export function pluginRoot(name) {
  const file = join(process.env.CLAUDE_CODE_PLUGIN_CACHE_DIR || join(homedir(), ".claude", "plugins"), "installed_plugins.json");
  if (existsSync(file)) {
    const all = JSON.parse(readFileSync(file, "utf8")).plugins || {};
    const keys = Object.keys(all).filter((k) => k.split("@")[0] === name).sort((a, b) => (b.endsWith("@boring-stack") ? 1 : 0) - (a.endsWith("@boring-stack") ? 1 : 0));
    for (const k of keys) { const p = all[k].at(-1)?.installPath; if (p && existsSync(p)) return p; }
  }
  const prov = readProviders().providers.find((p) => p.name === name);
  if (prov) {
    const c = join(process.env.BORING_STACK_CACHE || join(homedir(), ".cache", "boring-stack"), "providers", prov.name, prov.adopted, prov.path);
    if (existsSync(c)) return c;
  }
  return null;
}

// The SKILL.md of a skill, ours or a provider's.
export function skillPath(skill) {
  const ours = join(PLUGIN, "skills", skill, "SKILL.md");
  if (existsSync(ours)) return ours;
  const prov = readProviders();
  for (const p of [...prov.providers, ...prov.ours_elsewhere]) {
    const root = pluginRoot(p.name);
    if (!root) continue;
    for (const f of [join(root, "skills", skill, "SKILL.md"), join(root, skill, "SKILL.md")]) if (existsSync(f)) return f;
    if (p.name === skill && existsSync(join(root, "SKILL.md"))) return join(root, "SKILL.md");
  }
  for (const f of [join(homedir(), ".claude", "skills", skill, "SKILL.md"), join(homedir(), ".agents", "skills", skill, "SKILL.md")]) if (existsSync(f)) return f;
  return null;
}
