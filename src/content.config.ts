import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const stories = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/stories' }),
  schema: z.object({
    title: z.string(),
    author: z.string(),
    rating: z.number().int().min(1).max(5),
    teaser: z.string().optional(),
    order: z.number().optional(),
  }),
});

export const collections = { stories };
