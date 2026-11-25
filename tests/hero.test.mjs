import test from 'node:test';
import assert from 'node:assert/strict';
import { createHeroRotation, bindHeroSwipe } from '../js/hero.js';

function setup(count = 2) {
  let next = 0;
  const timers = new Map();
  const changes = [];
  const rotation = createHeroRotation({ count, onChange: index => changes.push(index),
    schedule(fn, ms) { assert.equal(ms, 6000); timers.set(++next, fn); return next; },
    cancel(id) { timers.delete(id); }
  });
  const tick = () => { const [id, fn] = timers.entries().next().value; timers.delete(id); fn(); };
  return { rotation, changes, timers, tick };
}

test('alternates every six seconds and loops back', () => {
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

test('manual selection updates the next automatic slide', () => {
  const h = setup(); h.rotation.select(1); h.tick();
  assert.deepEqual(h.changes, [1, 0]); assert.equal(h.timers.size, 1);
});
test('manual selection remains available while paused and rejects invalid indices', () => {
  const h = setup(); h.rotation.setPaused(true); h.rotation.select(1);
  h.rotation.select(-1); h.rotation.select(2); h.rotation.select(NaN);
  assert.deepEqual(h.changes, [1]); assert.equal(h.timers.size, 0);
});

function swipeSetup() {
  const handlers = {};
  const changes = [];
  bindHeroSwipe({ addEventListener(name, fn) { handlers[name] = fn; } }, value => changes.push(value));
  const emit = (name, values = {}) => handlers[name]({ isPrimary: true, pointerType: 'touch', pointerId: 1,
    clientX: 150, clientY: 100, target: { closest: () => null }, ...values });
  return { emit, changes };
}
test('horizontal swipes select next or previous slide', () => {
  const h = swipeSetup();
  h.emit('pointerdown'); h.emit('pointerup', { clientX: 70 });
  h.emit('pointerdown'); h.emit('pointerup', { clientX: 240 });
  assert.deepEqual(h.changes, [1, -1]);
});
test('scrolling, small gestures, cancelled touches and controls do not change slides', () => {
  const h = swipeSetup();
  h.emit('pointerdown'); h.emit('pointerup', { clientX: 140 });
  h.emit('pointerdown'); h.emit('pointerup', { clientX: 70, clientY: 200 });
  h.emit('pointerdown'); h.emit('pointercancel'); h.emit('pointerup', { clientX: 70 });
  h.emit('pointerdown', { target: { closest: () => ({}) } }); h.emit('pointerup', { clientX: 70 });
  h.emit('pointerdown', { pointerType: 'mouse' }); h.emit('pointerup', { clientX: 70 });
  assert.deepEqual(h.changes, []);
});
