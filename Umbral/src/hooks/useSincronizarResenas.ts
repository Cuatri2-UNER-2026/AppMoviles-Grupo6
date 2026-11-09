import { useEffect } from "react";
import { AppState } from "react-native";
import { sincronizarResenasPendientes } from "../servicios/resenas";
import { useRed } from "./useRed";

/**
 * Sube las reseñas escritas sin conexión: al abrir la app, al volver a primer
 * plano y cada vez que vuelve la red. Se usa una sola vez en el layout raíz.
 */
export function useSincronizarResenas() {
  const { conectado } = useRed();

  useEffect(() => {
    if (!conectado) return;
    sincronizarResenasPendientes().catch((e) => console.warn("[resenas] Sincronización", e));
  }, [conectado]);

  useEffect(() => {
    const sub = AppState.addEventListener("change", (estado) => {
      if (estado === "active") sincronizarResenasPendientes().catch(() => {});
    });
    return () => sub.remove();
  }, []);
}
