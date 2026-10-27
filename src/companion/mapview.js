// A map on a phone (stage 4 of notes/worlds-plan.md): the picture, moved and
// zoomed with one thumb, and the pins on it. A drag moves it and keeps going a
// little when it's let go. A double tap zooms in where it's tapped, and back
// out to the whole map once it's in as close as it goes. A double tap held and
// slid down zooms in, slid up zooms out, the way a phone's own maps do, so it
// all works in one hand. Two fingers pinch it too, a mouse wheel zooms it, and
// with the map focused the arrow keys move it, + and - zoom and 0 shows it
// whole. It never zooms out past the whole map, and it springs back in from an
// edge. Under reduce-motion nothing glides: it goes straight there.
//
// The viewer's element lives on while the screen's drawn again around it
// (mapsui.js puts it back in its place), so where it's been moved to stays put.

const TAP_MOVE = 10; // how far a finger can wander and still be a tap
const DOUBLE_MS = 300;
const DOUBLE_GAP = 44;
const ZOOM_DRAG = 160; // a one-thumb zoom: this far down zooms in about 2.7 times
const still = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
// Past an edge it pulls harder the further it goes.
const band = (over, dim) => (1 - 1 / ((Math.abs(over) * 0.55) / dim + 1)) * dim * Math.sign(over);
const ease = (k) => 1 - Math.pow(1 - k, 3);

