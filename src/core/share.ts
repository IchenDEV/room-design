import type { Project } from './types';
import type { Store } from './store/store';
import { addProjectAsFile, isValidProject } from './store/project-files';

type StreamCtor = new (format: string) => {
  readable: ReadableStream<Uint8Array>;
  writable: WritableStream<Uint8Array>;
};

const MARK = 'qj1';
const enc = new TextEncoder();
const dec = new TextDecoder();

const compression = () =>
  (globalThis as typeof globalThis & { CompressionStream?: StreamCtor }).CompressionStream;
const decompression = () =>
  (globalThis as typeof globalThis & { DecompressionStream?: StreamCtor }).DecompressionStream;

function toBase64Url(bytes: Uint8Array) {
  let raw = '';
  for (let i = 0; i < bytes.length; i += 0x8000) {
    raw += String.fromCharCode(...bytes.slice(i, i + 0x8000));
  }
  return btoa(raw).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(text: string) {
  const padded = text.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(text.length / 4) * 4, '=');
  const raw = atob(padded);
  const bytes = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
  return bytes;
}

async function transform(bytes: Uint8Array, ctor: StreamCtor | undefined) {
  if (!ctor) return null;
  const stream = new ctor('gzip');
  const result = new Response(stream.readable).arrayBuffer();
  const writer = stream.writable.getWriter();
  await writer.write(bytes);
  await writer.close();
  return new Uint8Array(await result);
}

export async function encodeShareProject(project: Project) {
  const plain = enc.encode(JSON.stringify(project));
  const zipped = await transform(plain, compression()).catch(() => null);
  if (zipped && zipped.length < plain.length) return `${MARK}.g.${toBase64Url(zipped)}`;
  return `${MARK}.p.${toBase64Url(plain)}`;
}

export async function decodeShareProject(token: string): Promise<Project | null> {
  try {
    const [mark, mode, data] = token.split('.', 3);
    if (mark !== MARK || !data) return null;
    let bytes = fromBase64Url(data);
    if (mode === 'g') {
      const plain = await transform(bytes, decompression());
      if (!plain) return null;
      bytes = plain;
    } else if (mode !== 'p') {
      return null;
    }
    const project = JSON.parse(dec.decode(bytes));
    return isValidProject(project) ? project : null;
  } catch {
    return null;
  }
}

export async function makeShareUrl(store: Store) {
  const url = new URL(location.href);
  url.hash = `#/studio?share=${await encodeShareProject(store.project)}`;
  return url.href;
}

function currentShareToken() {
  const hash = location.hash.slice(1);
  const q = hash.indexOf('?');
  if (q < 0) return null;
  return new URLSearchParams(hash.slice(q + 1)).get('share');
}

function clearShareToken() {
  const hash = location.hash.slice(1);
  const q = hash.indexOf('?');
  if (q < 0) return;
  const path = hash.slice(0, q) || '/studio';
  const params = new URLSearchParams(hash.slice(q + 1));
  if (!params.has('share')) return;
  params.delete('share');
  const next = new URL(location.href);
  const query = params.toString();
  next.hash = `${path}${query ? `?${query}` : ''}`;
  history.replaceState(null, '', next);
}

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return;
  } catch { /* fall back to textarea copy */ }
  const area = document.createElement('textarea');
  area.value = text;
  area.style.cssText = 'position:fixed;left:-9999px;top:0';
  document.body.appendChild(area);
  area.select();
  document.execCommand('copy');
  area.remove();
}

export async function shareProject(store: Store) {
  const url = await makeShareUrl(store);
  const title = `栖居 Rooms · ${store.project.name || '未命名方案'}`;
  if (navigator.share) {
    try {
      await navigator.share({ title, text: '查看这个房间设计方案', url });
      return '已打开系统分享';
    } catch (err) {
      if ((err as DOMException).name === 'AbortError') return '已取消分享';
    }
  }
  await copyText(url);
  return '分享链接已复制';
}

export async function consumeShareLink(store: Store): Promise<string | null> {
  const token = currentShareToken();
  if (!token) return null;
  const project = await decodeShareProject(token);
  clearShareToken();
  if (!project) return '分享链接无效或已损坏';
  await addProjectAsFile(store, { ...project, name: `${project.name || '分享方案'}（分享）` });
  return null;
}
