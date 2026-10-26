// The party sheet, the one the whole crew shares (Appendix A's crew page): the
// crew's name, its Reputations, Power, resources and assets, the Party Goal,
// projects, party holdings and the people the crew relies on. Every player's
// Aspiration's on it too, read off their own sheets (party.js).
//
// Each campaign has one, kept by the Worker (src/worker/party.js) and changed a
// piece at a time from any phone in the campaign. The phone and the Worker both
// change it with apply(), so a change looks the same on the phone the moment
// it's made as it does once the Worker's got it. A change is one of these:
//
//   { o: "start", res, assets }       the book's new crew, on a sheet nobody's touched
//   { o: "name", v }                  the crew's name
//   { o: "goal", v }                  the Goal's words
//   { o: "climb", by: 1 or -1, id? }  the Goal, or a project, up or down one
//   { o: "die", v, done?, id? }       the Goal, or a project, set straight to a size
//   { o: "next", v }                  the next Goal, at d2
//   { o: "add", l, item, at? }        a line on one of the lists
//   { o: "edit", l, id, f, v }        one part of a line
//   { o: "drop", l, id }              a line off the sheet
//
// The lists are reps (Reputations), res (resources), assets, projects,
// holdings and people. Two changes that cross both land: two climbs make two,
// and a line added on one phone and another on the next are both there.

export const MAX = { name: 60, goal: 160, line: 120, asset: 60, does: 240, then: 160, list: 24, projects: 6 };
export const LISTS = ["reps", "res", "assets", "projects", "holdings", "people"];
const ID = /^[a-z0-9-]{2,24}$/;

// One line of words: no line breaks or control characters, no doubled spaces.
export const line = (v, max) => String(v ?? "").normalize("NFC").replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
// A die that climbs: d2 to d12.
const size = (v) => {
  const n = Number(v);
  return Number.isInteger(n) && n >= 2 && n <= 12 && n % 2 === 0 ? n : null;
};

export function blank() {
  return { made: false, name: "", goal: { text: "", die: 2, done: false }, reps: [], res: [], assets: [], projects: [], holdings: [], people: [], bonds: {}, by: null, at: 0 };
}

// A line on one of the lists, tidied, or null if it can't go on.
function itemOf(l, x) {
  if (!x || typeof x !== "object" || !ID.test(String(x.id ?? ""))) return null;
  const id = x.id;
  if (l === "assets") {
    const text = line(x.text, MAX.asset);
    return text ? { id, text, does: line(x.does, MAX.does), power: x.power === true, off: x.off === true } : null;
  }
  if (l === "projects") {
    const text = line(x.text, MAX.line);
    const die = size(x.die) ?? 2;
    return text ? { id, text, then: line(x.then, MAX.then), die, done: x.done === true && die === 12 } : null;
  }
  const text = line(x.text, MAX.line);
  return text ? { id, text } : null;
}
// The parts of a line that can be changed on their own.
const FIELDS = { reps: ["text"], res: ["text"], assets: ["text", "does", "power", "off"], projects: ["text", "then"], holdings: ["text"], people: ["text"] };

// A sheet as it came from somewhere else, tidied so nothing in it is anything
// but words and numbers in the right places.
export function readable(raw) {
  const doc = blank();
  if (!raw || typeof raw !== "object") return doc;
  doc.made = raw.made === true;
  doc.name = line(raw.name, MAX.name);
  const g = raw.goal && typeof raw.goal === "object" ? raw.goal : {};
  doc.goal = { text: line(g.text, MAX.goal), die: size(g.die) ?? 2, done: g.done === true && size(g.die) === 12 };
  for (const l of LISTS) {
    const seen = new Set();
    doc[l] = (Array.isArray(raw[l]) ? raw[l] : []).map((x) => itemOf(l, x)).filter((x) => x && !seen.has(x.id) && seen.add(x.id)).slice(0, l === "projects" ? MAX.projects : MAX.list);
  }
  if (raw.bonds && typeof raw.bonds === "object") {
    for (const [id, b] of Object.entries(raw.bonds)) {
      if (!/^[a-z0-9]{2,20}$/.test(id) || !b || typeof b !== "object" || !["whole", "strained", "snapped"].includes(b.s)) continue;
      doc.bonds[id] = { a: String(b.a ?? ""), b: String(b.b ?? ""), w: line(b.w, 240), s: b.s, v: Number.isInteger(b.v) ? b.v : 1, by: typeof b.by === "string" ? b.by : null, at: Number(b.at) || 0 };
    }
  }
  doc.by = typeof raw.by === "string" ? raw.by : null;
  doc.at = Number(raw.at) || 0;
  return doc;
}

