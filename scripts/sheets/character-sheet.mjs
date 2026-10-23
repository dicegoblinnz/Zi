// The character sheet: one A4 sheet, printed back to back. The front's for
// play and the back's for who you are. Every write-in space carries a field
// name (data-f, data-cb or data-radio), and scripts/build-sheets.mjs puts a
// fillable field over each one, so it can be typed into or printed blank.
// What's on it comes from Appendix A (#s-sheet-character).

const DICE = ["d2", "d4", "d6", "d8", "d10", "d12"];
const STAGES = ["Awakened", "Tempered", "Perfected"];
// Five Scars, each one a size more on the wound die's floor, and the fifth makes it d12.
const SCARS = ["d4", "d6", "d8", "d10", "d12"];
const range = (n) => Array.from({ length: n }, (_, i) => i + 1);

// Field markers. size is the typed text's size in points (0 fits it to the box).
const w = (name, { size, cls = "", align } = {}) =>
  `<span class="w ${cls}" data-f="${name}"${size !== undefined ? ` data-size="${size}"` : ""}${align ? ` data-align="${align}"` : ""}></span>`;
const box = (name) => `<span class="box" data-f="${name}" data-size="10" data-align="center"></span>`;
const tick = (name, look) => `<span class="tick" data-cb="${name}" data-look="${look}"></span>`;
const dice = (group, faces) => `<div class="dice">${faces.map((d) => `<span class="die" data-radio="${group}" data-value="${d}">${d}</span>`).join("")}</div>`;
const lines = (prefix, n, opts) => range(n).map((i) => w(`${prefix}_${i}`, opts)).join("");

const MARK = `<svg viewBox="0 0 40 40" aria-hidden="true"><path d="M20 2 38 20 20 38 2 20z" fill="none" stroke="#5b36b0" stroke-width="2.6" stroke-linejoin="round"/><path d="M20 12 28 20 20 28 12 20z" fill="#d7ae4b"/></svg>`;

const FIXED = [
  ["defend", "Defend", "dodge, parry, armour"],
  ["fight", "Fight", "melee and ranged"],
  ["move", "Move", "run, climb, jump and chase"],
  ["sneak", "Sneak", "unseen and unheard"],
  ["study", "Study", "look closely, know things"],
  ["talk", "Talk", "charm, lies and threats"],
];
const OWN_ROWS = 6;
const LADDER = [["1", "d2"], ["2", "d4"], ["3", "d6"], ["4", "d8"], ["5", "d10"], ["6", "d12"], ["7", "d12+d2"], ["8", "d12+d4"], ["9", "d12+d6"], ["10", "d12+d8"], ["11", "d12+d10"], ["12", "2d12"], ["18", "3d12"], ["24", "4d12"]];
const NUMERALS = ["I", "II", "III", "IV", "V", "VI"];

