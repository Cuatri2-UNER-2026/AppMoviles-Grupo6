import { obtenerToken } from "../almacenamiento/seguro";
import type { Comercio, Horario } from "../tipos";
import { ErrorApi, pedir } from "./cliente";

const BASE = process.env.EXPO_PUBLIC_API_URL;

/** Catálogo fijo de medios de pago de la API (decisión D11). */
export const MEDIOS_DE_PAGO = [
  { id: "efectivo", nombre: "Efectivo" },
  { id: "debito", nombre: "Débito" },
  { id: "credito", nombre: "Crédito" },
  { id: "transferencia", nombre: "Transferencia" },
  { id: "billetera_virtual", nombre: "Billetera virtual" },
] as const;

export const nombreMedioDePago = (id: string) =>
  MEDIOS_DE_PAGO.find((m) => m.id === id)?.nombre ?? id;

/** Límites de la API para /archivos y para la ficha. */
export const LIMITES = {
  imagenBytes: 5 * 1024 * 1024,
  videoBytes: 30 * 1024 * 1024,
  maxImagenes: 8,
};

export type CambiosFicha = Partial<
  Pick<
    Comercio,
    | "nombre"
    | "descripcion"
    | "direccion"
    | "telefono"
    | "whatsapp"
    | "instagram"
    | "imagenes"
    | "videoUrl"
    | "mediosDePago"
  > & { horarios: Horario[] }
>;

export const obtenerMiComercio = async () => (await pedir<Comercio>("/mi-comercio")).datos;

export const actualizarMiComercio = async (cambios: CambiosFicha) =>
  (await pedir<Comercio>("/mi-comercio", { metodo: "PATCH", cuerpo: cambios })).datos;

export interface ArchivoSubido {
  url: string;
  tipo: "imagen" | "audio" | "video";
  bytes: number;
}

/**
 * Sube una foto o un video (multipart/form-data, campo "archivo") y devuelve
 * la URL que después se guarda en la ficha. No usa pedir() porque el cuerpo
 * no es JSON.
 */
export async function subirArchivo(uri: string, nombre: string, mime: string): Promise<ArchivoSubido> {
  if (!BASE) throw new ErrorApi("SIN_CONFIGURAR", "Falta EXPO_PUBLIC_API_URL en el .env", 0);

  const form = new FormData();
  // React Native acepta { uri, name, type } como archivo dentro de FormData.
  form.append("archivo", { uri, name: nombre, type: mime } as unknown as Blob);

  const token = await obtenerToken();
  let res: Response;
  try {
    res = await fetch(`${BASE}/archivos`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      body: form,
    });
  } catch {
    throw new ErrorApi("SIN_RED", "No pudimos subir el archivo. Revisá tu conexión.", 0);
  }

  const json = await res.json().catch(() => null);
  if (!res.ok || json?.error) {
    throw new ErrorApi(
      json?.error?.codigo ?? "ERROR",
      json?.error?.mensaje ?? "No se pudo subir el archivo.",
      res.status,
    );
  }
  return json.datos as ArchivoSubido;
}
