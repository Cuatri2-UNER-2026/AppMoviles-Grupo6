import * as Notifications from "../servicios/expoNotificaciones";
import { router } from "expo-router";
import { useEffect } from "react";
import { AppState } from "react-native";
import { revisarPromos } from "../servicios/notificaciones";

// Va montado una sola vez en app/_layout.tsx: revisa promos al abrir la app
// y cada vez que vuelve a primer plano, y abre la promo al tocar el aviso.
export function useAvisos() {
  useEffect(() => {
    const revisar = () => revisarPromos().catch(() => {});
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
