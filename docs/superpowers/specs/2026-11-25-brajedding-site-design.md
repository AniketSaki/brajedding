# Brajedding: wedding countdown site for Brajesh

Date: 2026-11-25
Status: draft, awaiting owner approval

## Intent

A fun single-page site counting down to Brajesh and Saranya's wedding, shared as a link with mutual friends (mostly via WhatsApp, so mostly opened on phones). The friends are from a movie club Brajesh has been part of for ~6 years, so the whole page is a movie-club in-joke: the wedding is presented as a film premiere / live stream, his quotes are "Brajesh of the Day", stories are "reviews".

The page should feel like a roast zine with love: comic-book energy, inside jokes, a bit of chaos. It is maintained by one person (the site owner) who collects content from friends and redeploys.

## Goals

- Countdown to the wedding, front and centre, with title.
- Random "Brajesh of the Day" (BoTD) quote, different per page load, with a button to get another.
- Photo section ("Stickered") — small number of photos.
- Stories ("Reviews"), each readable as its own blog-style article.
- A shared, live poll: "Did you get the invite?"
- A farewell section from the Mubi club.
- Phone-first; also looks good on laptop.
- Updating content = edit files in the repo, push, Vercel redeploys. No admin UI.

## Non-goals

- Friends submitting content through the site (except voting in the poll).
- Accounts, login, password protection, comments.
- CMS or admin dashboard.
- Quotes appearing anywhere other than the BoTD generator.

## Anti-goals

- Slow on phone data: unoptimized multi-MB photos would kill it.
- Feeling like a generic wedding template (cream/serif/gold). This must look like the movie club made it.
- Using Marvel/Sony Spider-Man characters, logos or artwork, or MUBI's logo. We borrow a printing *style* (halftone/misprint) and MUBI's *colours* only.

## Fixed facts (from the owner)

| Item | Value |
|------|-------|
| Groom | Brajesh |
| Partner | Saranya |
| Date | 3 Feb 2027 |
| Venue | Guruvayur |
| Timezone | IST (Asia/Kolkata, UTC+05:30) |
| Hosting | Vercel |

## Approaches considered

1. **Plain HTML/CSS/JS, no build.** Simplest, but stories as JS strings are painful and photos would ship unoptimized.
2. **Astro static site (chosen).** Stories as Markdown files, photos dropped in a folder and auto-optimized at build, quotes in one JSON file, tiny client-side JS for randomness and the countdown. Small build step that Vercel runs.
3. **Next.js / React app.** Overkill for one page; rejected.

Owner picked **Astro**.

Poll storage, three options considered:

1. **Vercel serverless endpoint + Upstash Redis (chosen).** Real shared results, free tier, connected through Vercel's Marketplace.
2. Third-party embed (StrawPoll etc.) — clashes visually, possible branding/ads.
3. Joke poll with no stored results — fully static, but loses the fun of seeing how everyone voted.

Owner picked **option 1**.

## Look and feel (approved via mockups)

"Film-poster roast zine" in a comic-halftone style (Spider-Verse–inspired printing look: halftone dots, misregistered pink/cyan offsets on big type, speech bubbles, chunky outlines and hard drop shadows).

- **Hero (title + countdown):** MUBI deep blue `#001489` and white only (subtle white halftone on blue allowed; title gets the pink/cyan misprint offset). Film-strip edge at top.
- **Everything below the hero:** yellow `#ffe94d` and pink `#ff4f9a` zine palette, with black `#111` outlines, white panels, cyan `#00e5ff` as a minor accent (misprint offset, poll bars, sticker tape). Pink halftone dots on yellow background.
- Reference mockup: `docs/superpowers/specs/mockups/zine-film-v4.html` (phone view). Earlier `mockups/zine-film-v2.html` shows the laptop layout direction.

## Page structure (top to bottom)

