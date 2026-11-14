// The home page for someone who's been here before (Mo's 1 Nov pick): their
// characters and their games first, read off this phone the way the companion
// keeps them (zi-characters in store.js, zi-account in sync.js and
// zi-campaigns in campaigns.js), so it works with no signal. The page's head
// has already set data-home="back" before anything painted, so nothing jumps
// about. Signing in, syncing and fetching campaigns stay the companion's job,
// and this only draws what the phone last saw. The kit's only fetched for
// someone who's back, so someone new doesn't wait on it.
let kit = null;

const MOST = 4;
const read = (key) => {
  try {
    return JSON.parse(localStorage.getItem(key) || "null");
  } catch {
    return null;
  }
};
// A crest beside a name says nothing a screen reader needs.
const quiet = (html) => html.replace(/role="img" aria-label="[^"]*"/, 'aria-hidden="true"');
const players = (n) => (n === 1 ? "1 player" : n ? `${n} players` : "nobody’s joined yet");
const go = `<svg class="hm-go" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7"></path></svg>`;

function draw(box) {
  const { crest, esc } = kit;
  let crew = {};
  try {
    crew = JSON.parse(document.getElementById("hm-crew-data")?.textContent || "{}");
  } catch {}
  const me = read("zi-account");
  const kept = read("zi-campaigns");
  // The campaigns this phone last saw, if they're this account's.
  const games = me && kept && kept.user === me.id && Array.isArray(kept.list) ? kept.list.filter((g) => g && typeof g.id === "string") : null;
  const list = read("zi-characters")?.characters;
  const chars = (Array.isArray(list) ? list : []).filter((c) => c && typeof c.id === "string");
  // One of the crew as written reads off the rules, and one of your own (or a
  // crew member made your own) off its build.
  const lookOf = (ch) => {
    const c = crew[ch.crew];
    if (c && !ch.build) return { title: c.title, archs: c.archs };
    const b = ch.build && typeof ch.build === "object" ? ch.build : {};
    const archs = (Array.isArray(b.archs) ? b.archs : []).filter((a) => typeof a === "string" && a);
    const title = Array.isArray(b.titles) && typeof b.titles[0]?.text === "string" ? b.titles[0].text.trim() : "";
    return { title, archs };
  };
  const card = (ch) => {
    const { title, archs } = lookOf(ch);
    const camp = games?.find((g) => g.role === "player" && g.character?.id === ch.id);
    return `<li><a class="card hm-char" href="/characters/?c=${encodeURIComponent(ch.id)}">
      ${quiet(crest(archs, { strict: false }))}
      <span class="hm-char-name">${esc(ch.name || "No name yet")}</span>
      ${title ? `<span class="hm-char-title">${esc(title)}</span>` : ""}
      ${camp ? `<span class="hm-char-camp">${esc(camp.name)}</span>` : ""}</a></li>`;
  };
  const game = (g) => `<li><a class="card hm-game${g.role === "gm" ? " is-gm" : ""}" href="/characters/?camp=${encodeURIComponent(g.id)}">
    <span class="hm-game-text"><b>${esc(g.name)}</b><small>${g.role === "gm" ? `You’re the GM · ${players(g.players)}` : `${g.character ? `You play ${esc(g.character.name)}` : "No character here yet"} · run by ${esc(g.gm)}`}</small></span>${go}</a></li>`;
  const more = chars.length > MOST ? `<a href="/characters/">All ${chars.length}</a>` : "";
  const make = `<a class="hm-make" href="/characters/?build"><span class="hm-plus" aria-hidden="true">+</span>Make a new character</a>`;
  const theirs = me
    ? `<div class="hm-head"><h2 id="hm-games">Your games</h2><a href="/characters/?camps">Campaigns</a></div>
      ${games?.length ? `<ul class="hm-games">${games.map(game).join("")}</ul>`
        : `<p class="hm-none">${games ? "No campaigns yet. Start one and you’re its GM, or open the link your GM sent you." : "Your campaigns show up here once Campaigns has opened with a signal."} <a href="/characters/?camps">Campaigns</a></p>`}`
    : `<p class="hm-none">Sign in and your characters come with you to any phone, and you can play in your GM’s campaigns. <a href="/account/">Sign in</a></p>`;
  box.innerHTML = `<div class="hm-head"><h1 id="hm-yours">Your characters</h1>${more}</div>
    ${chars.length ? `<ul class="hm-chars">${chars.slice(0, MOST).map(card).join("")}</ul>` : ""}${make}
    ${theirs}`;
}

async function show(box) {
  try {
    kit ??= await import("../kit/kit.js");
    draw(box);
  } catch {
    // Something on the phone that can't be read: show the page for someone new.
    document.documentElement.removeAttribute("data-home");
  }
}
const box = document.querySelector("[data-home-back]");
if (box && document.documentElement.getAttribute("data-home") === "back") show(box);
// Characters made or deleted in another tab change what's here.
addEventListener("storage", (e) => {
  if (!box || !["zi-characters", "zi-account", "zi-campaigns"].includes(e.key)) return;
  const back = (read("zi-characters")?.characters?.length ?? 0) > 0 || Boolean(read("zi-account"));
  if (!back) return document.documentElement.removeAttribute("data-home");
  document.documentElement.setAttribute("data-home", "back");
  show(box);
});
