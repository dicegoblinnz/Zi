// The character sheet: one A4 sheet, printed back to back. The front's for
// play, on the new core (16 Nov 2026): each Root as its number, its dice and
// its points, with its wound, its Scars and its armour, Aura and Toll, and
// the attuned things with the Root each awakening locks. The back's who you
// are. Every write-in space carries a field name
// (data-f, data-cb or data-radio), and scripts/build-sheets.mjs puts a
// fillable field over each one, so it can be typed into or printed blank.
// The names are src/companion/sheet-fields.js's, and the build stops if this
// page hasn't got exactly those, so print.js (which fills them by name when
// someone prints a character) always finds them. Each block is its own
// function, so a new look can take the same fields and lay them out its way.
// What's on it comes from Appendix A (#s-sheet-character), and the pieces are
// the kit's (src/kit/kit.js), drawn in its Paper theme: dice in their real
// shapes, the crest and Aura's hexes.
import { die, crest, mini, aura, SIZES } from "../../src/kit/kit.js";
import { stepsToDice, diceLabel } from "../../src/companion/dice.js";
import { ROWS, ROOTS, WOUNDS, STAGES, THREADS } from "../../src/companion/sheet-fields.js";

const range = (n) => Array.from({ length: n }, (_, i) => i + 1);
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const NUMERALS = ["I", "II", "III", "IV", "V", "VI"];

// Field markers. size is the typed text's size in points (0 fits it to the box).
const w = (name, { size, cls = "", align, multi = false } = {}) =>
  `<span class="w ${cls}" data-f="${name}"${size !== undefined ? ` data-size="${size}"` : ""}${align ? ` data-align="${align}"` : ""}${multi ? " data-multi" : ""}></span>`;
const box = (name, cls = "box", size = 11) => `<span class="${cls}" data-f="${name}" data-size="${size}" data-align="center"></span>`;
const tick = (name, look) => `<span class="tick" data-cb="${name}" data-look="${look}"></span>`;
// Words to ring, one of them: a stage, bond or hostile, a Root.
const words = (name, values, label = cap, sep = "<i></i>") => values.map((v) => `<span class="word" data-radio="${name}" data-value="${v}">${label(v)}</span>`).join(sep);
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
// Steps into dice, straight off the companion's table, so the two can't differ.
const LADDER = [...range(12), 18, 24].map((s) => [s, stepsToDice(s)]);

// ---------------------------------------------------------------- the front

const head = () => `
  <header class="head">
    ${crest([], { label: "Zi’Dara" })}
    <div class="brand"><div class="wordmark">Zi’Dara</div><div class="doc">Character sheet</div></div>
    <div class="ident">
      <div class="field name"><span class="lab">Name</span>${w("name", { size: 12 })}</div>
      <div class="field" style="flex:1.1"><span class="lab">Pronouns</span>${w("pronouns")}</div>
      <div class="field" style="flex:1.5"><span class="lab">Player</span>${w("player")}</div>
    </div>
  </header>`;

// Aura, Toll and your stride, in a bar under the name since they move most.
const pool = () => `
  <div class="pool">
    <div class="cell"><h2>Aura<small>full every scene · 5 to start · 1 for every die that wins and every top face</small></h2>
      <div class="row"><span class="lab">now</span><span class="hex">${HEX}<span class="f" data-f="aura_now" data-size="11" data-align="center"></span></span><span class="lab">max</span><span class="hex">${HEX}<span class="f" data-f="aura_max" data-size="11" data-align="center"></span></span></div></div>
    <div class="cell"><h2>Toll<small>1 for each heal from someone else · a heal loses 5 a Toll · down 1 each scene · gone in downtime</small></h2>${box("toll")}</div>
    <div class="cell"><h2>Stride<small>3 to start</small></h2>${box("stride")}</div>
  </div>`;

