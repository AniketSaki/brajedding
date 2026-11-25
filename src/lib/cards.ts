import { slug } from 'github-slugger';
import { photoCardId, storyCardId } from './reactions';

const stills = import.meta.glob('../assets/stills/*.{jpg,jpeg,png,webp,JPG,JPEG,PNG}');
const stories = import.meta.glob('../content/stories/*.md');

const fileName = (path: string) => path.split('/').pop()!;

/** Same id Astro's glob loader gives a story file (github-slugger on the name without extension). */
export function storyIdFromFile(file: string): string {
  return slug(file.replace(/\.md$/, ''));
}

/** Every card that can be reacted to, derived from the same folders the page renders. */
export function allCardIds(): string[] {
  return [
    ...Object.keys(stills).map(fileName).sort().map(photoCardId),
    ...Object.keys(stories).map((p) => storyIdFromFile(fileName(p))).sort().map(storyCardId),
  ];
}
