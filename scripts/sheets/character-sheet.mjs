// The character sheet: one A4 sheet, printed back to back. The front's for
// play and the back's who you are. Every write-in space carries a field name
// (data-f, data-cb or data-radio), and scripts/build-sheets.mjs puts a
// fillable field over each one, so it can be typed into or printed blank.
// src/companion/print.js fills them by name when someone prints a character,
// so keep every name as it is. What's on it comes from Appendix A
// (#s-sheet-character), and the pieces are the kit's (src/kit/kit.js), drawn
// in its Paper theme: dice in their real shapes, the crest, Resolve's gems,
// Aura's hexes and the Scars.
import { die, crest, mini, aura, resolve, SIZES } from "../../src/kit/kit.js";
import { stepsToDice, diceLabel } from "../../src/companion/dice.js";

const STAGES = ["Awakened", "Tempered", "Perfected"];
const KINDS = ["bond", "hostile"];
// Five Scars, each one a size more on the wound die's floor, and the fifth makes it d12.
const SCARS = [4, 6, 8, 10, 12];
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
const ringDice = (group, { own = "you", big = false } = {}) =>
  `<div class="dice${big ? " big" : ""}">${SIZES.map((d) => `<span class="ring" data-radio="${group}" data-value="d${d}">${paperDie(d, own)}</span>`).join("")}</div>`;
const svgOf = (html) => html.match(/<svg[\s\S]*<\/svg>/)[0];
const GEM = svgOf(resolve(0, 1));
const HEX = svgOf(aura(0, 1));
// A Title's numeral sits on a diamond cut like the crest's.
const numeral = (n) => `<span class="numeral"><svg viewBox="0 0 64 64" aria-hidden="true"><path d="M32 2.6 L61.4 32 L32 61.4 L2.6 32 Z" style="fill:var(--ink)"/></svg><b>${n}</b></span>`;

const FIXED = [
  ["defend", "Defend", "dodge, parry, armour"],
  ["fight", "Fight", "melee and ranged"],
  ["move", "Move", "run, climb, jump and chase"],
  ["sneak", "Sneak", "unseen and unheard"],
  ["study", "Study", "look closely, know things"],
  ["talk", "Talk", "charm, lies and threats"],
];
const OWN_ROWS = 6;
// Steps into dice, straight off the companion's table, so the two can't differ.
const LADDER = [...range(12), 18, 24].map((s) => [s, stepsToDice(s)]);
const NUMERALS = ["I", "II", "III", "IV", "V", "VI"];

