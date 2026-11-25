# Brajedding Site Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A phone-first, comic-zine single-page site counting down to Brajesh & Saranya's wedding, with a random "Brajesh of the Day" quote, sticker photo gallery, story pages, a live shared poll and a farewell, deployed on Vercel.

**Architecture:** Astro static site (all pages prerendered) with the Vercel adapter for one on-demand API route (`/api/poll`) backed by Upstash Redis. Pure logic (countdown state, quote picking, poll tallying, poll storage) lives in `src/lib/` as plain TypeScript unit-tested with Vitest; components are thin Astro files with small inline client scripts that call into `src/lib/`.

**Tech Stack:** Node 24, Astro 7.4.x, @astrojs/vercel 11.x, @upstash/redis 1.41.x, Vitest 5.x, canvas-confetti 1.9.x, @fontsource/bangers 5.x, sharp (Astro image service).

**Spec:** `docs/superpowers/specs/2026-11-25-brajedding-site-design.md` (mockup: `docs/superpowers/specs/mockups/zine-film-v4.html`)

## Global Constraints

- Wedding datetime: `2027-02-03T00:00:00+05:30` (IST). All day-boundary logic is in IST (`Asia/Kolkata`, fixed +05:30, no DST), never the viewer's local zone.
- Hero uses only MUBI blue `#001489` and white (title misprint offset in `#ff4f9a` / `#00e5ff` allowed). Below the hero: yellow `#ffe94d`, pink `#ff4f9a`, black `#111`, white, cyan `#00e5ff` accent.
- Exact copy (verbatim):
  - Badge: `Streaming live soon from Guruvayur`
  - Title: `Brajesh & Saranya: The Wedding`
  - Tagline: `Rated U/A for emotional damage`
  - Credit: `Brought to you by Dating Splinter`
  - Quote tag/label: `BoTD` / `Brajesh of the Day`; button: `↻ *Varuned`
  - Section labels: `Stickered`, `Reviews`, `Audience poll`
  - Poll question: `Did you get the invite?`; options (ids → labels): `physical` → `Yes, physical invite hand delivered in person 💌`, `digital` → `Only a digital group one 📱`, `thinking` → `He's thinking about it 🤔`, `gatecrash` → `Gatecrash! 🚪💥`
  - Farewell: label `A message from the management`, heading `Mubi club wishes you a fond farewell`, body `You will be missed.`
  - Footer: `we got brajedding before nadodi subs`
  - Live state: `🔴 STREAMING LIVE NOW`; after: `Married for N days` (`1 day` singular)
- No "Premieres … Guruvayur" line anywhere.
- Quotes appear only in the BoTD section.
- No Spider-Man/Marvel/Sony artwork or MUBI logo.
- Must work at 320px width; phone = 1 photo per row; laptop (≥768px) = 3–4 per row.
- Respect `prefers-reduced-motion` (no confetti/balloons/wobble; static celebration instead).
- All copy/config lives in `src/config/site.ts`, `src/data/quotes.json`, `src/data/captions.json`, `src/content/stories/*.md`, `src/assets/stills/*` — no copy hard-coded in components except section structure.

## Review Focus

1. **Viewer outside IST** (e.g. a friend in London on 2 Feb 20:00 local = 3 Feb 01:30 IST) must see the live state, and on 3 Feb 23:00 London time (= 4 Feb IST) must see "Married for 1 day". → tests in Task 2.
2. **Tab left open across the target moment**: ticking must switch from countdown to live and fire the celebration once, without reload. → test in Task 2 (state function) + manual check in Task 7.
3. **Poll with zero votes, Redis down, or env vars missing**: shows 0% (never `NaN%`), a friendly fallback message, rest of page unaffected. → tests in Task 6.
4. **Only one quote in `quotes.json`**: `↻ *Varuned` must not loop forever; returns that quote. → test in Task 3.
5. **Repeat or forged votes**: unknown option id → 400; request carrying the `voted` cookie → 409 with current counts; malformed JSON → 400. → tests in Task 6.

---

### Task 1: Scaffold, config, base layout, theme

