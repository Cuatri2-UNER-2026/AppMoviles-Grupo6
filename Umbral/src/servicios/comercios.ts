import type { Comercio, Rubro } from "../tipos";
import { leerComercioGuardado } from "../db/comercios";
import { ErrorApi, pedir } from "./cliente";

export interface FiltrosComercios {
  q?: string;
  rubroId?: string;
  latitud?: number;
  longitud?: number;
  radioMetros?: number;
  orden?: "nombre" | "distancia" | "puntaje";
  pagina?: number;
  porPagina?: number;
}

export const listarRubros = async () => (await pedir<Rubro[]>("/rubros")).datos;

export const listarComercios = (filtros: FiltrosComercios = {}) =>
  pedir<Comercio[]>("/comercios", { params: { ...filtros } });

export const obtenerComercio = async (id: string) =>
  (await pedir<Comercio>(`/comercios/${encodeURIComponent(id)}`)).datos;

/** Como obtenerComercio, pero sin red usa la copia guardada en el teléfono. */
export async function obtenerComercioConRespaldo(
  id: string,
): Promise<{ comercio: Comercio; desdeCopiaLocal: boolean }> {
  try {
    return { comercio: await obtenerComercio(id), desdeCopiaLocal: false };
  } catch (e) {
    if (e instanceof ErrorApi && e.codigo === "SIN_RED") {
      const guardado = await leerComercioGuardado(id).catch(() => null);
      if (guardado) return { comercio: guardado, desdeCopiaLocal: true };
    }
    throw e;
  }
}