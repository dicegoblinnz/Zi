#!/usr/bin/env python3
"""Zi'Dara fight simulator: how long and how dangerous a fight is.

Four of the crew as they start against a boss and its people, the way stage 2
of notes/roots-plan.md and prompt 11 of notes/stacking-plan.md set the GM's
budgets. Two sets of rules:

  now     Roots as it went live on 10 Nov: a Root and one specialty a roll,
          Aura 5, 3 Aura an extra action and one action for each archetype,
          an attuned thing getting Aura its own way, passive awakenings pumped.
  stack   part 1 of the 14 Nov rework: a Root and everything that fits, Aura 7
          with one attuned thing, powering off the maximum, extra actions 3, 4,
          5 with no cap, the crew on 35 points.

The fight: Redhand (Challenge 6, Armoured x8 first, Feeds x5, Relentless, each
multiplier times --f), two named threats (Challenge 4, two tags) and three
mooks (Challenge 3). Three quarters of the round budget goes at the crew's
tracks, the rest at stakes and clocks that don't hit anyone. Bram intercepts
and Defends. --policy plain has everyone else hit things; table plays the
archetypes too (orders with Everyone gets it, the Mark, the Shadow's pool,
Ash's areas, Knock them flat, ties won for Aura). Traits aren't in.

  python3 tools/fight_sim.py                         today against stacking, Even
  python3 tools/fight_sim.py --rules stack --f 3 --budget 44 --policy table
"""
import random
from functools import lru_cache

TRACK = [12, 10, 8, 6, 4, 2]
ROOTS = ("Body", "Mind", "Soul")
LAMBDA = 0.15          # what a chance at a top face is worth, in wins, when shaping dice
AT_TRACKS = 0.75       # share of the round budget aimed at the crew's tracks (the rest: stakes, clocks, words)


@lru_cache(None)
def pwin(d, D):
    """Chance a dD beats (strictly) a defence that rolled on a dD."""
    if d <= 0:
        return 0.0
    return sum(min(x - 1, D) for x in range(1, d + 1)) / (d * D)


