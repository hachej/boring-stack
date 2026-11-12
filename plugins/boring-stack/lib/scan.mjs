// Safety scan of skill text before it is adopted. A skill is instructions that agents with
// access to secrets will follow, so any hit below stops adoption for a person to read.
// It catches what a pattern can see; a harmful instruction in plain words passes (see DESIGN.md).

const HIDDEN = /[\u00AD\u034F\u061C\u115F\u1160\u17B4\u17B5\u180B-\u180F\u200B-\u200F\u202A-\u202E\u2060-\u2064\u2066-\u206F\u3164\uFE00-\uFE0E\uFEFF\uFFA0]|[\u{E0000}-\u{E007F}]|[\u{E0100}-\u{E01EF}]/gu;

export const RULES = [
  { id: "secrets", why: "reads credentials, tokens, keys or the environment",
    re: /(\bvault\s+(kv|read|token)|~\/\.(ssh|aws|codex|claude\/\.credentials|vault-token|netrc|npmrc|docker\/config)|\bauth\.json\b|\.env\b(?!\.example)|\bprintenv\b|\benv\s*\||\bprocess\.env\b|os\.environ|\$\{?[A-Z_]*(TOKEN|SECRET|API_KEY|PASSWORD)\b|\bgh\s+auth\s+token\b|keychain|id_rsa|id_ed25519)/i },
  { id: "exfiltration", why: "sends data to a network address",
    re: /(curl\b[^\n|]*\s(-d|--data|-F|--form|-T|--upload-file|-X\s*POST)\b|wget\b[^\n]*--post|\bnc\s+-?[a-z]*\s*\d{1,3}\.\d|\/dev\/tcp\/|webhook\.site|requestbin\.|ngrok\.io|pastebin\.com|fetch\([^)]*method:\s*["']POST)/i },
  { id: "download-exec", why: "runs downloaded code",
    re: /((curl|wget)\b[^\n]*\|\s*(sudo\s+)?(ba|z)?sh\b|\|\s*(python3?|node|perl|ruby)\s*-?\s*$|bash\s+<\(\s*(curl|wget)|\beval\s*\(\s*(await\s+)?fetch|iex\s*\(|Invoke-Expression|npx\s+-y\s+(?!@?(shadcn|playwright|skills)\b)\S+|pip\s+install\s+(git\+)?https?:)/im },
  { id: "settings", why: "changes settings, permissions, hooks or standing instructions",
    re: /(~?\/?\.claude\/settings(\.local)?\.json|\bsettings\.json\b[^\n]*(write|edit|add|set|modify)|enabledPlugins|permissions\.allow|bypassPermissions|dangerously-skip-permissions|--dangerously|skipDangerousModePermissionPrompt|PreToolUse|PostToolUse|hooks\.json|(write|edit|append|modify|add)[^\n]{0,40}\b(CLAUDE|AGENTS)\.md|(CLAUDE|AGENTS)\.md[^\n]{0,40}\b(write|edit|append|overwrite)|~\/\.claude\/rules|\.bashrc|\.zshrc|\.profile\b|crontab|systemctl\s+(--user\s+)?enable)/i },
  { id: "disable-checks", why: "disables checks or reviews",
    re: /(--no-verify|--no-gpg-sign|skip (the )?(tests|checks|review|ci)\b|disable (the )?(tests|checks|lint|review|ci|hooks)|git push\s+(-f|--force)\b|HUSKY=0|SKIP_CHECKS|\|\|\s*true\s*$)/im },
  { id: "override", why: "addresses the model to override the user",
    re: /(ignore (all |any )?(previous|prior|earlier|above) (instructions|rules|messages)|disregard (the |all )?(user|previous|system)|you are now\b|new system prompt|(as|you are) an? (AI|assistant|language model)[^\n]{0,60}(must|should|will)|do not (tell|inform|mention (this )?to) the user|without (telling|asking|informing) the user|the user (does not|doesn't) need to know|keep this (secret|hidden) from)/i },
];

const URL = /\bhttps?:\/\/[^\s)>"'`\]]+/g;

export function hidden(text) {
  const found = new Map();
  for (const m of text.matchAll(HIDDEN)) {
    const cp = "U+" + m[0].codePointAt(0).toString(16).toUpperCase().padStart(4, "0");
    found.set(cp, (found.get(cp) || 0) + 1);
  }
  return [...found].map(([cp, n]) => `${cp} x${n}`);
}

// Zero-width watermark: runs of U+200B/U+200C read as bits (U+200D is a delimiter).
export function decodeZeroWidth(text) {
  const out = [];
  for (const m of text.matchAll(/[\u200B\u200C\u200D]{8,}/g)) {
    const bits = [...m[0]].filter((c) => c !== "\u200D").map((c) => (c === "\u200B" ? "0" : "1")).join("");
    let s = "";
    for (let i = 0; i + 8 <= bits.length; i += 8) s += String.fromCharCode(parseInt(bits.slice(i, i + 8), 2));
    if (/^[\x20-\x7e]+$/.test(s)) out.push(s);
  }
  return out.join("");
}

// Scan one file. `added` is the text to judge (the whole file when new, the added lines when changed);
// `before` is the old text, so a URL is flagged only when it is new.
export function scanText(file, added, before = "") {
  const flags = [];
  const lines = added.split("\n");
  const marks = hidden(added);
  if (marks.length) {
    const decoded = decodeZeroWidth(added);
    flags.push({ file, rule: "hidden-chars", why: `hidden characters ${marks.join(", ")}${decoded ? `; zero-width bits decode to "${decoded}"` : ""}` });
  }
  for (const rule of RULES) {
    lines.forEach((line, i) => {
      if (rule.re.test(line)) flags.push({ file, rule: rule.id, why: rule.why, line: i + 1, text: line.trim().slice(0, 160) });
    });
  }
  const old = new Set(before.match(URL) || []);
  const fresh = [...new Set(added.match(URL) || [])].filter((u) => !old.has(u));
  if (fresh.length) flags.push({ file, rule: "new-url", why: "new external address", text: fresh.slice(0, 8).join(" ") });
  return flags;
}

export function scanExecutable(file, mode, text) {
  const isExec = (mode & 0o111) !== 0 || /^#!/.test(text);
  return isExec ? [{ file, rule: "new-executable", why: "new or changed executable script" }] : [];
}
