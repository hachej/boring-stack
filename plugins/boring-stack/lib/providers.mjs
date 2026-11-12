import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

export const PLUGIN = join(dirname(fileURLToPath(import.meta.url)), "..");
export const REPO = join(PLUGIN, "..", "..");
export const CACHE = process.env.BORING_STACK_CACHE || join(homedir(), ".cache", "boring-stack");

export const readProviders = () => JSON.parse(readFileSync(join(PLUGIN, "providers.json"), "utf8"));
export const writeProviders = (p) => writeFileSync(join(PLUGIN, "providers.json"), JSON.stringify(p, null, 2) + "\n");

const git = (args, opts = {}) => execFileSync("git", args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], ...opts }).trim();

// The newest commit on `ref` that touched `path` (what an update would adopt).
export function latest(p) {
  try {
    const out = execFileSync("gh", ["api", `repos/${p.repo}/commits?sha=${p.ref}&path=${p.path}&per_page=1`, "--jq", ".[0].sha"], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
    if (/^[0-9a-f]{40}$/.test(out)) return out;
  } catch {}
  return git(["ls-remote", `https://github.com/${p.repo}.git`, p.ref]).split(/\s/)[0];
}

// A checkout of `path` at `sha`, cached by sha (never mutated after it is written).
export function tree(p, sha) {
  const dir = join(CACHE, "providers", p.name, sha);
  if (existsSync(join(dir, ".done"))) return join(dir, p.path);
  mkdirSync(dir, { recursive: true });
  git(["init", "-q"], { cwd: dir });
  try { git(["remote", "add", "origin", `https://github.com/${p.repo}.git`], { cwd: dir }); } catch {}
  git(["sparse-checkout", "set", "--no-cone", `/${p.path}/`], { cwd: dir });
  git(["fetch", "-q", "--depth", "1", "--filter=blob:none", "origin", sha], { cwd: dir, timeout: 180000 });
  git(["checkout", "-q", "FETCH_HEAD"], { cwd: dir, timeout: 180000 });
  writeFileSync(join(dir, ".done"), sha + "\n");
  return join(dir, p.path);
}

export function files(root) {
  const out = [];
  const walk = (d) => {
    for (const e of readdirSync(d, { withFileTypes: true })) {
      if (e.name === ".git" || e.name === "node_modules") continue;
      const f = join(d, e.name);
      if (e.isDirectory()) walk(f);
      else if (e.isFile()) out.push(relative(root, f));
    }
  };
  if (existsSync(root)) walk(root);
  return out.sort();
}

// Only the selected skill folders count when a provider selects some.
export const selected = (p, rel) => !p.plugin?.skills || p.plugin.skills.some((s) => rel === s || rel.startsWith(s + "/"));
export const mode = (f) => statSync(f).mode;

// marketplace.json is generated from providers.json, so there is one place to bump.
export function marketplace(prov = readProviders()) {
  const sub = (p, sha) => ({ source: "git-subdir", url: `https://github.com/${p.repo}.git`, path: p.path, ...(sha ? { sha } : { ref: p.ref }) });
  const entry = (p, sha, description) => ({
    name: p.name,
    description,
    source: sub(p, sha),
    ...(p.plugin?.skills ? { skills: p.plugin.skills.map((s) => `./${s}`) } : {}),
    license: p.license,
  });
  const pluginJson = JSON.parse(readFileSync(join(PLUGIN, ".claude-plugin", "plugin.json"), "utf8"));
  return {
    name: "boring-stack",
    owner: { name: "hachej" },
    description: "The Boring Factory's worker stack: boring-stack on top of pstack, with the providers it routes to pinned by commit.",
    plugins: [
      { name: "boring-stack", source: "./plugins/boring-stack", description: pluginJson.description, version: pluginJson.version },
      ...prov.providers.map((p) => entry(p, p.adopted, `${p.repo}/${p.path} at ${p.adopted.slice(0, 12)} (adopted ${p.adopted_on}), by reference`)),
      ...prov.ours_elsewhere.map((p) => entry(p, null, `${p.repo}/${p.path}, ours, tracks ${p.ref}`)),
    ],
  };
}

export function writeMarketplace(prov) {
  const m = marketplace(prov);
  writeFileSync(join(REPO, ".claude-plugin", "marketplace.json"), JSON.stringify(m, null, 2) + "\n");
  return m;
}
