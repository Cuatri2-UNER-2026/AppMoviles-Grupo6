import { Directory, File, Paths } from "expo-file-system";

// Carpeta local para guardar fotos y videos de las fichas y verlos sin datos.
const ARCHIVOS_DIR = new Directory(Paths.document, "comercios_media");

function asegurarDirectorio() {
  if (!ARCHIVOS_DIR.exists) {
    ARCHIVOS_DIR.create({ intermediates: true, idempotent: true });
  }
}

// Nombre de archivo seguro y estable a partir de la URL remota.
export function nombreLocal(url: string): string {
  const limpia = url.split("?")[0];
  const extension = limpia.match(/\.[a-z0-9]{2,5}$/i)?.[0] ?? "";
  let hash = 0;
  for (let i = 0; i < url.length; i++) hash = (hash * 31 + url.charCodeAt(i)) | 0;
  return `${(hash >>> 0).toString(36)}${extension}`;
}

/**
 * Descarga una foto o video y lo guarda para uso offline.
 * Si ya estaba descargado, devuelve la copia local sin volver a bajarlo.
 */
export async function guardarArchivoLocal(url: string): Promise<string> {
  asegurarDirectorio();
  const destino = new File(ARCHIVOS_DIR, nombreLocal(url));
  if (destino.exists) return destino.uri;

  const descargado = await File.downloadFileAsync(url, destino, { idempotent: true });
  return descargado.uri;
}

/** URI local del archivo si ya fue descargado, o null. */
export function obtenerArchivoLocal(url: string): string | null {
  const archivo = new File(ARCHIVOS_DIR, nombreLocal(url));
  return archivo.exists ? archivo.uri : null;
}

/**
 * Devuelve la mejor URI para mostrar: la local si existe; si no, la remota,
 * y en segundo plano la descarga para la próxima vez.
 */
export function uriParaMostrar(url: string): string {
  const local = obtenerArchivoLocal(url);
  if (local) return local;
  guardarArchivoLocal(url).catch((e) => console.warn("[archivos] No se pudo guardar", url, e));
  return url;
}
