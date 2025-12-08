// Utilidades para trabajar con JWT en el cliente

function decodePayload(token) {
  try {
    const [, payload] = String(token || '').split('.');
    if (!payload) return null;
    let b64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    while (b64.length % 4) b64 += '=';
    return JSON.parse(atob(b64));
  } catch (_) {
    return null;
  }
}

export function isAdminFromToken(token) {
  const payload = decodePayload(token);
  return Boolean(payload && payload.role === 'ADMIN');
}

export function getTokenExpirationMs(token) {
  const payload = decodePayload(token);
  const expSec = payload && Number(payload.exp);
  if (!Number.isFinite(expSec)) return null;
  return expSec * 1000;
}

export function isTokenExpired(token, now = Date.now()) {
  const expMs = getTokenExpirationMs(token);
  if (expMs == null) return false; // si no hay exp, asumir válido
  return expMs <= now;
}
