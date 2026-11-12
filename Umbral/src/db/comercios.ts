import type { Comercio, Horario, Rubro } from "../tipos";
import { abrirBase } from "./index";

const CLAVE_FECHA = "directorio_actualizado_en";

export interface DirectorioGuardado {
  comercios: Comercio[];
  rubros: Rubro[];
  /** Cuándo se guardó por última vez (ms desde 1970). */
  actualizadoEn: number | null;
}

async function escribirDirectorio(comercios: Comercio[], rubros: Rubro[]) {
  const db = await abrirBase();
  await db.withTransactionAsync(async () => {
    await db.runAsync("DELETE FROM horarios");
    await db.runAsync("DELETE FROM comercios");
    await db.runAsync("DELETE FROM rubros");

    for (const r of rubros) {
      await db.runAsync("INSERT INTO rubros (id, orden, datos) VALUES (?, ?, ?)", [r.id, r.orden, JSON.stringify(r)]);
    }
    for (const c of comercios) {
      // Los horarios van en su propia tabla; el resto de la ficha, como JSON.
      const { horarios, ...resto } = c;
      await db.runAsync("INSERT INTO comercios (id, rubro_id, nombre, datos) VALUES (?, ?, ?, ?)", [
        c.id,
        c.rubroId,
        c.nombre,
        JSON.stringify(resto),
      ]);
      for (const h of horarios) {
        await db.runAsync("INSERT INTO horarios (comercio_id, dia, abre, cierra) VALUES (?, ?, ?, ?)", [
          c.id,
          h.dia,
          h.abre,
          h.cierra,
        ]);
      }
    }
    await db.runAsync("INSERT OR REPLACE INTO meta (clave, valor) VALUES (?, ?)", [CLAVE_FECHA, String(Date.now())]);
  });
}

// Los guardados se hacen de a uno: SQLite no admite dos transacciones a la vez en la misma conexión.
let cola: Promise<void> = Promise.resolve();

/** Reemplaza el directorio guardado por el que acaba de llegar de la API. */
export function guardarDirectorio(comercios: Comercio[], rubros: Rubro[]): Promise<void> {
  const trabajo = cola.then(() => escribirDirectorio(comercios, rubros));
  cola = trabajo.catch(() => {});
  return trabajo;
}

/** Lee el directorio guardado. Devuelve null si todavía no se guardó nada. */
export async function leerDirectorio(): Promise<DirectorioGuardado | null> {
  const db = await abrirBase();
  const filas = await db.getAllAsync<{ datos: string }>("SELECT datos FROM comercios ORDER BY nombre");
  if (filas.length === 0) return null;

  const filasHorarios = await db.getAllAsync<{ comercio_id: string; dia: number; abre: string; cierra: string }>(
    "SELECT comercio_id, dia, abre, cierra FROM horarios ORDER BY comercio_id, dia, abre",
  );
  const porComercio = new Map<string, Horario[]>();
  for (const h of filasHorarios) {
    const lista = porComercio.get(h.comercio_id) ?? [];
    lista.push({ dia: h.dia as Horario["dia"], abre: h.abre, cierra: h.cierra });
    porComercio.set(h.comercio_id, lista);
  }

  const comercios = filas.map((f) => {
    const c = JSON.parse(f.datos) as Omit<Comercio, "horarios">;
    return { ...c, horarios: porComercio.get(c.id) ?? [] } as Comercio;
  });

  const filasRubros = await db.getAllAsync<{ datos: string }>("SELECT datos FROM rubros ORDER BY orden");
  const rubros = filasRubros.map((f) => JSON.parse(f.datos) as Rubro);

  const fecha = await db.getFirstAsync<{ valor: string }>("SELECT valor FROM meta WHERE clave = ?", [CLAVE_FECHA]);
  return { comercios, rubros, actualizadoEn: fecha ? Number(fecha.valor) : null };
}

/** Una ficha guardada (con sus horarios), para abrirla sin conexión. */
export async function leerComercio(id: string): Promise<Comercio | null> {
  const db = await abrirBase();
  const fila = await db.getFirstAsync<{ datos: string }>("SELECT datos FROM comercios WHERE id = ?", [id]);
  if (!fila) return null;
  const horarios = await db.getAllAsync<{ dia: number; abre: string; cierra: string }>(
    "SELECT dia, abre, cierra FROM horarios WHERE comercio_id = ? ORDER BY dia, abre",
    [id],
  );
  return {
    ...(JSON.parse(fila.datos) as Omit<Comercio, "horarios">),
    horarios: horarios.map((h) => ({ dia: h.dia as Horario["dia"], abre: h.abre, cierra: h.cierra })),
  } as Comercio;
}

/** Los rubros guardados, ordenados. */
export async function leerRubros(): Promise<Rubro[]> {
  const db = await abrirBase();
  const filas = await db.getAllAsync<{ datos: string }>("SELECT datos FROM rubros ORDER BY orden");
  return filas.map((f) => JSON.parse(f.datos) as Rubro);
}