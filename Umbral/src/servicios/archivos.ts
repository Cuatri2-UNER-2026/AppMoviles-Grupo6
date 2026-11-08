import { File, Directory, Paths } from 'expo-file-system/next';

// Carpeta local para almacenar descargas offline de fichas
const ARCHIVOS_DIR = new Directory(Paths.document, 'comercios_media');

/**
 * Asegura que el directorio local de archivos exista.
 */
export async function inicializarDirectorioArchivos(): Promise<void> {
  if (!ARCHIVOS_DIR.exists) {
    ARCHIVOS_DIR.create();
  }
}

/**
 * Descarga una foto o video y lo guarda en el sistema de archivos local para uso offline.
 * @param urlRemote URL remota de la imagen o video
 * @param nombreArchivo Nombre único con el que se guardará localmente
 * @returns La URI del archivo guardado localmente
 */
export async function guardarArchivoLocal(urlRemote: string, nombreArchivo: string): Promise<string> {
  await inicializarDirectorioArchivos();
  const destino = new File(ARCHIVOS_DIR, nombreArchivo);

  if (destino.exists) {
    return destino.uri;
  }

  // Descarga e instala la versión local
  const downloadedFile = await File.downloadFileAsync(urlRemote, destino);
  return downloadedFile.uri;
}

/**
 * Obtiene la URI local de un archivo si ya fue descargado previamente.
 * @param nombreArchivo Nombre del archivo buscado
 * @returns URI del archivo o null si no existe localmente
 */
export function obtenerArchivoLocal(nombreArchivo: string): string | null {
  const archivo = new File(ARCHIVOS_DIR, nombreArchivo);
  return archivo.exists ? archivo.uri : null;
}