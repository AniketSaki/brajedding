# Reactions on photo and story cards + laptop layout

Date: 2026-11-25
Status: draft, awaiting owner approval
Builds on: `2026-11-25-brajedding-site-design.md`

## Intent

Let friends react to each photo and story with Gen Z slang, like emoji reactions on WhatsApp messages. It's more fun because Brajesh doesn't understand youth slang (it says so in the Mubi club story).

## Behaviour (owner asked; defaults proposed and not objected to)

- Every **Stickered** photo card and every **Reviews** story card on the home page gets a reaction bar underneath.
- The bar shows the reactions already given, as chips with counts (`slay 4`, `cooked 2`), plus a **`+ react`** button.
- `+ react` opens a small picker listing all words. Words that already have reactions show their count.
- **One reaction per person per card**, like WhatsApp:
  - picking a word adds it;
  - picking a different word switches to it;
  - tapping your current word (in the picker or as a chip) removes it.
- Your own chip is highlighted.
- Tapping an existing chip is a shortcut for picking that word.
- Words (fixed list, in config, order as shown): **slay, no cap, it's giving, rizz, ate, based, aura +1000, delulu, mid, cooked, sus, L**.

## Approach

There's one sensible way: an on-demand API route `/api/reactions` with the same Upstash Redis store the poll uses. Rejected alternatives:
- a second service, which adds cost and setup for no gain;
- browser-only storage, which means nobody sees anyone else's reactions.

## Design

- **Card ids:** `photo:<filename>` for stills, `story:<story id>` for stories. The server only accepts ids of cards that exist, derived from the same stills folder and stories folder at build time, so random keys can't be created.
- **Per-person tracking:** an anonymous random voter id goes in an HttpOnly cookie (1 year). The server stores each voter's current word per card, so a switch or removal only ever undoes that voter's own reaction. Clearing cookies lets someone react again; that's accepted, as with the poll.
- **Storage:**
  - counts: a hash `reactions:<cardId>` (word → count);
  - per-voter choice: a hash `reacted:<voterId>` (cardId → word);
  - counts never go below 0.
- **API:**
  - `GET /api/reactions` returns counts for all cards, plus this voter's own words.
  - `POST /api/reactions` with `{ card, word }` sets this voter's reaction on that card.
  - `POST` with `{ card, word: null }` removes it.
  - Unknown card or word → 400. Malformed JSON → 400. Storage missing or down → 503. Responses are `no-store`.
- **UI:**
  - updates optimistically, then reconciles with the server's counts;
  - if the API is unavailable, the reaction bars stay hidden and the rest of the page works as before;
  - the picker closes on outside tap or Esc and is keyboard-accessible;
  - it must work at 320px wide.
- **Look:** zine style. Chips are white with a black border, your own chip gets a pink fill, and the `+ react` button and picker use the existing panel style.

## Laptop layout (owner picked option A from mockups)

On screens about 900px and wider, the page should use the horizontal space instead of leaving wide empty margins. Phones are unchanged (one column).

- **BoTD and the shout bubble share one row:** BoTD takes about 3/5, the bubble about 2/5, and both are vertically centred.
- **The poll and the farewell share one row,** half each.
- **Countdown boxes widen** to use more of the hero width.
- **Photos stay 4 across and stories 2 across** (already the case), with reaction bars under each.
- The content max-width stays about 1100px, centred.
- Reference mockup: `docs/superpowers/specs/mockups/desktop-layout-a.html`.

## Non-goals

- Reactions on the BoTD quote, the poll, the farewell or the story pages themselves (cards only).
- Custom words or emoji typed by users.
- Showing who reacted.
- Testimonials (parked by owner).

## Left to the builder

- Picker positioning on phone vs laptop.
- Chip ordering (by count, then list order).
- Minor animation.
- Tests: reaction state transitions and API handler cases, mirroring the poll tests.
