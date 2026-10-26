import type { Comercio, Rubro } from "../tipos";
import { pedir } from "./cliente";

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
  (await pedir<Comercio>(`/comercios/${id}`)).datos;