// w and h are the picture's size in pixels. drawPin(pin) gives a pin's
// element its class and insides. onTap() is a tap on the map itself, once
// it's clear it wasn't the first of a double tap. onRest() is the map coming
// to rest after it's been moved.
export function makeViewer({ w, h, label, how, drawPin, onTap, onRest }) {
  const el = document.createElement("div");
  el.className = "wm-stage";
  el.tabIndex = 0;
  el.setAttribute("role", "group");
  el.setAttribute("aria-roledescription", "map");
  el.setAttribute("aria-label", label);
  if (how) el.setAttribute("aria-describedby", how);
  el.innerHTML = '<div class="wm-layer" aria-hidden="true"><img class="wm-pic" alt="" draggable="false" decoding="async"></div><div class="wm-pins"></div><div class="wm-cross" aria-hidden="true" hidden><i></i></div>';
  const layer = el.firstElementChild;
  const img = layer.firstElementChild;
  const pinsEl = el.querySelector(".wm-pins");
  const cross = el.querySelector(".wm-cross");
  layer.style.width = `${w}px`;
  layer.style.height = `${h}px`;

  let W = 0;
  let H = 0;
  let s = 1;
  let x = 0;
  let y = 0;
  let placed = false;
  let anim = 0;
  let queued = 0;
  let pins = [];
  let tapTimer = 0;
  let dragged = false;
  // A spot to go to that was asked for before the map had a size.
  let pending = null;
  // How much of the bottom the bar covers, so the whole map shows above it.
  let pad = 0;

  // The height that isn't under the bar.
  const vis = () => Math.max(1, H - pad);
  const fitS = () => (W && H ? Math.min(W / w, vis() / h) : 1);
  const minS = () => fitS();
  // In as close as a pixel of the picture to a pixel of the screen, or four
  // times the whole map, whichever's closer.
  const maxS = () => Math.max(fitS() * 4, 1);
  const range = (sc, dim, size) => {
    const span = size * sc;
    return span <= dim ? [(dim - span) / 2, (dim - span) / 2] : [dim - span, 0];
  };
  const hard = (sc, tx, ty) => {
    const [lx, hx] = range(sc, W, w);
    const [ly, hy] = range(sc, vis(), h);
    return [clamp(tx, lx, hx), clamp(ty, ly, hy)];
  };
  const soft = (sc, tx, ty) => {
    const [lx, hx] = range(sc, W, w);
    const [ly, hy] = range(sc, vis(), h);
    const fx = tx > hx ? hx + band(tx - hx, W) : tx < lx ? lx + band(tx - lx, W) : tx;
    const fy = ty > hy ? hy + band(ty - hy, H) : ty < ly ? ly + band(ty - ly, H) : ty;
    return [fx, fy];
  };
  const softS = (sc) => {
    const hi = maxS();
    const lo = minS();
    return sc > hi ? hi * Math.pow(sc / hi, 0.3) : sc < lo ? lo * Math.pow(sc / lo, 0.3) : sc;
  };
  // Zoomed to sc with the picture's point under (ax, ay) staying there.
  const about = (sc, ax, ay, from = { s, x, y }) => [ax - ((ax - from.x) / from.s) * sc, ay - ((ay - from.y) / from.s) * sc];

  function paint() {
    queued = 0;
    layer.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${s})`;
    for (const p of pins) p.el.style.transform = `translate3d(${x + p.x * w * s}px, ${y + p.y * h * s}px, 0)`;
  }
  const draw = () => {
    queued ||= requestAnimationFrame(paint);
  };
  function stop() {
    if (anim) cancelAnimationFrame(anim);
    anim = 0;
  }
  // Labels that would sit on top of each other: the ones further down the
  // list keep their pin and lose their name till there's room.
  function declutter() {
    const kept = [];
    const order = [...pins].sort((a, b) => b.rank - a.rank || a.y - b.y);
    for (const p of order) {
      const n = p.el.querySelector(".wm-pin-n");
      if (!n) continue;
      p.el.classList.remove("is-quiet");
      const r = n.getBoundingClientRect();
      const box = { l: r.left - 4, r: r.right + 4, t: r.top - 2, b: r.bottom + 2 };
      const hit = kept.some((k) => box.l < k.r && box.r > k.l && box.t < k.b && box.b > k.t);
      if (hit && !p.always) p.el.classList.add("is-quiet");
      else kept.push(box);
    }
  }
  function rest() {
    el.classList.remove("is-moving");
    declutter();
    onRest?.();
  }

  // Gliding from where it is to (s1, x1, y1). The zoom turns about the one
  // point that stays put, so whatever's being zoomed into doesn't wander.
  function tweenTo(s1, x1, y1, ms = 280) {
    stop();
    if (still() || ms <= 0 || (Math.abs(s1 - s) < 1e-6 && Math.hypot(x1 - x, y1 - y) < 0.5)) {
      [s, x, y] = [s1, x1, y1];
      paint();
      return rest();
    }
    const [s0, x0, y0] = [s, x, y];
    const t0 = performance.now();
    const fixed = Math.abs(s1 - s0) > 1e-9 ? { ix: (x1 - x0) / (s0 - s1), iy: (y1 - y0) / (s0 - s1) } : null;
    const step = (t) => {
      const e = ease(Math.min(1, (t - t0) / ms));
      if (fixed) {
        const sk = s0 * Math.pow(s1 / s0, e);
        [s, x, y] = [sk, fixed.ix * s0 + x0 - fixed.ix * sk, fixed.iy * s0 + y0 - fixed.iy * sk];
      } else [s, x, y] = [s0, x0 + (x1 - x0) * e, y0 + (y1 - y0) * e];
      paint();
      if (e < 1) anim = requestAnimationFrame(step);
      else {
        anim = 0;
        rest();
      }
    };
    anim = requestAnimationFrame(step);
  }
  // Back inside its edges and zoom, about (ax, ay).
  function settle(ax = W / 2, ay = vis() / 2) {
    const s1 = clamp(s, minS(), maxS());
    const [tx, ty] = s1 === s ? [x, y] : about(s1, ax, ay);
    const [x1, y1] = hard(s1, tx, ty);
    tweenTo(s1, x1, y1, 240);
  }
  function glide(vx, vy) {
    const [lx, hx] = range(s, W, w);
    const [ly, hy] = range(s, vis(), h);
    if (still() || Math.hypot(vx, vy) < 0.12 || x > hx + 0.5 || x < lx - 0.5 || y > hy + 0.5 || y < ly - 0.5) return settle();
    let last = performance.now();
    const step = (t) => {
      const dt = Math.min(32, t - last);
      last = t;
      x += vx * dt;
      y += vy * dt;
      const k = Math.pow(0.995, dt);
      vx *= k;
      vy *= k;
      const [cx, cy] = hard(s, x, y);
      if (cx !== x) vx = 0;
      if (cy !== y) vy = 0;
      [x, y] = [cx, cy];
      paint();
      if (Math.hypot(vx, vy) > 0.02) anim = requestAnimationFrame(step);
      else {
        anim = 0;
        rest();
      }
    };
    anim = requestAnimationFrame(step);
  }

  function zoomTo(sc, ax = W / 2, ay = vis() / 2) {
    const s1 = clamp(sc, minS(), maxS());
    const [tx, ty] = about(s1, ax, ay);
    const [x1, y1] = hard(s1, tx, ty);
    tweenTo(s1, x1, y1);
  }
  function fit(ms = 280) {
    const s1 = fitS();
    const [x1, y1] = hard(s1, 0, 0);
    tweenTo(s1, x1, y1, ms);
  }
  // A double tap: in closer where it was tapped, or the whole map once it's
  // in as close as it goes.
  function doubleTap(ax, ay) {
    if (s >= maxS() * 0.98) return fit();
    zoomTo(s * 2.4, ax, ay);
  }

  // ------------------------------------------------------------ fingers, a mouse and keys

  const ptrs = new Map();
  let g = null;
  let lastTap = null;
  let box = null;
  const local = (e) => ({ x: e.clientX - box.left, y: e.clientY - box.top });

  el.addEventListener("pointerdown", (e) => {
    // Whatever's pressed now is a new tap, whatever the last one was.
    dragged = false;
    if (e.pointerType === "mouse" && e.button !== 0) return;
    if (e.target.closest(".wm-pin") && e.pointerType === "mouse") return;
    stop();
    box = el.getBoundingClientRect();
    // A first finger starts afresh, whatever an interrupted gesture left.
    if (e.isPrimary) ptrs.clear();
    ptrs.set(e.pointerId, local(e));
    if (ptrs.size === 1) {
      const p = ptrs.get(e.pointerId);
      const now = performance.now();
      const second = lastTap && now - lastTap.t < DOUBLE_MS && Math.hypot(p.x - lastTap.x, p.y - lastTap.y) < DOUBLE_GAP;
      if (second) clearTimeout(tapTimer);
      g = { kind: second ? "zoom" : "pan", id: e.pointerId, sx: p.x, sy: p.y, from: { s, x, y }, moved: false, trail: [{ ...p, t: now }], at: second ? { x: lastTap.x, y: lastTap.y } : null };
    } else if (ptrs.size === 2) {
      const [a, b] = [...ptrs.values()];
      clearTimeout(tapTimer);
      lastTap = null;
      g = { kind: "pinch", d0: Math.max(1, Math.hypot(a.x - b.x, a.y - b.y)), mid: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }, from: { s, x, y }, moved: true };
      el.classList.add("is-moving");
      for (const id of ptrs.keys()) el.setPointerCapture?.(id);
    }
  });

  el.addEventListener("pointermove", (e) => {
    if (!ptrs.has(e.pointerId) || !g) return;
    const p = local(e);
    ptrs.set(e.pointerId, p);
    if (g.kind === "pinch") {
      if (ptrs.size < 2) return;
      const [a, b] = [...ptrs.values()];
      const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
      const sc = softS(g.from.s * (Math.hypot(a.x - b.x, a.y - b.y) / g.d0));
      // The point that was under the fingers stays under them as they move.
      const ix = (g.mid.x - g.from.x) / g.from.s;
      const iy = (g.mid.y - g.from.y) / g.from.s;
      s = sc;
      [x, y] = soft(sc, mid.x - ix * sc, mid.y - iy * sc);
      g.last = mid;
      return draw();
    }
    if (e.pointerId !== g.id) return;
    const dx = p.x - g.sx;
    const dy = p.y - g.sy;
    if (!g.moved) {
      if (Math.hypot(dx, dy) < TAP_MOVE) return;
      g.moved = true;
      el.setPointerCapture?.(e.pointerId);
      el.classList.add("is-moving");
    }
    const now = performance.now();
    g.trail.push({ ...p, t: now });
    while (g.trail.length > 2 && now - g.trail[0].t > 100) g.trail.shift();
    if (g.kind === "zoom") {
      s = softS(g.from.s * Math.exp(dy / ZOOM_DRAG));
      [x, y] = soft(s, ...about(s, g.at.x, g.at.y, g.from));
    } else [x, y] = soft(s, g.from.x + dx, g.from.y + dy);
    draw();
  });

  function up(e, cancelled = false) {
    if (!ptrs.has(e.pointerId)) return;
    const p = ptrs.get(e.pointerId);
    ptrs.delete(e.pointerId);
    if (!g) return;
    if (g.kind === "pinch") {
      if (ptrs.size === 1) {
        // One finger still down carries on moving it, from where it is now.
        const [[id, q]] = [...ptrs.entries()];
        g = { kind: "pan", id, sx: q.x, sy: q.y, from: { s, x, y }, moved: true, trail: [{ ...q, t: performance.now() }] };
        return;
      }
      const at = g.last ?? g.mid;
      g = null;
      dragged = true;
      return settle(at.x, at.y);
    }
    if (e.pointerId !== g.id) return;
    const was = g;
    g = null;
    if (cancelled) return was.moved ? settle() : undefined;
    if (!was.moved) {
      if (was.kind === "zoom") {
        lastTap = null;
        // The second tap of a double tap on a pin doesn't open it again.
        dragged = true;
        return doubleTap(was.at.x, was.at.y);
      }
      lastTap = { t: performance.now(), x: p.x, y: p.y };
      // A pin's own tap goes straight through. A tap on the map waits to see
      // whether it's the first of two.
      if (!e.target.closest?.(".wm-pin")) {
        clearTimeout(tapTimer);
        tapTimer = setTimeout(() => onTap?.(), DOUBLE_MS);
      }
      return;
    }
    dragged = true;
    if (was.kind === "zoom") return settle(was.at.x, was.at.y);
    const t = was.trail;
    const a = t[0];
    const b = t[t.length - 1];
    const dt = Math.max(1, b.t - a.t);
    const v = (n) => clamp(n / dt, -4, 4);
    glide(performance.now() - b.t > 80 ? 0 : v(b.x - a.x), performance.now() - b.t > 80 ? 0 : v(b.y - a.y));
  }
  el.addEventListener("pointerup", (e) => up(e));
  el.addEventListener("pointercancel", (e) => up(e, true));
  // A drag that started on a pin doesn't open it.
  el.addEventListener("click", (e) => {
    if (!dragged) return;
    dragged = false;
    e.preventDefault();
    e.stopPropagation();
  }, true);
  // Safari's own pinch would zoom the whole page.
  el.addEventListener("gesturestart", (e) => e.preventDefault());
  el.addEventListener("contextmenu", (e) => {
    if (e.target === img || e.target === layer || e.target === el) e.preventDefault();
  });
  el.addEventListener("wheel", (e) => {
    e.preventDefault();
    stop();
    box = el.getBoundingClientRect();
    const p = local(e);
    const by = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY;
    const sc = clamp(s * Math.exp(-by * (e.ctrlKey ? 0.01 : 0.0018)), minS(), maxS());
    [x, y] = hard(sc, ...about(sc, p.x, p.y));
    s = sc;
    draw();
    clearTimeout(el._rest);
    el._rest = setTimeout(rest, 160);
  }, { passive: false });
  el.addEventListener("keydown", (e) => {
    if (e.target !== el || e.altKey || e.ctrlKey || e.metaKey) return;
    const step = { ArrowLeft: [1, 0], ArrowRight: [-1, 0], ArrowUp: [0, 1], ArrowDown: [0, -1] }[e.key];
    if (step) {
      e.preventDefault();
      const [x1, y1] = hard(s, x + step[0] * W * 0.2, y + step[1] * vis() * 0.2);
      return tweenTo(s, x1, y1, 180);
    }
    if (e.key === "+" || e.key === "=") return (e.preventDefault(), zoomTo(s * 1.6));
    if (e.key === "-" || e.key === "_") return (e.preventDefault(), zoomTo(s / 1.6));
    if (e.key === "0") return (e.preventDefault(), fit());
  });

  // A new size (the phone turned, the bars came or went): whatever was in the
  // middle stays in the middle, and the whole map's the furthest out it goes.
  const ro = new ResizeObserver(() => {
    const r = el.getBoundingClientRect();
    if (!r.width || !r.height) return;
    if (r.width === W && r.height === H) return;
    const mid = placed ? { ix: (W / 2 - x) / s, iy: (vis() / 2 - y) / s } : null;
    [W, H] = [r.width, r.height];
    if (!placed) {
      placed = true;
      s = fitS();
      [x, y] = hard(s, 0, 0);
      if (pending) {
        const [fx, fy, closer] = pending;
        pending = null;
        s = closer ? clamp(fitS() * 2.4, minS(), maxS()) : s;
        [x, y] = hard(s, W / 2 - fx * w * s, vis() / 2 - fy * h * s);
      }
    } else {
      s = clamp(s, minS(), maxS());
      [x, y] = hard(s, W / 2 - mid.ix * s, vis() / 2 - mid.iy * s);
    }
    paint();
    declutter();
  });
  ro.observe(el);

  return {
    el,
    // The picture, by its address (an object URL from the phone's copy).
    show(src) {
      if (!src) img.removeAttribute("src");
      else if (img.getAttribute("src") !== src) img.src = src;
      el.classList.toggle("is-empty", !src);
    },
    // The pins: [{ id, x, y, rank, always }], drawn by drawPin(pin) into a
    // button each. A pin keeps its button from one drawing to the next, so
    // one that's got focus keeps it.
    pins(list) {
      const had = new Map(pins.map((p) => [p.id, p.el]));
      const sorted = [...list].sort((a, b) => a.y - b.y || a.x - b.x);
      pins = sorted.map((p) => {
        const b = had.get(p.id) ?? document.createElement("button");
        had.delete(p.id);
        b.type = "button";
        const d = drawPin(p);
        if (b.className !== d.cls) b.className = d.cls;
        if (b.innerHTML !== d.html) b.innerHTML = d.html;
        for (const [k, v] of Object.entries(d.attrs)) if (b.getAttribute(k) !== v) b.setAttribute(k, v);
        return { ...p, el: b };
      });
      for (const old of had.values()) old.remove();
      // Pins in the order they're read: top to bottom, then left to right.
      pins.forEach((p, i) => {
        if (pinsEl.children[i] !== p.el) pinsEl.insertBefore(p.el, pinsEl.children[i] ?? null);
      });
      paint();
      requestAnimationFrame(declutter);
    },
    // Dropping a pin: a cross in the middle, and the map's moved under it.
    placing(on) {
      cross.hidden = !on;
      el.classList.toggle("is-placing", on);
    },
    // The bar along the bottom covers this much of the map.
    pad(px) {
      const next = Math.max(0, Math.round(px));
      if (next === pad) return;
      const iy = (vis() / 2 - y) / s;
      pad = next;
      el.style.setProperty("--wm-pad", `${pad}px`);
      if (!placed) return;
      const wasWhole = s <= fitS() * 1.01;
      s = wasWhole ? fitS() : clamp(s, minS(), maxS());
      [x, y] = hard(s, x, vis() / 2 - iy * s);
      paint();
    },
    // Where the middle of what's showing is on the picture, from 0 to 1.
    middle() {
      return { x: clamp((W / 2 - x) / (w * s), 0, 1), y: clamp((vis() / 2 - y) / (h * s), 0, 1) };
    },
    // Glide to a spot on the picture (0 to 1 each way), in a little closer
    // if it's showing the whole map.
    centreOn(fx, fy, closer = true) {
      if (!placed) {
        pending = [fx, fy, closer];
        return;
      }
      const s1 = closer ? clamp(Math.max(s, fitS() * 2.4), minS(), maxS()) : s;
      const [x1, y1] = hard(s1, W / 2 - fx * w * s1, vis() / 2 - fy * h * s1);
      tweenTo(s1, x1, y1, 320);
    },
    zoomIn: () => zoomTo(s * 1.8),
    zoomOut: () => zoomTo(s / 1.8),
    fit: () => fit(),
    whole: () => s <= fitS() * 1.01,
    closest: () => s >= maxS() * 0.99,
    destroy() {
      stop();
      clearTimeout(tapTimer);
      ro.disconnect();
      el.remove();
    },
  };
}
