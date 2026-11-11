import { obtenerToken } from "../almacenamiento/seguro";
import type { Promocion, UsoDePromocion } from "../tipos";

const API_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  "https://api-directorio-comercios.onrender.com";

export type { Promocion };

// Datos necesarios para crear una promoción.
export interface CrearPromocionInput {
    titulo: string;
    detalle: string;
    descuento?: number | null;
    desde?: string;
    hasta: string;
    imagenUrl?: string | null;
    soloApp?: boolean;
}

// Datos que se pueden modificar en una promoción.
export type ActualizarPromocionInput =
    Partial<CrearPromocionInput>;

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
    // Obtener promociones públicas por categoría.
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
        throw new Error(
            json?.error?.mensaje || "Error al obtener promociones"
        );
        }

        return (json?.datos ?? []).map(mapearPromocion);
    },

    // Obtener todas las promociones del comercio autenticado.
    async obtenerMisPromociones(
        pagina: number = 1,
        porPagina: number = 100
    ): Promise<Promocion[]> {
        const token = await obtenerToken();

        const url =
        `${API_URL}/mi-comercio/promociones?pagina=${pagina}&porPagina=${porPagina}`;

        console.log("GET", url);

        const res = await fetch(url, {
        headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        });

        const json = await res.json().catch(() => null);

        console.log("Estado de mis promociones:", res.status);
        console.log("Respuesta de mis promociones:", json);

        if (!res.ok) {
        throw new Error(
            json?.error?.mensaje ||
            "Error al obtener las promociones del comercio"
        );
        }

        return (json?.datos ?? []).map(mapearPromocion);
    },

    // Obtener el detalle de una promoción.
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
        throw new Error(
            json?.error?.mensaje || "Error al obtener la promoción"
        );
        }

        return mapearPromocion(json.datos);
    },

    // Crear una promoción del comercio.
    async crearPromocion(
        datos: CrearPromocionInput
    ): Promise<Promocion> {
        const token = await obtenerToken();
        const url = `${API_URL}/mi-comercio/promociones`;

        const res = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(datos),
        });

        const json = await res.json().catch(() => null);

        console.log("Estado al crear promoción:", res.status);
        console.log("Respuesta:", json);

        if (!res.ok) {
        throw new Error(
            json?.error?.mensaje || "No se pudo crear la promoción"
        );
        }

        return mapearPromocion(json.datos);
    },

    // Actualizar una promoción propia.
    async actualizarPromocion(
        id: string,
        datos: ActualizarPromocionInput
    ): Promise<Promocion> {
        const token = await obtenerToken();
        const url = `${API_URL}/mi-comercio/promociones/${encodeURIComponent(id)}`;

        const res = await fetch(url, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(datos),
        });

        const json = await res.json().catch(() => null);

        console.log("Estado al actualizar promoción:", res.status);
        console.log("Respuesta:", json);

        if (!res.ok) {
        throw new Error(
            json?.error?.mensaje || "No se pudo actualizar la promoción"
        );
        }

        return mapearPromocion(json.datos);
    },

    // Obtener los códigos de promociones del usuario.
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
            json?.error?.mensaje ||
            "Error al obtener los códigos de promociones"
        );
        }

        return json?.datos ?? [];
    },

    // Pedir mi código de una promoción exclusiva de la app (crea el uso o devuelve el mismo).
    async generarCodigo(promocionId: string): Promise<UsoDePromocion> {
        const token = await obtenerToken();
        const url = `${API_URL}/promociones/${encodeURIComponent(promocionId)}/usos`;

        const res = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({}),
        });

        const json = await res.json().catch(() => null);

        if (!res.ok) {
        throw new Error(json?.error?.mensaje || "No se pudo generar el código");
        }

        return json.datos as UsoDePromocion;
    },

    // Validar un código QR en el comercio.
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
        throw new Error(
            json?.error?.mensaje || "Error al validar el código"
        );
        }

        return {
        success: true,
        mensaje: json?.datos?.mensaje || "Código validado correctamente",
        };
    },

    // Dar de baja una promoción.
    async eliminarPromocion(id: string): Promise<void> {
        const token = await obtenerToken();
        const url = `${API_URL}/mi-comercio/promociones/${encodeURIComponent(id)}`;

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

    // Mantener compatibilidad con las pantallas existentes.
    async obtenerPromociones(
        estado?: "vigentes" | "proximas" | "por-vencer"
    ): Promise<Promocion[]> {
        return this.obtenerTodas(estado);
    },

    async obtenerPromocionPorId(id: string): Promise<Promocion> {
        return this.obtenerPorId(id);
    },

    async validarCodigoQR(codigo: string) {
        return this.canjearPromocion(codigo);
    },
};
