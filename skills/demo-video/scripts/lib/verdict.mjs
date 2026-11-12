// The verdict: pass when every step did what it set out to do. A failure is never edited out.
const WORDS = {
  fr: { ok: 'Fonctionne', ko: (n) => `Ne fonctionne pas : étape ${n}`, steps: 'étapes', errors: 'erreurs console' },
  en: { ok: 'Works', ko: (n) => `Does not work: step ${n}`, steps: 'steps', errors: 'console errors' },
};

/** steps: [{ n, caption, ok, reason, consoleErrors: [] }] */
export function verdictOf(steps, { lang = 'en', durationMs = 0, strictConsole = false } = {}) {
  const w = WORDS[lang] ?? WORDS.en;
  const failed = steps.find((s) => !s.ok || (strictConsole && s.consoleErrors?.length));
  const errors = steps.reduce((n, s) => n + (s.consoleErrors?.length ?? 0), 0);
  const seconds = (durationMs / 1000).toFixed(1);
  const ok = !failed;
  const detail = failed ? (failed.reason ?? (failed.consoleErrors?.length ? 'console error' : 'failed')) : null;
  const line = ok
    ? `PASS ${steps.length}/${steps.length} steps, ${seconds}s, ${errors} console error${errors === 1 ? '' : 's'}`
    : `FAIL step ${failed.n}/${steps.length} "${(failed.caption ?? '').slice(0, 60)}": ${detail} (${steps.filter((s) => s.ok).length}/${steps.length} ok, ${seconds}s)`;
  return {
    ok, failedStep: failed?.n ?? null, line,
    card: { text: ok ? w.ok : w.ko(failed.n), sub: ok ? `${steps.length} ${w.steps}${errors ? `, ${errors} ${w.errors}` : ''}` : (failed.caption ?? ''), tone: ok ? 'ok' : 'ko' },
  };
}