**Files:**
- Create: `package.json`, `astro.config.mjs`, `tsconfig.json`, `vitest.config.ts`
- Create: `src/config/site.ts`, `src/data/quotes.json`, `src/data/captions.json`
- Create: `src/layouts/Base.astro`, `src/styles/global.css`, `src/pages/index.astro` (skeleton)
- Test: `tests/config.test.ts`

**Interfaces:**
- Produces:
  ```ts
  // src/config/site.ts
  export interface PollOption { id: string; label: string }
  export const site: {
    groom: string; partner: string; venue: string;
    weddingAt: string;          // '2027-02-03T00:00:00+05:30'
    streamUrl: string;          // '' = no link
    badge: string; title: string; tagline: string; credit: string;
    farewell: { label: string; heading: string; body: string };
    footer: string;
    poll: { question: string; options: PollOption[] };
    meta: { description: string };
  };
  ```
  - `src/data/quotes.json`: `string[]` (the 8 seed quotes from the spec, verbatim).
  - `src/data/captions.json`: `Record<string, string>` keyed by image filename (start `{}`).
  - `Base.astro` props: `{ title: string; description?: string }`; renders `<head>` (viewport, OG/Twitter meta pointing at `/og.png`, favicon `/favicon.svg`), imports `global.css` and `@fontsource/bangers`, `<slot/>`.
  - `global.css` CSS custom properties: `--blue:#001489; --white:#fff; --yellow:#ffe94d; --pink:#ff4f9a; --ink:#111; --cyan:#00e5ff;` and utility classes `.halftone-yellow` (pink dots on yellow body bg), `.misprint` (pink/cyan text-shadow offset), `.label`, `.panel` (white, 3px ink border, 5px hard shadow), `.tab` (section label chip).
- npm scripts: `dev`, `build`, `preview`, `test` (`vitest run`).

- [ ] **Step 1:** `npm init -y`, install `astro @astrojs/vercel @upstash/redis canvas-confetti @fontsource/bangers` and dev `vitest typescript @types/canvas-confetti`. `astro.config.mjs`: `output: 'static'`, `adapter: vercel()`. (Check current Astro 7 docs for adapter/content-layer API if anything below differs.)
- [ ] **Step 2: Write failing test** `tests/config.test.ts`:
  ```ts
  test('wedding is 3 Feb 2027 00:00 IST', () =>
    expect(new Date(site.weddingAt).toISOString()).toBe('2027-02-02T18:30:00.000Z'));
  test('poll option ids are unique and match spec', () =>
    expect(site.poll.options.map(o => o.id)).toEqual(['physical','digital','thinking','gatecrash']));
  test('quotes non-empty, all non-blank strings', () => {
    expect(quotes.length).toBeGreaterThan(0);
    for (const q of quotes) expect(q.trim()).not.toBe('');
  });
  test('streamUrl empty or https', () =>
    expect(site.streamUrl === '' || site.streamUrl.startsWith('https://')).toBe(true));
  ```
- [ ] **Step 2b:** `npm test` → FAIL (module not found).
- [ ] **Step 3:** Create `site.ts` with the Global Constraints copy, `quotes.json`, `captions.json`, `global.css`, `Base.astro`, and an `index.astro` that renders Base with an empty `<main>`.
- [ ] **Step 4:** `npm test` → PASS; `npm run build` → succeeds.
- [ ] **Step 5:** Commit `feat: scaffold astro site with config and theme`.

### Task 2: Countdown logic, hero, wedding-day celebration

**Files:**
- Create: `src/lib/countdown.ts`, `src/components/Hero.astro`, `src/lib/celebrate.ts`
- Modify: `src/pages/index.astro`
- Test: `tests/countdown.test.ts`

**Interfaces:**
- Consumes: `site` (Task 1).
- Produces:
  ```ts
  export type CountdownState =
    | { kind: 'before'; days: number; hours: number; minutes: number; seconds: number }
    | { kind: 'live' }
    | { kind: 'after'; daysMarried: number };
  export function getCountdownState(now: Date, weddingAt: Date): CountdownState;
  export function formatMarried(days: number): string; // 'Married for 1 day' | 'Married for N days'
  export function celebrate(opts: { reducedMotion: boolean }): void; // celebrate.ts
  ```
  Rules: `before` while `now < weddingAt` (floor each unit). `live` from `weddingAt` until the end of the wedding's IST calendar day. `after` from the next IST midnight; `daysMarried = number of IST midnights crossed since the wedding IST date` (4 Feb IST → 1). IST = shift by +330 min then use UTC getters.

