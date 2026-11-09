import type { Resena } from "../tipos";
import { obtenerDb } from "./database";

interface Fila {
  id: string;
  comercio_id: string;
  usuario_id: string;
  estrellas: Resena["estrellas"];
  comentario: string;
  creada_en: string;
}

const aResena = (f: Fila): Resena => ({
  id: f.id,
  comercioId: f.comercio_id,
  usuarioId: f.usuario_id,
  estrellas: f.estrellas,
  comentario: f.comentario,
  respuesta: null,
  reportada: false,
  creadaEn: f.creada_en,
  sincronizada: false,
});

/** Guarda una reseña que no se pudo subir por falta de red. */
export async function guardarPendiente(r: Resena) {
  const db = await obtenerDb();
  await db.runAsync(
    `INSERT OR REPLACE INTO resenas_pendientes (id, comercio_id, usuario_id, estrellas, comentario, creada_en)
     VALUES (?, ?, ?, ?, ?, ?)`,
    r.id,
    r.comercioId,
    r.usuarioId,
    r.estrellas,
    r.comentario,
    r.creadaEn,
  );
}

/** Pendientes de un comercio, o todas si no se indica. */
export async function listarPendientes(comercioId?: string): Promise<Resena[]> {
  const db = await obtenerDb();
  const filas = comercioId
    ? await db.getAllAsync<Fila>(
        "SELECT * FROM resenas_pendientes WHERE comercio_id = ? ORDER BY creada_en DESC",
        comercioId,
      )
    : await db.getAllAsync<Fila>("SELECT * FROM resenas_pendientes ORDER BY creada_en");
  return filas.map(aResena);
}

export async function borrarPendiente(id: string) {
  const db = await obtenerDb();
  await db.runAsync("DELETE FROM resenas_pendientes WHERE id = ?", id);
}
