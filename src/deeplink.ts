import * as ExpoLinking from 'expo-linking';

/**
 * Enlaces del tipo guardapp://guardar?url=...&texto=...
 * Los usa el Atajo de iOS para mandar a GuardApp lo que compartes,
 * como alternativa gratuita a la extensión de Compartir.
 */
export function leerEnlaceGuardar(url: string | null): { text: string | null; webUrl: string | null } | null {
  if (!url) return null;
  const { hostname, path, queryParams } = ExpoLinking.parse(url);
  const destino = (hostname || path || '').replace(/^\/+|\/+$/g, '');
  if (destino !== 'guardar') return null;
  const valor = (k: string) => {
    const v = queryParams?.[k];
    return typeof v === 'string' && v.trim() ? v.trim() : null;
  };
  const webUrl = valor('url');
  const text = valor('texto') ?? valor('text');
  if (!webUrl && !text) return null;
  return { text: text ?? webUrl, webUrl };
}