// A Root, side by side with the other two: its number, which is its dice,
// and where each point came from (each Title's spread, and 1 for every
// permission on it), then what's locked (a point for each awakening and each
// Scar), what it holds, and the points it has now, its wound to tick, a line
// for each Scar's Catch, and two lines of armour on it.
function rootCol(r) {
  return `
    <section class="blk rootcol">
      <div class="rhead">
        <div class="rname"><h2>${cap(r)}</h2>${box(`root_${r}`, "rbox", 13)}</div>
        <div class="from">
          <div class="frow"><span class="lab">Titles</span>${range(ROWS.titles).map((n) => `<span class="fcell"><i>${NUMERALS[n - 1]}</i>${box(`root_${r}_title_${n}`, "sbox", 9)}</span>`).join("")}</div>
          <div class="frow"><span class="lab">Permissions</span>${box(`root_${r}_permissions`, "sbox", 9)}<span class="lab">rolls</span>${w(`root_${r}_dice`, { size: 8.5 })}</div>
        </div>
      </div>
      <div class="pts">
        <span class="pt"><span class="lab">locked</span>${box(`root_${r}_locked`, "sbox", 9)}</span>
        <span class="pt"><span class="lab">holds</span>${box(`root_${r}_holds`, "sbox", 10)}</span>
        <span class="pt now"><span class="lab">now</span>${box(`root_${r}_now`, "nbox", 13)}</span>
        <span class="wound">${tick(`root_${r}_wound`, "cross")}<b>${WOUNDS[r]}</b></span>
      </div>
      <div class="scars">${range(ROWS.scars).map((n) => `<div class="scar"><span class="cut"></span>${w(`root_${r}_scar_${n}`, { size: 8 })}</div>`).join("")}</div>
      ${range(ROWS.armour).map((n) => `<div class="arm"><span class="lab">Armour</span>${w(`root_${r}_armour_${n}`)}<span class="boxes">${range(ROWS.boxes).map((j) => tick(`root_${r}_armour_${n}_box_${j}`, "check")).join("")}</span></div>`).join("")}
    </section>`;
}
const roots = () => `
  <section>
    ${tab("Roots", "a Title puts 5 on your Roots · a permission 1 on its Root · a Root’s number is its dice, its points to take hits with and its points to spend")}
    <div class="roots3">${ROOTS.map(rootCol).join("")}</div>
    <p class="hint"><b>A hit</b>’s a point off, or 2 off another Root · armour can take it · <b>at 0</b> it wounds, and you heal to half · <b>wounded at 0</b> it’s a Scar and you leave · <b>Blaze:</b> take the Scar, do the extraordinary, leave</p>
  </section>`;

// Building a roll, and the steps ladder under it.
const roll = () => `
  <section class="blk roll">
    ${tab("A roll", "two sides a step, up to a d12 · past 6 steps, more dice")}
    <p class="hint"><b>One Root</b> that fits how you’re doing it, all of it, whatever it’s got left · <b>bring another Root in:</b> a permission that explains it, and 1 point of that Root or <b>3 Aura</b> · an <b>awakening</b> that fits is 2 steps, and 2 more for each Aura · split your dice any way you like, an intent on each · nothing else is counted · every roll’s at least 1 step</p>
    <div class="ladder" aria-label="Steps into dice">${LADDER.map(([s, dice]) => `<div><b>${s}</b><span class="shapes${dice.length > 2 ? " many" : ""}">${dice.map((d) => mini(d)).join("")}</span><span>${diceLabel(dice).replace(/\s/g, "")}</span></div>`).join("")}</div>
  </section>`;

// Conditions, and the two rests beside them.
const conditionsAndScars = () => `
  <div class="grid">
    <section class="blk">
      ${tab("Conditions", "ring the die that placed it · it steps down a size every round")}
      ${range(ROWS.conditions).map((n) => `<div class="cond">${w(`condition_${n}`)}${ringDice(`condition_${n}_die`)}</div>`).join("")}
    </section>
    <section class="blk rests">
      ${tab("Getting it back", "two rests")}
      <p class="hint"><b>When a scene ends:</b> roll each Root below what it holds, unsplit, d12s first (8 is a d12 and a d4), and get back what you roll · its top faces are Aura, what it heals never is · Toll down 1</p>
      <p class="hint"><b>Downtime:</b> everything back, every Root full and every wound and your Toll gone · Scars stay</p>
      <p class="hint"><b>A heal</b> (a Healer’s) is rolled unsplit, less 5 for each Toll, spread on any of your Roots · <b>quick heal:</b> 1 Aura and an action, 1 point back</p>
    </section>
  </div>`;

