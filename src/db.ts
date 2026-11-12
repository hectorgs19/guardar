import * as SQLite from 'expo-sqlite';
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
  creado: number; // ms desde epoch
  visto: number | null;
  recordar: number | null;
};

const db = SQLite.openDatabaseSync('guardapp.db');

db.execSync(`
  PRAGMA journal_mode = WAL;
  CREATE TABLE IF NOT EXISTS elementos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    url TEXT,
    texto TEXT,
    titulo TEXT,
    descripcion TEXT,
    imagen TEXT,
    origen TEXT NOT NULL,
    tipo TEXT NOT NULL,
    creado INTEGER NOT NULL,
    visto INTEGER,
    recordar INTEGER
  );
  CREATE INDEX IF NOT EXISTS idx_elementos_tipo ON elementos(tipo);
`);

export function listar(tipo?: Tipo | null): Elemento[] {
  return tipo
    ? db.getAllSync<Elemento>('SELECT * FROM elementos WHERE tipo = ? ORDER BY creado DESC', tipo)
    : db.getAllSync<Elemento>('SELECT * FROM elementos ORDER BY creado DESC');
}

export function existeUrl(url: string): Elemento | null {
  return db.getFirstSync<Elemento>('SELECT * FROM elementos WHERE url = ?', url);
}

export function insertar(e: Omit<Elemento, 'id' | 'visto' | 'recordar'>): number {
  const r = db.runSync(
    `INSERT INTO elementos (url, texto, titulo, descripcion, imagen, origen, tipo, creado)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    e.url, e.texto, e.titulo, e.descripcion, e.imagen, e.origen, e.tipo, e.creado,
  );
  return r.lastInsertRowId;
}

export function actualizarMetadatos(
  id: number,
  m: { titulo?: string | null; descripcion?: string | null; imagen?: string | null; tipo: Tipo },
) {
  db.runSync(
    `UPDATE elementos SET
       titulo = COALESCE(?, titulo),
       descripcion = COALESCE(?, descripcion),
       imagen = COALESCE(?, imagen),
       tipo = ?
     WHERE id = ?`,
    m.titulo ?? null, m.descripcion ?? null, m.imagen ?? null, m.tipo, id,
  );
}

export function cambiarTipo(id: number, tipo: Tipo) {
  db.runSync('UPDATE elementos SET tipo = ? WHERE id = ?', tipo, id);
}

export function marcarVisto(id: number) {
  db.runSync('UPDATE elementos SET visto = ? WHERE id = ?', Date.now(), id);
}

export function borrar(id: number) {
  db.runSync('DELETE FROM elementos WHERE id = ?', id);
}

/** Cosas guardadas hace más de 3 días que nunca has abierto, de la más antigua a la más nueva. */
export function olvidados(limite = 5): Elemento[] {
  const hace3dias = Date.now() - 3 * 24 * 60 * 60 * 1000;
  return db.getAllSync<Elemento>(
    'SELECT * FROM elementos WHERE visto IS NULL AND creado < ? ORDER BY creado ASC LIMIT ?',
    hace3dias, limite,
  );
}