1. **Hero / poster**
   - Badge: "● Streaming live soon from Guruvayur" (live-stream framing, not theatre).
   - Title: "Brajesh & Saranya: The Wedding".
   - Tagline: "Rated U/A for emotional damage" *(builder's copy; owner can change)*.
   - Countdown: days / hrs / min / sec in four boxes, always one row (including 320px-wide phones).
   - Credit line under the countdown: "Brought to you by Dating Splinter".
2. **BoTD (Brajesh of the Day)** — speech bubble, "BoTD" tag + "Brajesh of the Day" label, a random quote, and a button labelled `↻ *Varuned` (redo/regenerate icon + the exact text `*Varuned`, so people know they can tap for another) that shows a different random quote (never the same one twice in a row).
3. **Stickered** — photos styled as stickers (rounded white die-cut border, slight rotation, a strip of tape). **One per row on phones**; grid of 3–4 per row on laptop. Tap/click opens the photo full-screen (simple lightbox, swipe/arrow to next is nice-to-have). Optional short caption per photo.
4. **Reviews** — one comic panel card per story: title, star rating (1–5), "by <author>", teaser, "read more". "Read more" opens the story on its own page (`/stories/<slug>`), styled in the same zine look, with a back link to the main page.
5. **Audience poll** — "Did you get the invite?", options:
   - Yes, physical invite hand delivered in person 💌
   - Only a digital group one 📱
   - He's thinking about it 🤔
   - Gatecrash! 🚪💥
   Before voting: four tappable options. After voting: bars with percentages and a "POW! N votes" total. One vote per browser.
6. **Farewell** — blue panel: "Mubi club wishes you a fond farewell" / "You will be missed." (small label "A message from the management" is builder's copy).
7. **Footer** — "we got brajedding before nadodi subs".

## Countdown behaviour

- Target: 3 Feb 2027, 00:00 IST (owner has no ceremony time; the datetime stays a single config value in case that changes).
- Before target: live ticking countdown.
- On the wedding day (IST date = 3 Feb 2027): replace numbers with a "🔴 STREAMING LIVE NOW" state. If `streamUrl` is set in config, this becomes a big tappable button to the stream; if empty, it is just a label (owner may add the link later).
- Also on the wedding day: a confetti explosion plus balloons floating up when the page is opened (once per page load, then settles so the page stays usable). Under `prefers-reduced-motion`, skip the animation and show a static celebratory state instead.
- After the day: "Married for N days" so the link stays fun afterwards.
- Computed in the browser against the IST target, so viewers in any timezone see the correct remaining time.

## Content model (what the owner edits)

- `site config` (one file): names, venue, wedding datetime with `+05:30` offset, optional `streamUrl` (empty by default), tagline, credit line, footer text.
- `quotes.json`: array of strings. Seed list:
  - Your Face is a Site With Countdown!
  - it's Friday who nominate
  - Death of Mubi Club
  - Aligned
  - CEOji must resign
  - Once again Mubians have been disenfranchised
  - I protest, CEC-ji must take strict action
  - Cull this guy immediately
- Stories: one Markdown file each, frontmatter `title`, `author`, `rating` (1–5), optional `teaser` (else first paragraph is used), optional `order`. Placeholder stories until real ones arrive.
- Photos: dropped into one folder; picked up automatically, sorted by filename; optional captions in a small JSON map (filename → caption). Placeholder images until real ones arrive.
- Poll question/options: in config, so they can be tweaked without touching code.

Quotes are shipped to the browser as data and picked client-side on each load (dynamic per load on a static site). They must not be rendered anywhere else.

## Poll backend

- One on-demand API route (Astro endpoint with the Vercel adapter, everything else prerendered).
- `GET` returns counts per option; `POST {option}` increments and returns counts. Reject unknown option ids.
- Storage: Upstash Redis via Vercel Marketplace (free tier), a single hash of counts. Credentials come from env vars that Vercel injects.
- One vote per browser enforced client-side (localStorage) plus a cookie; good enough for friends, not tamper-proof (accepted).
- If the API is down or env vars missing (e.g. local dev without Redis), the poll shows a friendly fallback, and the rest of the page is unaffected.

## Sharing

- Open Graph / Twitter meta (title, description, preview image) so the WhatsApp link preview looks like the poster. A static preview image in the same style. *(builder's call; owner didn't ask but the link is shared on WhatsApp.)*
- Favicon in the same style.

## Constraints

- Phone-first, must work from 320px wide; laptop layout uses wider grids.
- Photos optimized at build (responsive sizes, modern formats, lazy-loaded below the fold).
- Respect `prefers-reduced-motion` for any wobble/animation.
- Readable contrast for body text on the halftone background (text sits on solid white panels).
- Site is public to anyone with the link (no password) — accepted.

## Left to the builder

- Exact fonts (a comic display face such as Bangers or similar, self-hosted; a clean sans for body).
- Lightbox implementation, sticker/tape details, small animations (e.g. "POW!" pop on vote).
- Placeholder story and photo content.
- Project layout within Astro conventions, tests for countdown state logic and the poll endpoint.
- README section explaining how to add quotes, stories, photos, set the wedding time, and connect Upstash on Vercel.