// The Aspiration and the Party Goal, a line each and the dice it climbs, and
// your points: what you've spent of what you started on, and room for any
// you've got banked.
const goal = (id, title, after) => `
    <div class="goal"><h2 class="chip">${title}</h2>${w(id)}${ringDice(`${id}_die`)}<p class="hint">${after}</p></div>`;
const goals = () => `
  <section class="goals">
    <div class="pair">${goal("aspiration", "Aspiration", "Past d12: a new Title, archetype or attuned thing, with its one, and a new Aspiration at d2.")}${goal("party_goal", "Party Goal", "Past d12: the crew’s done it, and everyone writes a new thread.")}</div>
    <div class="points"><h2 class="chip">Points</h2>
      <div class="row"><span class="lab">spent</span>${box("points_spent")}<span class="lab">of</span>${box("points_start")}</div>
      <div class="row"><span class="lab">banked</span>${box("points_banked")}</div>
    </div>
  </section>`;

const kit = () => `
  <section class="blk kit">
      ${tab("Kit", "a plain item does what it is, and it’s never a step · armour goes on its Root too")}
      <div class="cols">
        <div class="sub"><span class="lab">Equipment · what you wear or wield</span>${range(ROWS.equipment).map((n) => w(`equipment_${n}`)).join("")}</div>
        <div class="sub"><span class="lab">Utility · cross it off once it’s used</span>${range(ROWS.utility).map((n) => w(`utility_${n}`)).join("")}</div>
      </div>
      <div class="sub row"><span class="lab">Keepsake · something that matters to you</span>${w("keepsake")}</div>
      <div class="sub"><span class="lab">Bag · holds 10 · getting something out takes your action</span>
        <div class="cols"><div>${range(ROWS.bag / 2).map((n) => w(`bag_${n}`)).join("")}</div><div>${range(ROWS.bag / 2).map((n) => w(`bag_${n + ROWS.bag / 2}`)).join("")}</div></div></div>
  </section>`;

// An attuned thing: what it is, its material and stage, its Catch and
// Burden, and its awakenings, each with the Root it locks to ring.
const wake = (a, n) => `<div class="wake">${w(`attune_${a}_awakening_${n}`, { size: 8 })}<span class="kind">${words(`attune_${a}_awakening_${n}_root`, ROOTS, (v) => v.charAt(0).toUpperCase())}</span></div>`;
const attuneCard = (a) => `
      <div class="card acard">
        <div class="row"><span class="lab">Thing</span>${w(`attune_${a}_thing`)}<div class="stage">${words(`attune_${a}_stage`, STAGES, cap, "<i>›</i>")}</div></div>
        <div class="row"><span class="lab">Material</span>${w(`attune_${a}_material`)}<span class="lab">Catch</span>${w(`attune_${a}_catch`)}<span class="lab">Burden</span>${w(`attune_${a}_burden`)}</div>
        <div class="wakes"><div class="top"><span class="lab">Awakenings</span><span>the Root it locks</span></div>${range(ROWS.awakenings).map((n) => wake(a, n)).join("")}</div>
      </div>`;
const attunement = () => `
  <section class="blk attune">
    ${tab("Attunement", "bound to you · it can’t break")}
    <p class="hint">Each awakening locks a point of the Root you ring, for as long as it’s attuned, so that Root holds a point less, but you still roll all of it · it’s 2 steps on a roll it fits, and 2 more for each Aura · attuned things don’t touch your Aura · a Summoner’s souls go on the lines, with their dice</p>
    <div class="grid2">${range(ROWS.attuned).map(attuneCard).join("")}</div>
  </section>`;

function front(stamp) {
  return `
<section class="page front">
  ${head()}
  ${pool()}
  ${roots()}
  ${roll()}
  ${conditionsAndScars()}
  ${goals()}
  ${kit()}
  ${attunement()}
  <footer class="stamp"><span>zidara.world/sheets</span><span>${stamp}</span></footer>
</section>`;
}

// ---------------------------------------------------------------- the back

