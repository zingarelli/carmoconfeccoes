/**
 * Fetch the newest owned Instagram post into a static, public cache.
 * Run with Node 22+: INSTAGRAM_ACCESS_TOKEN=... INSTAGRAM_USER_ID=... node scripts/sync-instagram.mjs
 * Tokens never enter HTML, client-side JS, the JSON cache, or error messages.
 */
import { mkdir, readFile, writeFile, rename } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const PROFILE = 'https://www.instagram.com/carmo.confeccoes/';
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

export function safePostUrl(value) {
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || !['instagram.com', 'www.instagram.com'].includes(url.hostname)
      || !/^\/(p|reel|tv)\/[\w-]+\/?$/.test(url.pathname)) return null;
    url.search = '';
    url.hash = '';
    return url.href;
  } catch { return null; }
}

export function newestPost(items) {
  if (!Array.isArray(items)) throw new Error('Resposta de mídia inválida.');
  return items.filter(item => Number.isFinite(Date.parse(item.timestamp)))
    .sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp))[0] || null;
}

export function previewUrl(post) {
  if (post.media_type === 'VIDEO') return post.thumbnail_url;
  if (post.media_type === 'CAROUSEL_ALBUM') {
    const first = post.children?.data?.[0];
    return first?.media_type === 'VIDEO' ? first.thumbnail_url : first?.media_url || post.media_url;
  }
  return post.media_url;
}

export function imageExtension(bytes) {
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'jpg';
  if (bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) return 'png';
  if (bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP') return 'webp';
  throw new Error('O Instagram não retornou uma imagem JPEG, PNG ou WebP.');
}

export async function syncInstagram({ env = process.env, fetchImpl = fetch, root = ROOT } = {}) {
  const token = env.INSTAGRAM_ACCESS_TOKEN;
  const userId = env.INSTAGRAM_USER_ID;
  if (!token || !/^\d+$/.test(userId || '')) throw new Error('Configure INSTAGRAM_ACCESS_TOKEN e INSTAGRAM_USER_ID nos secrets.');
  const host = env.INSTAGRAM_API_HOST || 'graph.instagram.com';
  const version = env.INSTAGRAM_API_VERSION || 'v27.0';
  if (!['graph.instagram.com', 'graph.facebook.com'].includes(host) || !/^v\d+\.0$/.test(version)) {
    throw new Error('Host ou versão da API inválidos.');
  }
  const api = async (path, fields) => {
    const url = new URL(`https://${host}/${version}/${path}`);
    url.searchParams.set('fields', fields);
    url.searchParams.set('limit', '25');
    // A bearer header avoids exposing the token in URL/access logs.
    const response = await fetchImpl(url, {
      headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(20000), redirect: 'error'
    });
    if (!response.ok) throw new Error(`A API recusou a consulta (HTTP ${response.status}). Verifique permissões e validade do token.`);
    return response.json();
  };
  const account = await api(userId, 'username');
  if (account.username?.toLowerCase() !== 'carmo.confeccoes') throw new Error('A conta autorizada não corresponde a @carmo.confeccoes.');
  // Meta documents caption as Facebook Login only. Instagram Login uses a neutral caption.
  const fields = ['id', 'media_type', 'media_url', 'thumbnail_url', 'permalink', 'timestamp',
    'children{media_type,media_url,thumbnail_url}', ...(host === 'graph.facebook.com' ? ['caption'] : [])].join(',');
  const payload = await api(`${userId}/media`, fields);
  const latest = newestPost(payload.data);
  if (!latest) throw new Error('Nenhuma publicação encontrada; o cache anterior foi preservado.');
  const permalink = safePostUrl(latest.permalink);
  if (!permalink) throw new Error('A publicação mais recente não possui um link válido.');
  let imageUrl;
  try { imageUrl = new URL(previewUrl(latest)); } catch { throw new Error('A publicação mais recente não possui uma prévia.'); }
  if (imageUrl.protocol !== 'https:') throw new Error('A prévia precisa usar HTTPS.');
  const response = await fetchImpl(imageUrl, { signal: AbortSignal.timeout(20000) });
  if (!response.ok || !response.headers.get('content-type')?.startsWith('image/')) throw new Error('Não foi possível obter a imagem da publicação.');
  const chunks = [];
  let total = 0;
  for await (const chunk of response.body) {
    total += chunk.length;
    if (total > 10 * 1024 * 1024) throw new Error('Imagem maior que 10 MB; o cache anterior foi preservado.');
    chunks.push(chunk);
  }
  const bytes = Buffer.concat(chunks);
  const extension = imageExtension(bytes);
  const image = `imagens/instagram/latest.${extension}`;
  const data = { profileUrl: PROFILE, post: {
    id: latest.id, url: permalink, image,
    caption: typeof latest.caption === 'string' ? latest.caption : '', timestamp: latest.timestamp
  } };
  const serialized = `${JSON.stringify(data, null, 2)}\n`;
  const destination = resolve(root, 'data/instagram.json');
  const imageDestination = resolve(root, image);
  await mkdir(dirname(imageDestination), { recursive: true });
  await mkdir(dirname(destination), { recursive: true });
  const previous = await readFile(destination, 'utf8').catch(() => '');
  const previousImage = await readFile(imageDestination).catch(() => Buffer.alloc(0));
  if (previous === serialized && previousImage.equals(bytes)) return false;
  await writeFile(`${imageDestination}.tmp`, bytes);
  await rename(`${imageDestination}.tmp`, imageDestination);
  await writeFile(`${destination}.tmp`, serialized);
  await rename(`${destination}.tmp`, destination);
  return true;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    const changed = await syncInstagram();
    console.log(changed ? 'Publicação do Instagram atualizada.' : 'A publicação já está atualizada.');
  } catch (error) {
    // Never log raw fetch errors: they may contain sensitive request information.
    const known = /^(Configure |Host |A API |A conta |Nenhuma |A publicação |A prévia |Não foi |Imagem |O Instagram |Resposta )/;
    console.error(known.test(error.message) ? error.message : 'Falha ao sincronizar o Instagram; o cache anterior foi preservado.');
    process.exitCode = 1;
  }
}
