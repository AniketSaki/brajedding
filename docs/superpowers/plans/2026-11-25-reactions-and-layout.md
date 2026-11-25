# Reactions + Laptop Layout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add WhatsApp-style Gen Z slang reactions under every photo and story card (shared counts in Upstash), and a two-column laptop layout (BoTD | shout, poll | farewell).

**Architecture:** Pure reaction logic in `src/lib/reactions.ts`; Redis access in `src/lib/reactionStore.ts`; a pure request handler in `src/lib/reactionsHandler.ts` wired by the on-demand route `src/pages/api/reactions.ts` (same pattern as the poll). One Astro component `Reactions.astro` renders a bar per card; one bundled client script loads counts once and handles all bars. Layout is CSS only.

**Tech Stack:** Astro 7, @upstash/redis, Vitest (existing).

**Spec:** `docs/superpowers/specs/2026-11-25-reactions-design.md` (mockup `docs/superpowers/specs/mockups/desktop-layout-a.html`)

## Global Constraints

- Words, in this order, ids → labels: `slay`→`slay`, `no-cap`→`no cap`, `its-giving`→`it's giving`, `rizz`→`rizz`, `ate`→`ate`, `based`→`based`, `aura`→`aura +1000`, `delulu`→`delulu`, `mid`→`mid`, `cooked`→`cooked`, `sus`→`sus`, `l`→`L`. Stored in `site.reactions.words`.
- Card ids: `photo:<filename>` (e.g. `photo:4ad204a1-….JPG`), `story:<collection id>` (e.g. `story:the-iffk-threesome`).
- Redis keys: counts `reactions:<cardId>` (word → count); voter choices `reacted:<voterId>` (cardId → word). Counts never below 0.
- Voter cookie: `rid=<uuid v4>`, `Max-Age=31536000; Path=/; HttpOnly; SameSite=Lax` (+`Secure` on https). Invalid/missing → new id issued on POST.
- One reaction per voter per card; same word again via POST `{card, word: null}` removes; different word switches.
- Responses `Cache-Control: no-store`; unknown card/word → 400; bad JSON → 400; no store / store error → 503; other methods → 405.
- API down → reaction bars stay hidden, page otherwise unaffected.
- Reactions only on home-page photo and story cards.
- Laptop layout only at `min-width: 900px`; phones unchanged. BoTD:shout = 3fr:2fr; poll:farewell = 1fr:1fr; content max-width ~1100px.
- Must work at 320px with no horizontal scroll (including open picker).

## Review Focus

1. **Double-tap / repeat POST of the same word**: count must not increase twice. → test `same word twice is idempotent` (Task 1).
2. **Missing, garbled or forged `rid` cookie**: no crash; a fresh id is issued; nobody else's reaction is touched. → test `invalid rid cookie gets a new id` (Task 1).
3. **Counts drifted below what mine says** (e.g. counts key reset in Upstash console): switching away must floor at 0, not go negative. → test `decrement never below zero` (Task 1).
4. **Card that no longer exists** (photo deleted after people reacted) or a made-up card id: 400, no key created. → test `unknown card → 400, nothing written` (Task 1).
5. **Picker opened on the last photo at 320px**: stays on screen, no horizontal scroll, closes on outside tap/Esc. → browser check (Task 2 Step 6).

---

### Task 1: Reactions logic, store, API

**Files:**
- Modify: `src/config/site.ts` (add `reactions.words`)
- Create: `src/lib/reactions.ts`, `src/lib/reactionStore.ts`, `src/lib/reactionsHandler.ts`, `src/lib/cards.ts`, `src/pages/api/reactions.ts`
- Test: `tests/reactions.test.ts`, `tests/reactions-api.test.ts`