// A Title: its words, its spread (5 in all), and its permissions, each with
// its Root to ring. A Boon takes two lines and rings nothing.
const titleCard = (t) => `
      <div class="card tcard">
        <div class="top">${numeral(NUMERALS[t - 1])}<span class="lines">${w(`title_${t}`, { size: 8.5 })}${w(`title_${t}_more`, { size: 8.5 })}</span></div>
        <div class="spread"><span class="lab">Spread</span>${ROOTS.map((r) => `<span class="sp"><i>${cap(r)}</i>${box(`title_${t}_${r}`, "sbox", 9)}</span>`).join("")}<span class="hint">5 in all</span></div>
        <div class="perms"><div class="phead"><span class="lab">Permissions</span><span class="lab">its Root</span></div>${range(ROWS.perms).map((j) => `<div class="perm">${w(`title_${t}_permission_${j}`, { size: 8 })}<span class="kind">${words(`title_${t}_permission_${j}_root`, ROOTS, (v) => v.charAt(0).toUpperCase())}</span></div>`).join("")}</div>
      </div>`;

// An archetype: its name, its mechanic, its Trait and its abilities.
const archCard = (a) => `
      <div class="card xcard">
        <div class="row">${w(`archetype_${a}`)}</div>
        <div class="lines"><div class="row"><span class="lab">Mechanic</span>${w(`archetype_${a}_mechanic`, { size: 8 })}</div>${w(`archetype_${a}_mechanic_more`, { size: 8 })}</div>
        <div class="lines"><div class="row"><span class="lab">Trait</span>${w(`archetype_${a}_trait`, { size: 8 })}</div>${w(`archetype_${a}_trait_more`, { size: 8 })}</div>
        <div class="perms"><span class="lab">Abilities</span>${range(ROWS.abilities).map((k) => w(`archetype_${a}_ability_${k}`, { size: 8 })).join("")}</div>
      </div>`;

// Each thread: its words, bond or hostile to ring, and a box for strained
// and one for snapped. A thread's a sentence, so it gets the width, and a
// long one wraps onto a second, smaller line when it's printed.
const bondCard = (b) => `
      <div class="card bcard">
        <div class="top"><div class="row"><span class="lab">Bond</span>${w(`bond_${b}`)}</div><span></span><span>strained</span><span>snapped</span></div>
        ${range(ROWS.threads).map((t) => `<div class="thread">${w(`bond_${b}_thread_${t}`, { size: 8, multi: true })}<span class="kind">${words(`bond_${b}_thread_${t}_kind`, THREADS, (v) => v)}</span>${tick(`bond_${b}_thread_${t}_strained`, "check")}${tick(`bond_${b}_thread_${t}_snapped`, "cross")}</div>`).join("")}
      </div>`;

function back(stamp) {
  return `
<section class="page back">
  <header class="slim">
    ${crest([], { size: "sm", label: "Zi’Dara" })}<div class="wordmark">Zi’Dara</div>
    <div class="doc">Who you are</div>
  </header>

  <section>
    ${tab("Titles")}
    <p class="hint">Write where each Title’s 5 Root points go, all on one or spread · ring each permission’s Root, B, M or S, for 1 on it · a permission’s what you can do, and what lets you bring a Root in · six at most · a Boon takes two lines and puts nothing on a Root</p>
    <div class="grid3">${range(ROWS.titles).map(titleCard).join("")}</div>
  </section>

  <section>
    ${tab("Archetypes")}
    <p class="hint">The same one twice is fine · its Trait’s always on · each ability’s 1 Aura when you use it, unless its line says more · six abilities at most</p>
    <div class="grid3">${range(ROWS.archetypes).map(archCard).join("")}</div>
  </section>

  <section>
    ${tab("Bonds")}
    <p class="hint">A bond’s usually a person, but it can be a faction, a place or a cause · ring each thread bond or hostile · tick the first box when it’s strained, and the second when it snaps</p>
    <div class="grid2">${range(ROWS.bonds).map(bondCard).join("")}</div>
  </section>

  <section class="blk notes">
    ${tab("Notes", "whatever your archetype’s holding, like a Shadow’s pool · trouble that follows you · whatever won’t fit")}
    <div class="lines">${range(ROWS.notes).map((n) => w(`notes_${n}`, { size: 9 })).join("")}</div>
  </section>

  <footer class="stamp"><span>zidara.world/sheets</span><span>${stamp}</span></footer>
</section>`;
}

export function characterSheet(stamp) {
  return `<style>@page { size: A4; margin: 0; }</style><main class="cs">${front(stamp)}${back(stamp)}</main>`;
}
