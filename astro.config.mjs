// @ts-check
import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';

// Absolute URL for link previews (og:image). SITE_URL wins (custom domain);
// otherwise Vercel's production domain, which Vercel sets during builds.
const site =
  process.env.SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : undefined);

export default defineConfig({
  site,
  output: 'static',
  adapter: vercel(),
});