**Interfaces:**
- Consumes: existing `CounterStore`-style pattern and `json`/cookie conventions from `src/lib/pollHandler.ts`.
- Produces:
  ```ts
  // site.ts
  site.reactions: { words: { id: string; label: string }[] }
  // reactions.ts
  export const photoCardId = (filename: string) => `photo:${filename}`;
  export const storyCardId = (id: string) => `story:${id}`;
  export interface Chip { id: string; label: string; count: number }
  export function chipsFor(counts: Record<string, number>, words: {id:string;label:string}[]): Chip[]; // count>0 only, count desc then word order
  // cards.ts
  export function allCardIds(): string[]; // from import.meta.glob of src/assets/stills/* and src/content/stories/*.md
  // reactionStore.ts
  export interface ReactionStore {
    hgetall(key: string): Promise<Record<string, unknown> | null>;
    hincrby(key: string, field: string, by: number): Promise<number>;
    hget(key: string, field: string): Promise<unknown>;
    hset(key: string, values: Record<string, string | number>): Promise<unknown>;
    hdel(key: string, field: string): Promise<unknown>;
  }
  export function reactionStoreFromEnv(env: Record<string, string | undefined>): ReactionStore | null; // reuse env var names from storeFromEnv
  export function getCounts(store, cards: string[], words: string[]): Promise<Record<string, Record<string, number>>>; // every card present, only known words, ints ≥0
  export function getMine(store, voterId: string, cards: string[]): Promise<Record<string, string>>;
  export function setReaction(store, voterId: string, card: string, word: string | null): Promise<Record<string, number>>; // returns that card's counts
  // reactionsHandler.ts
  export function handleReactions(req: Request, store: ReactionStore | null,
    opts: { cards: string[]; words: string[]; newVoterId: () => string }): Promise<Response>;
  // GET  → 200 { counts, mine }   (mine = {} when no valid rid)
  // POST { card, word|null } → 200 { card, counts: Record<word,number>, mine: string|null } (+ Set-Cookie rid when newly issued)
  ```

- [ ] **Step 1: Write failing tests** `tests/reactions.test.ts`:
  ```ts
  test('chipsFor: drops zero, sorts by count desc then word order', () =>
    expect(chipsFor({ mid: 2, slay: 2, rizz: 5, sus: 0 }, site.reactions.words).map(c => c.id)).toEqual(['rizz','slay','mid']));
  test('card ids', () => { expect(photoCardId('a.JPG')).toBe('photo:a.JPG'); expect(storyCardId('x')).toBe('story:x'); });
  test('allCardIds has every still and story', () => {
    const ids = allCardIds();
    expect(ids).toContain('story:the-iffk-threesome');
    expect(ids).toContain('story:the-mubi-club-years');
    expect(ids.filter(i => i.startsWith('photo:'))).toHaveLength(6);
  });
  test('words match spec', () => expect(site.reactions.words.map(w => w.label))
    .toEqual(['slay','no cap',"it's giving",'rizz','ate','based','aura +1000','delulu','mid','cooked','sus','L']));
  ```
  `tests/reactions-api.test.ts` with an in-memory fake `ReactionStore` (Map of hashes), `CARDS = ['story:a','photo:b.JPG']`, `newVoterId = () => '11111111-1111-4111-8111-111111111111'`:
  ```ts
  test('GET empty → zeroed counts for all cards, mine {}', ...);              // counts['story:a'].slay === 0, 12 keys per card
  test('POST new reaction → count 1, mine set, rid cookie issued', ...);
  test('same word twice is idempotent', ...);                                // two POSTs slay → slay 1
  test('switch word moves the count', ...);                                  // slay then mid → slay 0, mid 1
  test('word null removes', ...);                                            // slay then null → slay 0, mine null
  test('two voters counted separately', ...);                                // cookies rid=A, rid=B both slay → 2
  test('decrement never below zero', ...);                                   // mine says slay but counts hash empty; switch to mid → slay 0, mid 1
  test('invalid rid cookie gets a new id', ...);                             // cookie rid=garbage → Set-Cookie rid=<newVoterId()>
  test('GET returns mine for known voter', ...);
  test('unknown card → 400, nothing written', ...);
  test('unknown word → 400', ...);
  test('malformed JSON → 400', ...);
  test('store null → 503; store throws → 503', ...);
  test('other methods → 405', ...);
  ```
- [ ] **Step 2:** `npx vitest run tests/reactions*.test.ts` → FAIL (modules missing).
- [ ] **Step 3:** Implement config words, `reactions.ts`, `cards.ts` (`import.meta.glob(..., { eager: false })` keys only; filenames sorted), `reactionStore.ts` (`setReaction`: read `hget(reacted:<voter>, card)`; if equal to `word` → return counts unchanged; if prev → `hincrby -1`, and if result < 0 `hset` it to 0; if word → `hincrby +1` and `hset(reacted, {card: word})`, else `hdel`), `reactionsHandler.ts` (voter id valid iff matches UUID v4 regex), route (`prerender = false`, env = `{...import.meta.env, ...process.env}`, `cards: allCardIds()`, `words` from config, `newVoterId: () => crypto.randomUUID()`).
- [ ] **Step 4:** `npx vitest run` → all PASS; `npm run build` → succeeds, `/api/reactions` routed to the function in `.vercel/output/config.json`.
- [ ] **Step 5:** Commit `feat: reactions api backed by upstash`.

