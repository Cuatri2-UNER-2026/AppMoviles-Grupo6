import type { Resena } from "../tipos";
import { obtenerYo } from "./auth";
import { pedir } from "./cliente";

export const resenasService = {
  // Reseñas del comercio de la cuenta autenticada.
  async obtenerMisResenas(): Promise<Resena[]> {
    const usuario = await obtenerYo();

    if (usuario.rol !== "comercio" || !usuario.comercioId) {
      throw new Error("No se encontró un comercio asociado a esta cuenta.");
    }

    return this.obtenerDeComercio(usuario.comercioId);
  },

  // Reseñas de un comercio, de la más nueva a la más vieja.
  async obtenerDeComercio(comercioId: string, pagina = 1, porPagina = 100): Promise<Resena[]> {
    const { datos } = await pedir<Resena[]>(
      `/comercios/${encodeURIComponent(comercioId)}/resenas`,
      { params: { pagina, porPagina } },
    );
    return datos ?? [];
  },

  // El comercio responde una reseña (una sola vez).
  async responder(resenaId: string, respuesta: string): Promise<Resena> {
    const { datos } = await pedir<Resena>(
      `/resenas/${encodeURIComponent(resenaId)}/respuesta`,
      { metodo: "POST", cuerpo: { respuesta: respuesta.trim() } },
    );
    return datos;
  },
};
