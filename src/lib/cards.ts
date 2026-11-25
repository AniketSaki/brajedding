import { photoCardId, storyCardId } from './reactions';

const stills = import.meta.glob('../assets/stills/*.{jpg,jpeg,png,webp,JPG,JPEG,PNG}');
const stories = import.meta.glob('../content/stories/*.md');

const fileName = (path: string) => path.split('/').pop()!;

/** Every card that can be reacted to, derived from the same folders the page renders. */
export function allCardIds(): string[] {
  return [
    ...Object.keys(stills).map(fileName).sort().map(photoCardId),
    ...Object.keys(stories).map((p) => fileName(p).replace(/\.md$/, '')).sort().map(storyCardId),
  ];
}
