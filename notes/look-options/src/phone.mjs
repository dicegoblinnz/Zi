// The home-screen options and the play screen, at phone size (390 × 844).
// node phone.mjs OUTDIR → home-1.html, home-2.html, home-3.html, play.html
import fs from "node:fs";
import { FONTS } from "./lib.mjs";
import { die, crest, sigil, aura } from "../../../src/kit/kit.js";

const OUT = process.argv[2] || "out";
const KIT = fs.readFileSync(new URL("../../../src/styles/kit.css", import.meta.url), "utf8");
const SIL = "M14 130 C15 116 18 104 26 96 C20 86 19 70 24 58 C29 42 40 31 53 29 C64 27.5 72 32 75 39 C76.5 42 75 44 72.5 44.2 C72.8 47 73.2 49.5 74 51 C74.8 52.6 76.8 55.3 77.6 57.2 C77.9 58.5 75.8 58.9 74.6 59.2 C75.4 60.2 75.3 61 74.9 61.7 C75.6 62.4 75.4 63.3 74.6 63.9 C74.6 65.8 74.1 67.6 72.4 68.6 C70.2 69.7 67.6 69.6 65.4 69 C67 72.6 70.2 74.6 73.6 77.4 C79.6 83 84.6 93 88 105 C89.6 112 90.8 121 91.4 130 Z";
const FACE = "M72.5 44.2 C72.8 47 73.2 49.5 74 51 C74.8 52.6 76.8 55.3 77.6 57.2 C77.9 58.5 75.8 58.9 74.6 59.2 C75.4 60.2 75.3 61 74.9 61.7 C75.6 62.4 75.4 63.3 74.6 63.9 C74.6 65.8 74.1 67.6 72.4 68.6 C70.2 69.7 67.6 69.6 65.4 69 C63.6 63 63.4 55 65 49.6 C66.2 45.8 69 44.2 72.5 44.2 Z";
const RIM = "M72.6 44.6 C72.9 47.2 73.3 49.6 74.1 51.1 C74.9 52.7 76.9 55.4 77.6 57.2 M74.9 61.7 C75.6 62.4 75.4 63.3 74.6 63.9 C74.6 65.8 74.1 67.6 72.4 68.6";
const ROOFS = "M0 130 L0 108 L7 108 L7 100 L12 95 L17 100 L17 106 L24 106 L24 98 L27 98 L27 93 L30 93 L30 98 L36 98 L36 104 L43 104 L48 99 L53 104 L53 101 L58 101 L58 112 L64 112 L64 104 L67 100 L70 104 L70 98 L76 98 L76 92 L79 88 L82 92 L82 103 L90 103 L90 97 L95 97 L95 102 L100 102 L100 130 Z";
let picN = 0;
// Vesk's picture in colour, as a player's photo would sit: x,y,w of the art box and a viewBox crop.
function pic(vb = "6 14 88 116") {
  const id = `g${picN++}`;
  return `<svg class="pic" viewBox="${vb}" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs>
  <linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a1d4a"/><stop offset="0.6" stop-color="#5a3b6e"/><stop offset="1" stop-color="#b7787a"/></linearGradient></defs>
  <rect x="0" y="0" width="100" height="130" fill="url(#${id})"/>
  ${[[12, 14], [24, 9], [88, 12], [93, 30], [8, 40], [34, 20], [90, 52]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="0.6" fill="#fff" opacity="0.8"/>`).join("")}
  <circle cx="62" cy="40" r="25" fill="#f4e2b0"/><circle cx="62" cy="40" r="29" fill="#f4e2b0" opacity="0.14"/>
  <circle cx="70" cy="33" r="3.2" fill="#e7cf95" opacity="0.8"/><circle cx="55" cy="47" r="2.2" fill="#e7cf95" opacity="0.7"/>
  <path d="${ROOFS}" fill="#24183a"/>
  <rect x="21" y="109" width="1.8" height="2.4" fill="#f2c96b"/><rect x="32" y="101" width="1.6" height="2.2" fill="#f2c96b"/><rect x="73" y="101" width="1.6" height="2.2" fill="#f2c96b"/><rect x="85" y="107" width="1.8" height="2.4" fill="#f2c96b"/>
  <path d="${SIL}" fill="#120c1c"/><path d="${FACE}" fill="#3b2a3c"/>
  <path d="M70.6 52.6 C71.4 52 72.4 52 73 52.6 C72.3 53.1 71.4 53.2 70.6 52.6Z" fill="#120c1c"/>
  <path d="${RIM}" fill="none" stroke="#f6d995" stroke-width="0.6" stroke-linecap="round"/>
  <path d="M53 29.4 C64 28 72 32.4 75 39" fill="none" stroke="#f6d995" stroke-width="0.7" stroke-linecap="round" opacity="0.85"/>
  </svg>`;
}
const ICON = {
  search: `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5L21 21"/></svg>`,
  moon: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z"/></svg>`,
  dice: `<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="4" width="16" height="16" rx="3"/><circle cx="9" cy="9" r="1.3" class="f"/><circle cx="15" cy="15" r="1.3" class="f"/><circle cx="15" cy="9" r="1.3" class="f"/><circle cx="9" cy="15" r="1.3" class="f"/></svg>`,
  sheet: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3h9l4 4v14H6Z"/><path d="M15 3v4h4M9 11h7M9 15h7"/></svg>`,
  crew: `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="8" cy="9" r="3"/><circle cx="16" cy="9" r="3"/><path d="M3 20c.5-4 3-6 5-6s4.5 2 5 6M11 20c.5-4 3-6 5-6s4.5 2 5 6"/></svg>`,
  arrow: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg>`,
  book: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5c3-1 6-1 8 1 2-2 5-2 8-1v14c-3-1-6-1-8 1-2-2-5-2-8-1Z"/><path d="M12 6v14"/></svg>`,
  cards: `<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="7" y="3" width="12" height="16" rx="2"/><path d="M5 6v13a2 2 0 0 0 2 2h9"/></svg>`,
  plus: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>`,
};

const CSS = `${FONTS}
${KIT}
:root{--bg:#120d18;--pattern:rgba(217,180,90,.055);--surface:#1a1422;--panel:#231b2e;--line:rgba(217,180,90,.28);--line-soft:rgba(217,180,90,.15);--ink:#f0e9f6;--muted:#b9adc8;--gold:#d9b45a;--gold-ink:#e5c677;--on-gold:#1a1208;--violet:#b596f5;--bracket:#d9b45a;--display:"Cinzel",Georgia,serif;--body:"Alegreya Sans",system-ui,sans-serif;--chamfer:polygon(12px 0,calc(100% - 12px) 0,100% 50%,calc(100% - 12px) 100%,12px 100%,0 50%)}
*{box-sizing:border-box}
html,body{margin:0;background:#cfc7bb;font-family:var(--body)}
.board{display:inline-flex;gap:34px;padding:26px 30px 30px;background:#d8d0c3;align-items:flex-start}
.col{display:flex;flex-direction:column;gap:12px;align-items:center}
.cap{font-family:var(--display);font-weight:700;font-size:15px;letter-spacing:.06em;color:#2b2117;text-transform:uppercase}
.cap small{display:block;font-family:var(--body);font-weight:500;font-size:13px;letter-spacing:0;text-transform:none;color:#5b4f42;text-align:center;margin-top:2px}
.phone{width:410px;height:864px;border-radius:52px;background:#0a0710;padding:10px;box-shadow:0 18px 40px rgba(40,25,10,.35),inset 0 0 0 2px #2c2236}
.screen{width:390px;height:844px;border-radius:42px;overflow:hidden;position:relative;color:var(--ink);background-color:var(--bg);background-image:repeating-linear-gradient(45deg,var(--pattern) 0 1px,transparent 1px 28px),repeating-linear-gradient(-45deg,var(--pattern) 0 1px,transparent 1px 28px)}
.status{height:46px;display:flex;align-items:center;justify-content:space-between;padding:6px 28px 0 34px;font:600 15px var(--body);color:var(--ink)}
.status i{display:inline-block;width:24px;height:11px;border:1.5px solid var(--ink);border-radius:3px;position:relative;opacity:.9}
.status i:after{content:"";position:absolute;inset:1.5px;right:5px;background:var(--ink);border-radius:1px}
.top{padding:0 14px;border-bottom:1px solid var(--line-soft);background:rgba(18,13,24,.92)}
.row1{display:flex;align-items:center;justify-content:space-between;height:50px}
.brand{display:flex;align-items:center;gap:10px;font-family:var(--display);font-weight:700;font-size:21px;letter-spacing:.04em;color:var(--ink);text-decoration:none}
.mark{width:18px;height:18px;transform:rotate(45deg);border:2px solid var(--violet);display:grid;place-items:center}
.mark:after{content:"";width:7px;height:7px;background:var(--gold)}
.acts{display:flex;align-items:center;gap:4px}
.ib{width:44px;height:44px;display:grid;place-items:center;border:0;background:none;color:var(--ink);border-radius:12px}
.ib svg{width:22px;height:22px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round}
.av{width:34px;height:34px;border-radius:50%;overflow:hidden;border:1.5px solid var(--gold);margin-left:4px;display:grid;place-items:center;font:700 15px var(--body);color:var(--gold)}
.av .pic{width:100%;height:100%;display:block}
.signin{font:600 15px var(--body);color:var(--violet);padding:0 6px 0 8px;height:44px;display:flex;align-items:center}
.tabs{display:flex;justify-content:space-between;height:44px;margin:0 -6px}
.tabs a{display:flex;align-items:center;justify-content:center;font:500 15.5px var(--body);color:var(--muted);text-decoration:none;padding:0 10px;position:relative}
.tabs a.on{color:var(--ink)}
.tabs a.on:after{content:"";position:absolute;left:14px;right:14px;bottom:0;height:2.5px;background:var(--gold);border-radius:2px}
.body{padding:16px 16px 40px}
.card{position:relative;border:1px solid var(--line);background:
  linear-gradient(var(--bracket),var(--bracket)) left top/14px 1.5px no-repeat,linear-gradient(var(--bracket),var(--bracket)) left top/1.5px 14px no-repeat,
  linear-gradient(var(--bracket),var(--bracket)) right top/14px 1.5px no-repeat,linear-gradient(var(--bracket),var(--bracket)) right top/1.5px 14px no-repeat,
  linear-gradient(var(--bracket),var(--bracket)) left bottom/14px 1.5px no-repeat,linear-gradient(var(--bracket),var(--bracket)) left bottom/1.5px 14px no-repeat,
  linear-gradient(var(--bracket),var(--bracket)) right bottom/14px 1.5px no-repeat,linear-gradient(var(--bracket),var(--bracket)) right bottom/1.5px 14px no-repeat,var(--surface)}
.eyebrow{font:600 12.5px var(--body);letter-spacing:.14em;text-transform:uppercase;color:var(--gold-ink)}
h1{font-family:var(--display);font-weight:700;font-size:30px;line-height:1.12;margin:6px 0 8px;letter-spacing:.01em}
h2{font-family:var(--display);font-weight:700;font-size:18px;letter-spacing:.04em;margin:0 0 10px;display:flex;align-items:baseline;justify-content:space-between}
h2 a{font:500 15px var(--body);color:var(--violet);text-decoration:none;letter-spacing:0}
p{margin:0;font-size:17px;line-height:1.45;color:var(--muted)}
.btn{display:flex;align-items:center;justify-content:center;gap:8px;height:52px;background:var(--gold);color:var(--on-gold);font:700 17.5px var(--body);clip-path:var(--chamfer);text-decoration:none;letter-spacing:.01em}
.btn.ghost{background:none;color:var(--gold-ink);border:0;clip-path:none;height:44px;font-weight:600}
.btn svg{width:20px;height:20px;fill:none;stroke:currentColor;stroke-width:2}
.ways{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:12px}
.way{border:1px solid var(--line);background:var(--panel);border-radius:12px;padding:10px 6px 9px;text-align:center;font:600 13.5px/1.2 var(--body);color:var(--ink);min-height:74px;display:flex;flex-direction:column;align-items:center;gap:6px}
.way svg{width:24px;height:24px;fill:none;stroke:var(--gold);stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round}
.way svg .f{fill:var(--gold);stroke:none}
.sec{margin-top:22px}
.row{display:flex;align-items:center;gap:12px;padding:12px 14px}
.row .ic{width:44px;height:44px;border-radius:12px;background:var(--panel);display:grid;place-items:center;flex:none;border:1px solid var(--line-soft)}
.row .ic svg{width:24px;height:24px;fill:none;stroke:var(--gold);stroke-width:1.7}
.row b{display:block;font-size:17px;color:var(--ink)}
.row span{font-size:14.5px;color:var(--muted)}
.row .go{margin-left:auto;width:20px;height:20px;fill:none;stroke:var(--muted);stroke-width:2}
.crew{display:flex;gap:12px;overflow:hidden;margin:0 -16px;padding:0 16px}
.mate{flex:none;width:76px;text-align:center;font:600 14px var(--body);color:var(--ink)}
.mate .face{width:72px;height:72px;margin:0 auto 6px;border-radius:50%;border:2px solid var(--gold);overflow:hidden;background:var(--panel);display:grid;place-items:center}
.mate .face .pic{width:100%;height:100%}
.mate .face .zd-crest{transform:scale(.8)}
.mate small{display:block;font-weight:400;font-size:12.5px;color:var(--muted)}
.chars{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.ch{border:1px solid var(--line);border-radius:14px;overflow:hidden;background:var(--surface)}
.ch .ph{height:150px;position:relative;overflow:hidden;background:var(--panel)}
.ch .ph .pic{width:100%;height:100%;display:block}
.ch .ph .crestwrap{position:absolute;inset:0;display:grid;place-items:center}
.ch .meta{padding:9px 10px 10px}
.ch b{font-family:var(--display);font-size:17px;display:block}
.ch span{font-size:13.5px;color:var(--muted);display:block;line-height:1.3}
.chip{display:inline-flex;align-items:center;gap:6px;font:600 12.5px var(--body);padding:3px 9px;border-radius:999px;border:1px solid var(--line);color:var(--gold-ink);background:rgba(217,180,90,.08);margin-top:6px}
.live{width:8px;height:8px;border-radius:50%;background:#7fe0a2;box-shadow:0 0 0 3px rgba(127,224,162,.2)}
.new{border:1.5px dashed var(--line);border-radius:14px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;color:var(--gold-ink);font:600 15px var(--body);min-height:220px}
.new svg{width:30px;height:30px;fill:none;stroke:var(--gold);stroke-width:1.8}
.banner{display:flex;align-items:center;gap:12px;padding:12px 12px 12px 14px;border-radius:14px;background:linear-gradient(90deg,rgba(127,224,162,.12),rgba(217,180,90,.08));border:1px solid rgba(127,224,162,.35)}
.banner b{font-size:16.5px;display:block}
.banner span{font-size:14px;color:var(--muted)}
.banner .btn{height:44px;padding:0 16px;font-size:15.5px;margin-left:auto;flex:none}
.games .row{border-bottom:1px solid var(--line-soft)}
.games .row:last-child{border-bottom:0}
.hero2{position:relative;border-radius:18px;overflow:hidden;border:1px solid var(--line);height:430px}
.hero2 .pic{position:absolute;inset:0;width:100%;height:100%}
.hero2 .shade{position:absolute;inset:0;background:linear-gradient(180deg,rgba(18,13,24,0) 35%,rgba(18,13,24,.92) 78%)}
.hero2 .txt{position:absolute;left:16px;right:16px;bottom:16px}
.hero2 .zd-crest{position:absolute;top:14px;left:14px}
.dots{display:flex;gap:7px;justify-content:center;margin:10px 0 0}
.dots i{width:7px;height:7px;border-radius:50%;background:var(--line)}
.dots i.on{background:var(--gold);width:20px;border-radius:4px}
.steps3{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
.st{padding:10px 8px;text-align:center;font-size:13.5px;color:var(--muted);line-height:1.3}
.st b{display:block;color:var(--ink);font-size:14.5px;margin:6px 0 2px}
.st .zd-die{--s:34px;margin:0 auto}
.idea{padding:12px 14px;margin-bottom:8px}
.idea b{font-family:var(--display);font-size:16.5px;display:block;line-height:1.25}
.idea span{font-size:14px;color:var(--muted)}
.pts{display:flex;align-items:center;justify-content:space-between;margin:2px 0 12px}
.pts .chip{margin:0}
.q{font-family:var(--display);font-size:24px;line-height:1.2;margin:6px 0 4px}
.tonight{border-radius:18px;overflow:hidden;border:1px solid var(--line);background:var(--surface)}
.tonight .ph{height:250px;position:relative}
.tonight .ph .pic{position:absolute;inset:0;width:100%;height:100%}
.tonight .ph .shade{position:absolute;inset:0;background:linear-gradient(180deg,rgba(18,13,24,0) 45%,rgba(26,20,34,1) 100%)}
.tonight .in{padding:0 16px 16px;margin-top:-56px;position:relative}
.draft{display:flex;align-items:center;gap:12px;padding:12px 14px}
.bar{height:6px;background:var(--panel);border-radius:3px;overflow:hidden;margin-top:6px}
.bar i{display:block;height:100%;width:38%;background:var(--gold)}
`;

function frame(screen, { signed = false, tab = "" } = {}) {
  return `<div class="phone"><div class="screen">
  <div class="status"><span>9:41</span><i></i></div>
  <header class="top"><div class="row1"><a class="brand"><span class="mark"></span>Zi’Dara</a>
  <div class="acts"><button class="ib" aria-label="Search">${ICON.search}</button><button class="ib" aria-label="Light">${ICON.moon}</button>${signed ? `<span class="av">${pic("40 22 50 50")}</span>` : `<span class="signin">Sign in</span>`}</div></div>
  <nav class="tabs">${["Learn", "Rules", "Characters", "Campaigns"].map((t) => `<a class="${t === tab ? "on" : ""}">${t}</a>`).join("")}</nav></header>
  <div class="body">${screen}</div></div></div>`;
}
const crewRow = () => {
  const crew = [["Vesk", ["Shadow", "Shadow"], true], ["Dorrie", ["Face", "Shadow"]], ["Bram", ["Guardian", "Leader"]], ["Isolde", ["Oracle", "Scholar"]], ["Wren", ["Hunter", "Hunter"]], ["Ash", ["Elementalist", "Face"]]];
  return `<div class="crew">${crew.map(([n, a, p]) => `<div class="mate"><div class="face">${p ? pic("40 27 46 46") : crest(a, { size: "md", strict: false })}</div>${n}<small>${a[0] === a[1] ? `${a[0]} ×2` : a.join(" · ")}</small></div>`).join("")}</div>`;
};
const board = (cols) => `<!doctype html><html><head><meta charset="utf-8"><style>${CSS}</style></head><body><div class="board">${cols.map(([cap, sub, html]) => `<div class="col"><div class="cap">${cap}<small>${sub}</small></div>${html}</div>`).join("")}</div></body></html>`;

// ── Option 1: Make a character, first and plain.
const h1new = frame(`
  <section class="card" style="padding:18px 16px 16px">
    <div class="eyebrow">A tabletop roleplaying game</div>
    <h1>Make your character</h1>
    <p>Spend 35 points on who they are. Your phone keeps the sheet, rolls the dice, and prints it on paper too.</p>
    <a class="btn" style="margin-top:14px">Start building</a>
    <div class="ways"><div class="way">${ICON.crew}Start from the crew</div><div class="way">${ICON.dice}Random in one tap</div><div class="way">${ICON.sheet}A blank sheet</div></div>
  </section>
  <section class="sec card"><div class="row"><div class="ic">${ICON.cards}</div><div><b>New here? Learn it in 40 cards</b><span>a swipe at a time, about 15 minutes</span></div><svg class="go" viewBox="0 0 24 24">${ICON.arrow.replace(/<\/?svg[^>]*>/g, "")}</svg></div></section>
  <section class="sec"><h2>Meet the crew <a>Their sheets</a></h2>${crewRow()}</section>
  <section class="sec card"><div class="row"><div class="ic">${ICON.book}</div><div><b>The rules are free to read</b><span>the whole book, on the Rules tab</span></div><svg class="go" viewBox="0 0 24 24">${ICON.arrow.replace(/<\/?svg[^>]*>/g, "")}</svg></div></section>
`);
const h1signed = frame(`
  <div class="banner"><span class="live"></span><div><b>Tuesday Lair is live</b><span>Round 3 · Mo's running it</span></div><a class="btn">Join</a></div>
  <section class="sec"><h2>Your characters <a>All</a></h2>
    <div class="chars">
      <div class="ch"><div class="ph">${pic("26 22 64 58")}</div><div class="meta"><b>Vesk</b><span>The best cat burglar in the city</span><span class="chip">Tuesday Lair</span></div></div>
      <div class="ch"><div class="ph"><div class="crestwrap">${crest(["Guardian", "Warrior"], { size: "lg", strict: false })}</div></div><div class="meta"><b>Hollis</b><span>Shield of the Ninth Gate</span><span class="chip">Thursday Lair</span></div></div>
    </div>
    <a class="btn ghost" style="margin-top:4px">${ICON.plus}Make a new character</a>
  </section>
  <section class="sec"><h2>Your games <a>Start one</a></h2>
    <div class="card games"><div class="row"><div><b>Tuesday Lair</b><span>you play Vesk · the table's live</span></div><svg class="go" viewBox="0 0 24 24">${ICON.arrow.replace(/<\/?svg[^>]*>/g, "")}</svg></div>
    <div class="row"><div><b>Thursday Lair</b><span>you play Hollis · 5 in the crew</span></div><svg class="go" viewBox="0 0 24 24">${ICON.arrow.replace(/<\/?svg[^>]*>/g, "")}</svg></div></div>
  </section>
`, { signed: true });

// ── Option 2: Meet the crew. The six sell it, and making your own sits under them.
const h2new = frame(`
  <div class="eyebrow" style="text-align:center">Pick one and play tonight</div>
  <div class="hero2" style="margin-top:10px">${pic("8 18 84 104")}<div class="shade"></div>${crest(["Shadow", "Shadow"], { size: "md", strict: false })}
    <div class="txt"><h1 style="font-size:32px;margin:0">Vesk</h1><p style="color:var(--ink)">The best cat burglar in the city. Fast, quiet, and good with locks.</p>
    <a class="btn" style="margin-top:12px">Play Vesk</a></div></div>
  <div class="dots"><i class="on"></i><i></i><i></i><i></i><i></i><i></i></div>
  <a class="btn ghost" style="margin-top:6px">${ICON.plus}Or make your own character</a>
  <section class="sec card" style="padding:12px 4px"><div class="steps3">
    <div class="st">${die(10, { own: "them", face: 7 })}<b>See it coming</b>the GM shows the threat first</div>
    <div class="st">${die(12, { face: 9 })}<b>Stack your dice</b>a Root and a specialty</div>
    <div class="st">${die(8, { face: 8, state: "top" })}<b>Win, get Aura</b>and spend it on more</div>
  </div></section>
`);
const h2signed = frame(`
  <div class="tonight"><div class="ph">${pic("6 14 88 74")}<div class="shade"></div></div>
  <div class="in"><span class="chip" style="margin:0 0 6px"><span class="live"></span>Tuesday Lair is live</span><h1 style="margin:0 0 2px">Vesk</h1><p>Round 3 · Mo's running it</p>
  <a class="btn" style="margin-top:12px">Play Vesk</a></div></div>
  <section class="sec"><h2>Your other characters <a>All</a></h2>
    <div class="card"><div class="row"><div class="ic">${crest(["Guardian", "Warrior"], { size: "sm", strict: false })}</div><div><b>Hollis</b><span>Thursday Lair</span></div><svg class="go" viewBox="0 0 24 24">${ICON.arrow.replace(/<\/?svg[^>]*>/g, "")}</svg></div></div>
  </section>
  <section class="sec"><h2>Your games <a>Start one</a></h2>
    <div class="card games"><div class="row"><div><b>Thursday Lair</b><span>you play Hollis · 5 in the crew</span></div><svg class="go" viewBox="0 0 24 24">${ICON.arrow.replace(/<\/?svg[^>]*>/g, "")}</svg></div></div>
  </section>
`, { signed: true });

// ── Option 3: The builder starts on the home screen.
const ideas = [["The best cat burglar in the city", "plays like a cat burglar, thief or scout"], ["Captain of the Guard", "plays like an officer, sergeant or leader"], ["The herbwife every village sends for", "plays like a doctor, field surgeon or herbalist"]];
const h3new = frame(`
  <div class="pts"><span class="eyebrow">Make your character</span><span class="chip">35 points · a Title's 5</span></div>
  <div class="q">What are they known for?</div>
  <p style="margin-bottom:12px">Pick a Title to start from. You can change every word.</p>
  ${ideas.map(([n, s], i) => `<div class="card idea"${i === 0 ? ` style="border-color:var(--gold);box-shadow:0 0 0 1px var(--gold) inset"` : ""}><b>${n}</b><span>${s}</span></div>`).join("")}
  <a class="btn" style="margin-top:12px">Next: its permissions</a>
  <div style="display:flex;justify-content:center;gap:14px;margin-top:10px;font:600 14.5px var(--body);color:var(--violet)"><span>Random in one tap</span><span>From the crew</span><span>Blank</span></div>
  <section class="sec card"><div class="row"><div class="ic">${ICON.cards}</div><div><b>New here? Learn it in 40 cards</b><span>a swipe at a time</span></div><svg class="go" viewBox="0 0 24 24">${ICON.arrow.replace(/<\/?svg[^>]*>/g, "")}</svg></div></section>
`);
const h3signed = frame(`
  <h2>Pick up where you left off</h2>
  <div class="card" style="overflow:hidden"><div style="display:flex;gap:12px;padding:12px">
    <div style="width:92px;height:116px;border-radius:10px;overflow:hidden;border:1.5px solid var(--gold);flex:none">${pic("34 24 52 66")}</div>
    <div style="flex:1"><b style="font-family:var(--display);font-size:20px;display:block">Vesk</b><span style="color:var(--muted);font-size:14.5px">Tuesday Lair · the table's live</span>
    <a class="btn" style="margin-top:12px;height:46px">Play</a></div></div></div>
  <div class="card draft sec"><div class="row" style="padding:0;width:100%"><div class="ic">${ICON.sheet}</div><div style="flex:1"><b>Unnamed hunter</b><span>your draft · 13 of 35 points spent</span><div class="bar"><i></i></div></div></div></div>
  <section class="sec"><h2>Your characters <a>All</a></h2>
    <div class="card"><div class="row"><div class="ic">${crest(["Guardian", "Warrior"], { size: "sm", strict: false })}</div><div><b>Hollis</b><span>Thursday Lair</span></div><svg class="go" viewBox="0 0 24 24">${ICON.arrow.replace(/<\/?svg[^>]*>/g, "")}</svg></div></div>
  </section>
  <section class="sec"><h2>Your games <a>Start one</a></h2>
    <div class="card games"><div class="row"><div><b>Tuesday Lair</b><span>you play Vesk</span></div><svg class="go" viewBox="0 0 24 24">${ICON.arrow.replace(/<\/?svg[^>]*>/g, "")}</svg></div><div class="row"><div><b>Thursday Lair</b><span>you play Hollis</span></div><svg class="go" viewBox="0 0 24 24">${ICON.arrow.replace(/<\/?svg[^>]*>/g, "")}</svg></div></div>
  </section>
`, { signed: true });

// ── The play screen with the picture, and adding one.
const PCSS = `
.pbar{display:flex;align-items:center;justify-content:space-between;padding:0 12px;height:48px}
.pbar .bk{font:600 15px var(--body);color:var(--violet);display:flex;align-items:center;gap:2px}
.seg{display:flex;background:var(--panel);border:1px solid var(--line-soft);border-radius:10px;padding:3px}
.seg a{font:600 14px var(--body);color:var(--muted);padding:6px 12px;border-radius:7px}
.seg a.on{background:var(--gold);color:var(--on-gold)}
.stage{position:relative;height:262px;margin:2px 0 0}
.arch{position:absolute;left:50%;top:48px;width:132px;height:176px;transform:translateX(-50%);border-radius:66px 66px 10px 10px;padding:4px;background:linear-gradient(135deg,#b8892f,#e3c372 35%,#a87a26 55%,#d9b45a 80%,#8a6420)}
.arch .in{width:100%;height:100%;border-radius:62px 62px 7px 7px;overflow:hidden}
.arch .pic{width:100%;height:100%;display:block}
.cam{position:absolute;right:-6px;bottom:-6px;width:34px;height:34px;border-radius:50%;background:var(--surface);border:1.5px solid var(--gold);display:grid;place-items:center}
.cam svg{width:18px;height:18px;fill:none;stroke:var(--gold);stroke-width:1.8}
.med{position:absolute;width:96px;text-align:center}
.med .disc{width:74px;height:74px;margin:0 auto;border-radius:50%;padding:3px;background:linear-gradient(135deg,#b8892f,#e3c372 40%,#8a6420)}
.med .disc>div{width:100%;height:100%;border-radius:50%;background:var(--surface);display:flex;flex-direction:column;align-items:center;justify-content:center}
.med .disc b{font:700 30px var(--display);line-height:1;color:var(--ink)}
.med .disc span{font:700 10px var(--display);letter-spacing:.12em;color:var(--gold-ink);margin-top:2px}
.med .trk{display:flex;align-items:center;justify-content:center;gap:5px;margin-top:6px;font:600 13px var(--body);color:var(--muted)}
.med .trk .zd-die{--s:30px}
.med .arm{display:flex;gap:3px;justify-content:center;margin-top:4px}
.med .arm i{width:10px;height:10px;border:1.5px solid var(--gold);border-radius:2px}
.med.soul{left:50%;top:-6px;transform:translateX(-50%);width:auto;display:flex;align-items:center;gap:8px}
.med.soul .disc{width:56px;height:56px}
.med.soul .disc b{font-size:22px}
.med.soul .disc span{font-size:8.5px}
.strip{display:flex;align-items:center;justify-content:space-between;padding:10px 16px;border-top:1px solid var(--line-soft);border-bottom:1px solid var(--line-soft);margin-top:10px}
.strip .zd-pips{gap:4px}
.strip small{font:600 13.5px var(--body);color:var(--muted)}
.strip small b{color:var(--ink);font-size:16px}
.roll{padding:12px 16px}
.roll h3{font:700 15px var(--display);letter-spacing:.06em;margin:0 0 8px;color:var(--gold-ink)}
.specs{display:flex;flex-wrap:wrap;gap:7px}
.sp{font:600 15px var(--body);padding:8px 12px;border-radius:10px;background:var(--panel);border:1px solid var(--line-soft);color:var(--ink)}
.sp b{color:var(--gold-ink);margin-left:4px}
.sp.on{border-color:var(--gold);box-shadow:0 0 0 1px var(--gold) inset}
.roots{display:grid;grid-template-columns:repeat(3,1fr);gap:7px;margin-top:9px}
.rt{text-align:center;padding:8px 4px;border-radius:10px;background:var(--panel);border:1px solid var(--line-soft);font:600 14.5px var(--body)}
.rt.on{border-color:var(--gold);box-shadow:0 0 0 1px var(--gold) inset}
.rt small{display:block;color:var(--muted);font-weight:500;font-size:12.5px}
.go-roll{display:flex;align-items:center;justify-content:center;gap:10px;height:58px;margin-top:12px;background:var(--gold);color:var(--on-gold);clip-path:var(--chamfer);font:700 18px var(--body)}
.go-roll .zd-die{--s:34px}
.dim{position:absolute;inset:0;background:rgba(6,4,10,.62)}
.sheet{position:absolute;left:0;right:0;bottom:0;background:var(--surface);border-top:1px solid var(--line);border-radius:22px 22px 0 0;padding:10px 18px 30px}
.sheet .grab{width:44px;height:5px;border-radius:3px;background:var(--line);margin:0 auto 12px}
.sheet h3{font:700 19px var(--display);margin:0 0 10px;text-align:center}
.crop{position:relative;width:236px;height:300px;margin:0 auto;border-radius:12px;overflow:hidden;background:#000}
.crop .pic{position:absolute;left:-36px;top:-20px;width:320px;height:340px}
.crop .mask{position:absolute;inset:0}
.hint{font-size:14px;color:var(--muted);text-align:center;margin:10px 0 12px}
.two{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.two a{display:flex;align-items:center;justify-content:center;gap:8px;height:48px;border-radius:12px;border:1px solid var(--line);font:600 15.5px var(--body);color:var(--ink);background:var(--panel)}
.two a svg{width:20px;height:20px;fill:none;stroke:var(--gold);stroke-width:1.8}
.note{font-size:13.5px;color:var(--muted);text-align:center;margin-top:10px;line-height:1.4}
`;
const CAM = `<svg viewBox="0 0 24 24"><path d="M4 8h3l2-3h6l2 3h3v11H4Z"/><circle cx="12" cy="13" r="3.5"/></svg>`;
const IMG = `<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="10" r="1.8"/><path d="M4 18l5-5 4 4 3-3 4 4"/></svg>`;
function playScreen(withSheet) {
  const med = (cls, root, n, track, style) => `<div class="med ${cls}" style="${style}"><div class="disc"><div><b>${n}</b><span>${root.toUpperCase()}</span></div></div>${cls === "soul" ? `<div class="trk">${die(12)}<span>Resolve</span></div>` : `<div class="trk">${die(12)}<span>${track}</span></div><div class="arm">${root === "Body" ? "<i></i>" : ""}</div>`}</div>`;
  return `<div class="phone"><div class="screen">
  <div class="status"><span>9:41</span><i></i></div>
  <div class="pbar"><span class="bk">${ICON.arrow.replace('d="M9 5l7 7-7 7"', 'd="M15 5l-7 7 7 7"').replace("<svg", '<svg style="width:20px;height:20px;fill:none;stroke:currentColor;stroke-width:2"')}Characters</span><div class="seg"><a class="on">Play</a><a>Sheet</a><a>Rules</a></div></div>
  <div class="stage">
    ${med("soul", "Soul", 0, "Resolve", "")}
    <div class="arch"><div class="in">${pic("14 20 76 101")}</div><span class="cam">${CAM}</span></div>
    ${med("", "Body", 5, "Stamina", "left:6px;top:70px")}
    ${med("", "Mind", 3, "Confidence", "right:6px;top:70px")}
  </div>
  <div style="text-align:center;margin-top:-4px"><b style="font:700 24px var(--display);letter-spacing:.04em">Vesk</b></div>
  <div class="strip"><span style="display:flex;align-items:center;gap:8px"><small>Aura</small>${aura(5, 5)}</span><small>Actions <b>2</b></small><small>Stride <b>5</b></small></div>
  <div class="roll"><h3>Build a roll</h3>
    <div class="specs"><span class="sp on">Locks<b>4</b></span><span class="sp">Stealth<b>2</b></span><span class="sp">Climbing<b>2</b></span><span class="sp">Knives<b>2</b></span><span class="sp">Black market<b>2</b></span></div>
    <div class="roots"><div class="rt on">Body 5<small>hands and feet</small></div><div class="rt">Mind 3<small>in your head</small></div><div class="rt">Soul 0<small>who you are</small></div></div>
    <div class="specs" style="margin-top:9px"><span class="sp on">Her picks<b>+1</b></span><span class="sp">A knife<b>+1</b></span><span class="sp">Grappling line<b>+1</b></span></div>
    <div class="go-roll">Roll ${die(12)} ${die(8)}<span style="font-weight:600;font-size:15px">· 10 steps</span></div>
  </div>
  ${withSheet ? `<div class="dim"></div><div class="sheet"><div class="grab"></div><h3>Vesk's picture</h3>
    <div class="crop">${pic("0 0 100 130")}<svg class="mask" viewBox="0 0 236 300"><defs><mask id="mk"><rect width="236" height="300" fill="#fff"/><path d="M28 290V108A90 90 0 0 1 208 108V290Z" fill="#000"/></mask></defs><rect width="236" height="300" fill="rgba(6,4,10,.6)" mask="url(#mk)"/><path d="M28 290V108A90 90 0 0 1 208 108V290Z" fill="none" stroke="#d9b45a" stroke-width="2"/></svg></div>
    <div class="hint">Drag it into the frame, pinch to zoom</div>
    <div class="two"><a>${CAM}Take a photo</a><a>${IMG}Choose one</a></div>
    <a class="btn" style="margin-top:10px">Use this picture</a>
    <div class="note">It's kept with Vesk and your account, so your GM sees it too. It shows here at the table and prints on her sheet.</div>
  </div>` : ""}
  </div></div>`;
}

fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(`${OUT}/home-1.html`, board([["Option 1 · New here", "making a character comes first", h1new], ["Option 1 · Signed in", "your characters and games", h1signed]]));
fs.writeFileSync(`${OUT}/home-2.html`, board([["Option 2 · New here", "the crew sells it", h2new], ["Option 2 · Signed in", "tonight's game, one tap", h2signed]]));
fs.writeFileSync(`${OUT}/play.html`, board([["The play screen", "her picture, with Body, Mind and Soul round it", playScreen(false)], ["Adding a picture", "from the camera icon on the picture", playScreen(true)]]).replace("</style>", PCSS + "</style>"));
fs.writeFileSync(`${OUT}/home-3.html`, board([["Option 3 · New here", "the builder starts right here", h3new], ["Option 3 · Signed in", "pick up where you left off", h3signed]]));
console.log("ok");
