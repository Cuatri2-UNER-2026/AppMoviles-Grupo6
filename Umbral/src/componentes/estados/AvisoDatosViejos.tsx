import type { StyleProp, ViewStyle } from "react-native";
import { hace } from "../../utils/fechas";
import { Aviso } from "../ui/Aviso";

/** "Datos guardados hace 3 horas…". Aparece cuando se muestra la copia del teléfono y no lo último de la API. */
export function AvisoDatosViejos({
  actualizadoEn,
  style,
}: {
  actualizadoEn: number | null;
  style?: StyleProp<ViewStyle>;
}) {
  const cuando = actualizadoEn ? `guardados ${hace(actualizadoEn)}` : "guardados en el teléfono";
  return (
    <Aviso
      icono="time-outline"
      texto={`Sin conexión: mostramos datos ${cuando}. Promos y reseñas necesitan internet.`}
      style={style}
    />
  );
}