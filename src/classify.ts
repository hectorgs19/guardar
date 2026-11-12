// Primera versión de la clasificación: reglas por palabras clave y dominio.
// Más adelante se sustituirá por un modelo de lenguaje en un backend.

export type Tipo =
  | 'receta'
  | 'manual'
  | 'articulo'
  | 'video'
  | 'producto'
  | 'lugar'
  | 'idea'
  | 'otro';

export const TIPOS: { id: Tipo; nombre: string; emoji: string }[] = [
  { id: 'receta', nombre: 'Recetas', emoji: '🍳' },
  { id: 'manual', nombre: 'Manuales', emoji: '🛠️' },
  { id: 'articulo', nombre: 'Artículos', emoji: '📰' },
  { id: 'video', nombre: 'Vídeos', emoji: '🎬' },
  { id: 'producto', nombre: 'Productos', emoji: '🛍️' },
  { id: 'lugar', nombre: 'Sitios', emoji: '📍' },
  { id: 'idea', nombre: 'Ideas', emoji: '💡' },
  { id: 'otro', nombre: 'Otros', emoji: '📦' },
];

export type Origen =
  | 'instagram'
  | 'tiktok'
  | 'youtube'
  | 'x'
  | 'facebook'
  | 'pinterest'
  | 'web'
  | 'texto';

const PALABRAS: Record<Exclude<Tipo, 'video' | 'otro'>, string[]> = {
  receta: [
    'receta', 'recipe', 'ingredientes', 'ingredients', 'horno', 'cocina', 'cocinar',
    'gramos', 'cucharada', 'tbsp', 'tsp', 'minutos de cocción', 'postre', 'tarta',
    'pasta', 'salsa', 'airfryer', 'freidora', 'thermomix', 'bizcocho', 'guiso',
  ],
  manual: [
    'cómo', 'como hacer', 'how to', 'tutorial', 'guía', 'guide', 'paso a paso',
    'step by step', 'manual', 'instrucciones', 'truco', 'tips', 'diy', 'bricolaje',
    'arreglar', 'fix', 'configurar', 'setup', 'aprende',
  ],
  articulo: [
    'artículo', 'article', 'blog', 'noticia', 'news', 'opinión', 'leer', 'read',
    'newsletter', 'ensayo', 'entrevista',
  ],
  producto: [
    'comprar', 'buy', 'precio', 'price', 'oferta', 'descuento', 'amazon', 'tienda',
    'shop', 'envío', '€', '$', 'review', 'unboxing',
  ],
  lugar: [
    'restaurante', 'restaurant', 'hotel', 'viaje', 'travel', 'visitar', 'ruta',
    'playa', 'museo', 'dónde comer', 'escapada', 'maps.google', 'goo.gl/maps',
    'booking', 'airbnb',
  ],
  idea: [
    'idea', 'inspiración', 'inspiration', 'decoración', 'decor', 'outfit', 'diseño',
    'design', 'regalo', 'gift',
  ],
};

export function detectarOrigen(url?: string | null): Origen {
  if (!url) return 'texto';
  const u = url.toLowerCase();
  if (u.includes('instagram.com')) return 'instagram';
  if (u.includes('tiktok.com')) return 'tiktok';
  if (u.includes('youtube.com') || u.includes('youtu.be')) return 'youtube';
  if (u.includes('twitter.com') || u.includes('x.com/')) return 'x';
  if (u.includes('facebook.com') || u.includes('fb.watch')) return 'facebook';
  if (u.includes('pinterest.')) return 'pinterest';
  return 'web';
}

function esVideo(url: string, origen: Origen): boolean {
  const u = url.toLowerCase();
  return (
    origen === 'youtube' ||
    origen === 'tiktok' ||
    u.includes('/reel/') ||
    u.includes('/reels/') ||
    u.includes('/shorts/') ||
    u.includes('vimeo.com')
  );
}

/** Devuelve el tipo más probable a partir del texto disponible. */
export function clasificar(input: {
  url?: string | null;
  titulo?: string | null;
  descripcion?: string | null;
  texto?: string | null;
}): Tipo {
  const texto = [input.titulo, input.descripcion, input.texto, input.url]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  let mejor: Tipo | null = null;
  let mejorPuntos = 0;
  for (const [tipo, palabras] of Object.entries(PALABRAS)) {
    const puntos = palabras.reduce((n, p) => (texto.includes(p) ? n + 1 : n), 0);
    if (puntos > mejorPuntos) {
      mejor = tipo as Tipo;
      mejorPuntos = puntos;
    }
  }
  if (mejor) return mejor;

  const url = input.url ?? '';
  if (url && esVideo(url, detectarOrigen(url))) return 'video';
  if (url && detectarOrigen(url) === 'web') return 'articulo';
  return 'otro';
}
