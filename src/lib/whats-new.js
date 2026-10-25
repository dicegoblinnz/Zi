// What's new: every section a recent change log entry links to gets marked
// New on its chapter page, in the contents and on the rules page. It's read
// straight off the change log, so marking something new is just writing the
// change log entry the way CLAUDE.md asks (with links to the sections).
import book from "../generated/book.json";

// A change is New for a month from the day the site's built, and only the
// latest batch counts: entries within a week of the newest one, so a run of
// changes that went to the table together is marked together.
export const NEW_FOR_DAYS = 30;
export const BATCH_DAYS = 7;

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const label = (iso) => {
  const [, m, d] = iso.split("-").map(Number);
  return `${d} ${MONTHS[m - 1]}`;
};
const plain = (html) => html.replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&#39;|&rsquo;|’/g, "’").trim();

function read(now = new Date()) {
  const html = book.changes?.html ?? "";
  const dates = [...html.matchAll(/<h2 id="c-(\d{4}-\d{2}-\d{2})"/g)].map((m) => m[1]).sort();
  const newest = dates.length ? new Date(`${dates[dates.length - 1]}T00:00:00`) : now;
  const cutoff = new Date(Math.max(now.getTime() - NEW_FOR_DAYS * 864e5, newest.getTime() - BATCH_DAYS * 864e5));
  const entries = [];
  const parts = html.split(/(?=<h2 id="c-\d{4}-\d{2}-\d{2}")/);
  for (const part of parts) {
    const head = part.match(/^<h2 id="c-(\d{4}-\d{2}-\d{2})">([\s\S]*?)<\/h2>/);
    if (!head) continue;
    const [, iso, title] = head;
    if (new Date(`${iso}T23:59:59`) < cutoff) continue;
    const links = [...part.matchAll(/href="\/rules\/([^/"#]+)\/#([^"]+)"/g)].map(([, slug, id]) => ({ slug, id }));
    entries.push({ id: `c-${iso}`, iso, date: label(iso), title: plain(title).replace(/^\d+ \w+ \d{4}:\s*/, ""), links });
  }
  // Newest entry wins when a section's in more than one.
  const bySlug = new Map();
  for (const e of [...entries].reverse()) {
    for (const { slug, id } of e.links) {
      if (!bySlug.has(slug)) bySlug.set(slug, new Map());
      bySlug.get(slug).set(id, { iso: e.iso, date: e.date, entry: e.id });
    }
  }
  return { entries, bySlug };
}

const NEW = read();

export const recentEntries = NEW.entries;

// The sections of one chapter that are new, in the order they appear in it.
export function newSections(chapter) {
  const marks = NEW.bySlug.get(chapter.slug);
  if (!marks) return [];
  const order = [...chapter.html.matchAll(/ id="([^"]+)"/g)].map((m) => m[1]);
  const names = new Map(chapter.headings.map((h) => [h.id, h.text]));
  return order
    .filter((id, i) => marks.has(id) && order.indexOf(id) === i)
    .map((id) => ({ id, name: names.get(id) ?? sectionName(chapter.html, id), ...marks.get(id) }));
}

function sectionName(html, id) {
  const m = html.match(new RegExp(`<(h[2-6])[^>]* id="${id}"[^>]*>([\\s\\S]*?)</\\1>`));
  if (m) return plain(m[2]);
  const box = html.match(new RegExp(` id="${id}"[^>]*>[\\s\\S]*?<strong>([\\s\\S]*?)</strong>`));
  return box ? plain(box[1]).replace(/\.$/, "") : id;
}

export const isNewChapter = (slug) => NEW.bySlug.has(slug);

// The chapter's HTML with a New mark on every new section. It's a span, not
// a link, so it never makes a small tap target. The list at the top of the
// chapter is where the links are.
export function markNew(chapter) {
  let html = chapter.html;
  for (const s of newSections(chapter)) {
    const mark = `<span class="new-mark" data-pagefind-ignore title="Changed on ${s.date}">New · ${s.date}</span>`;
    const heading = new RegExp(`(<(h[2-6])[^>]* id="${s.id}"[^>]*>[\\s\\S]*?)(</\\2>)`);
    if (heading.test(html)) html = html.replace(heading, `$1 ${mark}$3`);
    else html = html.replace(new RegExp(`(<[a-z]+[^>]* id="${s.id}"[^>]*>)`), `$1${mark}`);
  }
  return html;
}
