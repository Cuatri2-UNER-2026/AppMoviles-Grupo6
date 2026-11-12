import { useEffect, useRef } from "react";
import { listarPendientes } from "../db/resenasPendientes";
import { ErrorApi } from "../servicios/cliente";
import { escucharSincronizacion, resenasService } from "../servicios/resenas";
import type { Resena } from "../tipos";
import { useCarga } from "./useCarga";
import { useSesion } from "./useSesion";

export function useResenas(comercioId: string) {
    const sesion = useSesion();
    const usuarioId = sesion.estado === "activa" ? sesion.usuario.id : null;

    const { datos, cargando, refrescando, error, reintentar, refrescar } =
        useCarga(async () => {
            let servidor: Resena[] = [];
            let sinRed = false;
            try {
                servidor = await resenasService.obtenerDeComercio(
                    comercioId,
                    1,
                    100,
                );
            } catch (e) {
                if (e instanceof ErrorApi && e.codigo === "SIN_RED")
                    sinRed = true;
                else throw e;
            }
            const pendientes = usuarioId
                ? await listarPendientes({ comercioId, usuarioId })
                : [];
            const ids = new Set(servidor.map((r) => r.id));
            const lista = [
                ...pendientes.filter((p) => !ids.has(p.id)),
                ...servidor,
            ].sort((a, b) => Date.parse(b.creadaEn) - Date.parse(a.creadaEn));
            return { lista, sinRed };
        }, [comercioId, usuarioId]);

    // Cuando se suben reseñas pendientes, se vuelve a cargar.
    const recargar = useRef(refrescar);
    recargar.current = refrescar;
    useEffect(() => escucharSincronizacion(() => recargar.current()), []);

    const lista = datos?.lista ?? [];
    const propia = usuarioId
        ? (lista.find((r) => r.usuarioId === usuarioId) ?? null)
        : null;
    const otras = propia ? lista.filter((r) => r.id !== propia.id) : lista;

    return {
        lista,
        otras,
        propia,
        usuarioId,
        sinRed: datos?.sinRed ?? false,
        cargando,
        refrescando,
        error,
        reintentar,
        refrescar,
    };
}
