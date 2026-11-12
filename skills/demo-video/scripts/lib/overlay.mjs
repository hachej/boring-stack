// The injected overlay: pointer, touch dot, burned-in caption, title and end cards, optional device frame, and the mask CSS.
// It lives in the top document only (pointer-events none, above everything); child frames only get the mask CSS.
import { maskCss } from './safety.mjs';

export const overlayScript = ({ mask, phone, deviceFrame, ui = true }) => `(() => {
  const MASK = ${JSON.stringify(maskCss(mask))};
  const addMask = () => { const host = document.head || document.documentElement; if (!host || document.getElementById('__dv-mask')) return; const s = document.createElement('style'); s.id = '__dv-mask'; s.textContent = MASK; host.appendChild(s); };
  addMask(); new MutationObserver(addMask).observe(document, { childList: true, subtree: true });
  if (window.top !== window || !${JSON.stringify(!!ui)}) return;
  const PHONE = ${JSON.stringify(!!phone)}, FRAME = ${JSON.stringify(!!deviceFrame)};
  const css = \`
  #__dv { position: fixed; inset: 0; pointer-events: none; z-index: 2147483647; font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif; }
  #__dv * { box-sizing: border-box; }
  #__dv .cur { position: absolute; left: 0; top: 0; width: 28px; height: 28px; opacity: 0; transition: transform 280ms cubic-bezier(.25,.8,.3,1), opacity 160ms; filter: drop-shadow(0 2px 3px rgba(0,0,0,.45)); }
  #__dv .dot { position: absolute; left: 0; top: 0; width: 44px; height: 44px; margin: -22px 0 0 -22px; border-radius: 50%; background: rgba(255,255,255,.55); border: 3px solid rgba(20,20,20,.65); opacity: 0; transition: opacity 120ms, transform 90ms; }
  #__dv .dot.on { opacity: 1; transform: scale(.82); }
  #__dv .rip { position: absolute; width: 20px; height: 20px; margin: -10px 0 0 -10px; border-radius: 50%; border: 3px solid #fff; box-shadow: 0 0 0 2px rgba(0,0,0,.5); opacity: 0; }
  #__dv .rip.go { animation: __dvrip 520ms ease-out; }
  @keyframes __dvrip { from { opacity: .95; transform: scale(.6); } to { opacity: 0; transform: scale(3.2); } }
  #__dv .cap { position: absolute; left: 12px; right: 12px; bottom: \${PHONE ? 30 : 36}px; max-width: 980px; margin: 0 auto; padding: \${PHONE ? '10px 14px' : '12px 20px'}; border-radius: 12px; background: rgba(12,12,14,.86); color: #fff; font-weight: 600; font-size: \${PHONE ? 17 : 24}px; line-height: 1.25; text-align: center; opacity: 0; transition: opacity 140ms; text-wrap: balance; box-shadow: 0 4px 18px rgba(0,0,0,.35); }
  #__dv .cap.on { opacity: 1; }
  #__dv .cap.top { bottom: auto; top: \${PHONE ? 22 : 26}px; }
  #__dv .cap.ko { background: rgba(176,16,16,.94); }
  #__dv .cap::before, #__dv .card > div::before { content: attr(data-t); }
  #__dv .redframe { position: absolute; inset: 0; box-shadow: inset 0 0 0 6px #e11d1d; opacity: 0; transition: opacity 120ms; }
  #__dv .redframe.on { opacity: 1; }
  #__dv .card { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 14px; padding: 8%; text-align: center; color: #fff; background: linear-gradient(160deg, #101827, #1f2a44); opacity: 0; transition: opacity 220ms; }
  #__dv .card.on { opacity: 1; }
  #__dv .card.ok { background: linear-gradient(160deg, #0b3d26, #14633d); }
  #__dv .card.ko { background: linear-gradient(160deg, #4a0d0d, #861b1b); }
  #__dv .card .t { font-weight: 750; font-size: \${PHONE ? 30 : 52}px; line-height: 1.15; text-wrap: balance; }
  #__dv .card .s { font-size: \${PHONE ? 17 : 24}px; opacity: .85; line-height: 1.3; }
  #__dv .card .d { font-size: \${PHONE ? 14 : 18}px; opacity: .6; }
  #__dv .bezel { position: absolute; inset: 0; border-radius: 46px; box-shadow: 0 0 0 200vmax #0b0b0c, inset 0 0 0 12px #0b0b0c; }
  #__dv .notch { position: absolute; top: 10px; left: 50%; width: 110px; height: 26px; margin-left: -55px; border-radius: 14px; background: #0b0b0c; }
  \`;
  const root = document.createElement('div'); root.id = '__dv';
  const el = (cls, parent = root) => { const e = document.createElement('div'); e.className = cls; parent.appendChild(e); return e; };
  const style = document.createElement('style'); style.textContent = css; root.appendChild(style);
  const red = el('redframe'), cur = el('cur'), dot = el('dot'), rip = el('rip'), cap = el('cap'), card = el('card');
  cur.innerHTML = '<svg viewBox="0 0 24 24" width="28" height="28"><path d="M3 2l7.5 19 2.6-7.9L21 10.5z" fill="#fff" stroke="#111" stroke-width="1.6" stroke-linejoin="round"/></svg>';
  for (const c of ['t', 's', 'd']) el(c, card);
  if (FRAME) { el('bezel'); if (PHONE) el('notch'); }
  const mount = () => { if (!root.isConnected && document.documentElement) document.documentElement.appendChild(root); };
  mount(); new MutationObserver(mount).observe(document, { childList: true });
  document.addEventListener('DOMContentLoaded', mount);
  let curOn = false;
  const move = (x, y) => { cur.style.transform = 'translate(' + (x - 4) + 'px,' + (y - 3) + 'px)'; cur.style.opacity = 1; curOn = true; };
  // The caption stays at the bottom unless the field being typed in is there: then it moves to the top, so the typing stays visible.
  const place = () => { const a = document.activeElement, typing = a && a !== document.body && a.matches && a.matches('input,textarea,[contenteditable=""],[contenteditable=true]'); let top = false;
    if (typing) { const r = a.getBoundingClientRect(); top = r.bottom > innerHeight - (cap.offsetHeight || 70) - 60 && r.top < innerHeight; } cap.classList.toggle('top', top); };
  window.__dv = {
    avoid: place,
    caption(text, kind) { if (!text) { cap.classList.remove('on'); red.classList.remove('on'); return; } cap.dataset.t = text; cap.className = 'cap on' + (kind === 'ko' ? ' ko' : ''); place(); red.classList.toggle('on', kind === 'ko'); },
    hideCaption(hide) { cap.style.visibility = hide ? 'hidden' : ''; red.style.visibility = hide ? 'hidden' : ''; },
    move, hideCursor() { cur.style.opacity = 0; },
    tap(x, y) { dot.style.transition = 'none'; dot.style.left = x + 'px'; dot.style.top = y + 'px'; dot.style.transition = ''; dot.classList.add('on'); rip.style.left = x + 'px'; rip.style.top = y + 'px'; rip.classList.remove('go'); void rip.offsetWidth; rip.classList.add('go'); setTimeout(() => dot.classList.remove('on'), 260); },
    click(x, y) { rip.style.left = x + 'px'; rip.style.top = y + 'px'; rip.classList.remove('go'); void rip.offsetWidth; rip.classList.add('go'); },
    touch(x, y, down) { dot.style.transition = 'none'; dot.style.left = x + 'px'; dot.style.top = y + 'px'; dot.classList.toggle('on', !!down); },
    card(c, instant) { if (!c) { card.classList.remove('on'); return; } card.style.transition = instant ? 'none' : ''; card.className = 'card on ' + (c.tone || ''); card.querySelector('.t').dataset.t = c.title || ''; card.querySelector('.s').dataset.t = c.sub || ''; card.querySelector('.d').dataset.t = c.date || ''; },
  };
})()`;
