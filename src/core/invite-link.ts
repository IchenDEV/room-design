const KEY = 'qiju:pending-invite';

function inviteTokenFromHash(): string | null {
  const hash = location.hash.slice(1);
  if (hash.startsWith('/i/')) {
    const token = hash.slice(3).split(/[?#]/, 1)[0];
    return token ? decodeURIComponent(token) : null;
  }
  const q = hash.indexOf('?');
  if (q < 0) return null;
  return new URLSearchParams(hash.slice(q + 1)).get('invite');
}

function clearInviteFromHash(): void {
  const hash = location.hash.slice(1);
  if (hash.startsWith('/i/')) {
    const next = new URL(location.href);
    next.hash = '#/studio';
    history.replaceState(null, '', next);
    return;
  }
  const q = hash.indexOf('?');
  if (q < 0) return;
  const path = hash.slice(0, q) || '/studio';
  const params = new URLSearchParams(hash.slice(q + 1));
  if (!params.has('invite')) return;
  params.delete('invite');
  const next = new URL(location.href);
  const query = params.toString();
  next.hash = `${path}${query ? `?${query}` : ''}`;
  history.replaceState(null, '', next);
}

function readPending(): string | null {
  try { return sessionStorage.getItem(KEY); } catch { return null; }
}

function writePending(token: string): void {
  try { sessionStorage.setItem(KEY, token); } catch { /* ignore storage denial */ }
}

function clearPending(): void {
  try { sessionStorage.removeItem(KEY); } catch { /* ignore storage denial */ }
}

export function hasInviteToken(): boolean {
  return !!(inviteTokenFromHash() || readPending());
}

export function rememberInviteToken(): string | null {
  const token = inviteTokenFromHash();
  if (token) writePending(token);
  return token;
}

export function consumeInviteToken(): string | null {
  const token = inviteTokenFromHash() || readPending();
  if (!token) return null;
  clearInviteFromHash();
  clearPending();
  return token;
}
