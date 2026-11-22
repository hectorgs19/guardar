// Versión web de src/db.ts: mismas funciones, guardadas en localStorage en vez de SQLite.
import type { Origen, Tipo } from './classify';

export type Elemento = {
  id: number;
  url: string | null;
  texto: string | null;
  titulo: string | null;
  descripcion: string | null;
  imagen: string | null;
  origen: Origen;
  tipo: Tipo;
  creado: number;
  visto: number | null;
  recordar: number | null;
};

const CLAVE = 'guardapp.elementos';

function leer(): Elemento[] {
  try {
    return JSON.parse(localStorage.getItem(CLAVE) ?? '[]');
  } catch {
    return [];
  }
}

function escribir(lista: Elemento[]) {
  try {
    localStorage.setItem(CLAVE, JSON.stringify(lista));
  } catch {}
}

function modificar(id: number, cambio: (e: Elemento) => void) {
  const lista = leer();
  const e = lista.find((x) => x.id === id);
  if (e) {
    cambio(e);
    escribir(lista);
  }
}

const porFecha = (a: Elemento, b: Elemento) => b.creado - a.creado;

export function listar(tipo?: Tipo | null): Elemento[] {
  return leer().filter((e) => !tipo || e.tipo === tipo).sort(porFecha);
}

export function existeUrl(url: string): Elemento | null {
  return leer().find((e) => e.url === url) ?? null;
}

export function insertar(e: Omit<Elemento, 'id' | 'visto' | 'recordar'>): number {
  const lista = leer();
  const id = lista.reduce((m, x) => Math.max(m, x.id), 0) + 1;
  lista.push({ ...e, id, visto: null, recordar: null });
  escribir(lista);
  return id;
}

export function actualizarMetadatos(
  id: number,
  m: { titulo?: string | null; descripcion?: string | null; imagen?: string | null; tipo: Tipo },
) {
  modificar(id, (e) => {
    e.titulo = m.titulo ?? e.titulo;
    e.descripcion = m.descripcion ?? e.descripcion;
    e.imagen = m.imagen ?? e.imagen;
    e.tipo = m.tipo;
  });
}

export function cambiarTipo(id: number, tipo: Tipo) {
  modificar(id, (e) => (e.tipo = tipo));
}

export function marcarVisto(id: number) {
  modificar(id, (e) => (e.visto = Date.now()));
}

export function borrar(id: number) {
  escribir(leer().filter((e) => e.id !== id));
}

export function olvidados(limite = 5): Elemento[] {
  const hace3dias = Date.now() - 3 * 24 * 60 * 60 * 1000;
  return leer()
    .filter((e) => e.visto === null && e.creado < hace3dias)
    .sort((a, b) => a.creado - b.creado)
    .slice(0, limite);
}
