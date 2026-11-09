import { borrarPendiente, guardarPendiente, listarPendientes } from "../db/resenasPendientes";
import type { Resena } from "../tipos";
import { obtenerYo } from "./auth";
import { ErrorApi, pedir } from "./cliente";

export type Estrellas = Resena["estrellas"];

// Id generado en el teléfono con el formato que acepta la API (res-xxxx).
// Si la misma reseña llega dos veces, la API devuelve la existente y no la duplica.
function nuevoIdResena() {
  const alfabeto = "abcdefghijklmnopqrstuvwxyz0123456789";
  let id = "";
  for (let i = 0; i < 16; i++) id += alfabeto[Math.floor(Math.random() * alfabeto.length)];
  return `res-${id}`;
}

const esSinRed = (e: unknown) => e instanceof ErrorApi && e.codigo === "SIN_RED";

export const resenasService = {
  // ---------- Vecino ----------

  /** Reseñas de un comercio, de la más nueva a la más vieja. */
  async obtenerDeComercio(comercioId: string, pagina = 1, porPagina = 100): Promise<Resena[]> {
    const { datos } = await pedir<Resena[]>(
      `/comercios/${encodeURIComponent(comercioId)}/resenas`,
      { params: { pagina, porPagina } },
    );
    return datos ?? [];
  },

  /**
   * Crea una reseña. Si no hay red, la guarda en SQLite con `sincronizada: false`
   * y la devuelve igual, para mostrarla como pendiente.
   */
  async crear(
    comercioId: string,
    usuarioId: string,
    estrellas: Estrellas,
    comentario: string,
  ): Promise<Resena> {
    const borrador: Resena = {
      id: nuevoIdResena(),
      comercioId,
      usuarioId,
      estrellas,
      comentario: comentario.trim(),
      respuesta: null,
      reportada: false,
      creadaEn: new Date().toISOString(),
      sincronizada: false,
    };
    try {
      return await subir(borrador);
    } catch (e) {
      if (!esSinRed(e)) throw e;
      await guardarPendiente(borrador);
      return borrador;
    }
  },

  async editar(id: string, cambios: { estrellas?: Estrellas; comentario?: string }): Promise<Resena> {
    const { datos } = await pedir<Resena>(`/resenas/${encodeURIComponent(id)}`, {
      metodo: "PATCH",
      cuerpo: cambios,
    });
    return datos;
  },

  async borrar(id: string): Promise<void> {
    await pedir<void>(`/resenas/${encodeURIComponent(id)}`, { metodo: "DELETE" });
  },

  /** Reportar una reseña ofensiva de otra persona. */
  async reportar(id: string): Promise<Resena> {
    const { datos } = await pedir<Resena>(`/resenas/${encodeURIComponent(id)}/reportes`, {
      metodo: "POST",
    });
    return datos;
  },

  /** Reseñas pendientes guardadas en el teléfono para un comercio. */
  pendientesDe(comercioId: string) {
    return listarPendientes(comercioId);
  },

  /** Borra una reseña pendiente que todavía no se subió. */
  descartarPendiente(id: string) {
    return borrarPendiente(id);
  },

  // ---------- Comercio ----------

  /** Reseñas del comercio de la cuenta autenticada. */
  async obtenerMisResenas(): Promise<Resena[]> {
    const usuario = await obtenerYo();
    if (usuario.rol !== "comercio" || !usuario.comercioId) {
      throw new Error("No se encontró un comercio asociado a esta cuenta.");
    }
    return this.obtenerDeComercio(usuario.comercioId);
  },

  /** El comercio responde una reseña (una sola vez). */
  async responder(resenaId: string, respuesta: string): Promise<Resena> {
    const { datos } = await pedir<Resena>(
      `/resenas/${encodeURIComponent(resenaId)}/respuesta`,
      { metodo: "POST", cuerpo: { respuesta: respuesta.trim() } },
    );
    return datos;
  },
};

async function subir(r: Resena): Promise<Resena> {
  const { datos } = await pedir<Resena>(
    `/comercios/${encodeURIComponent(r.comercioId)}/resenas`,
    {
      metodo: "POST",
      cuerpo: { id: r.id, estrellas: r.estrellas, comentario: r.comentario, creadaEn: r.creadaEn },
    },
  );
  return datos;
}

let sincronizando: Promise<number> | null = null;

/**
 * Sube las reseñas pendientes. Se llama al abrir la app, al volver a primer plano
 * y cuando vuelve la conexión. Devuelve cuántas se subieron.
 *
 * - Si sigue sin red, se corta y se reintenta la próxima vez.
 * - Si la API la rechaza por una regla (por ejemplo, ya había una reseña para ese
 *   comercio), se descarta: reintentarla daría siempre el mismo error.
 */
export function sincronizarResenasPendientes(): Promise<number> {
  if (sincronizando) return sincronizando;
  sincronizando = (async () => {
    let subidas = 0;
    const pendientes = await listarPendientes().catch(() => []);
    for (const r of pendientes) {
      try {
        await subir(r);
        await borrarPendiente(r.id);
        subidas++;
      } catch (e) {
        if (esSinRed(e)) break;
        const estado = e instanceof ErrorApi ? e.estado : 0;
        // Sin sesión: se deja para cuando vuelva a ingresar.
        if (estado === 401) break;
        // Error del servidor o desconocido: se reintenta la próxima vez.
        if (estado < 400 || estado >= 500 || estado === 408 || estado === 429) continue;
        console.warn("[resenas] Pendiente rechazada por la API, se descarta:", r.id, e);
        await borrarPendiente(r.id);
      }
    }
    return subidas;
  })().finally(() => {
    sincronizando = null;
  });
  return sincronizando;
}
