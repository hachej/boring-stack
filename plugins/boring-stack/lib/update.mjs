import { existsSync, mkdirSync, readFileSync, symlinkSync, writeFileSync, appendFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { CACHE, PLUGIN, files, latest, mode, readProviders, selected, tree, writeMarketplace, writeProviders } from "./providers.mjs";
import { scanExecutable, scanText } from "./scan.mjs";
import { card, checks, routing } from "./gate.mjs";

const text = (f) => { try { return readFileSync(f, "utf8"); } catch { return ""; } };

// Files added, removed and changed between two checkouts, limited to the selected skills.
export function diff(p, oldRoot, newRoot) {
  const a = new Set(files(oldRoot).filter((f) => selected(p, f)));
  const b = new Set(files(newRoot).filter((f) => selected(p, f)));
  const added = [...b].filter((f) => !a.has(f));
  const removed = [...a].filter((f) => !b.has(f));
  const changed = [...b].filter((f) => a.has(f) && text(join(oldRoot, f)) !== text(join(newRoot, f)));
  return { added, removed, changed };
}

// One line per changed instruction file: lines in and out, headings added or dropped, a new description.
function summary(oldText, newText) {
  const ol = oldText.split("\n"), nl = newText.split("\n");
  const os = new Set(ol), ns = new Set(nl);
  const plus = nl.filter((l) => !os.has(l)), minus = ol.filter((l) => !ns.has(l));
  const heads = (ls) => ls.filter((l) => /^#{1,4} /.test(l)).map((l) => l.replace(/^#+ /, ""));
  const desc = (t) => (t.match(/^description:\s*(.*)$/m) || [])[1] || "";
  const bits = [`+${plus.length}/-${minus.length} lines`];
  if (heads(plus).length) bits.push(`new headings: ${heads(plus).slice(0, 4).join("; ")}`);
  if (heads(minus).length) bits.push(`dropped headings: ${heads(minus).slice(0, 4).join("; ")}`);
  if (desc(oldText) !== desc(newText)) bits.push("description changed");
  return { text: bits.join(", "), plus: plus.join("\n") };
}

export function scanChange(p, oldRoot, newRoot, d) {
  const flags = [], notes = [];
  for (const f of d.added) {
    const t = text(join(newRoot, f));
    flags.push(...scanText(f, t), ...scanExecutable(f, mode(join(newRoot, f)), t));
  }
  for (const f of d.changed) {
    const o = text(join(oldRoot, f)), n = text(join(newRoot, f));
    const s = summary(o, n);
    if (/\.md$/.test(f)) notes.push(`${f}: ${s.text}`);
    flags.push(...scanText(f, s.plus, o));
    if (!(mode(join(oldRoot, f)) & 0o111) && mode(join(newRoot, f)) & 0o111) flags.push({ file: f, rule: "new-executable", why: "became executable" });
  }
  return { flags, notes };
}

// A folder Claude Code loads with --plugin-dir: the provider's skills, only the selected ones.
export function pluginDir(p, root) {
  if (!p.plugin?.skills && existsSync(join(root, ".claude-plugin", "plugin.json"))) return root;
  const dir = join(CACHE, "plugin-dirs", `${p.name}-${root.split("/").slice(-2).join("-")}`);
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(join(dir, ".claude-plugin"), { recursive: true });
  mkdirSync(join(dir, "skills"), { recursive: true });
  writeFileSync(join(dir, ".claude-plugin", "plugin.json"), JSON.stringify({ name: p.name, version: "0.0.0-gate" }) + "\n");
  const names = p.plugin?.skills || (existsSync(join(root, "SKILL.md")) ? [null] : []);
  for (const s of names) symlinkSync(s ? join(root, s) : root, join(dir, "skills", s || p.name));
  return dir;
}

export function run({ only, apply = false, live = true, log = console.log } = {}) {
  const prov = readProviders();
  const all = [...prov.providers, ...prov.ours_elsewhere.map((p) => ({ ...p, ours: true }))];
  const results = [];
  for (const p of prov.providers.filter((x) => !only || x.name === only)) {
    const r = { name: p.name, from: p.adopted };
    try {
      if (p.hold) { results.push({ ...r, status: "held" }); continue; }
      r.to = latest(p);
      if (r.to === p.adopted) { results.push({ ...r, status: "up to date" }); continue; }
      const oldRoot = tree(p, p.adopted), newRoot = tree(p, r.to);
      r.diff = diff(p, oldRoot, newRoot);
      if (!r.diff.added.length && !r.diff.removed.length && !r.diff.changed.length) { results.push({ ...r, status: "no change in the selected skills", bump: true }); continue; }
      Object.assign(r, scanChange(p, oldRoot, newRoot, r.diff));
      r.broken = routing(p, newRoot);
      r.status = r.flags.length ? "flagged" : r.broken.length ? "routing broken" : "candidate";
      r.root = newRoot;
    } catch (e) { r.status = "error"; r.error = String(e.message || e).split("\n")[0]; }
    results.push(r);
  }
  const candidates = results.filter((r) => r.status === "candidate");
  let gate = null;
  if (candidates.length) {
    const bad = checks();
    gate = { checks: bad };
    if (live && !bad.length) {
      const dirs = all.map((p) => { const c = candidates.find((r) => r.name === p.name); return pluginDir(p, c ? c.root : tree(p, p.adopted || latest(p))); });
      gate.card = card(dirs);
    }
    const ok = !bad.length && (!live || gate.card.pass);
    for (const c of candidates) c.status = ok ? (live ? "gate passed" : "gate passed (no live card)") : "gate failed";
  }
  if (apply) adopt(prov, results);
  return { results, gate };
}

function adopt(prov, results) {
  const today = new Date().toISOString().slice(0, 10);
  const moved = results.filter((r) => r.status === "gate passed" || r.bump);
  if (!moved.length) return;
  for (const r of moved) {
    const p = prov.providers.find((x) => x.name === r.name);
    p.adopted = r.to; p.adopted_on = today;
    const d = r.diff || { added: [], removed: [], changed: [] };
    appendFileSync(join(PLUGIN, "CHANGELOG.md"), `\n- ${today} ${r.name}: ${r.from.slice(0, 12)} -> ${r.to.slice(0, 12)}; added ${d.added.length}, removed ${d.removed.length}, changed ${d.changed.length}${r.notes?.length ? "; " + r.notes.join("; ") : ""}\n`);
  }
  writeProviders(prov);
  writeMarketplace(prov);
}