- [ ] **Step 1: Write failing tests** `tests/countdown.test.ts`:
  ```ts
  const W = new Date('2027-02-03T00:00:00+05:30');
  test('before: exact breakdown', () =>
    expect(getCountdownState(new Date('2027-02-01T22:58:57+05:30'), W))
      .toEqual({ kind:'before', days:1, hours:1, minutes:1, seconds:3 }));
  test('one ms before → before, at target → live', () => {
    expect(getCountdownState(new Date(W.getTime()-1), W).kind).toBe('before');
    expect(getCountdownState(W, W)).toEqual({ kind:'live' });
  });
  test('London viewer 2 Feb 20:00 GMT = 3 Feb 01:30 IST → live', () =>
    expect(getCountdownState(new Date('2027-02-02T20:00:00Z'), W)).toEqual({ kind:'live' }));
  test('3 Feb 23:59:59 IST still live', () =>
    expect(getCountdownState(new Date('2027-02-03T23:59:59+05:30'), W).kind).toBe('live'));
  test('4 Feb 00:00 IST → married 1 day', () =>
    expect(getCountdownState(new Date('2027-02-04T00:00:00+05:30'), W)).toEqual({ kind:'after', daysMarried:1 }));
  test('London 3 Feb 23:00 GMT (= 4 Feb IST) → after', () =>
    expect(getCountdownState(new Date('2027-02-03T23:00:00Z'), W).kind).toBe('after'));
  test('a year later', () =>
    expect(getCountdownState(new Date('2028-02-03T12:00:00+05:30'), W)).toEqual({ kind:'after', daysMarried:365 }));
  test('formatMarried', () => {
    expect(formatMarried(1)).toBe('Married for 1 day');
    expect(formatMarried(12)).toBe('Married for 12 days');
  });
  ```
- [ ] **Step 2:** `npm test -- countdown` → FAIL.
- [ ] **Step 3:** Implement `src/lib/countdown.ts`.
- [ ] **Step 4:** `npm test -- countdown` → PASS.
- [ ] **Step 5:** Build `Hero.astro` per mockup v4: film-strip top edge, blue halftone poster, badge with red dot, `.misprint` title, tagline, 4 countdown boxes (`data-unit="days|hours|minutes|seconds"`, always a 4-col grid, numbers zero-padded to 2 except days), credit line under countdown with "Dating Splinter" bolded. Server renders the `before` state computed at build as fallback for no-JS. Inline client script ticks every 1s via `getCountdownState(new Date(), new Date(site.weddingAt))`:
  - `before` → update numbers.
  - `live` → swap boxes for `🔴 STREAMING LIVE NOW`; if `site.streamUrl` non-empty render it as an `<a target="_blank" rel="noopener">` styled as a big button, else plain text. First time live is reached in this page load (including mid-session transition) call `celebrate({ reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches })` exactly once.
  - `after` → swap for `formatMarried(daysMarried)`; stop ticking.
- [ ] **Step 6:** Implement `celebrate`: if not reducedMotion, fire 2–3 `canvas-confetti` bursts (pink/cyan/yellow/blue) and append ~12 CSS-animated balloons (absolutely positioned, `pointer-events:none`, float up over ~6s, removed on `animationend`). If reducedMotion, add a static class that shows a few balloon emoji next to the live text. No layout shift; page stays usable.
- [ ] **Step 7:** Manual check: temporarily set `weddingAt` to 10s in the future in `npm run dev`, watch countdown → live + confetti + balloons; revert. `npm run build` passes.
- [ ] **Step 8:** Commit `feat: hero poster with IST countdown and wedding-day celebration`.

### Task 3: Brajesh of the Day

**Files:**
- Create: `src/lib/quotes.ts`, `src/components/Botd.astro`
- Modify: `src/pages/index.astro`
- Test: `tests/quotes.test.ts`

