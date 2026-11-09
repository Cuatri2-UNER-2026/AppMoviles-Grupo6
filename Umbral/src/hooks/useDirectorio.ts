import { useCallback, useEffect, useState } from "react";
import { listarComercios, listarRubros } from "../servicios/comercios";
import { promocionesService } from "../servicios/promociones";
import type { Comercio, Rubro } from "../tipos";

export interface Directorio {
  comercios: Comercio[];
  rubros: Rubro[];
  rubroPorId: Map<string, Rubro>;
  /** Ids de comercios que tienen al menos una promo vigente. */
  conPromo: Set<string>;
}

// Caché en memoria compartida por Buscar y Mapa: se pide una vez por sesión de la app.
// (El guardado en SQLite para usar sin red es parte de src/db/, Parte 5.)
let cache: Directorio | null = null;
let enCurso: Promise<Directorio> | null = null;

async function cargarDirectorio(): Promise<Directorio> {
  const [rComercios, rubros, promos] = await Promise.all([
    listarComercios({ porPagina: 1000, orden: "nombre" }),
    listarRubros(),
    // Si fallan las promos, el directorio igual se muestra (sin la etiqueta de promo).
    promocionesService.obtenerTodas({ estado: "vigentes" }).catch(() => []),
  ]);
  const ordenados = [...rubros].sort((a, b) => a.orden - b.orden);
  return {
    comercios: rComercios.datos ?? [],
    rubros: ordenados,
    rubroPorId: new Map(ordenados.map((r) => [r.id, r])),
    conPromo: new Set(promos.map((p) => p.comercioId)),
  };
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

  return { datos, cargando, error, recargar: () => cargar(true) };
}
