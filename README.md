# Brajesh & Saranya: The Wedding

A countdown site for Brajesh's wedding (3 Feb 2027, Guruvayur). Made by the movie club. Built with [Astro](https://astro.build) and hosted on Vercel.

## Run it locally

```bash
npm install
npm run dev      # http://localhost:4321
npm test         # unit tests
npm run build    # production build
```

Without Redis credentials the poll shows "The projector broke". That's expected locally. See [Poll](#poll-upstash-redis) below to connect it.

## Updating content

Edit the files below, commit, and push. Vercel redeploys on its own.

| What | Where |
| --- | --- |
| Names, wedding date/time, stream link, tagline, credit, farewell, footer, poll question/options | `src/config/site.ts` |
| BoTD quotes | `src/data/quotes.json` (a list of strings) |
| Photos | drop files into `src/assets/stills/` (jpg/png/webp, any size) |
| Photo captions (optional) | `src/data/captions.json`, e.g. `{ "goa.jpg": "Aligned." }` |
| Stories | one Markdown file per story in `src/content/stories/` |

### Quotes

Add a line to `src/data/quotes.json`. Keep it valid JSON: double quotes, and a comma between items.

### Photos

- Put photos straight from your phone into `src/assets/stills/`. They get resized and compressed automatically.
- They show in filename order, so prefix them `01-`, `02-` and so on to control the order.
- Delete the `placeholder-*.jpg` files once you have real ones.

### Stories ("Reviews")

Create `src/content/stories/the-goa-incident.md`:

```markdown
---
title: The Goa incident
author: Rahul
rating: 4          # 1 to 5 stars, required
order: 1           # optional, lower shows first
teaser: Optional custom teaser for the home page card.
---

The story, in Markdown. Paragraphs, **bold**, *italics*, [links](https://…).
```

The filename becomes the URL (`/stories/the-goa-incident/`). Delete the placeholder stories when the real ones come in.

### Wedding time and live stream

In `src/config/site.ts`:

- `weddingAt: '2027-02-03T00:00:00+05:30'`: change the time if you ever get the muhurtham time. Keep the `+05:30`.
- `streamUrl: ''`: paste the live-stream link (`https://…`). On the wedding day the "STREAMING LIVE NOW" banner becomes a button to it.

What the countdown does:

- **Before the wedding:** counts down.
- **On 3 Feb (IST):** shows "🔴 STREAMING LIVE NOW", with confetti and balloons.
- **From 4 Feb:** shows "Married for N days".

## Deploying on Vercel

1. Push this repo to GitHub.
2. On vercel.com, click **Add New → Project** and import the repo. Vercel detects Astro, so keep the defaults and deploy.
3. If you use a custom domain, add an env var `SITE_URL=https://your.domain` so link previews (WhatsApp) use it. Otherwise the `*.vercel.app` domain is used automatically.

## Poll (Upstash Redis)

The "Did you get the invite?" poll stores votes in Upstash Redis (free tier).

1. In the Vercel project, open **Storage** (or **Marketplace**), choose **Upstash → Redis**, create a database, and connect it to the project.
2. Vercel adds the credentials as env vars (`KV_REST_API_URL` / `KV_REST_API_TOKEN`, or `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN`). Both naming styles work.
3. Redeploy.

To use the poll locally, copy those two env vars into a `.env` file. It's git-ignored.

Each browser gets one vote, tracked with a cookie and localStorage. That's good enough for friends.

- **Reset the votes:** delete the key `poll:invite` in the Upstash console.
- **Change the options:** edit `site.poll.options`. Votes are stored by `id`, so don't rename ids once voting has started.

## Regenerating images

```bash
node scripts/make-og.mjs            # link-preview image → public/og.png
node scripts/make-placeholders.mjs  # placeholder photos
```