function front(stamp) {
  const scarRow = (i) => `
    <div class="scar"><span class="n">${i}</span><span class="floor">${SCARS[i - 1]}</span>${w(`scar_${i}`)}</div>`;
  const ownRow = (i) => `
    <tr><td class="name">${w(`set_${i}_name`, { cls: "bare" })}</td><td>${w(`set_${i}_lines`)}</td><td class="steps">${w(`set_${i}_steps`, { align: "center" })}</td><td class="dicecol">${w(`set_${i}_die`, { align: "center" })}</td></tr>`;
  return `
<section class="page front">
  <header class="head">
    <div class="brand">${MARK}<div><div class="wordmark">Zi’Dara</div><div class="doc">Character sheet</div></div></div>
    <div class="ident">
      <div class="field" style="flex:3"><span class="lab">Name</span>${w("name", { size: 11 })}</div>
      <div class="field" style="flex:1.2"><span class="lab">Pronouns</span>${w("pronouns")}</div>
      <div class="field" style="flex:1.8"><span class="lab">Player</span>${w("player")}</div>
    </div>
  </header>

  <div class="grid2">
    <div class="stack">
      <div class="card stats">
        <div class="statrow rs">
          <div class="stat"><h3>Aura</h3><p class="hint">full every scene · 5 to start</p>
            <div class="nums"><span class="lab">now</span>${box("aura_now")}<span class="lab">max</span>${box("aura_max")}</div></div>
          <div class="stat"><h3>Stride</h3><p class="hint">3 to start</p>
            <div class="nums">${box("stride")}</div></div>
        </div>
        <div class="statrow one">
          <div class="stat"><h3>Resolve</h3><p class="hint">a star for each Title · fill in the ones you’ve got · 1 back every scene, all of it after downtime</p>
            <div class="nums"><div class="stars">${range(7).map((i) => `<span class="star" data-cb="resolve_${i}" data-look="star"></span>`).join("")}</div><span class="lab">max</span>${box("resolve_max")}</div></div>
        </div>
        <div class="statrow one">
          <div class="stat"><h3>Confidence</h3><p class="hint">d6 at the start of every scene, a size up in clothes that fit it · back to d6 when it ends</p>
            <div class="row" style="margin-top:1.4mm">${dice("confidence", DICE)}<p class="hint" style="flex:1">d2 is shaken · d12 is fired up</p></div></div>
        </div>
      </div>
      <div class="card">
        <h3>Conditions</h3><p class="hint">the die that placed it, to ring · it steps down a size every round</p>
        ${range(4).map((i) => `<div class="cond">${w(`condition_${i}`)}${dice(`condition_${i}_die`, DICE)}</div>`).join("")}
      </div>
    </div>

    <div class="stack">
      <div class="card">
        <h3>Wound die</h3><p class="hint">d2 to start, and every Hurt puts it up a size · a heal has to beat it · downtime clears it to your Scars</p>
        <div class="row woundrow">${dice("wound_die", DICE)}<span class="blaze">→ Blaze</span></div>
        <p class="hint" style="margin-top:1.2mm"><b>Blaze:</b> a Hurt at d12. Declare something extraordinary, then die or take a Scar and leave the scene.</p>
        <p class="hint" style="margin-top:0.4mm"><b>Rest:</b> when a scene ends, roll your Confidence against it, and beat it to bring it down a size.</p>
        <div class="scars"><h3>Scars</h3><p class="hint">each is a Catch, and your wound die never goes below the last one · five and your next Blaze is your last</p>
          ${range(5).map(scarRow).join("")}</div>
      </div>
      <div class="card">
        <div class="goal"><div class="row" style="align-items:flex-end"><h3>Aspiration</h3>${w("aspiration")}</div>
          <div class="row">${dice("aspiration_die", DICE)}<p class="hint">past d12: a new archetype and Title, and a new Aspiration at d2</p></div></div>
        <div class="goal"><div class="row" style="align-items:flex-end"><h3>Party Goal</h3>${w("party_goal")}</div>
          <div class="row">${dice("party_goal_die", DICE)}<p class="hint">past d12: the crew’s done it, and everyone writes a new thread</p></div></div>
      </div>
    </div>
  </div>

  <div class="card">
    <h3>Set actions <span class="hint" style="font-family:var(--body);letter-spacing:0">1 step for the action and 1 for every line on it · anything else that fits is 1 Aura</span></h3>
    <table class="sa">
      <thead><tr><th class="name">Set action</th><th>What’s on it</th><th class="steps">Steps</th><th class="dicecol">Die</th></tr></thead>
      <tbody>
        ${FIXED.map(([id, name, what]) => `<tr><td class="name fixed">${name}<i>${what}</i></td><td>${w(`set_${id}_lines`)}</td><td class="steps">${w(`set_${id}_steps`, { align: "center" })}</td><td class="dicecol">${w(`set_${id}_die`, { align: "center" })}</td></tr>`).join("")}
        ${range(OWN_ROWS).map(ownRow).join("")}
      </tbody>
    </table>
    <div class="ladder">${LADDER.map(([s, d]) => `<div><b>${s}</b><span>${d}</span></div>`).join("")}</div>
  </div>

  <div class="grid2" style="flex:1">
    <div class="stack">
      <div class="card">
        <h3>Traits</h3><p class="hint">Passive · Triggered · Invoked · Per scene · Per downtime · Used</p>
        ${range(3).map((i) => `<div class="trait"><div class="row">${w(`trait_${i}`)}<span class="lab">type</span>${w(`trait_${i}_type`, { cls: "short" })}</div><span class="w two" data-f="trait_${i}_does" data-multi data-size="8"></span></div>`).join("")}
      </div>
      <div class="card notes" style="flex:1;display:flex;flex-direction:column">
        <h3>Notes</h3>
        <div class="w ruled" data-f="notes" data-multi data-size="9" style="height:auto;flex:1;border:0;margin-top:0.4mm"></div>
      </div>
    </div>
    <div class="card">
      <h3>Kit</h3>
      <div class="kit-cols">
        <div class="kit-sub"><span class="lab">Equipment · what you wear or wield</span>${lines("equipment", 3)}</div>
        <div class="kit-sub"><span class="lab">Utility · cross it off once it’s used</span>${lines("utility", 3)}</div>
      </div>
      <div class="kit-sub"><span class="lab">Keepsake · something that matters to you</span>${w("keepsake")}</div>
      <div class="kit-sub"><span class="lab">Bag · holds 10 · getting something out takes your action</span>
        <div class="kit-cols"><div>${range(5).map((i) => w(`bag_${i}`)).join("")}</div><div>${range(5).map((i) => w(`bag_${i + 5}`)).join("")}</div></div></div>
    </div>
  </div>

  <footer class="stamp"><span>zidara.world/sheets</span><span>${stamp}</span></footer>
</section>`;
}