@lru_cache(None)
def build(S, nmax, targets):
    """Shape S steps into at most nmax dice (each at most 6 steps), die i at
    targets[i] (extra dice at the last target). Returns ((steps, target), ...)."""
    S = max(1, S)
    base = -(-S // 6)
    best = None
    for n in range(base, max(base, min(nmax, S)) + 1):
        assign = [min(i, len(targets) - 1) for i in range(n)]
        steps = [1] * n
        rem = S - n
        while rem > 0:
            bi, bg = -1, -1.0
            for i in range(n):
                if steps[i] < 6:
                    D = targets[assign[i]]
                    g = pwin(2 * steps[i] + 2, D) - pwin(2 * steps[i], D)
                    if g > bg + 1e-12:
                        bg, bi = g, i
            if bi < 0:
                break
            steps[bi] += 1
            rem -= 1
        val = sum(pwin(2 * s, targets[a]) for s, a in zip(steps, assign)) + LAMBDA * sum(1.0 / (2 * s) for s in steps)
        if best is None or val > best[0] + 1e-12:
            best = (val, tuple(zip(steps, assign)))
    return best[1]


def die_of(steps):
    return 2 * steps


def smaller(size):
    i = TRACK.index(size)
    return TRACK[i + 1] if i + 1 < len(TRACK) else 0


# ---------------------------------------------------------------- the crew

def crew_sheet(name, rules):
    """The numbers each crew member plays with, from 03b (stack: the plan's crew on 35 points)."""
    now = rules == "now"
    if name == "Bram":
        return dict(
            arch=["Guardian", "Leader"],
            attack=10 if now else 12,   # Body, Shieldwork, hammer / Body, both Titles, hold the line, hammer, Ring the bell
            defend=11 if now else 14,   # Body, Shieldwork, plate, shield / Body, both Titles, hold the line, shield wall, Guardian, plate, shield
            lead=4 if now else 6,       # Soul, Command / Soul, second Title, bark an order, Leader
            armour={"Body": 3},         # Fine plate 2, Common shield 1
            passive="attack", melee=True, its_aura="intercept")
    if name == "Vesk":
        return dict(
            arch=["Shadow", "Shadow"],
            attack=8 if now else 11,    # Body, Knives, knife / Body, second Title, fight dirty, knife
            hide=9 if now else 15,      # Body, Stealth, boots, line / Body, first Title, move unseen, Shadow twice, boots, line, Anywhere
            strike=10 if now else 17,   # out of hiding: Body, Stealth, Knives, knife / 16 and her own extra action
            defend=8 if now else 10,
            armour={"Body": 1},
            passive="hide", melee=True, its_aura="hide")
    if name == "Wren":
        return dict(
            arch=["Hunter", "Hunter"],
            attack=7 if now else 12,    # Body, Archery, longbow / Body, both Titles, Hunter twice, longbow, Long shot
            defend=7 if now else 8,
            armour={},
            passive="attack", melee=False, its_aura="shot")
    if name == "Ash":
        return dict(
            arch=["Elementalist", "Face"],
            attack=10 if now else 13,   # Soul, Fire, ember stone / Soul, first Title, throw fire, Elementalist, ember stone, Fire without a word
            defend=1 if now else 2,
            armour={},
            passive="attack", melee=False, its_aura="fire")
    raise KeyError(name)


class Char:
    PICK_NOW = 2      # an average pick: half of them fit the main roll (a Title that fits is 4 now and 6 stacking)
    PICK_STACK = 3

    def __init__(self, name, rules, traits, picks=0):
        self.name = name
        self.rules = rules
        self.s = crew_sheet(name, rules)
        # each pick is a new Title, with its one permission, that fits the main roll:
        # now +2 Root and +2 specialty, stacking +4 Root (3 spread and its permission's 1) and the Title and permission a step each
        grow = int(round((self.PICK_NOW if rules == "now" else self.PICK_STACK) * picks))
        for key in ("attack", "strike", "hide"):
            if key in self.s:
                self.s[key] += grow
        self.tr = {r: 0 for r in ROOTS}       # index into TRACK
        self.blazed = False
        self.armour = dict(self.s["armour"])
        self.max = 5 if rules == "now" else 7
        self.aura = self.max
        self.bonus = 0                        # +1 a die for each Aura in (now) or powering (stack) the passive
        self.hidden = False
        self.pool = []
        self.got_own_aura = False
        self.traits = traits
        self.hits = 0
        self.sizes = 0
        self.stand_firm = 0
        self.lead_steps = 0

    def track(self, root):
        return TRACK[self.tr[root]]


class Threat:
    def __init__(self, name, die, tags, cap, roots, boss=False):
        self.name, self.die, self.cap, self.roots, self.boss = name, die, cap, roots, boss
        self.tags = [list(t) for t in tags]    # [count, first?]
        self.alive = True
        self.defroll = None
        self.prone = 0
        self.prone_set = -1
        self.marked = 0

    def left(self):
        return sum(t[0] for t in self.tags) if self.tags else 1

    def tick(self, n):
        """n ticks; returns True if it falls."""
        if not self.tags:
            self.alive = False
            return True
        while n > 0 and self.tags:
            t = self.tags[0]
            t[0] -= 1
            n -= 1
            if t[0] <= 0:
                self.tags.pop(0)
        if not self.tags:
            self.alive = False
            return True
        return False


def encounter(k, f=1.0):
    """A boss and its people. Each of the boss's multipliers is f times what it is now, plus k."""
    boss = Threat("boss", 12, [[int(round(8 * f)) + k, True], [int(round(5 * f)) + k, False], [1, False]], 3, ["Body", "Body", "Mind", "Soul"], boss=True)
    people = [Threat("named1", 8, [[1, False], [1, False]], 2, ["Body", "Mind"]),
              Threat("named2", 8, [[1, False], [1, False]], 2, ["Body", "Mind"]),
              Threat("mook1", 6, [], 1, ["Body"]),
              Threat("mook2", 6, [], 1, ["Body"]),
              Threat("mook3", 6, [], 1, ["Body"])]
    return boss, people


# ---------------------------------------------------------------- the fight

class Fight:
    def __init__(self, rules, names, R, k, traits=None, rng=None, plain=False, policy=None, f=1.0, picks=0, sheets=None):
        self.policy = policy or ('plain' if plain else 'hard')
        self.plain = self.policy == 'plain'
        self.f = f
        self.picks = picks
        self.rules = rules
        self.now = rules == "now"
        self.rng = rng or random.Random()
        self.crew = [Char(n, sheets or rules, traits or {}, picks) for n in names]
        for c in self.crew:
            c.max = 5 if rules == 'now' else 7
            c.aura = c.max
        self.boss, self.people = encounter(k, f)
        self.threats = [self.boss] + self.people
        self.R = R
        self.round = 0
        self.wins = 0
        self.actions = 0
        self.boss_wins = 0

    def r(self, d):
        return self.rng.randint(1, d) if d > 0 else 0

    def living(self):
        return [t for t in self.threats if t.alive]

    def standing(self):
        return [c for c in self.crew if not c.blazed]

    # ---- the GM telegraphs
    def telegraph(self):
        budget = int(round(self.R * AT_TRACKS))
        teles = []          # [threat, char, root, die]
        used = {}           # (threat, char) pairs, and counts
        count = {}
        crew = self.standing()
        if not crew:
            return teles
        rng = self.rng
        order = crew[:]
        rng.shuffle(order)

        def pick(c, root):
            best = None
            for t in sorted(self.living(), key=lambda t: -t.die):
                if count.get(id(t), 0) >= t.cap or (id(t), id(c)) in used:
                    continue
                if root not in t.roots:
                    continue
                best = t
                break
            return best

        def add(t, c, root, die):
            teles.append([t, c, root, die])
            if t is not None:
                used[(id(t), id(c))] = True
                count[id(t)] = count.get(id(t), 0) + 1

        for c in order:
            if budget < 2:
                break
            t = pick(c, "Body")
            die = t.die if t else 8
            die = min(die, 2 * budget)
            add(t, c, "Body", die)
            budget -= die // 2
        cycle = ["Mind", "Soul", "Body"]
        i = 0
        while budget >= 2:
            root = cycle[i % 3]
            i += 1
            ats = sorted(crew, key=lambda c: (sum(1 for x in teles if x[1] is c and x[2] == root), rng.random()))
            c = ats[0]
            t = pick(c, root)
            die = t.die if t else 8
            die = min(die, 2 * budget)
            add(t, c, root, die)
            budget -= die // 2
        return teles

    # ---- rolling at threats
    def defence(self, t):
        if t.defroll is None:
            t.defroll = self.r(t.die)
        return t.defroll

    def targets(self):
        """Threats in the order the crew goes at them: the people with the fewest wins left, then the boss."""
        ppl = sorted([t for t in self.people if t.alive], key=lambda t: t.left())
        seq = []
        for t in ppl:
            seq += [t] * t.left()
        if self.boss.alive:
            seq.append(self.boss)
        return seq

    def throw(self, c, S, splits, melee, extra_dice=(), bonus=0, area=False, mark_roll=False):
        """Build and throw a roll. Returns wins. Aura goes to c."""
        seq = self.targets()
        if not seq:
            return 0
        if mark_roll:
            seq = [self.boss] if self.boss.alive else seq[:1]
        dice = []
        if area:
            # one split is the area die (a d4), the biggest die goes at everyone in it, the rest at the boss
            S2 = max(1, S - 2)
            shaped = build(S2, -(-S2 // 6) + max(0, splits - 1), tuple(t.die for t in ([self.boss] if self.boss.alive else seq[:1])))
            area_die = 4
            dice = sorted([die_of(s) for s, _ in shaped], reverse=True)
            wins = 0
            a = self.r(area_die)
            if a == area_die:
                c.aura += 1
            reach = 2 if a <= 2 else (4 if a <= 5 else 99)
            intent = dice[0]
            v = self.r(intent) + bonus
            caught = [t for t in sorted(self.living(), key=lambda t: (t.boss, t.left()))][:reach]
            won_any = False
            for t in caught:
                D = self.defence(t)
                if v > D or (v == D and c.aura >= 1 and self.pay_tie(c)):
                    won_any = True
                    wins += 1
                    t.tick(1 + self.vuln(t, melee))
            if won_any:
                c.aura += 1
                self.own_aura(c, "fire")
            if (v - bonus) == intent:
                c.aura += 1
            for d in dice[1:]:
                if not self.boss.alive and not self.living():
                    break
                t = self.boss if self.boss.alive else (self.living() or [None])[0]
                if t is None:
                    break
                wins += self.one_die(c, d, t, melee, 0)
            self.wins += wins
            return wins
        shaped = build(S, -(-S // 6) + splits, tuple(t.die for t in seq))
        at_boss = any(seq[a] is self.boss for _, a in shaped)
        wins = 0
        first = True
        for s, a in shaped:
            t = seq[a]
            if not t.alive:
                t = (self.targets() or [None])[0]
                if t is None:
                    break
            b = bonus if first else 0
            first = False
            wins += self.one_die(c, die_of(s), t, melee, b)
        for d in extra_dice:
            t = (self.targets() or [None])[0]
            if t is None:
                break
            wins += self.one_die(c, d, t, melee, 0)
        # the Mark die, against the boss
        if self.boss.alive and self.boss.marked and not mark_roll and at_boss:
            wins += self.one_die(c, self.boss.marked, self.boss, melee, 0)
        self.wins += wins
        return wins

    def pay_tie(self, c):
        if self.plain:
            return False
        if c.aura >= 1:
            c.aura -= 1
            return True
        return False

    def vuln(self, t, melee):
        return 1 if (t.prone and melee) else 0

    def one_die(self, c, d, t, melee, bonus):
        if not t.alive:
            return 0
        D = self.defence(t)
        raw = self.r(d)
        v = raw + bonus
        won = v > D or (v == D and t.alive and self.pay_tie(c))
        if raw == d:
            c.aura += 1
        if won:
            c.aura += 1
            t.tick(1 + self.vuln(t, melee))
            if t.boss:
                self.boss_wins += 1
            return 1
        return 0

    def own_aura(self, c, what):
        if self.now and not c.got_own_aura and c.s["its_aura"] == what:
            c.got_own_aura = True
            c.aura += 1

    # ---- a player's turn
    CAP = None    # stacking with a cap on bought actions (for comparing)
    STEP = 1      # how much each bought action puts the price up

    def extra_price(self, c, bought):
        if self.now:
            return 3 if bought < len(c.s["arch"]) - 1 else None
        if self.CAP is not None and bought >= self.CAP:
            return None
        return 3 + self.STEP * bought

    def turn(self, c, teles, plan):
        bought = 0
        acts = 1
        did = []
        if self.round == 1 and c.s.get("passive") and c.bonus == 0:
            p = min(2, c.aura)
            c.aura -= p
            if not self.now:
                c.max -= p
            c.bonus = p
        while True:
            if not self.living():
                break
            if acts == 0:
                price = self.extra_price(c, bought)
                if price is None or c.aura < price:
                    break
                c.aura -= price
                bought += 1
                acts = 1
            acts -= 1
            self.actions += 1
            what = self.choose(c, did, plan)
            did.append(what)
            self.act(c, what, plan)
            if what == "hide" and c.hidden:
                pass
        if c.aura > c.max:
            c.aura = c.max

    def choose(self, c, did, plan):
        n = c.name
        if n != "Bram" and plan.get("defend_" + n) and "defend" not in did:
            return "defend"
        if n == "Bram":
            if plan["bram_defend"] and "defend" not in did:
                return "defend"
            if not self.plain and "lead" not in did and c.tr["Soul"] <= (1 if self.policy == 'table' else 2) and len(self.standing()) > 1:
                return "lead"
            return "attack"
        if n == "Vesk":
            if self.plain:
                return "attack"
            return "strike" if c.hidden else "hide"
        if n == "Wren":
            if not self.plain and self.boss.alive and self.boss.marked < 8 and "mark" not in did:
                return "mark"
            return "attack"
        if plan.get("defend_" + n) and "defend" not in did:
            return "defend"
        return "attack"

    def act(self, c, what, plan):
        lead = c.lead_steps
        c.lead_steps = 0
        if what == "defend":
            plan.setdefault("defending", set()).add(c.name)
            return
        if what == "lead":
            steps = c.s["lead"]
            for f in self.standing():
                if f is not c:
                    f.lead_steps += steps
            c.tr["Soul"] = min(5, c.tr["Soul"] + 1)   # Everyone gets it, 1 Resolve
            return
        if what == "hide":
            seq = [t for t in self.living()]
            watcher = max(seq, key=lambda t: t.die)
            D = self.defence(watcher) if watcher.defroll is not None else self.r(watcher.die)
            dice = [die_of(s) for s, _ in build(c.s["hide"] + lead, -(-(c.s["hide"] + lead) // 6), (watcher.die,))]
            ok = False
            first = True
            for d in dice:
                raw = self.r(d)
                v = raw + (c.bonus if first else 0)
                first = False
                if raw == d:
                    c.aura += 1
                if v > D:
                    ok = True
                    c.aura += 1
            if ok:
                c.hidden = True
                c.pool = dice
                self.own_aura(c, "hide")
            return
        if what == "strike":
            c.hidden = False
            pool, c.pool = c.pool, []
            self.throw(c, c.s["strike"] + lead, 2, c.s["melee"], extra_dice=pool)
            return
        if what == "mark":
            S = c.s["attack"] + lead
            D = self.defence(self.boss)
            shaped = build(S, -(-S // 6), (12,))
            best = 0
            first = True
            for s, _ in shaped:
                d = die_of(s)
                raw = self.r(d)
                v = raw + (c.bonus if first else 0)
                first = False
                if raw == d:
                    c.aura += 1
                if v > D:
                    c.aura += 1
                    best = max(best, d)
            if best:
                self.boss.marked = best
            return
        if what == "attack":
            S = c.s["attack"] + lead
            area = (not self.plain) and "Elementalist" in c.s["arch"] and len(self.living()) >= 2
            before = self.boss_wins
            w = self.throw(c, S, 1, c.s["melee"], bonus=c.bonus, area=area)
            on_boss = self.boss_wins > before
            if w:
                self.own_aura(c, "shot")
                if not area:
                    self.own_aura(c, "fire")
            if not self.plain and c.name == "Bram" and on_boss and self.boss.alive and self.boss.prone_set != self.round and c.aura >= 1:
                c.aura -= 1            # Knock them flat
                self.boss.prone = 12
                self.boss.prone_set = self.round
            return

    # ---- the round
    def play_round(self):
        self.round += 1
        for t in self.threats:
            t.defroll = None
        teles = self.telegraph()
        plan = {}
        # the Guardian steps in
        bram = next((c for c in self.standing() if c.name == "Bram"), None)
        if bram:
            if bram.tr["Body"] <= 2:
                for x in teles:
                    if x[2] == "Body" and x[1] is not bram:
                        x[1] = bram
                if not self.now:
                    pass
                self.own_aura(bram, "intercept")
            mine = sum(1 for x in teles if x[1] is bram and x[2] == "Body")
            plan["bram_defend"] = mine >= 2
        for c in self.standing():
            if c.name != "Bram":
                inc = sum(1 for x in teles if x[1] is c and x[2] == "Body")
                plan["defend_" + c.name] = inc >= 1 and c.tr["Body"] >= 4
        order = sorted(self.standing(), key=lambda c: 0 if c.name == "Bram" else (1 if c.name == "Wren" else 2))
        for c in order:
            if not self.living():
                break
            self.turn(c, teles, plan)
        # whatever's left lands
        if self.living() or True:
            self.land(teles, plan)
        for t in self.threats:
            if t.prone:
                t.prone = smaller(t.prone)
            if t.marked:
                t.marked = smaller(t.marked)
        for c in self.crew:
            c.stand_firm = 0
        # the Mark jumps: not needed once the boss falls (people fall to one or two wins)

    def land(self, teles, plan):
        defending = plan.get("defending", set())
        for c in self.standing():
            for root in ROOTS:
                mine = [x for x in teles if x[1] is c and x[2] == root and (x[0] is None or x[0].alive)]
                if not mine:
                    continue
                rolls = sorted(self.r(x[3]) for x in mine)
                dd = [c.track(root)]
                if root == "Body" and c.name in defending:
                    S = c.s["defend"]
                    shaped = build(S, -(-S // 6) + 1, tuple([12] * 3))
                    dd += [die_of(s) for s, _ in shaped]
                mine_rolls = []
                for d in dd:
                    v = self.r(d)
                    mine_rolls.append(v)
                    if v == d:
                        self.gain(c, 1)
                mine_rolls.sort()
                # most stops: each telegraph from the smallest takes the smallest die that meets it
                stopped = 0
                j = 0
                avail = mine_rolls[:]
                through = 0
                for tv in rolls:
                    k = next((i for i, v in enumerate(avail) if v >= tv), None)
                    if k is None:
                        through += 1
                    else:
                        avail.pop(k)
                        stopped += 1
                self.gain(c, stopped)
                if through and c.name == "Bram" and root == "Body" and through >= 2 and c.tr["Body"] <= 3 and c.stand_firm == 0:
                    c.tr["Body"] += 1          # Stand firm, 1 Stamina
                    c.stand_firm = 2
                for _ in range(through):
                    self.hit(c, root)
                    if c.blazed:
                        break
            if c.blazed:
                continue

    def gain(self, c, n):
        c.aura += n
        if c.aura > c.max:
            spare = c.aura - c.max
            c.aura = c.max
            for f in sorted(self.standing(), key=lambda f: f.aura - f.max):
                if f is c or spare <= 0:
                    continue
                room = max(0, f.max - f.aura)
                g = min(room, spare)
                f.aura += g
                spare -= g

    def hit(self, c, root):
        c.hits += 1
        if c.stand_firm > 0 and root == "Body":
            c.stand_firm -= 1
            return
        if self.armour_takes(c, root):
            return
        if c.tr[root] >= 5:
            others = [r for r in ROOTS if r != root and c.tr[r] < 5]
            if len(others) == 2 or (len(others) == 1 and c.tr[others[0]] <= 3):
                # 2 for 1 keeps them standing
                if len(others) == 2:
                    c.tr[others[0]] += 1
                    c.tr[others[1]] += 1
                else:
                    c.tr[others[0]] += 2
                c.sizes += 2
                return
            c.blazed = True
            return
        c.tr[root] += 1
        c.sizes += 1

    def armour_takes(self, c, root):
        if c.armour.get(root, 0) > 0:
            c.armour[root] -= 1
            return True
        return False

    def play(self, cap=20):
        while self.living() and self.standing() and self.round < cap:
            self.play_round()
        return dict(rounds=self.round, won=not self.living(),
                    blazes=sum(1 for c in self.crew if c.blazed),
                    hits=sum(c.hits for c in self.crew) / len(self.crew),
                    sizes=sum(c.sizes for c in self.crew) / len(self.crew),
                    wins=self.wins, actions=self.actions)


def run(rules, names, R, k=0, n=3000, seed=1, traits=None, plain=False, policy=None, f=1.0, picks=0, sheets=None):
    rng = random.Random(seed)
    res = [Fight(rules, names, R, k, traits, rng, plain, policy, f, picks, sheets).play() for _ in range(n)]
    out = {}
    for key in ("rounds", "blazes", "hits", "sizes", "wins", "actions"):
        out[key] = sum(r[key] for r in res) / n
    out["won"] = sum(1 for r in res if r["won"]) / n
    out["any_blaze"] = sum(1 for r in res if r["blazes"]) / n
    out["wins_per_round"] = out["wins"] / out["rounds"]
    out["actions_per_round"] = out["actions"] / out["rounds"]
    return out


def main():
    import argparse
    ap = argparse.ArgumentParser(description="Zi'Dara fight simulator")
    ap.add_argument("--rules", choices=("now", "stack"))
    ap.add_argument("--policy", choices=("plain", "table"), default="plain")
    ap.add_argument("--budget", type=int, default=40, help="round budget for four players")
    ap.add_argument("--f", type=float, default=1.0, help="boss multipliers times this")
    ap.add_argument("--picks", type=int, default=0, help="new Titles, archetypes or attuned things each")
    ap.add_argument("--n", type=int, default=3000, help="fights")
    ap.add_argument("--seed", type=int, default=1)
    a = ap.parse_args()
    crew = ["Bram", "Vesk", "Wren", "Ash"]
    rows = [(a.rules, a.budget, a.f)] if a.rules else [("now", 40, 1.0), ("stack", 40, 1.0), ("stack", 44, 3.0)]
    for rules, R, f in rows:
        o = run(rules, crew, R, n=a.n, seed=a.seed, policy=a.policy, f=f, picks=a.picks)
        print("%-5s %-5s budget %d, boss x%.2g: %.2f rounds, %.2f hits a player, a Blaze in %.1f%%, "
              "%.1f wins and %.1f actions a round" % (rules, a.policy, R, f, o["rounds"], o["hits"],
                                                       100 * o["any_blaze"], o["wins_per_round"], o["actions_per_round"]))


if __name__ == "__main__":
    main()
