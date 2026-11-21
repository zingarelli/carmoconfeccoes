import test from 'node:test';
import assert from 'node:assert/strict';
import { createHeroRotation } from '../js/hero.mjs';

function setup(count = 2) {
  let next = 0;
  const timers = new Map();
  const changes = [];
  const rotation = createHeroRotation({ count, onChange: index => changes.push(index),
    schedule(fn, ms) { assert.equal(ms, 9000); timers.set(++next, fn); return next; },
    cancel(id) { timers.delete(id); }
  });
  const tick = () => { const [id, fn] = timers.entries().next().value; timers.delete(id); fn(); };
  return { rotation, changes, timers, tick };
}

test('alternates every nine seconds and loops back', () => {
  const h = setup(); h.tick(); h.tick();
  assert.deepEqual(h.changes, [1, 0]); assert.equal(h.timers.size, 1);
});
test('pause cancels pending switch; resume starts a fresh interval', () => {
  const h = setup(); h.rotation.setPaused(true); assert.equal(h.timers.size, 0);
  h.rotation.setPaused(false); h.tick(); assert.deepEqual(h.changes, [1]);
});
test('hidden-tab and reduced-motion blockers are independent', () => {
  const h = setup();
  h.rotation.setBlocked('hidden', true); h.rotation.setBlocked('reduced-motion', true);
  h.rotation.setBlocked('hidden', false); assert.equal(h.timers.size, 0);
  h.rotation.setBlocked('reduced-motion', false); assert.equal(h.timers.size, 1);
});
test('visibility changes never override a manual pause', () => {
  const h = setup(); h.rotation.setPaused(true);
  h.rotation.setBlocked('hidden', true); h.rotation.setBlocked('hidden', false);
  assert.equal(h.timers.size, 0);
});
test('one slide never schedules animation and destroy clears timers', () => {
  assert.equal(setup(1).timers.size, 0);
  const h = setup(); h.rotation.destroy(); assert.equal(h.timers.size, 0);
});
