// The rules page: Carry on reading from where you were, the card you're on in
// the Learn deck, and your bookmarks, all from this phone (zi-reading).
import { lastPlace, learnAt, marks } from "./store.js";

const box = document.querySelector("[data-reading]");
if (box) draw(box);

function go(href, kind, title, sub) {
  const a = document.createElement("a");
  a.className = "card rd-go";
  a.href = href;
  for (const [cls, text] of [["rd-k", kind], ["rd-t", title], ["rd-s", sub]]) {
    if (!text) continue;
    const span = document.createElement("span");
    span.className = cls;
    span.textContent = text;
    a.append(span);
  }
  return a;
}

function draw(box) {
  const carry = box.querySelector(".rd-carry");
  const place = lastPlace();
  const card = learnAt();
  const total = Number(box.dataset.cards) || 0;
  if (place?.slug && place.id) carry.append(go(`/rules/${place.slug}/#${place.id}`, "Carry on reading", place.t, place.c));
  if (card?.id) carry.append(go(`/learn/#${card.id}`, "Carry on learning", card.t, card.n ? `Card ${card.n}${total ? ` of ${total}` : ""}` : ""));
  const list = marks();
  const shelf = box.querySelector(".rd-marks");
  const ul = shelf.querySelector("ul");
  for (const m of list) {
    const li = document.createElement("li");
    const a = document.createElement("a");
    a.href = m.k === "card" ? `/learn/#${m.id}` : `/rules/${m.slug}/#${m.id}`;
    const b = document.createElement("b");
    b.textContent = m.t || m.id;
    const where = document.createElement("span");
    where.textContent = m.k === "card" ? "A card in the Learn deck" : m.c || "";
    a.append(b, where);
    li.append(a);
    ul.append(li);
  }
  shelf.hidden = list.length === 0;
  box.hidden = !carry.childElementCount && !list.length;
}