**Interfaces:**
- Consumes: `quotes.json` (Task 1).
- Produces: `export function pickQuote(quotes: string[], previous: string | null, rand?: () => number): string`

- [ ] **Step 1: Write failing tests:**
  ```ts
  test('never repeats previous when >1 quote', () => {
    for (let i = 0; i < 200; i++) expect(pickQuote(['a','b'], 'a')).toBe('b');
  });
  test('single quote returns it (no infinite loop)', () =>
    expect(pickQuote(['only'], 'only')).toBe('only'));
  test('uses rand for index', () =>
    expect(pickQuote(['a','b','c'], null, () => 0.99)).toBe('c'));
  test('empty list throws', () => expect(() => pickQuote([], null)).toThrow());
  ```
- [ ] **Step 2:** Run → FAIL. **Step 3:** Implement (pick from the list with `previous` filtered out when length > 1). **Step 4:** Run → PASS.
- [ ] **Step 5:** `Botd.astro`: speech-bubble panel (tail bottom-left), pink `BoTD` tag rotated, grey `Brajesh of the Day` label, `<blockquote aria-live="polite">`, button `↻ *Varuned`. Quotes embedded as JSON in a `<script type="application/json">`; inline script picks on load and on click. The blockquote is empty in HTML and gets `min-height` so there is no layout jump; noscript shows the first quote.
- [ ] **Step 6:** `npm run dev`, reload several times → quote varies; click button → changes each time. Commit `feat: brajesh of the day quote generator`.

### Task 4: Stickered photo gallery

**Files:**
- Create: `scripts/make-placeholders.mjs`, `src/assets/stills/placeholder-01.jpg` … `-04.jpg` (generated), `src/components/Stickered.astro`
- Modify: `src/pages/index.astro`

**Interfaces:**
- Consumes: `captions.json` (Task 1).
- Produces: none for later tasks.

- [ ] **Step 1:** `scripts/make-placeholders.mjs` uses sharp to write 4 portrait (1200×1500) JPGs in pink/cyan/blue/yellow with a big number; run it, commit the images.
- [ ] **Step 2:** `Stickered.astro`: `import.meta.glob('../assets/stills/*.{jpg,jpeg,png,webp}', { eager: true })`, sort by filename, render each with Astro `<Image>`/`<Picture>` (widths ~[400, 800, 1200], `sizes` for 1-col phone / 4-col laptop, `loading="lazy"`), caption from `captions[filename]` if present. Sticker styling: white rounded border, hard shadow, alternating ±3° rotation, cyan translucent tape strip. Grid: 1 column < 768px, 3 columns 768–1100px, 4 above. Section heading uses `.tab` `Stickered`.
- [ ] **Step 3:** Lightbox: native `<dialog>`; click/tap a sticker opens full-size image; close on backdrop click, Esc, or ✕ button; left/right arrow keys and buttons go prev/next. If there are zero images, the section is not rendered.
- [ ] **Step 4:** `npm run build`; check `dist/` contains resized webp/avif outputs and no original multi-MB file is referenced by `index.html`. Commit `feat: stickered photo gallery with lightbox`.

### Task 5: Reviews (stories)

**Files:**
- Create: `src/content.config.ts`, `src/content/stories/the-goa-incident.md`, `src/content/stories/how-they-met.md`, `src/content/stories/the-mubi-club-years.md` (placeholders), `src/lib/stories.ts`, `src/components/Reviews.astro`, `src/pages/stories/[slug].astro`
- Modify: `src/pages/index.astro`
- Test: `tests/stories.test.ts`

**Interfaces:**
- Produces:
  ```ts
  // content.config.ts: collection 'stories', glob loader on src/content/stories/*.md
  // schema: { title: string; author: string; rating: int 1..5; teaser?: string; order?: number }
  export function teaserFrom(markdownBody: string, maxChars?: number /*=160*/): string; // src/lib/stories.ts
  export function starString(rating: number): string; // 4 → '★★★★☆'
  export function sortStories<T extends { data: { order?: number; title: string } }>(s: T[]): T[]; // order asc (missing last), then title
  ```