// The Goal, or a project by its id.
const climber = (doc, id) => (id == null ? doc.goal : doc.projects.find((p) => p.id === id) ?? null);

// One change, made to doc. It says whether anything changed.
export function apply(doc, op) {
  if (!op || typeof op !== "object") return false;
  const was = JSON.stringify(doc);
  switch (op.o) {
    case "start": {
      if (doc.made) return false;
      doc.made = true;
      for (const l of ["res", "assets"]) {
        const add = (Array.isArray(op[l]) ? op[l] : []).map((x) => itemOf(l, x)).filter((x) => x && !doc[l].some((y) => y.id === x.id));
        doc[l] = [...add, ...doc[l]].slice(0, MAX.list);
      }
      return true;
    }
    case "name":
      doc.name = line(op.v, MAX.name);
      break;
    case "goal":
      doc.goal.text = line(op.v, MAX.goal);
      break;
    case "next":
      doc.goal = { text: line(op.v, MAX.goal), die: 2, done: false };
      break;
    case "climb": {
      // Past d12 it's done. A step back from done is the d12 again, and
      // nothing goes below d2.
      const t = climber(doc, op.id);
      if (!t) return false;
      if (op.by === -1) {
        if (t.done) t.done = false;
        else t.die = Math.max(2, t.die - 2);
      } else if (!t.done) {
        if (t.die >= 12) t.done = true;
        else t.die += 2;
      }
      break;
    }
    case "die": {
      const t = climber(doc, op.id);
      const v = size(op.v);
      if (!t || v == null) return false;
      t.die = v;
      t.done = op.done === true && v === 12;
      break;
    }
    case "add": {
      if (!LISTS.includes(op.l)) return false;
      const list = doc[op.l];
      const item = itemOf(op.l, op.item);
      if (!item || list.some((x) => x.id === item.id) || list.length >= (op.l === "projects" ? MAX.projects : MAX.list)) return false;
      const at = Number.isInteger(op.at) && op.at >= 0 && op.at < list.length ? op.at : list.length;
      list.splice(at, 0, item);
      break;
    }
    case "edit": {
      if (!LISTS.includes(op.l) || !FIELDS[op.l].includes(op.f)) return false;
      const item = doc[op.l].find((x) => x.id === op.id);
      if (!item) return false;
      const next = itemOf(op.l, { ...item, [op.f]: op.v });
      if (!next) return false;
      Object.assign(item, next);
      break;
    }
    case "drop": {
      if (!LISTS.includes(op.l)) return false;
      doc[op.l] = doc[op.l].filter((x) => x.id !== op.id);
      break;
    }
    default:
      return false;
  }
  return JSON.stringify(doc) !== was;
}

// What puts a change back, worked out from the sheet before it's made.
export function undoOf(doc, op) {
  const t = op.o === "climb" || op.o === "die" ? climber(doc, op.id) : null;
  const item = op.l && Array.isArray(doc[op.l]) ? doc[op.l].find((x) => x.id === (op.id ?? op.item?.id)) : null;
  switch (op.o) {
    case "name":
      return [{ o: "name", v: doc.name }];
    case "goal":
      return [{ o: "goal", v: doc.goal.text }];
    case "next":
      return [{ o: "goal", v: doc.goal.text }, { o: "die", v: doc.goal.die, done: doc.goal.done }];
    case "climb":
    case "die":
      return t ? [{ o: "die", v: t.die, done: t.done, ...(op.id ? { id: op.id } : {}) }] : [];
    case "add":
      return [{ o: "drop", l: op.l, id: op.item?.id }];
    case "drop":
      return item ? [{ o: "add", l: op.l, item: { ...item }, at: doc[op.l].indexOf(item) }] : [];
    case "edit":
      return item ? [{ o: "edit", l: op.l, id: op.id, f: op.f, v: item[op.f] }] : [];
    default:
      return [];
  }
}

// The crew's Power: 1 step, plus 1 for each asset that adds Power and has a
// resource paying for it.
export const powerOf = (doc) => 1 + doc.assets.filter((a) => a.power && !a.off).length;

// What pays for what. Every asset needs a resource paying for it, and one
// that isn't paying for anything is an extra resource.
export function moneyOf(doc) {
  const paying = doc.assets.filter((a) => !a.off).length;
  return { res: doc.res.length, assets: doc.assets.length, paying, extra: Math.max(0, doc.res.length - paying), short: Math.max(0, paying - doc.res.length) };
}
