import type { Promocion, UsoDePromocion } from "../tipos";
import { pedir } from "./cliente";

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
export type ActualizarPromocionInput = Partial<CrearPromocionInput>;

export type EstadoPromo = "vigentes" | "proximas" | "por-vencer";

const MIS_PROMOS = "/mi-comercio/promociones";

// Promociones públicas por estado.
async function obtenerPromociones(estado: EstadoPromo = "vigentes"): Promise<Promocion[]> {
  const { datos } = await pedir<Promocion[]>("/promociones", {
    params: { estado, porPagina: 100 },
  });
  return datos ?? [];
}

// Detalle de una promoción.
async function obtenerPromocionPorId(id: string): Promise<Promocion> {
  const { datos } = await pedir<Promocion>(`/promociones/${encodeURIComponent(id)}`);
  return datos;
}

// Todas las promociones del comercio autenticado.
async function obtenerMisPromociones(pagina = 1, porPagina = 100): Promise<Promocion[]> {
  const { datos } = await pedir<Promocion[]>(MIS_PROMOS, { params: { pagina, porPagina } });
  return datos ?? [];
}

async function crearPromocion(datos: CrearPromocionInput): Promise<Promocion> {
  const r = await pedir<Promocion>(MIS_PROMOS, { metodo: "POST", cuerpo: datos });
  return r.datos;
}

async function actualizarPromocion(id: string, datos: ActualizarPromocionInput): Promise<Promocion> {
  const r = await pedir<Promocion>(`${MIS_PROMOS}/${encodeURIComponent(id)}`, {
    metodo: "PATCH",
    cuerpo: datos,
  });
  return r.datos;
}

// Dar de baja una promoción.
async function eliminarPromocion(id: string): Promise<void> {
  await pedir<void>(`${MIS_PROMOS}/${encodeURIComponent(id)}`, { metodo: "DELETE" });
}

// Códigos de promociones del usuario.
async function obtenerMisUsos(): Promise<UsoDePromocion[]> {
  const { datos } = await pedir<UsoDePromocion[]>("/yo/usos", {
    params: { pagina: 1, porPagina: 100 },
  });
  return datos ?? [];
}

// Pide el código de una promo exclusiva de la app (crea el uso o devuelve el mismo).
async function generarCodigo(promocionId: string): Promise<UsoDePromocion> {
  const { datos } = await pedir<UsoDePromocion>(
    `/promociones/${encodeURIComponent(promocionId)}/usos`,
    { metodo: "POST", cuerpo: {} },
  );
  return datos;
}

// Valida el código QR del cliente en el comercio.
async function validarCodigoQR(codigo: string): Promise<{ success: boolean; mensaje: string }> {
  const { datos } = await pedir<{ mensaje?: string } | undefined>("/mi-comercio/usos/validar", {
    metodo: "POST",
    cuerpo: { codigo },
  });
  return { success: true, mensaje: datos?.mensaje || "Código validado correctamente" };
}

export const promocionesService = {
  obtenerPromociones,
  obtenerPromocionPorId,
  obtenerMisPromociones,
  crearPromocion,
  actualizarPromocion,
  eliminarPromocion,
  obtenerMisUsos,
  generarCodigo,
  validarCodigoQR,
  // Alias por compatibilidad con nombres anteriores.
  obtenerTodas: obtenerPromociones,
  obtenerPorId: obtenerPromocionPorId,
  canjearPromocion: validarCodigoQR,
};