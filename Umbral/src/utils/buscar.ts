import type { Comercio, Coordenadas, Rubro } from "../tipos";
import { calcularEstado, type EstadoApertura } from "./abiertoAhora";
import { distanciaEnMetros } from "./distancia";

export type Orden = "distancia" | "puntaje" | "nombre";

export interface ComercioListado {
  comercio: Comercio;
  rubro: Rubro | undefined;
  /** Metros hasta la persona; null si no hay ubicación. */
  distancia: number | null;
  estado: EstadoApertura;
}

export interface OpcionesBusqueda {
  comercios: Comercio[];
  rubros: Rubro[];
  texto: string;
  rubroId: string | null;
  soloAbiertos: boolean;
  orden: Orden;
  ubicacion: Coordenadas | null;
  ahora: Date;
}

/** Minúsculas y sin tildes: "Ferretería" coincide con "ferreteria". */
export function normalizar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

/**
 * Búsqueda por nombre o por lo que venden (descripción y nombre del rubro),
 * filtro por rubro, filtro "abierto ahora" y orden.
 */
export function buscarComercios(op: OpcionesBusqueda): ComercioListado[] {
  const rubroPorId = new Map(op.rubros.map((r) => [r.id, r]));
  const palabras = normalizar(op.texto).split(/\s+/).filter(Boolean);

  const filas: ComercioListado[] = [];
  for (const comercio of op.comercios) {
    if (op.rubroId && comercio.rubroId !== op.rubroId) continue;

    const rubro = rubroPorId.get(comercio.rubroId);
    if (palabras.length > 0) {
      const pajar = normalizar(`${comercio.nombre} ${comercio.descripcion} ${rubro?.nombre ?? ""}`);
      if (!palabras.every((p) => pajar.includes(p))) continue;
    }

    const estado = calcularEstado(comercio.horarios, op.ahora);
    if (op.soloAbiertos && !estado.abierto) continue;

    const distancia = op.ubicacion ? distanciaEnMetros(op.ubicacion, comercio.coordenadas) : null;
    filas.push({ comercio, rubro, distancia, estado });
  }

  // Sin ubicación no se puede ordenar por distancia: caemos a nombre.
  const orden: Orden = op.orden === "distancia" && !op.ubicacion ? "nombre" : op.orden;
  filas.sort((a, b) => {
    if (orden === "distancia") return (a.distancia ?? Infinity) - (b.distancia ?? Infinity);
    if (orden === "puntaje") return b.comercio.puntaje - a.comercio.puntaje;
    return a.comercio.nombre.localeCompare(b.comercio.nombre, "es");
  });
  return filas;
}