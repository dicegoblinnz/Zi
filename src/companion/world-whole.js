// A whole world into a campaign (stage 14 of notes/builder-plan.md): Night
// City or Abnu, written whole rather than dealt (content/worlds/, built into
// public/worlds/<id>.json by scripts/worlds.mjs), made into the changes that
// put it in a campaign's world in one go. Pure, so the World screen and the
// checks make it the same way, and going to another year (stage 19) can too.
//
// Everything comes in hidden from the crew and hers to change: the factions
// onto the board, makers first so each mini faction sits under the faction
// that made it, their threads toward each other by their new ids, and where
// each one sits as sits; the places and people into the pages; the map,
// drawn, with a pin on every place; and How it came to be into the record,
// with the world's recipe and nothing dealt, last, the way Done sends a
// build. Every card and page keeps what the file said as its book (the
// world's id as from, its key, a hash of it and when the file was built), so
// when the file changes she gets the note the book's changes give.

// FNV-1a, so a card that hasn't changed hashes the same on every phone.
export function hashOf(card) {
  const text = JSON.stringify(card);
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(36);
}

// The map's shapes as a campaign keeps them: numbers and keys, and what it
// calls its districts and parts. The roads' and landmarks' names stay
// behind, since nothing draws them and they'd only be words on a phone that
// hasn't been shown those places.
export function drawingOf(map, areas = null) {
  const g = map.ground ?? {};
  const ground = g.land ? { land: g.land, deep: g.deep ?? [] } : { sea: g.sea };
  return {
    ground: { ...ground, water: g.water ?? [], hills: g.hills ?? [] },
    districts: map.districts ?? {},
    parts: map.parts ?? {},
    wilds: map.wilds ?? [],
    roads: (map.roads ?? []).map((r) => ({ pts: r.pts })),
    marks: (map.marks ?? []).map((m) => ({ kind: m.kind, at: m.at })),
    ...(areas ? { areas } : {}),
  };
}

// The changes that bring the world in, and what's in it. newId() makes the
// ids the World screen makes, and now is when the record's written.
export function wholeOps(world, newId, now = Date.now()) {
  const at = Number(world.at) || 0;
  const book = (key, card) => ({ from: world.id, key, h: hashOf(card), at, was: card });
  const fid = new Map(world.factions.map((f) => [f.key, newId()]));
  const pages = [...(world.places ?? []), ...(world.people ?? [])];
  const pid = new Map(pages.map((p) => [p.key, newId()]));
  const ids = (list, more = {}) => (list ?? []).map((x) => ({ ...x, id: newId(), ...more }));
  const ops = [];

  // The factions, makers first, since a mini faction needs its maker on the board.
  const makersFirst = [...world.factions].sort((a, b) => Number(Boolean(a.of)) - Number(Boolean(b.of)));
  for (const f of makersFirst) {
    const c = f.card;
    ops.push({
      o: "new",
      f: {
        id: fid.get(f.key), name: c.name, about: c.about, want: c.want, face: c.face, secret: c.secret, more: c.more, note: c.note,
        mini: Boolean(f.of), parent: f.of ? fid.get(f.of) ?? null : null, outs: c.outs ?? [],
        res: ids(c.res).map((x) => ({ ...x, left: x.x })),
        assets: ids(c.assets).map((x) => ({ ...x, left: x.x, off: x.off === true })),
        agendas: ids(c.agendas, { done: false }),
        pub: ids(c.pub), mor: ids(c.mor), loy: ids(c.loy),
        threads: (c.threads ?? []).filter((t) => fid.has(t.to)).map((t) => ({ id: newId(), text: t.text, kind: t.kind, s: t.s, to: fid.get(t.to) })),
        ...(f.seat && pid.has(f.seat) ? { sits: pid.get(f.seat) } : {}),
        shown: {},
        book: book(f.key, c),
      },
    });
  }

  // The places, then the people, each a page with ids on its lines.
  for (const p of pages) {
    const c = p.card;
    const lines = (l) => (c[l] ?? []).map((x) => (typeof x === "string" ? { id: newId(), text: x } : { id: newId(), ...x }));
    ops.push({ o: "p-new", p: { ...c, id: pid.get(p.key), here: lines("here"), ground: lines("ground"), stakes: lines("stakes"), tags: lines("tags"), teles: lines("teles"), hooks: lines("hooks"), shown: {}, book: book(p.key, c) } });
  }

  // The map, drawn, a pin on every place where the file puts it. On a map of
  // a whole world, a place inside a city tucks behind the city's name.
  const M = world.map;
  let pins = 0;
  if (M) {
    const [w, h] = M.size;
    const places = new Map((world.places ?? []).map((p) => [p.key, p]));
    const landed = Boolean(M.ground?.land);
    const pinOf = new Map();
    const list = Object.entries(M.pins).filter(([k]) => pid.has(k)).map(([k, [x, y]]) => {
      const pl = places.get(k);
      const id = newId();
      pinOf.set(k, id);
      const tuck = landed && !pl?.area && places.get(pl?.in)?.area === "part";
      return { id, x: x / w, y: y / h, to: { k: "p", id: pid.get(k) }, name: "", shown: false, ...(pl?.area ? { area: pl.area } : {}), ...(tuck ? { tuck: true } : {}) };
    });
    pins = list.length;
    ops.push({ o: "m-new", m: { id: newId(), name: world.title, key: "", w, h, of: "", shown: false, pins: list, draw: drawingOf(M, world.areas), from: world.id, opens: pinOf.get(M.opens) ?? "" } });
  }

  // How it came to be, with the world's recipe and nothing dealt, last.
  const r = world.recipe ?? {};
  const history = (world.history ?? []).map((l) => ({ id: newId(), text: l.text, age: l.age, ...(l.hers ? { hers: true } : {}) }));
  ops.push({ o: "wb-set", b: { world: world.id, recipe: { region: r.region, era: r.era, twist: r.twist ?? null }, dials: { tense: 1, strange: 1, rich: 1, ruled: 1, ...(r.dials ?? {}) }, seed: "", dealt: null, history, shown: [], at: now } });

  return { ops, counts: { factions: world.factions.length, places: (world.places ?? []).length, people: (world.people ?? []).length, pins, lines: history.length } };
}

// The file's version of a card or page she brought in, as it is now, with
// its hash and when the file was built, or null if the file hasn't got it.
export function cardNow(world, key, kind = "faction") {
  if (!world) return null;
  const list = kind === "faction" ? world.factions : [...(world.places ?? []), ...(world.people ?? [])];
  const c = list.find((x) => x.key === key)?.card;
  return c ? { ...c, h: hashOf(c), at: Number(world.at) || 0 } : null;
}
