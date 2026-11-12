import { Directory, File, Paths } from "expo-file-system";
import type { Comercio } from "../tipos";

// Carpeta local donde se guardan las fotos y los videos de las fichas para verlos sin datos.
const RAIZ = new Directory(Paths.document, "comercios_media");

const https = (url: string) =>
    url.replace(
        /^http:\/\/(?!localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/,
        "https://",
    );

// Hash corto de la URL: si el comercio cambia una foto, el nombre cambia y se baja de nuevo.
function hash(texto: string) {
    let h = 5381;
    for (let i = 0; i < texto.length; i++)
        h = ((h * 33) ^ texto.charCodeAt(i)) >>> 0;
    return h.toString(36);
}

function nombreDe(url: string, comercioId: string) {
    const ext =
        /\.([a-z0-9]{2,4})(?:[?#]|$)/i.exec(url)?.[1]?.toLowerCase() ?? "bin";
    return `${comercioId}-${hash(url)}.${ext}`;
}

const urlsDe = (c: Comercio) => [
    ...c.imagenes,
    ...(c.videoUrl ? [c.videoUrl] : []),
];

/** URI del archivo guardado en el teléfono, o null si todavía no se bajó. `url` es la que manda la API. */
export function archivoLocal(url: string, comercioId: string): string | null {
    try {
        const archivo = new File(RAIZ, nombreDe(url, comercioId));
        return archivo.exists ? archivo.uri : null;
    } catch {
        return null;
    }
}

/** ¿Ya están todas las fotos y el video de este comercio en el teléfono? */
export function mediosGuardados(c: Comercio): boolean {
    const urls = urlsDe(c);
    return urls.length > 0 && urls.every((u) => archivoLocal(u, c.id) !== null);
}

/** Baja las fotos y el video de la ficha. Devuelve cuántos archivos quedaron guardados y cuántos fallaron. */
export async function guardarMediosComercio(
    c: Comercio,
): Promise<{ guardados: number; fallidos: number }> {
    if (!RAIZ.exists) RAIZ.create();

    let guardados = 0;
    let fallidos = 0;

    await Promise.all(
        urlsDe(c).map(async (url) => {
            const destino = new File(RAIZ, nombreDe(url, c.id));
            if (destino.exists) {
                guardados++;
                return;
            }
            try {
                await File.downloadFileAsync(https(url), destino);
                guardados++;
            } catch {
                fallidos++;
                // Si la descarga quedó a medias, se borra para no mostrar un archivo roto.
                try {
                    if (destino.exists) destino.delete();
                } catch {}
            }
        }),
    );

    // Se borran los archivos viejos de este comercio (fotos que ya no están en la ficha).
    if (fallidos === 0) {
        const vigentes = new Set(urlsDe(c).map((u) => nombreDe(u, c.id)));
        try {
            for (const entrada of RAIZ.list()) {
                if (
                    entrada instanceof File &&
                    entrada.name.startsWith(`${c.id}-`) &&
                    !vigentes.has(entrada.name)
                ) {
                    entrada.delete();
                }
            }
        } catch {}
    }

    return { guardados, fallidos };
}
