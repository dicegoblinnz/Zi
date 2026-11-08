// The character sheet: one A4 sheet, printed back to back. The front's for
// play and the back's who you are. Every write-in space carries a field name
// (data-f, data-cb or data-radio), and scripts/build-sheets.mjs puts a
// fillable field over each one, so it can be typed into or printed blank.
// src/companion/print.js fills them by name when someone prints a character,
// so keep every name as it is. What's on it comes from Appendix A
// (#s-sheet-character), and the pieces are the kit's (src/kit/kit.js), drawn
// in its Paper theme: dice in their real shapes, the crest, Aura's hexes and
// the three tracks with their Scars.
import { die, crest, mini, aura, SIZES } from "../../src/kit/kit.js";
import { stepsToDice, diceLabel } from "../../src/companion/dice.js";

const STAGES = ["Awakened", "Tempered", "Perfected"];
const KINDS = ["bond", "hostile"];
const TRACKS = ["Stamina", "Confidence", "Resolve"];
const range = (n) => Array.from({ length: n }, (_, i) => i + 1);

// Field markers. size is the typed text's size in points (0 fits it to the box).
const w = (name, { size, cls = "", align, multi = false } = {}) =>
  `<span class="w ${cls}" data-f="${name}"${size !== undefined ? ` data-size="${size}"` : ""}${align ? ` data-align="${align}"` : ""}${multi ? " data-multi" : ""}></span>`;
const box = (name) => `<span class="box" data-f="${name}" data-size="11" data-align="center"></span>`;
const tick = (name, look) => `<span class="tick" data-cb="${name}" data-look="${look}"></span>`;
const lines = (prefix, n, opts) => range(n).map((i) => w(`${prefix}_${i}`, opts)).join("");
const tab = (title, aside = "", level = 2) => `<div class="tab"><h${level}>${title}</h${level}>${aside ? `<span class="aside">${aside}</span>` : ""}</div>`;

// The kit's die, with its size a little bigger on the hub than on a phone,
// since paper's read from across the table and never rolled.
const paperDie = (d, own) => die(d, { own, hide: true }).replace(/font-size="([\d.]+)"/, (_, v) => `font-size="${(Number(v) * (d >= 10 ? 1.12 : 1.22)).toFixed(1)}"`);
// A row of the six dice, d2 to d12, to ring the one you're on.
const ringDice = (group, { own = "you", big = false, down = false } = {}) =>
  `<div class="dice${big ? " big" : ""}">${(down ? [...SIZES].reverse() : SIZES).map((d) => `<span class="ring" data-radio="${group}" data-value="d${d}">${paperDie(d, own)}</span>`).join("")}</div>`;
const svgOf = (html) => html.match(/<svg[\s\S]*<\/svg>/)[0];
const HEX = svgOf(aura(0, 1));
// A Title's numeral sits on a diamond cut like the crest's.
const numeral = (n) => `<span class="numeral"><svg viewBox="0 0 64 64" aria-hidden="true"><path d="M32 2.6 L61.4 32 L32 61.4 L2.6 32 Z" style="fill:var(--ink)"/></svg><b>${n}</b></span>`;

// Specialties: two columns of rows, each a name and its steps.
const SPEC_ROWS = 6;
// Steps into dice, straight off the companion's table, so the two can't differ.
const LADDER = [...range(12), 18, 24].map((s) => [s, stepsToDice(s)]);
const NUMERALS = ["I", "II", "III", "IV", "V", "VI"];

