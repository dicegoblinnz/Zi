// How the companion feels in the hand: the Sigil dice tumbling and landing,
// and the sound and buzz. Sound and buzz stay off until the player turns them
// on (remembered as zi-sound), and then dice landing, a top face, a Hurt and
// a Hurt that takes the wound die to d12 each get one. Every sound is made on
// the phone, so it works offline and nothing's fetched. The phone's
// reduce-motion setting stills the tumble, and the CSS stills everything else.

const KEY = "zi-sound";
export const calm = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

let on = false;
try {
  on = localStorage.getItem(KEY) === "on";
} catch {}
export const soundOn = () => on;
export function setSound(next) {
  on = Boolean(next);
  try {
    localStorage.setItem(KEY, on ? "on" : "off");
  } catch {}
}

let ctx = null;
function audio() {
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  try {
    if (ctx?.state === "closed") ctx = null;
    ctx ??= new AC();
    if (ctx.state !== "running") ctx.resume().catch(() => {});
  } catch {
    return null;
  }
  return ctx;
}
// Phones only let sound start from a tap, and can pause it when the app's
// switched away, so any tap with sound on wakes it again.
addEventListener("pointerdown", () => {
  if (on && ctx?.state !== "running") audio();
}, { passive: true });

// A note that dies away, and can fall in pitch as it goes.
function tone(freq, dur, { vol = 0.2, to = freq, type = "sine", at = 0 } = {}) {
  const a = audio();
  if (!a) return;
  const t = a.currentTime + at;
  const osc = a.createOscillator();
  const amp = a.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  if (to !== freq) osc.frequency.exponentialRampToValueAtTime(to, t + dur);
  amp.gain.setValueAtTime(0.0001, t);
  amp.gain.exponentialRampToValueAtTime(vol, t + 0.008);
  amp.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(amp).connect(a.destination);
  osc.start(t);
  osc.stop(t + dur + 0.03);
}

// A short knock of noise, for a die hitting the table.
function knock(vol = 0.3) {
  const a = audio();
  if (!a) return;
  const len = Math.floor(a.sampleRate * 0.07);
  const buf = a.createBuffer(1, len, a.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len) ** 3;
  const src = a.createBufferSource();
  src.buffer = buf;
  const low = a.createBiquadFilter();
  low.type = "lowpass";
  low.frequency.value = 900;
  const amp = a.createGain();
  amp.gain.value = vol;
  src.connect(low).connect(amp).connect(a.destination);
  src.start();
}

const buzz = (pattern) => {
  try {
    navigator.vibrate?.(pattern);
  } catch {}
};

export const feel = {
  // Turning sound on answers with a knock, so the player knows it's working.
  hello() {
    if (!on) return;
    knock(0.3);
    buzz(15);
  },
  land() {
    if (!on) return;
    knock(0.35);
    tone(150, 0.13, { vol: 0.22, to: 70 });
    buzz(12);
  },
  // A top face: a chime, and a buzz as the Aura comes back.
  top() {
    if (!on) return;
    tone(1318.5, 0.9, { vol: 0.12 });
    tone(1975.5, 0.75, { vol: 0.07, at: 0.07 });
    buzz([20, 50, 20]);
  },
  hurt() {
    if (!on) return;
    tone(115, 0.3, { vol: 0.35, to: 55, type: "triangle" });
    buzz(60);
  },
  // A Hurt that puts the wound die on d12, or makes you Blaze.
  heavy() {
    if (!on) return;
    tone(98, 0.45, { vol: 0.4, to: 41, type: "triangle" });
    tone(65, 0.5, { vol: 0.3, to: 33, at: 0.12 });
    buzz([70, 60, 120]);
  },
};

// The Sigil dice: every [data-spin] in where shows random faces while it
// tumbles, then lands on the number it was drawn with, one die after another,
// each with a knock. done() runs once the last one's settled. The returned
// function stops it early (a tap skips the tumble). where is the element the
// dice are in, or a function that finds it, for a page that might be drawn
// again mid-tumble.
export function tumble(where, done) {
  const scope = () => (typeof where === "function" ? where() : where) ?? document.createDocumentFragment();
  const dice = [...scope().querySelectorAll("[data-spin]")];
  const gap = dice.length > 1 ? Math.min(160, 480 / (dice.length - 1)) : 0;
  dice.forEach((el, i) => {
    el.dataset.to = el.textContent;
    el.dataset.at = String(Math.round(600 + i * gap));
    el.style.animationDelay = `${-Math.round(Math.random() * 400)}ms`;
  });
  const end = 600 + gap * Math.max(0, dice.length - 1) + 340;
  const started = performance.now();
  let timer = 0;
  let stopped = false;
  const tick = () => {
    if (stopped) return;
    const t = performance.now() - started;
    for (const el of scope().querySelectorAll("[data-spin]:not(.is-landed)")) {
      // A die drawn again mid-tumble already shows its number, so it lands now.
      if (!el.dataset.to) Object.assign(el.dataset, { to: el.textContent, at: "0" });
      if (t >= Number(el.dataset.at)) {
        el.textContent = el.dataset.to;
        el.style.animationDelay = "";
        el.classList.add("is-landed");
        feel.land();
      } else el.textContent = String(1 + Math.floor(Math.random() * Number(el.dataset.spin)));
    }
    if (t >= end) {
      stopped = true;
      done();
      return;
    }
    timer = setTimeout(tick, 50);
  };
  tick();
  return () => {
    stopped = true;
    clearTimeout(timer);
  };
}
