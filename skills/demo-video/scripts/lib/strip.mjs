// The contact strip: one frame per step with its caption under it, rendered by the browser we already have.
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export async function renderStrip(browser, shots, { phone, title, verdictLine, ok }) {
  const cell = phone ? 230 : 640, cols = phone ? Math.min(6, shots.length) : Math.min(2, shots.length);
  const cells = shots.map((s) => `<figure class="${s.ok ? 'ok' : 'ko'}"><div class="img"><img src="data:image/png;base64,${s.png.toString('base64')}"><b>${s.n}</b></div><figcaption>${esc(s.caption)}<small>${s.ok ? '' : esc(s.reason) + ' · '}${(s.ms / 1000).toFixed(1)}s</small></figcaption></figure>`).join('');
  const html = `<!doctype html><meta charset=utf-8><style>
  body{margin:0;padding:14px;background:#16181d;color:#eee;font:14px system-ui,sans-serif;width:${cols * (cell + 12) + 16}px}
  h1{font-size:15px;margin:0 0 4px}.v{margin:0 0 12px;font-weight:700;color:${ok ? '#5fd38d' : '#ff6b6b'}}
  .g{display:grid;grid-template-columns:repeat(${cols},${cell}px);gap:12px}figure{margin:0}.img{position:relative;border:3px solid #3a3f4a;border-radius:8px;overflow:hidden}
  figure.ko .img{border-color:#e11d1d}img{width:100%;display:block}.img b{position:absolute;left:6px;top:6px;background:#000c;color:#fff;border-radius:10px;padding:1px 8px}
  figure.ko .img b{background:#e11d1d}figcaption{padding:6px 2px;line-height:1.3}small{display:block;opacity:.65;margin-top:2px}figure.ko figcaption{color:#ff9a9a}
  </style><h1>${esc(title)}</h1><p class="v">${esc(verdictLine)}</p><div class="g">${cells}</div>`;
  const page = await browser.newPage({ viewport: { width: cols * (cell + 12) + 16, height: 400 } });
  await page.setContent(html);
  const png = await page.screenshot({ fullPage: true, type: 'png' });
  await page.close();
  return png;
}
