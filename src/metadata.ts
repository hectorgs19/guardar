// Saca título, descripción e imagen de un enlace leyendo sus etiquetas Open Graph.
// Instagram y TikTok a veces devuelven poca información sin sesión; en ese caso
// usamos lo que la app de origen haya enviado al compartir.

export type Metadatos = {
  titulo?: string;
  descripcion?: string;
  imagen?: string;
};

function decodificar(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&#x27;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .trim();
}

function meta(html: string, nombre: string): string | undefined {
  const patrones = [
    new RegExp(`<meta[^>]+(?:property|name)=["']${nombre}["'][^>]*content=["']([^"']*)["']`, 'i'),
    new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]*(?:property|name)=["']${nombre}["']`, 'i'),
  ];
  for (const p of patrones) {
    const m = html.match(p);
    if (m?.[1]) return decodificar(m[1]);
  }
  return undefined;
}

export async function obtenerMetadatos(url: string, timeoutMs = 8000): Promise<Metadatos> {
  const control = new AbortController();
  const t = setTimeout(() => control.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: control.signal,
      headers: {
        // Muchas webs solo sirven las etiquetas Open Graph a los "previsualizadores" de enlaces.
        'User-Agent': 'facebookexternalhit/1.1 (+GuardApp)',
        Accept: 'text/html',
      },
    });
    const html = (await res.text()).slice(0, 300_000);
    const tituloHtml = html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1];
    return {
      titulo: meta(html, 'og:title') ?? meta(html, 'twitter:title') ?? (tituloHtml ? decodificar(tituloHtml) : undefined),
      descripcion: meta(html, 'og:description') ?? meta(html, 'description') ?? meta(html, 'twitter:description'),
      imagen: meta(html, 'og:image') ?? meta(html, 'twitter:image'),
    };
  } catch {
    return {};
  } finally {
    clearTimeout(t);
  }
}
