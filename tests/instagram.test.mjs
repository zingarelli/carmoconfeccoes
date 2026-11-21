import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { newestPost, previewUrl, safePostUrl, syncInstagram } from '../scripts/sync-instagram.mjs';

test('selects newest by publication date, not pinned/list order', () => {
  assert.equal(newestPost([{ id: 'old', timestamp: '2024-01-01' }, { id: 'new', timestamp: '2026-11-21' }]).id, 'new');
  assert.equal(newestPost([]), null);
});
test('uses video thumbnails and the first carousel child', () => {
  assert.equal(previewUrl({ media_type: 'VIDEO', thumbnail_url: 'thumb' }), 'thumb');
  assert.equal(previewUrl({ media_type: 'CAROUSEL_ALBUM', children: { data: [{ media_type: 'VIDEO', thumbnail_url: 'first' }, { media_url: 'second' }] } }), 'first');
});
test('rejects hostile links and strips tracking parameters', () => {
  assert.equal(safePostUrl('javascript:alert(1)'), null);
  assert.equal(safePostUrl('https://www.instagram.com.evil.test/p/abc/'), null);
  assert.equal(safePostUrl('https://www.instagram.com/p/abc/?secret=x'), 'https://www.instagram.com/p/abc/');
});
test('writes a public local-image cache without exposing the token', async () => {
  const root = await mkdtemp(join(tmpdir(), 'carmo-'));
  const token = 'secret-never-public';
  const bytes = Buffer.from([255, 216, 255, 224]);
  let calls = 0;
  const fetchImpl = async (url, options) => {
    calls++;
    if (calls <= 2) {
      assert.equal(options.headers.Authorization, `Bearer ${token}`);
      assert.ok(!String(url).includes(token));
    }
    if (calls === 1) return Response.json({ username: 'carmo.confeccoes' });
    if (calls === 2) return Response.json({ data: [{ id: '42', timestamp: '2026-11-21T12:00:00Z', media_type: 'IMAGE', media_url: 'https://cdn.example/photo.jpg', permalink: 'https://www.instagram.com/p/abc/' }] });
    assert.equal(options.headers, undefined); // Do not forward the API token to the image CDN.
    return new Response(bytes, { headers: { 'content-type': 'image/jpeg' } });
  };
  try {
    await syncInstagram({ root, fetchImpl, env: { INSTAGRAM_ACCESS_TOKEN: token, INSTAGRAM_USER_ID: '123' } });
    const json = await readFile(join(root, 'data/instagram.json'), 'utf8');
    assert.ok(!json.includes(token));
    assert.equal(JSON.parse(json).post.image, 'imagens/instagram/latest.jpg');
    assert.deepEqual(await readFile(join(root, 'imagens/instagram/latest.jpg')), bytes);
  } finally { await rm(root, { recursive: true }); }
});
test('preserves cache after API failure or a mismatched account', async () => {
  const root = await mkdtemp(join(tmpdir(), 'carmo-'));
  await mkdir(join(root, 'data'));
  await writeFile(join(root, 'data/instagram.json'), 'existing');
  try {
    await assert.rejects(syncInstagram({ root, env: { INSTAGRAM_ACCESS_TOKEN: 'token', INSTAGRAM_USER_ID: '123' }, fetchImpl: async () => new Response('', { status: 401 }) }));
    assert.equal(await readFile(join(root, 'data/instagram.json'), 'utf8'), 'existing');
    await assert.rejects(syncInstagram({ root, env: { INSTAGRAM_ACCESS_TOKEN: 'token', INSTAGRAM_USER_ID: '123' }, fetchImpl: async () => Response.json({ username: 'someone-else' }) }));
    assert.equal(await readFile(join(root, 'data/instagram.json'), 'utf8'), 'existing');
  } finally { await rm(root, { recursive: true }); }
});
