import type { Resena } from "../tipos";
import { abrirBase } from "./index";

interface Fila {
    id: string;
    comercio_id: string;
    usuario_id: string;
    estrellas: number;
    comentario: string;
    creada_en: string;
    sincronizada: number;
}

const aResena = (f: Fila): Resena => ({
    id: f.id,
    comercioId: f.comercio_id,
    usuarioId: f.usuario_id,
    estrellas: f.estrellas as Resena["estrellas"],
    comentario: f.comentario,
    respuesta: null,
    reportada: false,
    creadaEn: f.creada_en,
    sincronizada: f.sincronizada === 1,
});

/** Guarda una reseña escrita sin red (sincronizada = false) hasta que se pueda subir. */
export async function guardarPendiente(r: Resena) {
    const db = await abrirBase();
    await db.runAsync(
        `INSERT OR REPLACE INTO resenas_pendientes
       (id, comercio_id, usuario_id, estrellas, comentario, creada_en, sincronizada)
     VALUES (?, ?, ?, ?, ?, ?, 0)`,
        [
            r.id,
            r.comercioId,
            r.usuarioId,
            r.estrellas,
            r.comentario,
            r.creadaEn,
        ],
    );
}

export async function listarPendientes(
    filtro: { comercioId?: string; usuarioId?: string } = {},
) {
    const db = await abrirBase();
    const filas = await db.getAllAsync<Fila>(
        `SELECT * FROM resenas_pendientes
      WHERE (? IS NULL OR comercio_id = ?) AND (? IS NULL OR usuario_id = ?)
      ORDER BY creada_en ASC`,
        [
            filtro.comercioId ?? null,
            filtro.comercioId ?? null,
            filtro.usuarioId ?? null,
            filtro.usuarioId ?? null,
        ],
    );
    return filas.map(aResena);
}

export async function actualizarPendiente(
    id: string,
    cambios: { estrellas?: number; comentario?: string },
) {
    const db = await abrirBase();
    await db.runAsync(
        `UPDATE resenas_pendientes
        SET estrellas = COALESCE(?, estrellas), comentario = COALESCE(?, comentario)
      WHERE id = ?`,
        [cambios.estrellas ?? null, cambios.comentario ?? null, id],
    );
}

export async function borrarPendiente(id: string) {
    const db = await abrirBase();
    await db.runAsync("DELETE FROM resenas_pendientes WHERE id = ?", [id]);
}
