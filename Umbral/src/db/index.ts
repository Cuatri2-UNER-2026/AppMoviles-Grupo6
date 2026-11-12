import * as SQLite from "expo-sqlite";

let abierta: Promise<SQLite.SQLiteDatabase> | null = null;

/** Abre la base local una sola vez y crea las tablas si todavía no existen. */
export function abrirBase() {
    abierta ??= (async () => {
        const db = await SQLite.openDatabaseAsync("umbral.db");
        await db.execAsync(`
      CREATE TABLE IF NOT EXISTS resenas_pendientes (
        id TEXT PRIMARY KEY NOT NULL,
        comercio_id TEXT NOT NULL,
        usuario_id TEXT NOT NULL,
        estrellas INTEGER NOT NULL,
        comentario TEXT NOT NULL,
        creada_en TEXT NOT NULL,
        sincronizada INTEGER NOT NULL DEFAULT 0
      );
      CREATE TABLE IF NOT EXISTS rubros (
        id TEXT PRIMARY KEY NOT NULL,
        orden INTEGER NOT NULL,
        datos TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS comercios (
        id TEXT PRIMARY KEY NOT NULL,
        rubro_id TEXT NOT NULL,
        nombre TEXT NOT NULL,
        datos TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS horarios (
        comercio_id TEXT NOT NULL,
        dia INTEGER NOT NULL,
        abre TEXT NOT NULL,
        cierra TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS horarios_por_comercio ON horarios (comercio_id);
      CREATE TABLE IF NOT EXISTS meta (
        clave TEXT PRIMARY KEY NOT NULL,
        valor TEXT NOT NULL
      );
    `);
        return db;
    })();
    return abierta;
}