function back(stamp) {
  const titleCard = (t) => `
    <div class="card tcard">
      <div class="top"><span class="numeral">${NUMERALS[t - 1]}</span><span class="w two" data-f="title_${t}" data-multi data-size="8.5"></span></div>
      <div class="arch"><span class="lab">Archetype</span>${w(`title_${t}_archetype`)}</div>
      <div class="perms">${lines(`title_${t}_permission`, 6, { size: 8.5 })}</div>
    </div>`;
  const attuneCard = (a) => `
    <div class="card acard">
      <div class="top"><span class="lab">Thing</span>${w(`attune_${a}_thing`)}</div>
      <div class="mid"><span class="lab">Material</span>${w(`attune_${a}_material`)}<div class="stage">${STAGES.map((s) => `<span class="word" data-radio="attune_${a}_stage" data-value="${s.toLowerCase()}">${s}</span>`).join("")}</div></div>
      <div class="pair"><div><span class="lab">Catch</span>${w(`attune_${a}_catch`)}</div><div><span class="lab">Burden</span>${w(`attune_${a}_burden`)}</div></div>
      <div class="perms">${lines(`attune_${a}_permission`, 6)}</div>
    </div>`;
  const bondCard = (b) => `
    <div class="card bcard">
      <div class="top"><span class="lab">Bond</span>${w(`bond_${b}`)}</div>
      ${range(4).map((t) => `<div class="thread">${w(`bond_${b}_thread_${t}`, { size: 8 })}${tick(`bond_${b}_thread_${t}_strained`, "check")}${tick(`bond_${b}_thread_${t}_snapped`, "cross")}</div>`).join("")}
    </div>`;
  return `
<section class="page back">
  <header class="slim">
    <div class="brand">${MARK}<div class="wordmark">Zi’Dara</div></div>
    <div class="doc">Who you are</div>
  </header>

  <section>
    <h2 class="sec">Titles</h2>
    <p class="hint" style="margin:-0.6mm 0 1.6mm">Your Title and its archetype · I and II to start, with three permissions each, and III to VI earned in play, with one · a permission is one word or a doing word and how, what or where, on two set actions at most · a Boon takes two lines</p>
    <div class="grid3">${range(6).map(titleCard).join("")}</div>
  </section>

  <section>
    <h2 class="sec">Attunement</h2>
    <p class="hint" style="margin:-0.6mm 0 1.6mm">2 slots, on top of what you carry · ring its stage · a Summoner’s summoning attunement writes its souls and their dice on the lines</p>
    <div class="grid2">${range(2).map(attuneCard).join("")}</div>
  </section>

  <section>
    <h2 class="sec">Bonds</h2>
    <p class="hint" style="margin:-0.6mm 0 1.6mm">A bond’s usually a person, but it can be a faction, a place or a cause, and each thread is one truth you share · tick the first box when it’s strained, and the second when it snaps</p>
    <div class="grid2">${range(6).map(bondCard).join("")}</div>
  </section>

  <footer class="stamp"><span>zidara.world/sheets</span><span>${stamp}</span></footer>
</section>`;
}

export function characterSheet(stamp) {
  return `<style>@page { size: A4; margin: 0; }</style><main class="cs">${front(stamp)}${back(stamp)}</main>`;
}