function front(stamp) {
  // A track: its dice to ring, d12 to d2, the Blaze past them, a tick to lock
  // each size a Scar takes from the bottom, and two lines of armour on it.
  const track = (id, name, root) => `
    <section class="blk track3">
      <div class="th"><h2>${name}</h2><span class="lab">${root}</span></div>
      <div class="row">${ringDice(id, { own: "harm", down: true })}<div class="blaze"><b>→ Blaze</b><span>a hit at d2</span></div></div>
      <div class="locks"><span class="lab">Scars lock</span>${[2, 4, 6, 8, 10].map((d) => `<span class="lock">${tick(`${id}_scar_${d}`, "cross")}<i>d${d}</i></span>`).join("")}</div>
      ${range(2).map((i) => `<div class="arm"><span class="lab">Armour</span>${w(`${id}_armour_${i}`)}<span class="boxes">${range(3).map((j) => tick(`${id}_armour_${i}_box_${j}`, "check")).join("")}</span></div>`).join("")}
    </section>`;
  const spec = (i) => `
        <tr><td class="name">${w(`spec_${i}_name`)}</td><td class="steps">${w(`spec_${i}_steps`, { size: 10, align: "center" })}</td></tr>`;
  const goal = (id, title, after) => `
    <div class="goal"><h2 class="chip">${title}</h2>${w(id)}${ringDice(`${id}_die`)}<p class="hint">${after}</p></div>`;
  return `
<section class="page front">
  <header class="head">
    ${crest([], { label: "Zi’Dara" })}
    <div class="brand"><div class="wordmark">Zi’Dara</div><div class="doc">Character sheet</div></div>
    <div class="ident">
      <div class="field name"><span class="lab">Name</span>${w("name", { size: 12 })}</div>
      <div class="field" style="flex:1.1"><span class="lab">Pronouns</span>${w("pronouns")}</div>
      <div class="field" style="flex:1.5"><span class="lab">Player</span>${w("player")}</div>
    </div>
  </header>

  <div class="pool">
    <div class="cell"><h2>Aura<small>full every scene · 5 to start · 1 for every die that wins and every top face</small></h2>
      <div class="row"><span class="lab">now</span><span class="hex">${HEX}<span class="f" data-f="aura_now" data-size="11" data-align="center"></span></span><span class="lab">max</span><span class="hex">${HEX}<span class="f" data-f="aura_max" data-size="11" data-align="center"></span></span></div></div>
    <div class="cell"><h2>Actions<small>the most a round, one for each archetype · 3 Aura buys one</small></h2>${box("actions")}</div>
    <div class="cell"><h2>Stride<small>3 to start</small></h2>${box("stride")}</div>
  </div>

  <section>
    ${tab("Tracks", "d12 to start · ring where you are · a size off for every hit that gets through · back a size on a 4 or more when a scene ends")}
    <div class="tracks3">${track("stamina", "Stamina", "Body")}${track("confidence", "Confidence", "Mind")}${track("resolve", "Resolve", "Soul")}</div>
    <p class="hint"><b>Pay</b> for an ability: 1 off its home track, or 2 from the other two · <b>2 for 1:</b> when a hit gets through, pay 2 from the other two tracks and this one stays put · never below d2 · armour on that Root can take a hit instead: tick a box · <b>Blaze:</b> something extraordinary, then die, or leave the scene with a Scar</p>
  </section>

  <section class="blk">
    ${tab("Roots and specialties", "a roll's one Root and one specialty, plus 1 for each item you're using · anything else that fits is 1 Aura")}
    <div class="roots">${["Body", "Mind", "Soul"].map((r) => `<div class="root"><h2>${r}</h2>${box(`root_${r.toLowerCase()}`)}</div>`).join("")}
      <p class="hint">Body: what your hands and feet do · Mind: what goes on in your head · Soul: who you are. Each one's 1 for every Title and permission on it.</p></div>
    <div class="specs">${[0, 1].map((c) => `<table class="sa"><thead><tr><th class="name">Specialty</th><th class="steps">Steps</th></tr></thead><tbody>${range(SPEC_ROWS).map((i) => spec(i + c * SPEC_ROWS)).join("")}</tbody></table>`).join("")}</div>
    <div class="ladder" aria-label="Steps into dice">${LADDER.map(([s, dice]) => `<div><b>${s}</b><span class="shapes${dice.length > 2 ? " many" : ""}">${dice.map((d) => mini(d)).join("")}</span><span>${diceLabel(dice).replace(/\s/g, "")}</span></div>`).join("")}</div>
  </section>

  <div class="grid">
    <section class="blk">
      ${tab("Conditions", "ring the die that placed it · it steps down a size every round")}
      ${range(4).map((i) => `<div class="cond">${w(`condition_${i}`)}${ringDice(`condition_${i}_die`)}</div>`).join("")}
    </section>
    <section class="blk scars">
      ${tab("Scars", "each one a Catch, and a size locked on its track")}
      <div class="rows">${range(5).map((i) => `<div class="scar"><span class="cut"></span>${w(`scar_${i}`)}</div>`).join("")}</div>
    </section>
  </div>

  <section class="goals">${goal("aspiration", "Aspiration", "Past d12: a new Title, archetype or attuned thing, and a new Aspiration at d2.")}${goal("party_goal", "Party Goal", "Past d12: the crew’s done it, and everyone writes a new thread.")}
  </section>

  <section class="blk kit">
      ${tab("Kit", "an item's 1 more on a roll you use it in · armour goes on its track")}
      <div class="cols">
        <div class="sub"><span class="lab">Equipment · what you wear or wield</span>${lines("equipment", 3)}</div>
        <div class="sub"><span class="lab">Utility · cross it off once it’s used</span>${lines("utility", 3)}</div>
      </div>
      <div class="sub row"><span class="lab">Keepsake · something that matters to you</span>${w("keepsake")}</div>
      <div class="sub"><span class="lab">Bag · holds 10 · getting something out takes your action</span>
        <div class="cols"><div>${range(5).map((i) => w(`bag_${i}`)).join("")}</div><div>${range(5).map((i) => w(`bag_${i + 5}`)).join("")}</div></div></div>
  </section>

  <section class="blk notes">
    ${tab("Notes", "whatever your archetype’s holding, like a Shadow’s pool, and a thread that won’t fit on its bond")}
    <div class="w ruled" data-f="notes" data-multi data-size="9"></div>
  </section>

  <footer class="stamp"><span>zidara.world/sheets</span><span>${stamp}</span></footer>
</section>`;
}

