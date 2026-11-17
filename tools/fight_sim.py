#!/usr/bin/env python3
"""Zi'Dara fight simulator: how long and how dangerous a fight is.

Four of the crew as they start against a boss and its people, where Running
the Game's budgets come from (stage 2 of notes/roots-plan.md, prompts 11 and
12 of notes/stacking-plan.md, prompt 3 of notes/core-plan.md and prompt 4 of
notes/fixes-plan.md). Run it again whenever the crew, the action economy, the
items or the Traits change, and move the numbers in Running the Game if they
shift. Four sets of rules:

  fixes   part 3 of the rework (17 Nov), the default: the new core with items
          (a weapon's or a tool's tier on a roll it fits, one a roll, a
          guard's only on the Body roll when telegraphs land), armour that
          soaks a point a point and comes back every scene, and vessels.
  core    part 2 (16 Nov): a roll is one Root at full, a Root's points are
          its dice, its health and what you spend, one action a round and
          every die an intent, Aura 5, defence from the Root, a hit a point,
          armour boxes first, a wound at 0 and a Scar after it.
  stack   part 1 (14 Nov): a Root and everything that fits, Aura 7, extra
          actions 3, 4, 5 with no cap, and the archetypes' Traits.
  now     Roots as it went live on 10 Nov.

The fight: Redhand (Challenge 6, Armoured first, Feeds, Relentless), two named
threats (Challenge 4, two tags) and three mooks (Challenge 3). Three quarters
of the round budget goes at the crew's Roots, the rest at stakes and clocks.

On the new core (CoreFight) Bram, Vesk, Wren and Ash are as 03b has them, and
on the fixes with what KIT says they carry. Played plain they roll their Root
(and their weapon) at the threats. Played hard (--policy table) they bring a
Root in when a permission explains it (Bram's Mind, Wren's Mind, Ash's Mind,
for 3 Aura or a point they can spare), put charge and Aura on their
awakenings, win ties, and play the archetypes: Bram intercepts while his Body
can take it, Pushes a defence die and stands firm, Vesk hides and strikes with
her pool, Wren marks Redhand, Ash's area takes the people, and Better Me Than
You and Good Hunting pay. A Root that's 0 takes its wound before 2 for 1,
since the wound costs nothing in the scene, unless the other Root's got soak
to take it. The GM (--gm) spreads it (even), puts the first die at each Body
and two in three of the rest on the Body that's hurting most (hard, the
default, the big fight, from round 2, or --pile-from 1 for round 1 as well),
or piles the rest on the weakest Root anywhere, a 0 one first (cruel). --reach says how many friends Bram can get in front of,
--before plays an earlier fight first and carries the crew in, --deadly puts
hits on Redhand's dice and --deadly-price says what each hit past the first
costs. A fight's length is in minutes, from what a round takes at the table:
the dice model (GO_BASE, PER_DIE, PER_CHOICE, LAND_*, PER_HIT, the default,
and PHONE for a phone) or the flat one 16 Nov used (MIN_TELE, MIN_GO, MIN_LAND).

On 17 Nov (2,000 fights a setting, notes/loop-under-tension.md has the rest):
the items take the crew from 2.6 to 2.9 wins a round played plain and 3.7 to
4.0 hard, and a go from 2.3 dice to 2.9 (3.6 to 3.9 hard, 69% of hard goes
four dice or more). A round takes about 10 minutes at the table at Hard and
the bigger rolls take a bit longer, so the fight comes out at 52 minutes plain
and 42 hard (56 and 45 on 16 Nov's crew, with the dice model): Hard's 72 and
multipliers at a Challenge less 2 still make 45 minutes. Bram intercepting
for everyone keeps the rest of the crew whole: hard play Bloodies someone in
14% of fights, always Bram, and in 52% (median round 3, mostly Wren) when he
can only reach one friend. A deadly telegraph at the book's price (its steps
once a hit) is weaker than spending the steps on more dice; at half again a
hit it's about even. A GM piling on a Root of 0 (Vesk's and Wren's Soul)
Scars each of them in over half of hard fights. Till 17 Nov the hard GM's
third die of every three went at Body too, so it never reached a Mind or a
Soul, and deadly telegraphs cost their steps once.

With the crew's real items from 03b (prompt 7, 17 Nov, 3,000 fights): Bram's
helmet makes his Body soak 5, Wren's cloak is a tool so she's got no guard,
and Ash has a scorched coat and a tier 3 coal horn. The fight's 52 minutes
plain and 42 hard, still 45 between them, but with the GM piling on from
round 1 the first Bloodied moves to round 2 (33% of fights at --reach 1, 17%
in round 3), since it's Wren's Body every time and nothing guards it. Piling
on from round 2, as Running the Game says now, puts it back in round 3 (31%
at --reach 1, 3% in round 2, and 66% of fights played plain), with the same
45 minutes, so the budgets stay.

  python3 tools/fight_sim.py                         the big fight on the fixes
  python3 tools/fight_sim.py --rules core            the same on 16 Nov's core
  python3 tools/fight_sim.py --gm even               the same at Even
  python3 tools/fight_sim.py --gm cruel --reach 1    piled on the weakest, Bram beside one friend
  python3 tools/fight_sim.py --before hard           two Hard fights back to back
  python3 tools/fight_sim.py --vessel 2 --vessel-pts Bram and Wren a tier 2 vessel too, all topped up with points
  python3 tools/fight_sim.py --find --picks 4        the factor a 45-minute fight
                                                     needs, and each pick against none
  python3 tools/fight_sim.py --grid 72,84,96         --find at each round budget
  python3 tools/fight_sim.py --rules stack --find    the 14 Nov numbers, as they were
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
def pstop(d, D):
    """Chance a dd defence die stops a dD telegraph: meets or beats it, since ties go to you."""
    if d <= 0:
        return 0.0
    return sum(min(x, D) for x in range(1, d + 1)) / (d * D)


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

    def __init__(self, name, rules, picks=0):
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
        self.due = 0                          # Aura his Trait gives him once he's acting
        self.wn_turn = 0                      # steps the Leader moved onto (or off) their first roll this round
        self.wn_def = 0                       # and onto (or off) their Defend
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


def encounter(k, f=1.0, mults=None):
    """A boss and its people. Each of the boss's multipliers is f times what it is now, plus k,
    or mults, his Armoured and Feeds as they're written."""
    a, b = mults or (int(round(8 * f)) + k, int(round(5 * f)) + k)
    boss = Threat("boss", 12, [[a, True], [b, False], [1, False]], 3, ["Body", "Body", "Mind", "Soul"], boss=True)
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
        self.crew = [Char(n, sheets or rules, picks) for n in names]
        for c in self.crew:
            c.max = 5 if rules == 'now' else 7
            c.aura = c.max
        # The Traits came in with part 1 (14 Nov), so the rules as they went
        # live on 10 Nov have none. traits=False plays stacking without them.
        self.traits = (not self.now) and traits is not False
        has = lambda arch: next((c for c in self.crew if arch in c.s["arch"]), None) if self.traits else None
        self.guardian, self.hunter, self.leader = has("Guardian"), has("Hunter"), has("Leader")
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
                    self.hunted(c, t)
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
            self.hunted(c, t)
            t.tick(1 + self.vuln(t, melee))
            if t.boss:
                self.boss_wins += 1
            return 1
        return 0

    def hunted(self, c, t, n=1):
        """Good Hunting: a friend's die that wins against the creature the
        Hunter's Marked pays her 1 Aura as well. She isn't acting, so it stops
        at her maximum and the rest goes to a friend."""
        h = self.hunter
        if n and h is not None and c is not h and not h.blazed and t is not None and t.marked:
            self.gain(h, n)

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
        # Better Me Than You, played hard: he's acting, so it can go past his maximum.
        c.aura += c.due
        c.due = 0
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
            if "lead" not in did and self.leads_first(c):
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
        if what in ("hide", "strike", "mark", "attack") and c.wn_turn:
            # Where It's Needed: the steps the Leader moved onto (or off) this
            # roll before anyone rolled.
            lead += c.wn_turn
            c.wn_turn = 0
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

    # ---- Where It's Needed
    def first_roll(self, c, plan, lead=0):
        """What each of the crew rolls first this round, the way choose() will
        have it: (kind, steps). Bram's Defend and anyone else's roll at the
        end of the round, with their tracks, and a Lead's no roll. lead is the
        steps Bram's order hands each of them first, when he leads first."""
        n = c.name
        if n == "Bram":
            if plan["bram_defend"]:
                return "defend", c.s["defend"]
            if self.leads_first(c):
                return "lead", 0
            return "attack", c.s["attack"]
        if plan.get("defend_" + n):
            return "defend", c.s["defend"]
        if n == "Vesk":
            return ("strike", c.s["strike"] + lead) if c.hidden else ("hide", c.s["hide"] + lead)
        if n == "Wren" and self.boss.alive and self.boss.marked < 8:
            return "mark", c.s["attack"] + lead
        return "attack", c.s["attack"] + lead

    def leads_first(self, c):
        """Whether Bram's first action this round is an order, as choose() has it."""
        return (not self.plain and c.tr["Soul"] <= (1 if self.policy == "table" else 2)
                and len(self.standing()) > 1)

    def worth(self, kind, S):
        """What S steps on a roll are worth: wins against the boss's d12 (a d8
        once he's down), the chance of getting into hiding, or for a Defend,
        telegraphs stopped, at about a d10 each."""
        if S < 1:
            return float("-inf")
        if kind == "defend":
            return sum(pstop(2 * min(6, S - 6 * i), 10) for i in range(-(-S // 6)))
        D = 12 if self.boss.alive else 8
        dice = [s for s, _ in build(S, -(-S // 6) + 1, (D,))]
        if kind == "hide":
            miss = 1.0
            for s in dice:
                miss *= 1 - pwin(2 * s, D)
            return 1 - miss
        return sum(pwin(2 * s, D) for s in dice)

    def where_needed(self, plan):
        """Where It's Needed, played hard: before anyone rolls, the Leader moves
        steps a step at a time from the roll that loses least to the roll that
        gains most, while it's worth it, up to one for each of the crew
        standing. Nobody's roll goes below 1 step."""
        for c in self.crew:
            c.wn_turn = c.wn_def = 0
        L = self.leader
        if L is None or L.blazed or self.policy != "table":
            return
        crew = self.standing()
        # Bram acts first, so when his first action's an order, everyone else's
        # first roll has its steps (Everyone gets it), and his isn't a roll.
        bram = next((c for c in crew if c.name == "Bram"), None)
        lead = bram.s["lead"] if bram and not plan["bram_defend"] and self.leads_first(bram) else 0
        rolls = [[c, *self.first_roll(c, plan, lead), 0] for c in crew]   # [who, kind, steps, moved onto it]
        rolls = [r for r in rolls if r[1] != "lead"]
        for _ in range(len(crew)):
            best = None
            for give in rolls:
                S = give[2] + give[3]
                if S <= 1:
                    continue
                loss = self.worth(give[1], S) - self.worth(give[1], S - 1)
                for get in rolls:
                    if get is give:
                        continue
                    T = get[2] + get[3]
                    net = self.worth(get[1], T + 1) - self.worth(get[1], T) - loss
                    if net > 1e-9 and (best is None or net > best[0]):
                        best = (net, give, get)
            if best is None:
                break
            best[1][3] -= 1
            best[2][3] += 1
        for c, kind, _, moved in rolls:
            if kind == "defend":
                c.wn_def = moved
            else:
                c.wn_turn = moved

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
                took = 0
                for x in teles:
                    if x[2] == "Body" and x[1] is not bram:
                        x[1] = bram
                        took += 1
                self.own_aura(bram, "intercept")
                # Better Me Than You: 1 Aura for every blow he takes for a friend.
                if took and bram is self.guardian:
                    if self.policy == "table":
                        bram.due += took
                    else:
                        self.gain(bram, took)
            mine = sum(1 for x in teles if x[1] is bram and x[2] == "Body")
            plan["bram_defend"] = mine >= 2
        for c in self.standing():
            if c.name != "Bram":
                inc = sum(1 for x in teles if x[1] is c and x[2] == "Body")
                plan["defend_" + c.name] = inc >= 1 and c.tr["Body"] >= 4
        self.where_needed(plan)
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
                rolls = sorted(((self.r(x[3]), x[0]) for x in mine), key=lambda p: p[0])
                dd = [c.track(root)]
                if root == "Body" and c.name in defending:
                    S = max(1, c.s["defend"] + c.wn_def)
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
                for tv, src in rolls:
                    k = next((i for i, v in enumerate(avail) if v >= tv), None)
                    if k is None:
                        through += 1
                    else:
                        avail.pop(k)
                        stopped += 1
                        self.hunted(c, src)
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



# ================================================================ the new core (16 Nov)
#
# Part 2 of the rework (notes/core-plan.md): a roll is one Root at full, and a
# Root's points are its dice, its health and what you spend. One action a
# round, every die an intent, no extra actions, Aura 5. Defence is the Root a
# telegraph's at, rolled at full and split to meet what's landing, each die
# stopping one it meets or beats. A hit's a point off that Root, armour ticks a
# box first, 2 for 1 moves it to another Root with the points, a hit at 0
# wounds it (Bloodied, Frayed, Hollow) and a hit at 0 on a wounded Root is a
# Scar, and they leave the scene. Bringing a Root in is a permission and a
# point of it or 3 Aura, and an awakening is 2 steps on a roll it fits and 2
# more for each Aura.
#
# What a round takes at the table (MIN_*), so a fight's length comes out in
# minutes: the GM saying each telegraph and putting its die out, each player's
# go (a Root, maybe one brought in, the split, the roll, what each die did),
# and each telegraph that lands being rolled against and paid for. They're a
# guess, so time a round at the table and move them.

MIN_TELE = 0.25   # minutes for the GM to say a telegraph and put its die out
MIN_GO = 1.0      # minutes for a player's go (the flat model, 16 Nov)
MIN_LAND = 0.25   # minutes for a telegraph that lands, rolled against and paid for (the flat model)
WOUND = {"Body": "Bloodied", "Mind": "Frayed", "Soul": "Hollow"}

# The dice model (17 Nov, the default): a go and a landing cost time by what's
# in them, so more dice and more choices on a roll cost more. GO_BASE is saying
# what you're doing and the GM saying what happened. Each die is an intent to
# name, a number to read against what it's up against, and its Aura. Each
# choice is something to check fits and add (an awakening, an item, a Root
# brought in) or something to pay (Aura on an awakening, a point or 3 Aura for
# a Root, charge, a tie, an ability). A landing is a Root rolled against what's
# at it, its dice matched to theirs, and each hit paid (soak, a point, a
# wound). They're set so the 16 Nov crew's fights come out about as long as the
# flat model said (hard play the same, plain a tenth shorter), so the two
# compare, and the per-die and per-choice parts are what the flat model missed:
# a 4-die go with three things to add up takes longer than a 2-die go with one.
# About 9 seconds a die on paper, a bit less on a phone (PHONE).
GO_BASE = 0.55    # saying what you're doing, and the GM saying what happened
PER_DIE = 0.15    # each die on a go: its intent, reading it against what it's up against, its Aura
PER_CHOICE = 0.1  # each thing checked and added (an awakening, an item, a Root) or paid (Aura, a point, charge, a tie)
LAND_ROLL = 0.15  # each Root rolled when telegraphs land: picking up its dice and splitting them
LAND_TELE = 0.1   # each telegraph landing: which of your dice meets it
LAND_DIE = 0.05   # each defence die
PER_HIT = 0.1     # each hit paid: soak, a point, 2 for 1 or a wound, and writing it down
PHONE = 0.7       # a phone reads the dice, adds the steps and keeps the Aura: the per-die, per-choice and per-hit parts times this

# The 17 Nov fixes (notes/fixes-plan.md), what the four carry, as 03b has
# them. Items add their tier on a roll they fit, one a roll: a weapon on their
# fighting roll, a guard only on a roll avoiding harm (their Body when it
# lands), armour soaks (a point of soak a point, every piece on a Root), and a
# vessel holds charge.
#   Bram: plate armour (armour, Body, tier 3) and a helmet (armour, Body,
#         tier 2), so his Body soaks 5, a shield (guard, tier 2), his war
#         hammer (weapon, tier 2, attuned).
#   Vesk: worn leathers (armour, Body, tier 2), a knife (weapon, tier 2), her
#         grappling line (tool, tier 2, attuned, no use in a straight fight,
#         as on 16 Nov), boots and picks (tools, tier 3).
#   Wren: her longbow (weapon, tier 3, attuned), her hooded cloak (a tool,
#         tier 3, so no guard), a hunting knife (weapon, tier 3) she doesn't
#         fight with, a snare kit.
#   Ash:  her ember stone (tool, tier 2, attuned), which fits every roll she
#         throws fire with, a scorched coat (armour, Body, tier 2) and a coal
#         horn (vessel, tier 3).
KIT = {
    "Bram": dict(weapon=2, guard=2, armour={"Body": 5}),
    "Vesk": dict(weapon=2, guard=0, armour={"Body": 2}),
    "Wren": dict(weapon=3, guard=0, armour={}),
    "Ash": dict(weapon=2, guard=0, armour={"Body": 2}, vessel=3),
}


def core_sheet(name):
    """The crew on the new core, from 03b and notes/core-plan.md. roots are
    the dice (and the maximum), locked what their awakenings lock, attack the
    Root and the steps their awakenings put on a fighting roll, awk the Aura a
    step-pair goes on, bring the Root a permission of theirs brings in on it
    and the permission, and armour their boxes on each Root."""
    if name == "Bram":
        # hammer: Ring the bell; a swing to knock them down adds Knock them flat
        return dict(arch=["Guardian", "Leader"], roots={"Body": 9, "Mind": 3, "Soul": 4}, locked={"Body": 2},
                    attack=("Body", 2), knock=2, bring=("Mind", "spot who's in charge"),
                    armour={"Body": 3}, melee=True, awk=True)
    if name == "Vesk":
        # her hook's no use in a straight fight
        return dict(arch=["Shadow", "Shadow"], roots={"Body": 11, "Mind": 5, "Soul": 0}, locked={"Body": 1},
                    attack=("Body", 0), bring=None, armour={"Body": 1}, melee=True, awk=False)
    if name == "Wren":
        # Long shot (Hit anything I can see adds only past cover and range)
        return dict(arch=["Hunter", "Hunter"], roots={"Body": 8, "Mind": 8, "Soul": 0}, locked={"Body": 2},
                    attack=("Body", 2), bring=("Mind", "know a beast's habits"),
                    armour={}, melee=False, awk=True)
    if name == "Ash":
        return dict(arch=["Elementalist", "Face"], roots={"Body": 0, "Mind": 5, "Soul": 11}, locked={"Soul": 1},
                    attack=("Soul", 2), bring=("Mind", "feel every flame in a room"),
                    armour={}, melee=False, awk=True)
    raise KeyError(name)


class CoreChar:
    # An average pick: a Title's 6 points, about half on the Root they fight
    # with, an attuned thing's 2 steps on a roll it fits (and a point locked),
    # or an archetype's abilities, which put nothing on a roll. That's about 2
    # on the Root they fight with, dice and points both.
    PICK = 2

    def __init__(self, name, picks=0, kit=True, vessel=0):
        self.name = name
        self.kit = kit
        self.s = core_sheet(name)
        self.roots = dict(self.s["roots"])
        root, _ = self.s["attack"]
        self.roots[root] += self.PICK * picks
        self.cap = {r: self.roots[r] - self.s["locked"].get(r, 0) for r in ROOTS}
        self.pts = dict(self.cap)
        self.wound = {r: False for r in ROOTS}
        k = KIT[name] if kit else dict(weapon=0, guard=0, armour=self.s["armour"])
        self.weapon, self.guard = k["weapon"], k["guard"]
        self.worn = dict(k["armour"])          # soak each Root holds (16 Nov: boxes, which don't come back)
        self.armour = dict(self.worn)
        # a vessel: what they carry, or --vessel's for someone whose awakenings take Aura in a fight
        self.vessel = max(vessel, k.get("vessel", 0)) if (kit and self.s["awk"]) else 0
        self.charge = 0
        self.toll = 0
        self.max = 5
        self.aura = 5
        self.due = 0
        self.out = False
        self.scar = None
        self.hidden = False
        self.pool = []
        self.sf = 0          # Stand firm: hits left in its pair
        self.lost = 0        # points lost to hits
        self.hits = 0
        self.defending = False

    def steps(self, root):
        return max(1, self.roots[root])


def shape(S, n_targets, D):
    """S steps as dice to go at n_targets things defending on a dD: the
    build that wins most, as Fight's build() does."""
    return [die_of(s) for s, _ in build(max(1, S), max(-(-S // 6), n_targets), (D,))]


def shape_defence(S, teles):
    """S steps split to meet the telegraph dice landing on a Root: as many dice
    as there are telegraphs, or fewer when that stops more. Each die's at most
    a d12 (6 steps), so past 6 a step a telegraph, it splits further."""
    S = max(1, S)
    teles = sorted(teles, reverse=True)
    best, best_v = None, -1.0
    lo = -(-S // 6)
    for n in range(lo, max(lo, min(S, len(teles))) + 1):
        steps = [S // n + (1 if i < S % n else 0) for i in range(n)]
        if max(steps) > 6:
            continue
        dice = sorted((2 * s for s in steps), reverse=True)
        v = sum(pstop(d, T) for d, T in zip(dice, teles))
        if v > best_v + 1e-12:
            best, best_v = dice, v
    if best is None:
        best = [12] * (S // 6) + ([2 * (S % 6)] if S % 6 else [])
    return best


class CoreFight:
    """A fight on the new core. kit=True (the default) is the 17 Nov fixes:
    items on a roll, guards on landing, soak, vessels. kit=False is 16 Nov.
    gm: focus piles on the Body that's hurting most (hard), cruel piles the
    rest on the weakest Root anywhere, a 0 one first. crew: a crew carried in
    from an earlier scene."""

    def __init__(self, names, R, f=1.0, policy="plain", rng=None, picks=0, deadly=1, focus=False, mults=None,
                 kit=True, vessel=0, vessel_pts=False, cruel=False, crew=None, reach=9, deadly_price=0.5,
                 pile_from=2):
        self.focus = focus or cruel
        self.pile_from = pile_from
        self.cruel = cruel
        self.policy = policy
        self.plain = policy == "plain"
        self.rng = rng or random.Random()
        self.kit = kit
        self.vessel_pts = vessel_pts
        self.reach = reach              # how many friends the Guardian can get in front of a round
        self.deadly_price = deadly_price  # each hit past the first costs this many times its steps (the book: 0.5)
        self.first_bloodied_who = None
        self.crew = crew if crew is not None else [CoreChar(n, picks, kit, vessel) for n in names]
        self.R = R
        self.f = f
        self.deadly = deadly
        self.boss, self.people = encounter(0, f, mults)
        self.threats = [self.boss] + self.people
        has = lambda arch: next((c for c in self.crew if arch in c.s["arch"] and not c.out), None)
        self.guardian, self.hunter = has("Guardian"), has("Hunter")
        self.round = 0
        self.minutes = 0.0        # the dice model, on paper
        self.minutes_phone = 0.0  # the dice model, on a phone
        self.minutes_flat = 0.0   # the flat model (16 Nov)
        self.wins = 0
        self.first_wound = None
        self.first_bloodied = None
        self.wounds = 0
        self.scars = 0
        self.scarred = []
        self.gos = []             # (steps, dice) for every go
        self.soaked = 0
        self.charged = 0          # charge spent
        self.filled_pts = 0       # points put into vessels
        self._dice = self._choice = 0

    def r(self, d):
        return self.rng.randint(1, d) if d > 0 else 0

    def throw(self, d):
        """A die a player throws on their go (counted for the time it takes)."""
        self._dice += 1
        return self.r(d)

    def living(self):
        return [t for t in self.threats if t.alive]

    def standing(self):
        return [c for c in self.crew if not c.out]

    def defence(self, t):
        if t.defroll is None:
            t.defroll = self.r(t.die)
        return t.defroll

    def targets(self):
        ppl = sorted([t for t in self.people if t.alive], key=lambda t: t.left())
        seq = []
        for t in ppl:
            seq += [t] * t.left()
        if self.boss.alive:
            seq.append(self.boss)
        return seq

    def fill(self, c, n):
        """Aura that would be lost goes into a vessel, up to its tier."""
        if c.vessel and n > 0:
            c.charge = min(c.vessel, c.charge + n)

    def gain(self, c, n, acting=False):
        """Aura: past the maximum only while acting; otherwise the spare goes
        to a friend, and what nobody can take into a vessel."""
        c.aura += n
        if acting or c.aura <= c.max:
            return
        spare, c.aura = c.aura - c.max, c.max
        for f in sorted(self.standing(), key=lambda f: f.aura):
            if f is c or spare <= 0:
                continue
            g = min(max(0, f.max - f.aura), spare)
            f.aura += g
            spare -= g
        self.fill(c, spare)

    def pay(self, c, n=1):
        """An ability or an awakening's Aura: charge first, then Aura."""
        if c.charge >= n:
            c.charge -= n
            self.charged += n
            return True
        if c.aura >= n:
            c.aura -= n
            return True
        return False

    # ---- the GM telegraphs (as Fight does, at the crew's Roots)
    def telegraph(self):
        budget = int(round(self.R * AT_TRACKS))
        teles, used, count = [], {}, {}
        crew = self.standing()
        if not crew:
            return teles
        order = crew[:]
        self.rng.shuffle(order)
        g = self.guardian if (self.guardian is not None and not self.guardian.out) else None

        def hits_of(t):
            return self.deadly if (t is not None and t.boss) else 1

        def price(t):
            return 1 + self.deadly_price * (hits_of(t) - 1)

        def pick(c, root):
            for t in sorted(self.living(), key=lambda t: -t.die):
                if count.get(id(t), 0) >= t.cap or (id(t), id(c)) in used or root not in t.roots:
                    continue
                if 2 * price(t) > budget:
                    continue
                return t
            return None

        def add(t, c, root):
            # a telegraph costs its steps, once for each hit it carries
            h = price(t)
            die = min(t.die if t else 8, 2 * int(budget // h))
            teles.append([t, c, root, die, hits_of(t)])
            if t is not None:
                used[(id(t), id(c))] = True
                count[id(t)] = count.get(id(t), 0) + 1
            return int(round((die // 2) * h))

        for c in order:
            if budget < 2:
                break
            budget -= add(pick(c, "Body"), c, "Body")
        cycle, i, j = ["Mind", "Soul", "Body"], 0, 0
        while budget >= 2:
            i += 1
            # the ones that don't press go round the Roots in turn (till 17 Nov the
            # third of every three landed on Body too, so hard play never reached a Mind or a Soul)
            root = cycle[j % 3]
            c = None
            if self.cruel:
                # the weakest Root on the board, a 0 one first (a 0 Body behind a
                # Guardian is no use, since he'd take it), from a threat or the scene itself
                cands = [(x.pts[r] + x.armour.get(r, 0), self.rng.random(), x, r) for x in crew for r in ROOTS
                         if not (r == "Body" and g is not None and x is not g and x.pts["Body"] == 0)]
                if cands:
                    _, _, c, root = min(cands)
            if c is None and self.focus and i % 3 and self.round >= self.pile_from:
                # pressing: from round 2 (pile_from), two in three of the rest go at the
                # Body that's hurting most. Round 1 spreads them round the Roots, since
                # piling on from the start Bloodies the crew's softest Body in round 2
                root = "Body"
                pool = [x for x in crew if not (g is not None and x is not g and x.pts["Body"] == 0)] or crew
                c = min(pool, key=lambda x: (x.pts["Body"] + x.armour.get("Body", 0), self.rng.random()))
            if c is None:
                j += 1
                c = sorted(crew, key=lambda x: (sum(1 for y in teles if y[1] is x and y[2] == root), self.rng.random()))[0]
            budget -= add(pick(c, root), c, root)
        return teles

    # ---- going at threats
    def one_die(self, c, d, t, vuln=0):
        if not t.alive:
            return 0
        D = self.defence(t)
        raw = self.throw(d)
        won = raw > D
        if not won and raw == D and not self.plain and c.aura >= 1:
            c.aura -= 1
            self._choice += 1
            won = True
        if raw == d:
            self.gain(c, 1, True)
        if won:
            self.gain(c, 1, True)
            h = self.hunter
            if h is not None and h is not c and not h.out and t.marked:
                self.gain(h, 1)        # Good Hunting
            t.tick(1 + vuln)
            self.wins += 1
            return 1
        return 0

    def roll_at(self, c, S, melee, extra=(), area=False):
        """Shape S steps at the threats and throw them. Returns wins."""
        seq = self.targets()
        if not seq:
            return 0
        wins = 0
        if area and len(self.living()) >= 2:
            # one die's the area (a d4), the biggest goes at everyone in it, the rest at the boss
            self._choice += 1
            a = self.throw(4)
            if a == 4:
                self.gain(c, 1, True)
            reach = 2 if a <= 2 else (4 if a <= 5 else 99)
            dice = shape(S - 2, 1, 12)
            intent = dice[0]
            v = self.throw(intent)
            if v == intent:
                self.gain(c, 1, True)
            caught = sorted(self.living(), key=lambda t: (t.boss, t.left()))[:reach]
            won = False
            for t in caught:
                D = self.defence(t)
                if v > D:
                    won = True
                    t.tick(1 + self.vuln(t, melee))
                    self.wins += 1
                    wins += 1
            if won:
                self.gain(c, 1, True)
            for d in dice[1:]:
                t = self.boss if self.boss.alive else (self.living() or [None])[0]
                if t is None:
                    break
                wins += self.one_die(c, d, t, self.vuln(t, melee))
            return wins
        D = max(t.die for t in seq)
        for d in list(shape(S, 1, D)) + list(extra):
            seq = self.targets()
            if not seq:
                break
            t = seq[0]
            wins += self.one_die(c, d, t, self.vuln(t, melee))
        if self.boss.alive and self.boss.marked and seq and seq[0] is self.boss:
            wins += self.one_die(c, self.boss.marked, self.boss, self.vuln(self.boss, melee))
        return wins

    def vuln(self, t, melee):
        return 1 if (t.prone and melee) else 0

    def top_up(self, c):
        """Hard play with --vessel-pts: a point at a time from the Root they
        don't fight with into the vessel, no action, keeping 2 there."""
        if not (self.vessel_pts and c.vessel and not self.plain):
            return
        fight = c.s["attack"][0]
        while c.charge < c.vessel:
            spare = max((r for r in ROOTS if r != fight), key=lambda r: c.pts[r])
            if c.pts[spare] <= 2:
                break
            c.pts[spare] -= 1
            c.charge += 1
            self.filled_pts += 1

    def spend_for_roll(self, c, S):
        """Hard play: bring a Root in when a permission explains it (3 Aura, or
        a point when that Root's got 3 or more to spare), then put charge and
        spare Aura on an awakening, keeping 1 Aura for a tie."""
        if self.plain:
            return S
        b = c.s["bring"]
        if b:
            root = b[0]
            if c.aura >= 3:
                c.aura -= 3
                S += c.steps(root)
                self._choice += 2
            elif c.pts[root] >= 3:
                c.pts[root] -= 1
                S += c.steps(root)
                self._choice += 2
        if c.s["awk"]:
            self.top_up(c)
            paid = False
            while c.charge > 0:
                c.charge -= 1
                self.charged += 1
                S += 2
                paid = True
            while c.aura >= 2:
                c.aura -= 1
                S += 2
                paid = True
            self._choice += paid
        return S

    # ---- a player's go
    def turn(self, c, teles):
        c.aura += c.due
        c.due = 0
        root, awk = c.s["attack"]
        n = c.name
        if c.defending:
            return
        if not self.living():
            return
        self._dice = self._choice = 0
        S = self.go(c, root, awk, n)
        if S:
            self.gos.append((S, self._dice, self._choice))

    def go(self, c, root, awk, n):
        """The go itself; returns the steps rolled."""
        item = c.weapon if c.kit else 0
        if n == "Vesk" and not self.plain:
            if not c.hidden:
                watcher = max(self.living(), key=lambda t: t.die)
                D = self.defence(watcher)
                S = self.spend_for_roll(c, c.steps("Body"))
                dice = shape(S, 1, watcher.die)
                ok = False
                for d in dice:
                    raw = self.throw(d)
                    if raw == d:
                        self.gain(c, 1, True)
                    if raw > D:
                        ok = True
                        self.gain(c, 1, True)
                if ok:
                    c.hidden, c.pool = True, dice
                return S
            c.hidden = False
            pool, c.pool = c.pool, []
            S = self.spend_for_roll(c, c.steps(root) + item)
            self._choice += 1 + (item > 0)
            self.roll_at(c, S, True, extra=pool)
            return S + 2 * len(pool)
        if n == "Wren" and not self.plain and self.boss.alive and self.boss.marked < 8:
            S = self.spend_for_roll(c, c.steps(root) + awk + item)
            self._choice += (awk > 0) + (item > 0)
            D = self.defence(self.boss)
            best = 0
            for d in shape(S, 1, 12):
                raw = self.throw(d)
                if raw == d:
                    self.gain(c, 1, True)
                if raw > D:
                    self.gain(c, 1, True)
                    best = max(best, d)
            if best:
                self.boss.marked = best
            return S
        S = c.steps(root) + awk + item
        self._choice += (awk > 0) + (item > 0)
        knock = (not self.plain) and n == "Bram" and self.boss.alive
        if knock:
            S += c.s["knock"]
            self._choice += 1
        S = self.spend_for_roll(c, S)
        before = self.wins
        area = (not self.plain) and "Elementalist" in c.s["arch"]
        self.roll_at(c, S, c.s["melee"], area=area)
        if knock and self.wins > before and self.boss.prone_set != self.round:
            self.boss.prone = 8
            self.boss.prone_set = self.round
        return S

    # ---- what lands
    def take(self, c, root, n):
        """n points on a Root: soak first, then points. Returns what's left over."""
        s = min(c.armour.get(root, 0), n)
        if s:
            c.armour[root] -= s
            self.soaked += s
            n -= s
        p = min(c.pts[root], n)
        c.pts[root] -= p
        c.lost += p
        return n - p

    def hit(self, c, root, n=1):
        for _ in range(n):
            if c.out:
                return
            c.hits += 1
            if c.sf == 1 and root == "Body":
                c.sf = 0
                continue
            if c.sf == 2 and root == "Body":
                c.sf = 1
            if c.armour.get(root, 0) > 0 or c.pts[root] > 0:
                self.take(c, root, 1)
                continue
            # At 0 the wound comes first: it costs nothing in the scene, where 2 for 1
            # costs 2 points somewhere else. Once it's wounded, 2 for 1 keeps them in
            # (on the fixes, that Root's soak takes the 2 first).
            has = (lambda r: c.pts[r] + c.armour.get(r, 0)) if self.kit else (lambda r: c.pts[r])
            other = max((r for r in ROOTS if r != root), key=has)
            # on the fixes, 2 for 1 onto soak is free (it's back at the scene's end), so it
            # goes there before the wound does (Vesk's curse on her leathers)
            soaks = self.kit and c.armour.get(other, 0) >= 2
            if (c.wound[root] or soaks) and has(other) >= 2:
                if self.kit:
                    self.take(c, other, 2)
                else:
                    c.pts[other] -= 2
                    c.lost += 2
                continue
            if not c.wound[root]:
                c.wound[root] = True
                self.wounds += 1
                if self.first_wound is None:
                    self.first_wound = self.round
                if root == "Body" and self.first_bloodied is None:
                    self.first_bloodied = self.round
                    self.first_bloodied_who = c.name
                continue
            c.out = True
            c.scar = root
            self.scars += 1
            self.scarred.append(c.name)
            return

    def land(self, teles):
        lands = rolls_n = ddice = hits = 0
        for c in self.standing():
            for root in ROOTS:
                mine = [x for x in teles if x[1] is c and x[2] == root and (x[0] is None or x[0].alive)]
                if not mine:
                    continue
                lands += len(mine)
                rolls_n += 1
                rolls = sorted((self.r(x[3]), x[4]) for x in mine)
                # a guard's tier goes on the roll avoiding a blow (one item a roll, so once a landing)
                guard = c.guard if (c.kit and root == "Body") else 0
                dd = shape_defence(c.steps(root) + guard, [x[3] for x in mine])
                if c.defending and root == "Body":
                    dd += shape_defence(c.steps("Body"), [x[3] for x in mine])
                ddice += len(dd)
                mine_rolls = []
                for d in dd:
                    v = self.r(d)
                    if v == d:
                        self.gain(c, 1)
                    mine_rolls.append((v, d))
                avail = sorted(v for v, _ in mine_rolls)
                through = []
                for tv, h in sorted(rolls, key=lambda p: (-p[1], p[0])):
                    k = next((i for i, v in enumerate(avail) if v >= tv), None)
                    if k is None and not self.plain and c is self.guardian and (c.aura >= 1 or c.charge >= 1):
                        # his Push: +2 on a die that's 1 or 2 short
                        k = next((i for i, v in enumerate(avail) if v + 2 >= tv), None)
                        if k is not None:
                            self.pay(c)
                    if k is None:
                        through.append(h)
                    else:
                        avail.pop(k)
                        self.gain(c, 1)
                if (not self.plain and c is self.guardian and root == "Body" and len(through) >= 2
                        and (c.aura >= 1 or c.charge >= 1) and c.armour.get("Body", 0) == 0):
                    self.pay(c)
                    c.sf = 2                   # Stand firm
                for h in through:
                    hits += h
                    self.hit(c, root, h)
                    if c.out:
                        break
                if c.out:
                    break
        return lands, rolls_n, ddice, hits

    def play_round(self):
        self.round += 1
        for t in self.threats:
            t.defroll = None
        teles = self.telegraph()
        stakes = int(round(self.R * (1 - AT_TRACKS) / 4))    # the rest of the budget, at stakes and clocks, about a d8 each
        g = self.guardian
        if g is not None and not g.out:
            took = 0
            # the friends within his stride this round (--reach), the ones who need him most
            near = sorted([c for c in self.standing() if c is not g], key=lambda c: (c.pts["Body"], self.rng.random()))[:self.reach]
            for x in teles:
                if x[2] != "Body" or x[1] is g or x[1] not in near:
                    continue
                friend = x[1]
                # plain: only for a friend whose Body can't take it; hard: while his Body's got the points
                if friend.pts["Body"] == 0 or (not self.plain and g.pts["Body"] >= 4 and friend.pts["Body"] < g.pts["Body"]):
                    x[1] = g
                    took += 1
            if took:
                if self.plain:
                    self.gain(g, took)          # Better Me Than You, before he's acting
                else:
                    g.due += took               # stepping in on his own go
            g.defending = sum(1 for x in teles if x[1] is g and x[2] == "Body") >= 2
        for c in self.standing():
            if c is not g:
                c.defending = False
        order = sorted(self.standing(), key=lambda c: 0 if c is g else 1)
        n0 = len(self.gos)
        for c in order:
            if not self.living():
                break
            self.turn(c, teles)
            if c.aura > c.max:
                self.fill(c, c.aura - c.max)
                c.aura = c.max
        goes = len(self.standing())
        lands, rolls_n, ddice, hits = self.land(teles) if self.living() else (0, 0, 0, 0)
        gm = MIN_TELE * (len(teles) + stakes)
        self.minutes_flat += gm + MIN_GO * goes + MIN_LAND * lands
        mine = self.gos[n0:]
        idle = goes - len(mine)                # a Defend, or a go once it's over
        dice = sum(x[1] for x in mine)
        choice = sum(x[2] for x in mine)
        base = GO_BASE * (len(mine) + idle) + LAND_ROLL * rolls_n + LAND_TELE * lands
        var = PER_DIE * dice + PER_CHOICE * choice + LAND_DIE * ddice + PER_HIT * hits
        self.minutes += gm + base + var
        self.minutes_phone += gm + base + PHONE * var
        for t in self.threats:
            if t.prone:
                t.prone = smaller(t.prone)
            if t.marked:
                t.marked = smaller(t.marked)

    def play(self, cap=30):
        while self.living() and self.standing() and self.round < cap:
            self.play_round()
        n = len(self.crew)
        return dict(rounds=self.round, minutes=self.minutes, minutes_phone=self.minutes_phone,
                    minutes_flat=self.minutes_flat, won=not self.living(),
                    first_wound=self.first_wound, first_bloodied=self.first_bloodied, who=self.first_bloodied_who,
                    came_in=getattr(self, "came_in", None),
                    wounds=self.wounds, scars=self.scars, scarred=self.scarred,
                    lost=sum(c.lost for c in self.crew) / n,
                    left=sum(sum(c.pts.values()) for c in self.crew) / sum(sum(c.cap.values()) for c in self.crew),
                    wins=self.wins, gos=self.gos, soaked=self.soaked, charged=self.charged,
                    filled_pts=self.filled_pts)


def scene_end(c, rng, kit=True):
    """The end of a scene: each Root below what it holds rolls unsplit (its
    dice filled to a d12 first) and gets back what it rolls, up to what it
    holds or half that while it's wounded. A Scar locks a point of its Root
    for good. Soak comes back (the fixes, not 16 Nov's boxes), leftover Aura
    goes into a vessel, Aura fills, and Toll drops by 1."""
    if c.scar:
        c.cap[c.scar] = max(0, c.cap[c.scar] - 1)
        c.scar = None
    for r in ROOTS:
        top = -(-c.cap[r] // 2) if c.wound[r] else c.cap[r]
        c.pts[r] = min(c.pts[r], c.cap[r])
        if c.pts[r] < top:
            s = c.roots[r]
            dice = [12] * (s // 6) + ([2 * (s % 6)] if s % 6 else [])
            c.pts[r] = min(top, c.pts[r] + sum(rng.randint(1, d) for d in dice))
    if kit:
        c.armour = dict(c.worn)
    if c.vessel:
        c.charge = min(c.vessel, c.charge + c.aura)
    c.aura = c.max
    c.toll = max(0, c.toll - 1)
    c.out = c.hidden = c.defending = False
    c.pool, c.sf, c.due = [], 0, 0


def run_core(R, f=1.0, policy="plain", n=3000, seed=1, picks=0, deadly=1, focus=False, mults=None,
             names=("Bram", "Vesk", "Wren", "Ash"), before=None, **kw):
    """n fights. before: an earlier fight first, then the scene's end, then
    this one with what they carried in: "even" (the same people with a
    lieutenant, Armoured x2 and Feeds x1, at 48) or "hard" (this same fight
    at Hard, Armoured x4 and Feeds x3, at 72)."""
    rng = random.Random(seed)
    res = []
    for _ in range(n):
        crew = None
        if before:
            hard = before == "hard"
            first = CoreFight(list(names), 72 if hard else 48, 1.0, policy, rng, picks, 1, hard, (4, 3) if hard else (2, 1),
                              **{k: v for k, v in kw.items() if k != "cruel"})
            first.play()
            crew = first.crew
            for c in crew:
                scene_end(c, rng, kw.get("kit", True))
        fight = CoreFight(list(names), R, f, policy, rng, picks, deadly, focus, mults, crew=crew, **kw)
        if crew:
            # what they carry in: points down from what they hold, and wounds
            fight.came_in = (sum(c.cap[r] - c.pts[r] for c in crew for r in ROOTS) / len(crew),
                             sum(1 for c in crew if any(c.wound.values())) / len(crew),
                             sum(1 for c in crew if c.wound["Body"]) / len(crew))
        res.append(fight.play())
    out = {k: sum(r[k] for r in res) / n for k in ("rounds", "minutes", "minutes_phone", "minutes_flat", "wounds",
                                                    "scars", "lost", "left", "wins", "soaked", "charged", "filled_pts")}
    out["won"] = sum(1 for r in res if r["won"]) / n
    for k in ("first_wound", "first_bloodied"):
        got = sorted(r[k] for r in res if r[k] is not None)
        out[k + "_any"] = len(got) / n
        out[k + "_median"] = got[len(got) // 2] if got else None
        out[k + "_mean"] = sum(got) / len(got) if got else None
        out[k + "_34"] = sum(1 for x in got if x in (3, 4)) / n
    out["any_scar"] = sum(1 for r in res if r["scars"]) / n
    out["scarred"] = {nm: sum(r["scarred"].count(nm) for r in res) / n for nm in names}
    out["wins_per_round"] = out["wins"] / out["rounds"]
    out["who"] = {nm: sum(1 for r in res if r["who"] == nm) / n for nm in names}
    ci = [r["came_in"] for r in res if r["came_in"]]
    out["came_in"] = tuple(sum(x[i] for x in ci) / len(ci) for i in range(3)) if ci else None
    gos = [g for r in res for g in r["gos"]]
    out["go_steps"] = sum(g[0] for g in gos) / max(1, len(gos))
    out["go_dice"] = sum(g[1] for g in gos) / max(1, len(gos))
    out["go_choices"] = sum(g[2] for g in gos) / max(1, len(gos))
    out["go_3dice"] = sum(1 for g in gos if g[1] >= 3) / max(1, len(gos))
    out["go_4dice"] = sum(1 for g in gos if g[1] >= 4) / max(1, len(gos))
    out["min_round"] = out["minutes"] / out["rounds"]
    return out


def find_core_f(target, R, policy, picks=0, n=3000, seed=1, deadly=1, focus=False, lo=0.1, hi=30.0, steps=16, **kw):
    """The boss multipliers' factor that makes a fight on the new core last
    target minutes, by halving on the same dice."""
    for _ in range(steps):
        mid = (lo + hi) / 2
        if run_core(R, mid, policy, n, seed, picks, deadly, focus, **kw)["minutes"] < target:
            lo = mid
        else:
            hi = mid
    return (lo + hi) / 2


def say_core(policy, R, f, o, picks=0, mults=None):
    a, b = mults or (int(round(8 * f)), int(round(5 * f)))
    return ("%-5s budget %d, Redhand Armoured x%d, Feeds x%d%s: %.1f rounds, %.0f min (%.0f on phones, %.0f flat), "
            "%.1f min a round, wins %.1f a round; Bloodied in %.0f%% (median round %s, rounds 3-4 in %.0f%%), "
            "any wound %.0f%% (median %s), Scar %.0f%%, %.1f pts lost each, %.0f%% left; "
            "a go %.1f steps, %.2f dice (3+ in %.0f%%, 4+ in %.0f%%), %.1f choices"
            % (policy, R, a, b, ", %d picks" % picks if picks else "", o["rounds"], o["minutes"], o["minutes_phone"],
               o["minutes_flat"], o["min_round"], o["wins_per_round"], 100 * o["first_bloodied_any"],
               o["first_bloodied_median"], 100 * o["first_bloodied_34"], 100 * o["first_wound_any"],
               o["first_wound_median"], 100 * o["any_scar"], o["lost"], 100 * o["left"], o["go_steps"], o["go_dice"],
               100 * o["go_3dice"], 100 * o["go_4dice"], o["go_choices"]))

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


def find_f(target, names, R, policy, picks=0, n=3000, seed=1, traits=None, lo=1.0, hi=40.0, steps=16):
    """The boss multipliers' factor that makes a stacking fight last target
    rounds, by halving: the same seed every time, so each try plays the same
    dice and only the multipliers move."""
    for _ in range(steps):
        mid = (lo + hi) / 2
        if run("stack", names, R, n=n, seed=seed, policy=policy, f=mid, picks=picks, traits=traits)["rounds"] < target:
            lo = mid
        else:
            hi = mid
    return (lo + hi) / 2


def say(rules, policy, R, f, o, picks=0):
    return ("%-5s %-5s budget %d, boss x%.2g%s: %.2f rounds, %.2f hits a player, a Blaze in %.1f%%, "
            "%.1f wins and %.1f actions a round" % (rules, policy, R, f, ", %d picks" % picks if picks else "", o["rounds"], o["hits"],
                                                     100 * o["any_blaze"], o["wins_per_round"], o["actions_per_round"]))


def main():
    import argparse
    ap = argparse.ArgumentParser(description="Zi'Dara fight simulator")
    ap.add_argument("--rules", choices=("now", "stack", "core", "fixes"), default="fixes",
                    help="fixes (17 Nov, the default), core (16 Nov), stack (14 Nov) or now (10 Nov)")
    ap.add_argument("--policy", choices=("plain", "table"), help="plain or table (hard); without it, both")
    ap.add_argument("--gm", choices=("even", "hard", "cruel"), default="hard",
                    help="core and fixes: even spreads it, a die at each Body and the rest round the Roots; "
                         "hard piles two in three of the rest on the Body that's hurting most; "
                         "cruel piles the rest on the weakest Root anywhere, a 0 one first")
    ap.add_argument("--budget", type=int, help="round budget for four players (core: 72 at hard, 48 at even)")
    ap.add_argument("--mults", default="4,3", help="core: Redhand's Armoured and Feeds (4,3)")
    ap.add_argument("--deadly", type=int, default=1, help="core: hits on each of Redhand's dice that get through "
                                                          "(each costs its steps once a hit)")
    ap.add_argument("--vessel", type=int, default=0, help="fixes: a vessel of this tier for each of the crew whose awakenings take Aura (Ash carries a tier 3 one)")
    ap.add_argument("--vessel-pts", action="store_true", help="fixes: hard play tops vessels up with points from a spare Root")
    ap.add_argument("--pile-from", type=int, default=2, help="core and fixes: the round the hard GM starts piling on (1 was 17 Nov's prompt 4)")
    ap.add_argument("--reach", type=int, default=9, help="core and fixes: friends the Guardian can intercept for a round")
    ap.add_argument("--deadly-price", type=float, default=0.5,
                    help="core and fixes: each hit past the first costs this many times a deadly telegraph's steps (the book: half again, 0.5, since 17 Nov, and 1 before)")
    ap.add_argument("--before", choices=("even", "hard"), help="core and fixes: an earlier fight first, and what they carry in")
    ap.add_argument("--minutes", type=float, default=45, help="core --find: how long the fight should run")
    ap.add_argument("--f", type=float, default=1.0, help="boss multipliers times this (now, stack)")
    ap.add_argument("--picks", type=int, default=0, help="new Titles, archetypes or attuned things each (--find: up to this many)")
    ap.add_argument("--n", type=int, default=3000, help="fights")
    ap.add_argument("--seed", type=int, default=1)
    ap.add_argument("--no-traits", action="store_true", help="play stacking without the archetypes' Traits")
    ap.add_argument("--find", action="store_true",
                    help="core: the factor on Redhand's multipliers (x8 and x5 at 1) that makes the fight last "
                         "--minutes, and for each pick what it needs against none. now/stack: as on 14 Nov")
    ap.add_argument("--grid", default="", help="core and fixes: round budgets to try with --find, like 48,60,72")
    a = ap.parse_args()
    crew = ["Bram", "Vesk", "Wren", "Ash"]
    if a.rules in ("core", "fixes"):
        hard = a.gm != "even"
        R0 = a.budget or (72 if hard else 48)
        mults = tuple(int(x) for x in a.mults.split(","))
        kw = dict(kit=a.rules == "fixes", vessel=a.vessel, vessel_pts=a.vessel_pts, cruel=a.gm == "cruel",
                  before=a.before, reach=a.reach, deadly_price=a.deadly_price, pile_from=a.pile_from)
        for policy in [a.policy] if a.policy else ["plain", "table"]:
            if a.find or a.grid:
                for R in [int(x) for x in a.grid.split(",")] if a.grid else [R0]:
                    f0 = None
                    for picks in range(a.picks + 1):
                        # the round budget grows with the crew's points, 16 each and a pick's 2
                        Rk = int(round(R * (16 + CoreChar.PICK * picks) / 16))
                        f = find_core_f(a.minutes, Rk, policy, picks, a.n, a.seed, a.deadly, hard, **kw)
                        o = run_core(Rk, f, policy, a.n, a.seed, picks, a.deadly, hard, **kw)
                        f0 = f0 or f
                        print("%s %s %s" % (a.rules, a.gm, say_core(policy, Rk, f, o, picks)) +
                              (", x%.2f" % f if picks == 0 else ", %.2f times none" % (f / f0)), flush=True)
            else:
                o = run_core(R0, 1.0, policy, a.n, a.seed, a.picks, a.deadly, hard, mults, **kw)
                print("%s %s %s" % (a.rules, a.gm, say_core(policy, R0, 1.0, o, a.picks, mults)), flush=True)
                print("      first Bloodied: " + ", ".join("%s %.0f%%" % (k, 100 * v) for k, v in o["who"].items())
                      + "; Scars a fight: " + ", ".join("%s %.2f" % kv for kv in o["scarred"].items())
                      + "; soaked %.1f, charge spent %.1f, points into vessels %.1f" % (o["soaked"], o["charged"], o["filled_pts"])
                      + ("; came in %.1f points down each, %.0f%% wounded, %.0f%% Bloodied" % (
                          o["came_in"][0], 100 * o["came_in"][1], 100 * o["came_in"][2]) if o["came_in"] else ""), flush=True)
        return
    traits = False if a.no_traits else None
    if a.find:
        R = a.budget or 44
        for policy in [a.policy] if a.policy else ["plain", "table"]:
            base = run("now", crew, 40, n=a.n, seed=a.seed, policy=policy)
            print(say("now", policy, 40, 1.0, base))
            f0 = None
            for picks in range(a.picks + 1):
                target = base["rounds"] if picks == 0 else first["rounds"]
                f = find_f(target, crew, R, policy, picks, a.n, a.seed, traits)
                o = run("stack", crew, R, n=a.n, seed=a.seed, policy=policy, f=f, picks=picks, traits=traits)
                if picks == 0:
                    f0, first = f, o
                print(say("stack", policy, R, f, o, picks) + ("" if picks == 0 else ", %.2f times none" % (f / f0)))
        return
    policy = a.policy or "plain"
    o = run(a.rules, crew, a.budget or 40, n=a.n, seed=a.seed, policy=policy, f=a.f, picks=a.picks, traits=traits)
    print(say(a.rules, policy, a.budget or 40, a.f, o, a.picks))


if __name__ == "__main__":
    main()
