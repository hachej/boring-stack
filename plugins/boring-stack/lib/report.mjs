// The update report: one section per provider, then the gate. Short enough to read on a phone.
export function report({ results, gate }, { apply }) {
  const out = [`# boring-stack provider update, ${new Date().toISOString().slice(0, 16)}Z${apply ? "" : " (dry run: nothing adopted)"}`, ""];
  for (const r of results) {
    out.push(`## ${r.name}: ${r.status}`);
    if (r.to && r.to !== r.from) out.push(`${r.from.slice(0, 12)} -> ${r.to.slice(0, 12)}`);
    if (r.error) out.push(`error: ${r.error}`);
    if (r.diff) {
      const d = r.diff;
      out.push(`added ${d.added.length}, removed ${d.removed.length}, changed ${d.changed.length}`);
      for (const f of d.added.slice(0, 12)) out.push(`- added ${f}`);
      for (const f of d.removed.slice(0, 12)) out.push(`- removed ${f}`);
      for (const n of r.notes || []) out.push(`- changed ${n}`);
    }
    for (const f of (r.flags || []).slice(0, 25)) out.push(`- FLAG ${f.rule} ${f.file}${f.line ? ":" + f.line : ""}: ${f.why}${f.text ? ` (${f.text})` : ""}`);
    if ((r.flags || []).length > 25) out.push(`- and ${r.flags.length - 25} more flags`);
    for (const b of r.broken || []) out.push(`- ROUTING ${b}`);
    out.push("");
  }
  if (gate) {
    out.push("## Gate");
    out.push(gate.checks.length ? `checks failed: ${gate.checks.join("; ")}` : "library checks and plugin validate: pass");
    if (gate.card) {
      out.push(`fixed card: ${gate.card.pass ? "pass" : "FAIL"} in ${gate.card.seconds} s${gate.card.work ? ` (kept at ${gate.card.work})` : ""}`);
      for (const f of gate.card.facts) out.push(`- ${f.ok ? "ok" : "MISSING"} ${f.fact}`);
    }
  }
  return out.join("\n");
}
