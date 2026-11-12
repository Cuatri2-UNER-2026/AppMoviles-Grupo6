import { leerComercio, leerRubros } from "../db/comercios";
import type { Comercio, Rubro } from "../tipos";
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

const sinRed = (e: unknown) =>
    e instanceof ErrorApi && (e.codigo === "SIN_RED" || e.estado >= 500);

// Sin red, los rubros y las fichas salen de la copia guardada en SQLite (si existe).
export const listarRubros = async (): Promise<Rubro[]> => {
    try {
        return (await pedir<Rubro[]>("/rubros")).datos;
    } catch (e) {
        if (sinRed(e)) {
            const guardados = await leerRubros().catch(() => [] as Rubro[]);
            if (guardados.length > 0) return guardados;
        }
        throw e;
    }
};

export const listarComercios = (filtros: FiltrosComercios = {}) =>
    pedir<Comercio[]>("/comercios", { params: { ...filtros } });

export const obtenerComercio = async (id: string): Promise<Comercio> => {
    try {
        return (await pedir<Comercio>(`/comercios/${id}`)).datos;
    } catch (e) {
        if (sinRed(e)) {
            const guardado = await leerComercio(id).catch(() => null);
            if (guardado) return guardado;
        }
        throw e;
    }
};
