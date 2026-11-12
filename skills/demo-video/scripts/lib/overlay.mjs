// The only thing injected into the page: the pointer, the touch dot and the tap ripple (fixed, pointer-events none, no effect on layout),
// and the mask CSS (a blur: also no effect on layout). Captions, cards and the step counter are composed around the video (compose.mjs).
// It lives in the top document only; child frames only get the mask CSS.
import { maskCss } from './safety.mjs';

export const overlayScript = ({ mask, ui = true }) => `(() => {
  const MASK = ${JSON.stringify(maskCss(mask))};
  const addMask = () => { const host = document.head || document.documentElement; if (!host || document.getElementById('__dv-mask')) return; const s = document.createElement('style'); s.id = '__dv-mask'; s.textContent = MASK; host.appendChild(s); };
  addMask(); new MutationObserver(addMask).observe(document, { childList: true, subtree: true });
  if (window.top !== window || !${JSON.stringify(!!ui)}) return;
  const css = \`
  #__dv { position: fixed; left: 0; top: 0; width: 0; height: 0; overflow: visible; pointer-events: none; z-index: 2147483647; contain: layout style; }
  #__dv .cur { position: fixed; left: 0; top: 0; width: 28px; height: 28px; opacity: 0; transition: transform 280ms cubic-bezier(.25,.8,.3,1), opacity 160ms; filter: drop-shadow(0 2px 3px rgba(0,0,0,.45)); }
  #__dv .dot { position: fixed; left: 0; top: 0; width: 44px; height: 44px; margin: -22px 0 0 -22px; border-radius: 50%; background: rgba(255,255,255,.55); border: 3px solid rgba(20,20,20,.65); box-sizing: border-box; opacity: 0; transition: opacity 120ms, transform 90ms; }
  #__dv .dot.on { opacity: 1; transform: scale(.82); }
  #__dv .rip { position: fixed; width: 20px; height: 20px; margin: -10px 0 0 -10px; border-radius: 50%; border: 3px solid #fff; box-sizing: border-box; box-shadow: 0 0 0 2px rgba(0,0,0,.5); opacity: 0; }
  #__dv .rip.go { animation: __dvrip 520ms ease-out; }
  @keyframes __dvrip { from { opacity: .95; transform: scale(.6); } to { opacity: 0; transform: scale(3.2); } }
  \`;
  const root = document.createElement('div'); root.id = '__dv';
  const el = (cls) => { const e = document.createElement('div'); e.className = cls; root.appendChild(e); return e; };
  const style = document.createElement('style'); style.textContent = css; root.appendChild(style);
  const cur = el('cur'), dot = el('dot'), rip = el('rip');
  cur.innerHTML = '<svg viewBox="0 0 24 24" width="28" height="28"><path d="M3 2l7.5 19 2.6-7.9L21 10.5z" fill="#fff" stroke="#111" stroke-width="1.6" stroke-linejoin="round"/></svg>';
  const mount = () => { if (!root.isConnected && document.documentElement) document.documentElement.appendChild(root); };
  mount(); new MutationObserver(mount).observe(document, { childList: true });
  document.addEventListener('DOMContentLoaded', mount);
  const move = (x, y) => { cur.style.transform = 'translate(' + (x - 4) + 'px,' + (y - 3) + 'px)'; cur.style.opacity = 1; };
  window.__dv = {
    move, hideCursor() { cur.style.opacity = 0; },
    tap(x, y) { dot.style.transition = 'none'; dot.style.left = x + 'px'; dot.style.top = y + 'px'; dot.style.transition = ''; dot.classList.add('on'); rip.style.left = x + 'px'; rip.style.top = y + 'px'; rip.classList.remove('go'); void rip.offsetWidth; rip.classList.add('go'); setTimeout(() => dot.classList.remove('on'), 260); },
    click(x, y) { rip.style.left = x + 'px'; rip.style.top = y + 'px'; rip.classList.remove('go'); void rip.offsetWidth; rip.classList.add('go'); },
    touch(x, y, down) { dot.style.transition = 'none'; dot.style.left = x + 'px'; dot.style.top = y + 'px'; dot.classList.toggle('on', !!down); },
  };
})()`;
