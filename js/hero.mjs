/** Small timer controller; no catch-up jumps when the tab becomes visible again. */
export function createHeroRotation({ count, onChange, interval = 9000, schedule = setTimeout, cancel = clearTimeout }) {
  let index = 0;
  let timer = null;
  let userPaused = false;
  const blockers = new Set();
  const paused = () => userPaused || blockers.size > 0;
  function refresh() {
    if (timer !== null) cancel(timer);
    timer = null;
    if (count < 2 || paused()) return;
    timer = schedule(() => {
      timer = null;
      index = (index + 1) % count;
      onChange(index);
      refresh();
    }, interval);
  }
  refresh();
  return {
    select(nextIndex) {
      if (!Number.isInteger(nextIndex) || nextIndex < 0 || nextIndex >= count) return;
      index = nextIndex;
      onChange(index);
      refresh();
    },
    setPaused(value) { userPaused = value; refresh(); },
    setBlocked(reason, value) { value ? blockers.add(reason) : blockers.delete(reason); refresh(); },
    get userPaused() { return userPaused; },
    destroy() { if (timer !== null) cancel(timer); timer = null; blockers.add('destroyed'); }
  };
}

async function initHero() {
  const root = document.querySelector('[data-hero]');
  if (!root) return;
  const slides = [...root.querySelectorAll('[data-hero-slide]')];
  const button = root.querySelector('[data-hero-toggle]');
  const controls = root.querySelector('[data-hero-controls]');
  const dots = [...root.querySelectorAll('[data-hero-select]')];
  if (slides.length < 2 || !button) return;
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const setActive = index => {
    slides.forEach((slide, i) => {
      slide.toggleAttribute('data-active', i === index);
      slide.setAttribute('aria-hidden', String(i !== index));
    });
    root.dataset.theme = index === 0 ? 'pink' : 'blue';
    dots.forEach((dot, i) => i === index ? dot.setAttribute('aria-current', 'true') : dot.removeAttribute('aria-current'));
  };
  try {
    // Never fade out the fallback until the alternative image can actually render.
    await Promise.all(slides.map(slide => slide.querySelector('img').decode()));
  } catch { return; }
  const rotation = createHeroRotation({ count: slides.length, onChange: setActive });
  const syncVisibility = () => rotation.setBlocked('hidden', document.hidden);
  const syncMotion = () => {
    rotation.setBlocked('reduced-motion', motion.matches);
    button.hidden = motion.matches;
    if (motion.matches) rotation.select(0);
  };
  if (controls) controls.hidden = false;
  syncVisibility();
  syncMotion();
  dots.forEach(dot => dot.addEventListener('click', () => {
    rotation.select(Number(dot.dataset.heroSelect));
  }));
  document.addEventListener('visibilitychange', syncVisibility);
  motion.addEventListener('change', syncMotion);
  button.addEventListener('click', () => {
    rotation.setPaused(!rotation.userPaused);
    button.setAttribute('aria-pressed', String(rotation.userPaused));
    button.title = rotation.userPaused ? 'Reproduzir animação' : 'Pausar animação';
    button.querySelector('.hero-pause-icon').hidden = rotation.userPaused;
    button.querySelector('.hero-play-icon').hidden = !rotation.userPaused;
  });
}

if (typeof document !== 'undefined') initHero();
