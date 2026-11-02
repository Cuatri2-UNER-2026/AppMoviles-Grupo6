
import { obtenerToken } from "../almacenamiento/seguro";
import type { Promocion, UsoDePromocion } from "../tipos";

const API_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  "https://api-directorio-comercios.onrender.com";

export type { Promocion };

function mapearPromocion(apiPromo: any): Promocion {
  return {
    id: apiPromo.id,
    comercioId: apiPromo.comercioId,
    titulo: apiPromo.titulo,
    detalle: apiPromo.detalle,
    descuento: apiPromo.descuento,
    desde: apiPromo.desde,
    hasta: apiPromo.hasta,
    imagenUrl: apiPromo.imagenUrl,
    soloApp: apiPromo.soloApp,
    usos: apiPromo.usos,
    activa: apiPromo.activa,
  };
}

export const promocionesService = {
  async obtenerTodas(
    estado: "vigentes" | "proximas" | "por-vencer" = "vigentes"
  ): Promise<Promocion[]> {
    const token = await obtenerToken();

    const url = `${API_URL}/promociones?estado=${estado}`;

    console.log("GET", url);

    const res = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    const json = await res.json().catch(() => null);

    console.log("Estado:", res.status);
    console.log("Respuesta:", json);

    if (!res.ok) {
      throw new Error(json?.error?.mensaje || "Error al obtener promociones");
    }

    return (json?.datos ?? []).map(mapearPromocion);
  },

  async obtenerPorId(id: string): Promise<Promocion> {
    const token = await obtenerToken();

    const url = `${API_URL}/promociones/${id}`;

    console.log("GET", url);

    const res = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    const json = await res.json().catch(() => null);

    console.log("Estado:", res.status);
    console.log("Respuesta:", json);

    if (!res.ok) {
      throw new Error(json?.error?.mensaje || "Error al obtener la promoción");
    }

    return mapearPromocion(json.datos);
  },

  // Obtener los códigos de promociones del usuario que inició sesión
  async obtenerMisUsos(): Promise<UsoDePromocion[]> {
    const token = await obtenerToken();

    const url = `${API_URL}/yo/usos?pagina=1&porPagina=100`;

    console.log("GET", url);

    const res = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    const json = await res.json().catch(() => null);

    console.log("Estado de mis códigos:", res.status);
    console.log("Respuesta de mis códigos:", json);

    if (!res.ok) {
      throw new Error(
        json?.error?.mensaje || "Error al obtener los códigos de promociones"
      );
    }

    return json?.datos ?? [];
  },

  async canjearPromocion(
    codigo: string
  ): Promise<{ success: boolean; mensaje: string }> {
    const token = await obtenerToken();

    const url = `${API_URL}/mi-comercio/usos/validar`;

    console.log("POST", url);

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ codigo }),
    });

    const json = await res.json().catch(() => null);

    console.log("Estado:", res.status);
    console.log("Respuesta:", json);

    if (!res.ok) {
      throw new Error(json?.error?.mensaje || "Error al validar el código");
    }

    return {
      success: true,
      mensaje: json?.datos?.mensaje || "Código validado correctamente",
    };
  },

  async eliminarPromocion(id: string): Promise<void> {
    const token = await obtenerToken();

    const url = `${API_URL}/mi-comercio/promociones/${id}`;

    const res = await fetch(url, {
      method: "DELETE",
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    if (!res.ok) {
      const json = await res.json().catch(() => null);
      throw new Error(
        json?.error?.mensaje || "No se pudo eliminar la promoción"
      );
    }
  },

  async obtenerPromociones(
    estado?: "vigentes" | "proximas" | "por-vencer"
  ) {
    return this.obtenerTodas(estado);
  },

  async obtenerPromocionPorId(id: string) {
    return this.obtenerPorId(id);
  },

  async validarCodigoQR(codigo: string) {
    return this.canjearPromocion(codigo);
  },
};
