import { useCallback, useEffect, useState } from "react";
import { guardarDirectorio, leerDirectorio } from "../db/comercios";
import { listarComercios, listarRubros } from "../servicios/comercios";
import { promocionesService } from "../servicios/promociones";
import { useRed } from "./useRed";
import type { Comercio, Rubro } from "../tipos";

export interface Directorio {
  comercios: Comercio[];
  rubros: Rubro[];
  rubroPorId: Map<string, Rubro>;
  /** Ids de comercios que tienen al menos una promo vigente. */
  conPromo: Set<string>;
  /** Cuándo se trajo el listado de la API. */
  actualizadoEn: Date;
  /** true si la API no respondió y se muestra la copia guardada en el teléfono. */
  desdeCopiaLocal: boolean;
}

/** A partir de cuántas horas la copia guardada se considera vieja. */
export const HORAS_DATOS_VIEJOS = 24;

export function datosViejos(d: Directorio, ahora = new Date()) {
  return ahora.getTime() - d.actualizadoEn.getTime() > HORAS_DATOS_VIEJOS * 3600_000;
}

// Caché en memoria compartida por Buscar y Mapa: se pide una vez por sesión de la app.
// Cada listado que llega de la API se guarda en SQLite (src/db/); si después no hay
// red, se usa esa copia y la pantalla avisa de cuándo es.
let cache: Directorio | null = null;
let enCurso: Promise<Directorio> | null = null;

function armar(comercios: Comercio[], rubros: Rubro[], promoIds: string[], actualizadoEn: Date, desdeCopiaLocal: boolean): Directorio {
  const ordenados = [...rubros].sort((a, b) => a.orden - b.orden);
  return {
    comercios,
    rubros: ordenados,
    rubroPorId: new Map(ordenados.map((r) => [r.id, r])),
    conPromo: new Set(promoIds),
    actualizadoEn,
    desdeCopiaLocal,
  };
}

async function cargarDirectorio(): Promise<Directorio> {
  try {
    const [rComercios, rubros, promos] = await Promise.all([
      listarComercios({ porPagina: 1000, orden: "nombre" }),
      listarRubros(),
      // Si fallan las promos, el directorio igual se muestra (sin la etiqueta de promo).
      promocionesService.obtenerTodas({ estado: "vigentes" }).catch(() => []),
    ]);
    const comercios = rComercios.datos ?? [];
    guardarDirectorio(comercios, rubros).catch((e) =>
      console.warn("[db] No se pudo guardar el listado", e),
    );
    return armar(comercios, rubros, promos.map((p) => p.comercioId), new Date(), false);
  } catch (errorApi) {
    // Sin red (o la API caída): última copia guardada en el teléfono.
    const guardado = await leerDirectorio().catch(() => null);
    if (!guardado || !guardado.comercios.length) throw errorApi;
    return armar(guardado.comercios, guardado.rubros, [], guardado.actualizadoEn, true);
  }
}

/** Para pantallas que cambian comercios (por ejemplo, editar la ficha). */
export function invalidarDirectorio() {
  cache = null;
}

function obtener(forzar: boolean) {
  if (!forzar && cache) return Promise.resolve(cache);
  if (!enCurso) {
    enCurso = cargarDirectorio()
      .then((d) => (cache = d))
      .finally(() => (enCurso = null));
  }
  return enCurso;
}

export function useDirectorio() {
  const [datos, setDatos] = useState<Directorio | null>(cache);
  const [cargando, setCargando] = useState(!cache);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(async (forzar = false) => {
    setError(null);
    if (!cache || forzar) setCargando(true);
    try {
      setDatos(await obtener(forzar));
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo cargar el directorio.");
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carga inicial desde la API
    cargar();
  }, [cargar]);

  // Cuando vuelve la conexión y se estaba mostrando la copia guardada, se actualiza solo.
  const { conectado } = useRed();
  const usaCopia = datos?.desdeCopiaLocal ?? false;
  useEffect(() => {
    if (conectado && usaCopia) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- recarga al volver la red
      cargar(true);
    }
  }, [conectado, usaCopia, cargar]);

  return { datos, cargando, error, recargar: () => cargar(true) };
}
