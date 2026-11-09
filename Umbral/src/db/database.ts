import * as SQLite from "expo-sqlite";

// Base local de Umbral. Guarda el listado de comercios con sus horarios
// para usar la app sin conexión, y las reseñas escritas sin red.
//
// Las migraciones usan PRAGMA user_version: cada versión nueva agrega su bloque
// y las bases que ya existen en los teléfonos se actualizan solas.

const MIGRACIONES: string[] = [
  // v1: comercios, horarios, rubros y metadatos (fecha de última actualización).
  `
  CREATE TABLE IF NOT EXISTS comercios (
    id TEXT PRIMARY KEY NOT NULL,
    nombre TEXT NOT NULL,
    rubro_id TEXT NOT NULL,
    descripcion TEXT NOT NULL,
    direccion TEXT NOT NULL,
    latitud REAL NOT NULL,
    longitud REAL NOT NULL,
    telefono TEXT,
    whatsapp TEXT,
    instagram TEXT,
    imagenes TEXT NOT NULL,
    video_url TEXT,
    medios_de_pago TEXT NOT NULL,
    puntaje REAL NOT NULL,
    cantidad_resenas INTEGER NOT NULL,
    codigo_qr TEXT,
    activo INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS horarios (
    comercio_id TEXT NOT NULL REFERENCES comercios(id) ON DELETE CASCADE,
    dia INTEGER NOT NULL,
    abre TEXT NOT NULL,
    cierra TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS horarios_por_comercio ON horarios(comercio_id);
  CREATE TABLE IF NOT EXISTS rubros (
    id TEXT PRIMARY KEY NOT NULL,
    nombre TEXT NOT NULL,
    icono TEXT NOT NULL,
    color TEXT NOT NULL,
    orden INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS meta (
    clave TEXT PRIMARY KEY NOT NULL,
    valor TEXT NOT NULL
  );
  `,
  // v2: reseñas escritas sin conexión, pendientes de subir (sincronizada: false).
  `
  CREATE TABLE IF NOT EXISTS resenas_pendientes (
    id TEXT PRIMARY KEY NOT NULL,
    comercio_id TEXT NOT NULL,
    usuario_id TEXT NOT NULL,
    estrellas INTEGER NOT NULL,
    comentario TEXT NOT NULL,
    creada_en TEXT NOT NULL
  );
  `,
];

let abierta: Promise<SQLite.SQLiteDatabase> | null = null;

async function abrir() {
  const db = await SQLite.openDatabaseAsync("umbral.db");
  await db.execAsync("PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;");

  const fila = await db.getFirstAsync<{ user_version: number }>("PRAGMA user_version");
  const version = fila?.user_version ?? 0;
  for (let v = version; v < MIGRACIONES.length; v++) {
    await db.withTransactionAsync(async () => {
      await db.execAsync(MIGRACIONES[v]);
      await db.execAsync(`PRAGMA user_version = ${v + 1}`);
    });
  }
  return db;
}

/** Devuelve la base abierta (se abre y migra una sola vez). */
export function obtenerDb() {
  if (!abierta) {
    abierta = abrir().catch((e) => {
      abierta = null; // permite reintentar
      throw e;
    });
  }
  return abierta;
}