function back(stamp) {
  const titleCard = (t) => `
      <div class="card tcard">
        <div class="top">${numeral(NUMERALS[t - 1])}<span class="w two" data-f="title_${t}" data-multi data-size="8.5"></span></div>
        <div class="row"><span class="lab">Root</span>${w(`title_${t}_root`, { cls: "short" })}<span class="lab">Specialties</span>${w(`title_${t}_specialties`, { size: 8 })}</div>
        <div class="perms">${lines(`title_${t}_permission`, 6, { size: 8 })}</div>
      </div>`;
  const archCard = (a) => `
      <div class="card xcard">
        <div class="row"><span class="lab">Archetype</span>${w(`archetype_${a}`)}</div>
        <div class="row home"><span class="lab">Home track</span><span class="kind">${TRACKS.map((k) => `<span class="word" data-radio="archetype_${a}_track" data-value="${k.toLowerCase()}">${k}</span>`).join("<i></i>")}</span></div>
        <div class="row"><span class="lab">Mechanic</span>${w(`archetype_${a}_mechanic`, { size: 8 })}</div>
        <div class="perms">${lines(`archetype_${a}_ability`, 6, { size: 8 })}</div>
      </div>`;
  // One attuned thing, the width of the page, with its six awakenings in two
  // columns. A second one's rare, and goes in Notes till there's a sheet for it.
  const wake = (a, i) => `<div class="wake">${w(`attune_${a}_awakening_${i}`, { size: 8 })}<span class="kind">${["passive", "active"].map((k) => `<span class="word" data-radio="attune_${a}_awakening_${i}_kind" data-value="${k}">${k}</span>`).join("<i></i>")}</span><span class="boxes">${range(2).map((j) => tick(`attune_${a}_awakening_${i}_aura_${j}`, "check")).join("")}</span></div>`;
  const attuneCard = (a) => `
      <div class="card acard wide">
        <div class="row"><span class="lab">Thing</span><span class="grow2">${w(`attune_${a}_thing`)}</span><span class="lab">Material</span>${w(`attune_${a}_material`)}<div class="stage">${STAGES.map((s) => `<span class="word" data-radio="attune_${a}_stage" data-value="${s.toLowerCase()}">${s}</span>`).join("<i>›</i>")}</div></div>
        <div class="row"><span class="lab">Its Aura</span><span class="grow2">${w(`attune_${a}_aura`, { size: 8 })}</span><span class="lab">Catch</span>${w(`attune_${a}_catch`)}<span class="lab">Burden</span>${w(`attune_${a}_burden`)}</div>
        <div class="wakes2">${[0, 1].map((c) => `<div class="wakes"><div class="top"><span></span><span>passive or active</span><span>stored</span></div>${range(3).map((r) => wake(a, c * 3 + r + 1)).join("")}</div>`).join("")}</div>
      </div>`;
  // Each thread: its truth, bond or hostile to ring, and a box for strained
  // and one for snapped. A thread's a sentence, so it gets the width, and a
  // long one wraps onto a second, smaller line when it's printed.
  const bondCard = (b) => `
      <div class="card bcard">
        <div class="top"><div class="row"><span class="lab">Bond</span>${w(`bond_${b}`)}</div><span></span><span>strained</span><span>snapped</span></div>
        ${range(3).map((t) => `<div class="thread">${w(`bond_${b}_thread_${t}`, { size: 8, multi: true })}<span class="kind">${KINDS.map((k) => `<span class="word" data-radio="bond_${b}_thread_${t}_kind" data-value="${k}">${k}</span>`).join("<i></i>")}</span>${tick(`bond_${b}_thread_${t}_strained`, "check")}${tick(`bond_${b}_thread_${t}_snapped`, "cross")}</div>`).join("")}
      </div>`;
  return `
<section class="page back">
  <header class="slim">
    ${crest([], { size: "sm", label: "Zi’Dara" })}<div class="wordmark">Zi’Dara</div>
    <div class="doc">Who you are</div>
  </header>

  <section>
    ${tab("Titles")}
    <p class="hint">I and II to start with three permissions each, more earned in play · a Title's 1 on a Root and 1 on each of three specialties · a permission's 1 on a Root and 1 on a specialty, so write them next to it · a Boon takes two lines</p>
    <div class="grid3">${range(6).map(titleCard).join("")}</div>
  </section>

  <section>
    ${tab("Archetypes")}
    <p class="hint">Two to start, and the same one twice is fine · each ability's 1 off its home track, or 2 from the other two, and they stack · six abilities at most</p>
    <div class="grid3">${range(3).map(archCard).join("")}</div>
  </section>

  <section>
    ${tab("Attunement")}
    <p class="hint">One thing, on top of what you carry · ring its stage · a passive awakening holds up to 2 Aura, ticked as you pump it in, and it all empties when the scene ends · an active one spends it · a Summoner's souls go on the lines, with their dice</p>
    ${attuneCard(1)}
  </section>

  <section>
    ${tab("Bonds")}
    <p class="hint">A bond’s usually a person, but it can be a faction, a place or a cause · ring each thread bond or hostile · tick the first box when it’s strained, and the second when it snaps</p>
    <div class="grid2">${range(4).map(bondCard).join("")}</div>
  </section>

  <footer class="stamp"><span>zidara.world/sheets</span><span>${stamp}</span></footer>
</section>`;
}

export function characterSheet(stamp) {
  return `<style>@page { size: A4; margin: 0; }</style><main class="cs">${front(stamp)}${back(stamp)}</main>`;
}
