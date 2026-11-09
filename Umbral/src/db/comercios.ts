import type { Comercio, Horario, Rubro } from "../tipos";
import { obtenerDb } from "./database";

const CLAVE_ACTUALIZADO = "directorio_actualizado";

interface FilaComercio {
  id: string;
  nombre: string;
  rubro_id: string;
  descripcion: string;
  direccion: string;
  latitud: number;
  longitud: number;
  telefono: string | null;
  whatsapp: string | null;
  instagram: string | null;
  imagenes: string;
  video_url: string | null;
  medios_de_pago: string;
  puntaje: number;
  cantidad_resenas: number;
  codigo_qr: string | null;
  activo: number;
}

interface FilaHorario {
  comercio_id: string;
  dia: Horario["dia"];
  abre: string;
  cierra: string;
}

export interface DirectorioGuardado {
  comercios: Comercio[];
  rubros: Rubro[];
  actualizadoEn: Date;
}

/** Reemplaza el listado guardado por el que acaba de llegar de la API. */
export async function guardarDirectorio(comercios: Comercio[], rubros: Rubro[]) {
  const db = await obtenerDb();
  await db.withExclusiveTransactionAsync(async (tx) => {
    await tx.execAsync("DELETE FROM horarios; DELETE FROM comercios; DELETE FROM rubros;");

    const insComercio = await tx.prepareAsync(
      `INSERT INTO comercios (id, nombre, rubro_id, descripcion, direccion, latitud, longitud,
        telefono, whatsapp, instagram, imagenes, video_url, medios_de_pago, puntaje,
        cantidad_resenas, codigo_qr, activo)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    );
    const insHorario = await tx.prepareAsync(
      "INSERT INTO horarios (comercio_id, dia, abre, cierra) VALUES (?, ?, ?, ?)",
    );
    const insRubro = await tx.prepareAsync(
      "INSERT INTO rubros (id, nombre, icono, color, orden) VALUES (?, ?, ?, ?, ?)",
    );

    try {
      for (const c of comercios) {
        await insComercio.executeAsync([
          c.id,
          c.nombre,
          c.rubroId,
          c.descripcion,
          c.direccion,
          c.coordenadas.latitud,
          c.coordenadas.longitud,
          c.telefono,
          c.whatsapp,
          c.instagram,
          JSON.stringify(c.imagenes),
          c.videoUrl,
          JSON.stringify(c.mediosDePago),
          c.puntaje,
          c.cantidadResenas,
          c.codigoQr,
          c.activo ? 1 : 0,
        ]);
        for (const h of c.horarios) {
          await insHorario.executeAsync([c.id, h.dia, h.abre, h.cierra]);
        }
      }
      for (const r of rubros) {
        await insRubro.executeAsync([r.id, r.nombre, r.icono, r.color, r.orden]);
      }
    } finally {
      await insComercio.finalizeAsync();
      await insHorario.finalizeAsync();
      await insRubro.finalizeAsync();
    }

    await tx.runAsync(
      "INSERT OR REPLACE INTO meta (clave, valor) VALUES (?, ?)",
      CLAVE_ACTUALIZADO,
      new Date().toISOString(),
    );
  });
}

/** Lee el último listado guardado, o null si nunca se guardó. */
export async function leerDirectorio(): Promise<DirectorioGuardado | null> {
  const db = await obtenerDb();
  const meta = await db.getFirstAsync<{ valor: string }>(
    "SELECT valor FROM meta WHERE clave = ?",
    CLAVE_ACTUALIZADO,
  );
  if (!meta) return null;

  const [filas, horarios, rubros] = await Promise.all([
    db.getAllAsync<FilaComercio>("SELECT * FROM comercios ORDER BY nombre"),
    db.getAllAsync<FilaHorario>("SELECT comercio_id, dia, abre, cierra FROM horarios"),
    db.getAllAsync<Rubro>("SELECT id, nombre, icono, color, orden FROM rubros ORDER BY orden"),
  ]);

  const horariosPorComercio = new Map<string, Horario[]>();
  for (const h of horarios) {
    const lista = horariosPorComercio.get(h.comercio_id) ?? [];
    lista.push({ dia: h.dia, abre: h.abre, cierra: h.cierra });
    horariosPorComercio.set(h.comercio_id, lista);
  }

  const comercios: Comercio[] = filas.map((f) => ({
    id: f.id,
    nombre: f.nombre,
    rubroId: f.rubro_id,
    descripcion: f.descripcion,
    direccion: f.direccion,
    coordenadas: { latitud: f.latitud, longitud: f.longitud },
    telefono: f.telefono,
    whatsapp: f.whatsapp,
    instagram: f.instagram,
    imagenes: JSON.parse(f.imagenes),
    videoUrl: f.video_url,
    horarios: horariosPorComercio.get(f.id) ?? [],
    mediosDePago: JSON.parse(f.medios_de_pago),
    puntaje: f.puntaje,
    cantidadResenas: f.cantidad_resenas,
    codigoQr: f.codigo_qr,
    activo: f.activo === 1,
  }));

  return { comercios, rubros, actualizadoEn: new Date(meta.valor) };
}

/** Un comercio guardado (para abrir la ficha sin red). */
export async function leerComercioGuardado(id: string): Promise<Comercio | null> {
  const guardado = await leerDirectorio();
  return guardado?.comercios.find((c) => c.id === id) ?? null;
}