function front(stamp) {
  const scarRow = (i) => `
      <div class="scar"><span class="cut"></span><span class="floor">${mini(SCARS[i - 1], { own: "harm" })}d${SCARS[i - 1]}</span>${w(`scar_${i}`)}</div>`;
  const row = (name, what, id = name) => `
        <tr><td class="name${what ? " fixed" : ""}">${what ? `${name}<i>${what}</i>` : w(`set_${id}_name`)}</td><td class="on">${w(`set_${id}_lines`)}</td><td class="steps">${w(`set_${id}_steps`, { size: 10, align: "center" })}</td><td class="die">${w(`set_${id}_die`, { size: 10.5, align: "center" })}</td></tr>`;
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
    <div class="cell"><h2>Aura<small>full every scene · 5 to start</small></h2>
      <div class="row"><span class="lab">now</span><span class="hex">${HEX}<span class="f" data-f="aura_now" data-size="11" data-align="center"></span></span><span class="lab">max</span><span class="hex">${HEX}<span class="f" data-f="aura_max" data-size="11" data-align="center"></span></span></div></div>
    <div class="cell"><h2>Resolve<small>a gem for each Title, and fill in the ones you’ve got · 1 back every scene, all of it after downtime</small></h2>
      <div class="row"><div class="gems">${range(7).map((i) => `<span class="gem" data-cb="resolve_${i}" data-look="gem">${GEM}</span>`).join("")}</div><span class="lab">max</span>${box("resolve_max")}</div></div>
    <div class="cell"><h2>Stride<small>3 to start</small></h2>${box("stride")}</div>
  </div>

  <div class="grid">
    <section class="blk track">
      ${tab("Confidence", "d6 at the start of every scene")}
      ${ringDice("confidence", { big: true })}
      <div class="marks"><span>shaken</span><span></span><span>start</span><span></span><span></span><span>fired up</span></div>
      <div class="moves"><b>Up</b><span>a size when a die wins, or you stop a telegraph</span><b>Down</b><span>a size when your wound die goes up, or every die misses</span></div>
      <p class="hint">A size up in clothes that fit the scene, and back to d6 when it ends.</p>
    </section>

    <section class="blk track wound">
      ${tab("Wound die", "d2 to start")}
      <div class="row">${ringDice("wound_die", { own: "harm", big: true })}<div class="blaze"><b>→ Blaze</b><span>a Hurt at d12</span></div></div>
      <div class="moves"><b>Up</b><span>a size for every Hurt</span><b>Rest</b><span>when a scene ends, roll your Confidence against it, and beat it to bring it down a size</span></div>
      <p class="hint">A heal has to beat it. Downtime clears it to your Scars.</p>
    </section>

    <section class="blk">
      ${tab("Conditions", "ring the die that placed it · it steps down a size every round")}
      ${range(4).map((i) => `<div class="cond">${w(`condition_${i}`)}${ringDice(`condition_${i}_die`)}</div>`).join("")}
    </section>

    <section class="blk scars">
      ${tab("Scars", "five, and your next Blaze is your last")}
      <p class="hint"><b>Blaze:</b> declare something extraordinary, then die, or take a Scar and leave the scene. Each Scar’s a Catch, and your wound die never goes below the last one’s size.</p>
      <div class="rows">${range(5).map(scarRow).join("")}</div>
    </section>
  </div>

  <section class="blk">
    ${tab("Set actions", "1 step for the action and 1 for every line on it · anything else that fits is 1 Aura")}
    <table class="sa">
      <thead><tr><th class="name">Set action</th><th class="on">What’s on it</th><th class="steps">Steps</th><th class="die">Die</th></tr></thead>
      <tbody>${FIXED.map(([id, name, what]) => row(name, what, id)).join("")}${range(OWN_ROWS).map((i) => row(String(i), "")).join("")}
      </tbody>
    </table>
    <div class="ladder" aria-label="Steps into dice">${LADDER.map(([s, dice]) => `<div><b>${s}</b><span class="shapes${dice.length > 2 ? " many" : ""}">${dice.map((d) => mini(d)).join("")}</span><span>${diceLabel(dice).replace(/\s/g, "")}</span></div>`).join("")}</div>
  </section>

  <section class="goals">${goal("aspiration", "Aspiration", "Past d12: a new archetype and Title, and a new Aspiration at d2.")}${goal("party_goal", "Party Goal", "Past d12: the crew’s done it, and everyone writes a new thread.")}
  </section>

  <div class="grid">
    <section class="blk">
      ${tab("Traits", "Passive · Triggered · Invoked · Per scene · Per downtime · Used")}
      ${range(3).map((i) => `<div class="trait"><div class="row">${w(`trait_${i}`)}<span class="lab">type</span>${w(`trait_${i}_type`, { cls: "short" })}</div><span class="w two" data-f="trait_${i}_does" data-multi data-size="8"></span></div>`).join("")}
    </section>
    <section class="blk kit">
      ${tab("Kit")}
      <div class="cols">
        <div class="sub"><span class="lab">Equipment · what you wear or wield</span>${lines("equipment", 3)}</div>
        <div class="sub"><span class="lab">Utility · cross it off once it’s used</span>${lines("utility", 3)}</div>
      </div>
      <div class="sub row"><span class="lab">Keepsake · something that matters to you</span>${w("keepsake")}</div>
      <div class="sub"><span class="lab">Bag · holds 10 · getting something out takes your action</span>
        <div class="cols"><div>${range(5).map((i) => w(`bag_${i}`)).join("")}</div><div>${range(5).map((i) => w(`bag_${i + 5}`)).join("")}</div></div></div>
    </section>
  </div>

  <section class="blk notes">
    ${tab("Notes", "a thread that won’t fit on its bond, and whatever your archetype’s holding, like a Shadow’s pool")}
    <div class="w ruled" data-f="notes" data-multi data-size="9"></div>
  </section>

  <footer class="stamp"><span>zidara.world/sheets</span><span>${stamp}</span></footer>
</section>`;
}

function back(stamp) {
  const titleCard = (t) => `
      <div class="card tcard">
        <div class="top">${numeral(NUMERALS[t - 1])}<span class="w two" data-f="title_${t}" data-multi data-size="8.5"></span></div>
        <div class="row"><span class="lab">Archetype</span>${w(`title_${t}_archetype`)}</div>
        <div class="perms">${lines(`title_${t}_permission`, 6, { size: 8.5 })}</div>
      </div>`;
  const attuneCard = (a) => `
      <div class="card acard">
        <div class="row"><span class="lab">Thing</span>${w(`attune_${a}_thing`)}</div>
        <div class="row"><span class="lab">Material</span>${w(`attune_${a}_material`)}<div class="stage">${STAGES.map((s) => `<span class="word" data-radio="attune_${a}_stage" data-value="${s.toLowerCase()}">${s}</span>`).join("<i>›</i>")}</div></div>
        <div class="pair"><div><span class="lab">Catch</span>${w(`attune_${a}_catch`)}</div><div><span class="lab">Burden</span>${w(`attune_${a}_burden`)}</div></div>
        <div class="perms">${lines(`attune_${a}_permission`, 6)}</div>
      </div>`;
  // Each thread: its truth, bond or hostile to ring, and a box for strained
  // and one for snapped. A thread's a sentence, so it gets the width, and a
  // long one wraps onto a second, smaller line when it's printed.
  const bondCard = (b) => `
      <div class="card bcard">
        <div class="top"><div class="row"><span class="lab">Bond</span>${w(`bond_${b}`)}</div><span></span><span>strained</span><span>snapped</span></div>
        ${range(4).map((t) => `<div class="thread">${w(`bond_${b}_thread_${t}`, { size: 8, multi: true })}<span class="kind">${KINDS.map((k) => `<span class="word" data-radio="bond_${b}_thread_${t}_kind" data-value="${k}">${k}</span>`).join("<i></i>")}</span>${tick(`bond_${b}_thread_${t}_strained`, "check")}${tick(`bond_${b}_thread_${t}_snapped`, "cross")}</div>`).join("")}
      </div>`;
  return `
<section class="page back">
  <header class="slim">
    ${crest([], { size: "sm", label: "Zi’Dara" })}<div class="wordmark">Zi’Dara</div>
    <div class="doc">Who you are</div>
  </header>

  <section>
    ${tab("Titles")}
    <p class="hint">Your Title and its archetype · I and II to start, with three permissions each, and III to VI earned in play, with one · a permission is one word, or a doing word and how, what or where, on two set actions at most · a Boon takes two lines</p>
    <div class="grid3">${range(6).map(titleCard).join("")}</div>
  </section>

  <section>
    ${tab("Attunement")}
    <p class="hint">One thing to start, and more later in downtime, on top of what you carry · ring its stage · a Summoner’s summoning attunement writes its souls and their dice on the lines</p>
    <div class="grid2">${range(2).map(attuneCard).join("")}</div>
  </section>

  <section>
    ${tab("Bonds")}
    <p class="hint">A bond’s usually a person, but it can be a faction, a place or a cause · ring each thread bond or hostile, and tick it when it’s strained, and again when it snaps</p>
    <div class="grid2">${range(6).map(bondCard).join("")}</div>
  </section>

  <footer class="stamp"><span>zidara.world/sheets</span><span>${stamp}</span></footer>
</section>`;
}

export function characterSheet(stamp) {
  return `<style>@page { size: A4; margin: 0; }</style><main class="cs">${front(stamp)}${back(stamp)}</main>`;
}
