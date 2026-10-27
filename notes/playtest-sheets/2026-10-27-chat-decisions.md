# Mo's asks, 27 Oct 2026 (in chat)

His words, as he sent them:

> When telegraphing each player can only answer one since they have one action or they can use an action to do something else. Also for telegraph keep events present like timers of sort maybe a locked door that needs to be broken into or a ritual in the works or the time it takes for reinforcements. Etc.
>
> Make it all clear and most will tick after a round but the players have one action each round to respond or use an action to do something. For an attack they use Thier defence to block an attack but all telgraphed attacks get answered by the defence once. Meaning if you have two dice a maximum of two attacks can be blocked etc. also players cns take a telegraphed action by intercepting etc. but basically if 4 telegraphed attacks come at a player and they have a defence of d10 then they block one of the 4 attacks and the rest just go through.
>
> Also we forgot about item quality and armour worn having a durability track, meaning that the more armour we have the more hits we can take. So that 3 tiers of quality a one, two or three named propely. A one tier item can tank one damage, and a two tier can tank two and a three tier item can tank 3. All shields. Armours and possibly helmets etc. Should apply.
>
> Make sure there should be space for all the environment effects available for players to engage with etc.

## Already the rule in the book

- One action each a round, in any order, and answering a telegraph spends it ([The Round](#s-round), [Answering](#s-answering)). The Round could say the choice more plainly: answer one telegraph, or do something else.
- Your defence is rolled once, and each die stops one telegraph it beats or ties. The rest get through ([When It Lands](#s-defending)). His example: four blows at a d10 Defend, one's stopped and three get through.
- Intercept: 1 Aura and no action, any of the dice aimed at a friend in your stride, free for a Guardian ([Intercept](#s-intercept)).
- Stakes (a Challenge with tags in the way, like *Locked*), clocks and events, which step down at the end of every round nobody works them and take an action to engage, and the scene clock ([Stakes, Clocks and Events](#s-stakes)). A place's card has the ground (things to use, like *The Hot Pool*), stakes, a scene clock and telegraphs, some aimed at a stake ([The Copper Baths](#s-place-copper-baths)).

## What the live table's missing (stage 8)

- A player can answer every telegraph aimed at them in a round (`answer` in `src/companion/table-rules.js` only checks nobody else has). One action is one answer, or a share in a combo, or something else instead.
- No intercept: a friend taking a telegraph on their phone, for 1 Aura or free for a Guardian.
- No scene: the ground, stakes, clocks, events and the scene clock aren't on the table. The GM should be able to put them on the round, every phone sees them, a player can spend their action on one, and the round's end steps down whatever nobody worked.

## The new rule: quality and durability

- Three tiers of quality, each with a proper name. Tier 1 takes 1 hit, tier 2 takes 2 and tier 3 takes 3, then it breaks.
- Shields and armour, and maybe helmets. The more you wear, the more hits you can take.
- Today a piece breaks the first time it takes a blow instead of you ([Armour](#s-armour)), so this replaces that.
- Claude's suggested names: **Common**, **Fine** and **Masterwork**.
- Calls to make, the smallest in the shape of the rules, each into `notes/to-confirm.md`:
  - A piece counts on Defend till it breaks.
  - A blow that gets through ticks one box, and two Hurts from a vulnerability tick two.
  - Its ticks are mended in downtime, the same as broken armour.
  - A helmet is a piece of armour like any other.
  - Attuned things still can't break.