- [ ] **Step 1: Write failing tests:**
  ```ts
  test('teaser = first paragraph, markdown stripped, truncated with …', () =>
    expect(teaserFrom('# Hi\n\nHe **forgot** the [tickets](x).\n\nMore.')).toBe('He forgot the tickets.'));
  test('long teaser truncated at word boundary', () =>
    expect(teaserFrom('word '.repeat(100), 20)).toMatch(/^word word word…$/));
  test('stars', () => { expect(starString(4)).toBe('★★★★☆'); expect(starString(5)).toBe('★★★★★'); });
  test('sort by order then title', () =>
    expect(sortStories([{data:{title:'b'}},{data:{title:'a',order:2}},{data:{title:'c',order:1}}]).map(s=>s.data.title))
      .toEqual(['c','a','b']));
  ```
- [ ] **Step 2:** Run → FAIL. **Step 3:** Implement `src/lib/stories.ts`. **Step 4:** Run → PASS.
- [ ] **Step 5:** Content collection + 3 placeholder stories (obviously placeholder text, authors "A friend", ratings 4/5/3). A story with rating outside 1–5 must fail the build (zod `int().min(1).max(5)`).
- [ ] **Step 6:** `Reviews.astro`: `.tab` `Reviews`, one `.panel` card per story (uppercase title, pink `★★★★☆ · by <author>`, teaser = `teaser ?? teaserFrom(body)`, `read more` link to `/stories/<id>/`); 1 column phone, 2 columns laptop. Section hidden if no stories.
- [ ] **Step 7:** `stories/[slug].astro`: `getStaticPaths` over collection; Base layout with `title` = story title; small blue poster header with `← Back to the premiere` link to `/#reviews`, title (`.misprint`), stars/author, rendered markdown in a readable white panel (max ~65ch), same footer as home.
- [ ] **Step 8:** `npm run build` → 3 story pages in `dist/stories/`. Commit `feat: reviews section and story pages`.

### Task 6: Audience poll (API + UI)

**Files:**
- Create: `src/lib/poll.ts`, `src/lib/pollStore.ts`, `src/pages/api/poll.ts`, `src/components/Poll.astro`
- Modify: `src/pages/index.astro`
- Test: `tests/poll.test.ts`, `tests/poll-api.test.ts`

**Interfaces:**
- Consumes: `site.poll` (Task 1).
- Produces:
  ```ts
  // src/lib/poll.ts
  export interface TallyRow { id: string; label: string; count: number; percent: number }
  export function tally(counts: Record<string, number | string>, options: PollOption[]): { rows: TallyRow[]; total: number };
  // src/lib/pollStore.ts
  export interface CounterStore { hgetall(key: string): Promise<Record<string, unknown> | null>; hincrby(key: string, field: string, by: number): Promise<number> }
  export const POLL_KEY = 'poll:invite';
  export function storeFromEnv(env: Record<string, string | undefined>): CounterStore | null; // UPSTASH_REDIS_REST_URL/TOKEN, else KV_REST_API_URL/TOKEN; null if missing
  export function getCounts(store: CounterStore): Promise<Record<string, number>>;
  export function vote(store: CounterStore, optionId: string): Promise<Record<string, number>>;
  // src/pages/api/poll.ts
  export const prerender = false;
  export function handlePoll(req: Request, store: CounterStore | null, options: PollOption[]): Promise<Response>;
  export const GET, POST; // APIRoute wrappers calling handlePoll(request, storeFromEnv(process.env), site.poll.options)
  ```
  Response JSON: `{ counts: Record<id, number> }`, or `{ error: string }` on error.

