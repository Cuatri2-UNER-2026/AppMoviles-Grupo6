
import { obtenerToken } from "../almacenamiento/seguro";
import { obtenerYo } from "./auth";
import type { Resena } from "../tipos";

const API_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  "https://api-directorio-comercios.onrender.com";

export const resenasService = {
  // Obtener las reseñas del comercio autenticado.
  async obtenerMisResenas(): Promise<Resena[]> {
    const usuario = await obtenerYo();

    if (usuario.rol !== "comercio" || !usuario.comercioId) {
      throw new Error("No se encontró un comercio asociado a esta cuenta.");
    }

    return this.obtenerDeComercio(usuario.comercioId);
  },

  // Obtener las reseñas de un comercio.
  async obtenerDeComercio(
    comercioId: string,
    pagina: number = 1,
    porPagina: number = 20
  ): Promise<Resena[]> {
    const token = await obtenerToken();

    const url =
      `${API_URL}/comercios/${encodeURIComponent(comercioId)}/resenas?pagina=${pagina}&porPagina=${porPagina}`;

    const res = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    const json = await res.json().catch(() => null);

    if (!res.ok) {
      throw new Error(
        json?.error?.mensaje || "Error al obtener las reseñas"
      );
    }

    return json?.datos ?? [];
  },

  // Responder una reseña como comercio.
  async responder(
    resenaId: string,
    respuesta: string
  ): Promise<Resena> {
    const token = await obtenerToken();

    const res = await fetch(
      `${API_URL}/resenas/${encodeURIComponent(resenaId)}/respuesta`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          respuesta: respuesta.trim(),
        }),
      }
    );

    const json = await res.json().catch(() => null);

    if (!res.ok) {
      throw new Error(
        json?.error?.mensaje || "No se pudo responder la reseña"
      );
    }

    return json.datos;
  },
};

