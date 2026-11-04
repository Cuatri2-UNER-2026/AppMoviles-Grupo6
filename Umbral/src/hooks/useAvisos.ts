
import * as Notifications from "../servicios/expoNotificaciones";
import { router } from "expo-router";
import { useEffect } from "react";
import { AppState } from "react-native";
import { revisarPromos } from "../servicios/notificaciones";

export function useAvisos() {
  useEffect(() => {
    const revisar = () =>
      revisarPromos().catch((error) =>
        console.warn("[avisos] Error al revisar promociones:", error),
      );

    revisar();

    const estado = AppState.addEventListener("change", (s) => {
      if (s === "active") revisar();
    });

    const toque = Notifications.addNotificationResponseReceivedListener((r) => {
      const promoId = r.notification.request.content.data?.promoId;

      if (typeof promoId === "string") {
        router.push({ pathname: "/promo/[id]", params: { id: promoId } });
      }
    });

    return () => {
      estado.remove();
      toque.remove();
    };
  }, []);
}