### Task 2: Reaction bars on cards

**Files:**
- Create: `src/components/Reactions.astro`
- Modify: `src/components/Stickered.astro` (bar under each sticker, outside the lightbox button), `src/components/Reviews.astro` (bar at bottom of each card)

**Interfaces:**
- Consumes: `photoCardId`, `storyCardId`, `chipsFor`, `site.reactions.words` (Task 1); API shapes from Task 1.
- Produces: `<Reactions card={string} />` rendering `<div class="reactions" data-card={card} hidden>` containing `.chips`, a `button.react-add` (`+ react`, `aria-haspopup="true"`, `aria-expanded`), and a `div.picker[role=menu]` with one `button[data-word]` per word (label + count span).

- [ ] **Step 1:** Component markup + scoped styles per spec look: chips white/ink border, own chip pink fill, `+ react` dashed on yellow, picker = `.panel` popover (absolute, `max-width: min(92vw, 300px)`, flex-wrap word buttons, clamped inside viewport by script).
- [ ] **Step 2:** Client script (one module, runs once): `GET /api/reactions`; on non-200 or network error leave all bars hidden. Else unhide bars, render chips via `chipsFor` (textContent only), mark own chip `.me` and picker word `aria-pressed`. Click chip or picker word → optimistic update (switch/remove semantics), POST, replace that card's counts/mine from response; on failure revert. Toggle picker on `+ react`; close on outside click, Esc, or after a pick; only one picker open at a time. Clamp picker inside viewport (shift left if right edge > innerWidth - 8).
- [ ] **Step 3:** Wire into Stickered (`photoCardId(name)`) and Reviews (`storyCardId(s.id)`).
- [ ] **Step 4:** `npm run build` passes.
- [ ] **Step 5: Browser check (dev server, API mocked with Playwright `route`)** at 375px:
  - API 503 → no `.reactions` visible.
  - Mocked counts `{ 'story:the-iffk-threesome': { sus: 5, delulu: 3 } }` → chips `sus 5`, `delulu 3` in that order.
  - Tap `+ react` → picker opens; pick `slay` → chip `slay 1` with `.me`; pick `slay` again → chip gone; pick `mid` then `cooked` → only `cooked 1` is mine.
  - Esc and outside tap close the picker.
- [ ] **Step 6: Browser check** at 320px: open picker on the last photo card → picker fully inside viewport, `scrollWidth <= innerWidth`.
- [ ] **Step 7:** Commit `feat: slang reaction bars on photo and story cards`.

### Task 3: Laptop layout A

**Files:**
- Modify: `src/pages/index.astro` (wrap `<Botd/><Shout/>` and `<Poll/><Farewell/>` in `<div class="pair pair-botd">` / `<div class="pair pair-poll">`), `src/styles/global.css` (`.pair` rules), `src/components/Hero.astro` (countdown max-width at ≥900px), and component-level margins that fight the grid (`Botd`, `Shout`, `Poll`, `Farewell`) only as needed.

- [ ] **Step 1:** CSS: `.pair` is a no-op below 900px. At `min-width: 900px`: `.pair { display:grid; align-items:center; gap:2.5rem; max-width:1100px; margin:0 auto; padding:0 2.5rem; }`, `.pair-botd { grid-template-columns: 3fr 2fr }`, `.pair-poll { grid-template-columns: 1fr 1fr }`, children's own `.section` horizontal padding removed and max-widths lifted so they fill their column. Countdown `max-width: 760px` at ≥900px.
- [ ] **Step 2: Browser check** at 1280px: BoTD and shout `getBoundingClientRect().top` within 80px of each other and side by side (shout.left > botd.right); poll and farewell side by side; no horizontal scroll. At 375px: section order and widths unchanged from before (stacked, one column). At 900px exactly: pairs side by side without overflow.
- [ ] **Step 3:** `npx vitest run` and `npm run build` pass. Commit `feat: two-column laptop layout`.
