import { useCallback, useEffect, useRef, useState } from "react";
import { pedir } from "../servicios/cliente";
import { listarComercios, listarRubros } from "../servicios/comercios";
import type { Comercio, Promocion, Rubro } from "../tipos";

export interface DatosComercios {
  comercios: Comercio[];
  rubros: Rubro[];
  /** Una promo vigente por comercio (la que vence primero), para mostrar en la tarjeta. */
  promoPorComercio: Record<string, Promocion>;
  cargando: boolean;
  refrescando: boolean;
  error: string | null;
  recargar: () => Promise<void>;
  reintentar: () => Promise<void>;
}

/**
 * Trae comercios, rubros y promos vigentes de la API (todo en paralelo).
 * Lo usan Buscar y Mapa. La Parte 5 le puede sumar la lectura desde SQLite sin tocar las pantallas.
 */
export function useComercios(): DatosComercios {
  const [comercios, setComercios] = useState<Comercio[]>([]);
  const [rubros, setRubros] = useState<Rubro[]>([]);
  const [promoPorComercio, setPromoPorComercio] = useState<Record<string, Promocion>>({});
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const montado = useRef(true);

  const cargar = useCallback(async (esRefresco: boolean) => {
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

      setComercios(lista.datos.filter((c) => c.activo));
      setRubros([...listaRubros].sort((a, b) => a.orden - b.orden));
      setPromoPorComercio(porComercio);
    } catch (e) {
      if (!montado.current) return;
      setError(e instanceof Error ? e.message : "Algo salió mal.");
    } finally {
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

  const recargar = useCallback(() => cargar(true), [cargar]);
  const reintentar = useCallback(() => cargar(false), [cargar]);

  return { comercios, rubros, promoPorComercio, cargando, refrescando, error, recargar, reintentar };
}