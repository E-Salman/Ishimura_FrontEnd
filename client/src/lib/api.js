// If VITE_API_URL is not set, use Vite dev proxy under /api
const BASE = import.meta.env.VITE_API_URL ?? '/api';

export function getBaseUrl() {
  return BASE;
}

export async function getMarcas(signal) {
  const res = await fetch(`${BASE}/marcas`, { signal });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function getMarcaFirstImageUrl(marcaId, signal) {
  try {
    const res = await fetch(`${BASE}/marcasImages/${marcaId}/imagenes/primera`, { signal });
    if (!res.ok) throw new Error('no-image');
    const blob = await res.blob();
    return URL.createObjectURL(blob);
  } catch (e) {
    return 'https://placehold.co/800x600/png?text=Marca';
  }
}
