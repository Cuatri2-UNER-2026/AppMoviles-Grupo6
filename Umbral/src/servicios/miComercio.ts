import { File } from "expo-file-system";
import { fetch as fetchExpo } from "expo/fetch";
import { obtenerToken } from "../almacenamiento/seguro";
import type { Comercio, Horario } from "../tipos";
import { ErrorApi, pedir } from "./cliente";

/** La API suma `cerradoHasta` en la ficha propia (cierre por vacaciones). */
export type ComercioPropio = Comercio & { cerradoHasta?: string | null };

/** Solo se manda lo que cambió. Horarios, imágenes y medios de pago se reemplazan enteros. */
export interface CambiosComercio {
  descripcion?: string;
  telefono?: string | null;
  whatsapp?: string | null;
  instagram?: string | null;
  horarios?: Horario[];
  imagenes?: string[];
  videoUrl?: string | null;
  mediosDePago?: string[];
  cerradoHasta?: string | null;
}

export const obtenerMiComercio = async (): Promise<ComercioPropio> =>
  (await pedir<ComercioPropio>("/mi-comercio")).datos;

export const actualizarMiComercio = async (cambios: CambiosComercio): Promise<ComercioPropio> =>
  (await pedir<ComercioPropio>("/mi-comercio", { metodo: "PATCH", cuerpo: cambios })).datos;

export interface ArchivoParaSubir {
  uri: string;
  nombre: string;
  tipo: string;
}

/**
 * Sube una foto o un video con POST /archivos (multipart, campo "archivo") y devuelve la url.
 * Esa url es la que después se manda en `imagenes` o `videoUrl`.
 */
export async function subirArchivo(archivo: ArchivoParaSubir): Promise<string> {
  const BASE = process.env.EXPO_PUBLIC_API_URL;
  if (!BASE) throw new ErrorApi("SIN_CONFIGURAR", "Falta EXPO_PUBLIC_API_URL en el .env", 0);

  const token = await obtenerToken();
  const form = new FormData();
  // El File de expo-file-system se comporta como un Blob: expo/fetch lo sube como archivo.
  // El tipo se deduce de la extensión (.jpg, .png, .mp4), que el selector ya deja bien puesta.
  form.append("archivo", new File(archivo.uri));

  let res: Response;
  try {
    // Sin Content-Type: fetch lo arma solo, con el boundary del multipart.
    res = (await fetchExpo(`${BASE}/archivos`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: form,
    })) as unknown as Response;
  } catch (e) {
    console.warn("[subirArchivo] falló el pedido:", archivo.uri, e);
    throw new ErrorApi("SIN_RED", "No pudimos subir el archivo. Revisá tu conexión e intentá de nuevo.", 0);
  }

  const json = await res.json().catch(() => null);
  if (!res.ok || json?.error) {
    throw new ErrorApi(
      json?.error?.codigo ?? "ERROR",
      json?.error?.mensaje ?? "No pudimos subir el archivo.",
      res.status,
    );
  }
  const url = json?.datos?.url ?? json?.url;
  if (typeof url !== "string") throw new ErrorApi("ERROR", "La API no devolvió la dirección del archivo.", res.status);
  return url;
}