import { useCallback, useEffect, useRef, useState } from "react";
import { guardarDirectorio, leerDirectorio } from "../db/comercios";
import { pedir } from "../servicios/cliente";
import { listarComercios, listarRubros } from "../servicios/comercios";
import type { Comercio, Promocion, Rubro } from "../tipos";
import { useRed } from "./useRed";

export interface DatosComercios {
  comercios: Comercio[];
  rubros: Rubro[];
  /** Una promo vigente por comercio (la que vence primero), para mostrar en la tarjeta. Necesita red. */
  promoPorComercio: Record<string, Promocion>;
  cargando: boolean;
  refrescando: boolean;
  error: string | null;
  /** true cuando lo que se ve viene del teléfono (SQLite) porque no se pudo llegar a la API. */
  desactualizado: boolean;
  /** Cuándo se guardó por última vez el directorio (ms), o null si todavía no hay copia. */
  actualizadoEn: number | null;
  recargar: () => Promise<void>;
  reintentar: () => Promise<void>;
}

/**
 * Trae comercios, rubros y promos vigentes de la API (todo en paralelo) y guarda una copia en SQLite.
 * Si no hay red, muestra la última copia guardada y marca los datos como desactualizados.
 * Lo usan Buscar y Mapa.
 */
export function useComercios(): DatosComercios {
  const [comercios, setComercios] = useState<Comercio[]>([]);
  const [rubros, setRubros] = useState<Rubro[]>([]);
  const [promoPorComercio, setPromoPorComercio] = useState<Record<string, Promocion>>({});
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [desactualizado, setDesactualizado] = useState(false);
  const [actualizadoEn, setActualizadoEn] = useState<number | null>(null);
  const montado = useRef(true);
  const enCurso = useRef(false);
  const { conectado } = useRed();

  const cargar = useCallback(async (esRefresco: boolean) => {
    // Si ya hay una carga en marcha (por ejemplo, refresco + reconexión juntos), no se lanza otra.
    if (enCurso.current) return;
    enCurso.current = true;
    if (esRefresco) setRefrescando(true);
    else setCargando(true);
    setError(null);

    try {
      const [lista, listaRubros, promos] = await Promise.all([
        listarComercios({ porPagina: 1000 }),
        listarRubros(),
        // Si fallan las promos igual mostramos los comercios.
        pedir<Promocion[]>("/promociones", { params: { estado: "vigentes", porPagina: 100 } })
          .then((r) => r.datos)
          .catch(() => [] as Promocion[]),
      ]);
      if (!montado.current) return;

      const porComercio: Record<string, Promocion> = {};
      for (const p of promos) {
        // La API las ordena por vencimiento: nos quedamos con la primera de cada comercio.
        if (!porComercio[p.comercioId]) porComercio[p.comercioId] = p;
      }

      const activos = lista.datos.filter((c) => c.activo);
      const rubrosOrdenados = [...listaRubros].sort((a, b) => a.orden - b.orden);

      setComercios(activos);
      setRubros(rubrosOrdenados);
      setPromoPorComercio(porComercio);
      setDesactualizado(false);
      setActualizadoEn(Date.now());

      // La copia para usar sin red se guarda aparte: si falla, la pantalla no se entera.
      guardarDirectorio(activos, rubrosOrdenados).catch((e) => console.warn("[db] No se pudo guardar el directorio:", e));
    } catch (e) {
      if (!montado.current) return;
      // Sin red (o API caída): usamos lo último que guardamos, si hay algo.
      const guardado = await leerDirectorio().catch(() => null);
      if (!montado.current) return;
      if (guardado) {
        setComercios(guardado.comercios);
        setRubros(guardado.rubros);
        setPromoPorComercio({});
        setDesactualizado(true);
        setActualizadoEn(guardado.actualizadoEn);
      } else {
        setError(e instanceof Error ? e.message : "Algo salió mal.");
      }
    } finally {
      enCurso.current = false;
      if (montado.current) {
        setCargando(false);
        setRefrescando(false);
      }
    }
  }, []);

  useEffect(() => {
    montado.current = true;
    cargar(false);
    return () => {
      montado.current = false;
    };
  }, [cargar]);

  // Cuando vuelve la conexión y se estaba mostrando la copia, se actualiza sola.
  useEffect(() => {
    if (conectado && desactualizado) cargar(true);
  }, [conectado]); // eslint-disable-line react-hooks/exhaustive-deps

  const recargar = useCallback(() => cargar(true), [cargar]);
  const reintentar = useCallback(() => cargar(false), [cargar]);

  return {
    comercios,
    rubros,
    promoPorComercio,
    cargando,
    refrescando,
    error,
    desactualizado,
    actualizadoEn,
    recargar,
    reintentar,
  };
}