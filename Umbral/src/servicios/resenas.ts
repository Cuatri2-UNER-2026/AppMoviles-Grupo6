import { borrarPendiente, actualizarPendiente, guardarPendiente, listarPendientes } from "../db/resenasPendientes";
import type { Resena } from "../tipos";
import { obtenerYo } from "./auth";
import { ErrorApi, pedir } from "./cliente";

export interface DatosResena {
  estrellas: 1 | 2 | 3 | 4 | 5;
  comentario: string;
}

// El teléfono genera el id (res- + letras y números) para que reenviar no duplique la reseña.
const nuevoId = () => `res-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

let sincronizando = false;
const oyentes = new Set<() => void>();

/** Para que las pantallas se recarguen cuando se suben reseñas pendientes. */
export function escucharSincronizacion(oyente: () => void) {
  oyentes.add(oyente);
  return () => {
    oyentes.delete(oyente);
  };
}

export const resenasService = {
  // Obtener las reseñas del comercio autenticado.
  async obtenerMisResenas(): Promise<Resena[]> {
    const usuario = await obtenerYo();

    if (usuario.rol !== "comercio" || !usuario.comercioId) {
      throw new Error("No se encontró un comercio asociado a esta cuenta.");
    }

    return this.obtenerDeComercio(usuario.comercioId, 1, 100);
  },

  // Obtener las reseñas de un comercio (la API las manda de la más nueva a la más vieja).
  async obtenerDeComercio(comercioId: string, pagina: number = 1, porPagina: number = 20): Promise<Resena[]> {
    const { datos } = await pedir<Resena[]>(`/comercios/${encodeURIComponent(comercioId)}/resenas`, {
      params: { pagina, porPagina },
    });
    return datos ?? [];
  },

  // Dejar una reseña. Sin red se guarda en SQLite y se sube cuando vuelva la conexión.
  async crear(
    comercioId: string,
    datos: DatosResena,
    usuarioId: string,
  ): Promise<{ resena: Resena; pendiente: boolean }> {
    const id = nuevoId();
    const creadaEn = new Date().toISOString();
    try {
      const { datos: resena } = await pedir<Resena>(`/comercios/${encodeURIComponent(comercioId)}/resenas`, {
        metodo: "POST",
        cuerpo: { id, ...datos, creadaEn },
      });
      return { resena, pendiente: false };
    } catch (e) {
      if (e instanceof ErrorApi && e.codigo === "SIN_RED") {
        const resena: Resena = {
          id,
          comercioId,
          usuarioId,
          estrellas: datos.estrellas,
          comentario: datos.comentario,
          respuesta: null,
          reportada: false,
          creadaEn,
          sincronizada: false,
        };
        await guardarPendiente(resena);
        return { resena, pendiente: true };
      }
      throw e;
    }
  },

  // Editar la reseña propia. Si todavía no se subió, se edita la copia local.
  async editar(resena: Resena, cambios: Partial<DatosResena>): Promise<Resena> {
    if (!resena.sincronizada) {
      await actualizarPendiente(resena.id, cambios);
      return { ...resena, ...cambios };
    }
    const { datos } = await pedir<Resena>(`/resenas/${encodeURIComponent(resena.id)}`, {
      metodo: "PATCH",
      cuerpo: cambios,
    });
    return datos;
  },

  // Borrar la reseña propia.
  async borrar(resena: Resena): Promise<void> {
    if (!resena.sincronizada) {
      await borrarPendiente(resena.id);
      return;
    }
    await pedir<void>(`/resenas/${encodeURIComponent(resena.id)}`, { metodo: "DELETE" });
  },

  // Reportar una reseña ofensiva (una vez por usuario; el autor no puede).
  async reportar(resenaId: string): Promise<Resena> {
    const { datos } = await pedir<Resena>(`/resenas/${encodeURIComponent(resenaId)}/reportes`, {
      metodo: "POST",
    });
    return datos;
  },

  // Responder una reseña como comercio (una sola vez).
  async responder(resenaId: string, respuesta: string): Promise<Resena> {
    const { datos } = await pedir<Resena>(`/resenas/${encodeURIComponent(resenaId)}/respuesta`, {
      metodo: "POST",
      cuerpo: { respuesta: respuesta.trim() },
    });
    return datos;
  },

  // Sube las reseñas guardadas sin red de este usuario. Devuelve cuántas se subieron.
  async sincronizarPendientes(usuarioId: string): Promise<number> {
    if (sincronizando) return 0;
    sincronizando = true;
    let subidas = 0;
    try {
      const pendientes = await listarPendientes({ usuarioId });
      for (const p of pendientes) {
        try {
          await pedir<Resena>(`/comercios/${encodeURIComponent(p.comercioId)}/resenas`, {
            metodo: "POST",
            cuerpo: { id: p.id, estrellas: p.estrellas, comentario: p.comentario, creadaEn: p.creadaEn },
          });
          await borrarPendiente(p.id);
          subidas++;
        } catch (e) {
          // Sin red, sesión vencida o servidor caído: se reintenta más tarde.
          if (e instanceof ErrorApi && (e.codigo === "SIN_RED" || e.estado === 401 || e.estado >= 500)) break;
          // La API la rechazó (ya había una, comercio inexistente…): reintentar no sirve.
          await borrarPendiente(p.id);
        }
      }
    } finally {
      sincronizando = false;
    }
    if (subidas > 0) oyentes.forEach((o) => o());
    return subidas;
  },
};