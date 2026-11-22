import type { ShareIntent } from './share';
import { clasificar, detectarOrigen } from './classify';
import { actualizarMetadatos, existeUrl, insertar } from './db';
import { obtenerMetadatos } from './metadata';

const URL_RE = /https?:\/\/[^\s<>"']+/i;

export type ResultadoCaptura =
  | { estado: 'guardado'; id: number }
  | { estado: 'duplicado'; id: number }
  | { estado: 'vacio' };

/** Guarda lo que llega desde el menú Compartir y, en segundo plano, completa sus datos. */
export async function guardarCompartido(
  share: Pick<ShareIntent, 'text' | 'webUrl' | 'meta'>,
  alActualizar?: () => void,
): Promise<ResultadoCaptura> {
  const texto = share.text?.trim() || null;
  const url = share.webUrl || texto?.match(URL_RE)?.[0] || null;
  if (!url && !texto) return { estado: 'vacio' };

  if (url) {
    const previo = existeUrl(url);
    if (previo) return { estado: 'duplicado', id: previo.id };
  }

  // Si el texto compartido es solo el enlace, no lo guardamos dos veces.
  const textoExtra = texto && url && texto.replace(url, '').trim() === '' ? null : texto;
  const titulo = share.meta?.title ?? null;
  const imagen = (share.meta?.['og:image'] as string | undefined) ?? null;

  const id = insertar({
    url,
    texto: textoExtra,
    titulo,
    descripcion: null,
    imagen,
    origen: detectarOrigen(url),
    tipo: clasificar({ url, titulo, texto: textoExtra }),
    creado: Date.now(),
  });

  if (url) {
    obtenerMetadatos(url).then((m) => {
      const t = m.titulo ?? titulo;
      actualizarMetadatos(id, {
        titulo: m.titulo,
        descripcion: m.descripcion,
        imagen: m.imagen,
        tipo: clasificar({ url, titulo: t, descripcion: m.descripcion, texto: textoExtra }),
      });
      alActualizar?.();
    });
  }
  return { estado: 'guardado', id };
}
