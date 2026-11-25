import confetti from 'canvas-confetti';

const COLORS = ['#ff4f9a', '#00e5ff', '#ffe94d', '#001489', '#ffffff'];
const BALLOONS = ['#ff4f9a', '#00e5ff', '#ffe94d', '#001489', '#ff4f9a', '#00e5ff'];

/** Wedding-day party: confetti bursts + balloons floating up. Static fallback for reduced motion. */
export function celebrate(opts: { reducedMotion: boolean }): void {
  if (opts.reducedMotion) {
    document.documentElement.classList.add('celebrate-static');
    return;
  }

  const burst = (x: number, delay: number) =>
    setTimeout(
      () => confetti({ particleCount: 120, spread: 80, startVelocity: 55, origin: { x, y: 0.7 }, colors: COLORS }),
      delay,
    );
  burst(0.2, 0);
  burst(0.8, 250);
  burst(0.5, 600);

  const layer = document.createElement('div');
  layer.className = 'balloon-layer';
  layer.setAttribute('aria-hidden', 'true');
  for (let i = 0; i < 12; i++) {
    const b = document.createElement('span');
    b.className = 'balloon';
    b.style.left = `${4 + Math.random() * 88}%`;
    b.style.setProperty('--c', BALLOONS[i % BALLOONS.length]);
    b.style.animationDelay = `${Math.random() * 1.5}s`;
    b.style.animationDuration = `${5 + Math.random() * 2.5}s`;
    b.addEventListener('animationend', () => {
      b.remove();
      if (!layer.childElementCount) layer.remove();
    });
    layer.appendChild(b);
  }
  document.body.appendChild(layer);
}
