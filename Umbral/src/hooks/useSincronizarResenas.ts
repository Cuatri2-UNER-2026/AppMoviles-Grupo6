import { useEffect } from "react";
import { resenasService } from "../servicios/resenas";
import { useRed } from "./useRed";
import { useSesion } from "./useSesion";

/** Sube las reseñas guardadas sin red apenas vuelve la conexión. Va una sola vez en app/_layout.tsx. */
export function useSincronizarResenas() {
  const { conectado } = useRed();
  const sesion = useSesion();
  const usuarioId = sesion.estado === "activa" ? sesion.usuario.id : null;

  useEffect(() => {
    if (!conectado || !usuarioId) return;
    resenasService.sincronizarPendientes(usuarioId).catch((e) => console.warn("[resenas] sincronización:", e));
  }, [conectado, usuarioId]);
}