- [ ] **Step 1: Write failing tests** `tests/poll.test.ts`:
  ```ts
  test('zero votes → 0% each, total 0, no NaN', () => {
    const t = tally({}, opts);
    expect(t.total).toBe(0); expect(t.rows.every(r => r.percent === 0)).toBe(true);
  });
  test('percent rounding and string counts from redis', () =>
    expect(tally({ physical:'1', digital:'2' }, opts).rows.map(r=>r.percent)).toEqual([33,67,0,0]));
  test('unknown keys in store ignored', () =>
    expect(tally({ physical:1, hacked:99 }, opts).total).toBe(1));
  test('storeFromEnv returns null without env', () => expect(storeFromEnv({})).toBeNull());
  ```
  `tests/poll-api.test.ts` (in-memory fake `CounterStore`):
  ```ts
  test('GET returns counts for all options', async () => { /* 200, counts has 4 keys, all 0 */ });
  test('POST valid option increments and sets voted cookie', async () => {
    /* 200, counts.physical === 1, Set-Cookie contains 'voted=1', HttpOnly, Max-Age ≥ 31536000 */ });
  test('POST unknown option → 400', async () => {});
  test('POST malformed JSON → 400', async () => {});
  test('POST with voted cookie → 409 and current counts, no increment', async () => {});
  test('store null (env missing) → 503 {error}', async () => {});
  test('store throws → 503 {error}', async () => {});
  ```
- [ ] **Step 2:** `npm test -- poll` → FAIL.
- [ ] **Step 3:** Implement `poll.ts`, `pollStore.ts` (`@upstash/redis` `new Redis({url, token})`), `api/poll.ts`. Responses `Cache-Control: no-store`.
- [ ] **Step 4:** `npm test -- poll` → PASS; `npm run build` → succeeds with the API route as a Vercel function.
- [ ] **Step 5:** `Poll.astro`: `.tab` `Audience poll`, `.panel` with question as heading, four option buttons (labels from config, wrap on narrow screens). Client script: if `localStorage['brajedding-poll']` set → fetch GET and show results; else show buttons; on tap → POST, save choice to localStorage, show results. Results: each row a bordered bar (cyan fill width = percent), label + `N%`, user's choice marked, and `POW! N votes` burst (pop animation unless reduced motion). On 409 treat as voted and show results. On 503/network error show `The projector broke. Try again later.` and keep buttons hidden-safe (no crash). Bars render `0%` with zero votes.
- [ ] **Step 6:** Commit `feat: shared invite poll backed by upstash redis`.

### Task 7: Farewell, footer, share preview, README, final checks

**Files:**
- Create: `src/components/Farewell.astro`, `src/components/Footer.astro`, `scripts/make-og.mjs`, `public/og.png` (generated), `public/favicon.svg`, `README.md`
- Modify: `src/pages/index.astro`, `src/pages/stories/[slug].astro` (use Footer)

**Interfaces:**
- Consumes: `site` (Task 1); all components from Tasks 2–6.

- [ ] **Step 1:** `Farewell.astro`: blue halftone panel with ink border + hard shadow, label/heading/body from `site.farewell`, heading `.misprint`. `Footer.astro`: black bar, yellow text `site.footer`, film strip on top. Page order in `index.astro`: Hero, Botd, Stickered, Reviews (`id="reviews"`), Poll, Farewell, Footer.
- [ ] **Step 2:** `scripts/make-og.mjs`: sharp renders a 1200×630 SVG (blue halftone poster, `BRAJESH & SARANYA: THE WEDDING`, `Streaming live soon from Guruvayur`, film strip) to `public/og.png`. `favicon.svg`: pink film-reel/heart on blue. `site.meta.description`: `The countdown to Brajesh & Saranya's wedding. Brought to you by Dating Splinter.`
- [ ] **Step 3:** `README.md`: run locally; how to add quotes, stories (frontmatter fields, rating 1–5), photos and captions; set `weddingAt`/`streamUrl`; deploy on Vercel; connect Upstash Redis from the Vercel Marketplace (env vars auto-injected; locally copy them into `.env`).
- [ ] **Step 4: Final verification:** `npm test` all pass; `npm run build` succeeds; `npm run preview` (or `vercel dev` if available) and in a browser at 320px, 375px and 1280px widths screenshot the home page and one story page. Check: countdown 4 boxes stay in one row at 320px, no horizontal scroll, 1 sticker per row on phone, poll labels wrap cleanly, poll shows the fallback message without Redis, no "Premieres" line, quotes only in BoTD, `grep -r "Premieres" dist` returns nothing.
- [ ] **Step 5:** Commit `feat: farewell, footer, share preview and readme`.
