import type { Promocion, UsoDePromocion } from "../tipos";
import { pedir } from "./cliente";

export type { Promocion };

export type EstadoPromos = "vigentes" | "proximas" | "por-vencer";

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
export type ActualizarPromocionInput = Partial<CrearPromocionInput>;

export interface FiltrosPromociones {
  estado?: EstadoPromos;
  rubroId?: string;
  comercioId?: string;
}

// Todas las llamadas pasan por pedir(): token, errores de la API y "sin red"
// quedan manejados igual que en el resto de la app.
export const promocionesService = {
  // Promociones públicas. La API sólo devuelve vigentes, próximas o por vencer:
  // las vencidas nunca aparecen.
  async obtenerTodas(filtros: FiltrosPromociones = {}): Promise<Promocion[]> {
    const { datos } = await pedir<Promocion[]>("/promociones", {
      params: { estado: "vigentes", porPagina: 100, ...filtros },
    });
    return datos ?? [];
  },

  // Todas las promociones del comercio autenticado (incluye vencidas y dadas de baja).
  async obtenerMisPromociones(pagina = 1, porPagina = 100): Promise<Promocion[]> {
    const { datos } = await pedir<Promocion[]>("/mi-comercio/promociones", {
      params: { pagina, porPagina },
    });
    return datos ?? [];
  },

  async obtenerPorId(id: string): Promise<Promocion> {
    const { datos } = await pedir<Promocion>(`/promociones/${encodeURIComponent(id)}`);
    return datos;
  },

  async crearPromocion(datos: CrearPromocionInput): Promise<Promocion> {
    const r = await pedir<Promocion>("/mi-comercio/promociones", {
      metodo: "POST",
      cuerpo: datos,
    });
    return r.datos;
  },

  async actualizarPromocion(id: string, datos: ActualizarPromocionInput): Promise<Promocion> {
    const r = await pedir<Promocion>(`/mi-comercio/promociones/${encodeURIComponent(id)}`, {
      metodo: "PATCH",
      cuerpo: datos,
    });
    return r.datos;
  },

  async eliminarPromocion(id: string): Promise<void> {
    await pedir<void>(`/mi-comercio/promociones/${encodeURIComponent(id)}`, {
      metodo: "DELETE",
    });
  },

  // Códigos de promociones del vecino.
  async obtenerMisUsos(): Promise<UsoDePromocion[]> {
    const { datos } = await pedir<UsoDePromocion[]>("/yo/usos", {
      params: { pagina: 1, porPagina: 100 },
    });
    return datos ?? [];
  },

  // El vecino genera su código para una promo "solo app".
  // Si ya tenía uno sin validar, la API devuelve el mismo.
  async generarCodigo(promocionId: string): Promise<UsoDePromocion> {
    const { datos } = await pedir<UsoDePromocion>(
      `/promociones/${encodeURIComponent(promocionId)}/usos`,
      { metodo: "POST" },
    );
    return datos;
  },

  // El comercio valida el código QR del cliente.
  async canjearPromocion(codigo: string): Promise<UsoDePromocion> {
    const { datos } = await pedir<UsoDePromocion>("/mi-comercio/usos/validar", {
      metodo: "POST",
      cuerpo: { codigo },
    });
    return datos;
  },

  // Nombres que ya usan las pantallas.
  obtenerPromociones(estado?: EstadoPromos, rubroId?: string) {
    return this.obtenerTodas({ estado, rubroId });
  },
  obtenerPromocionPorId(id: string) {
    return this.obtenerPorId(id);
  },
  validarCodigoQR(codigo: string) {
    return this.canjearPromocion(codigo);
  },
};
