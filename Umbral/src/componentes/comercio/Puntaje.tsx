import { StyleSheet, Text, type StyleProp, type TextStyle } from "react-native";
import { colores, fuentes } from "../../tema";
import { formatearPuntaje } from "../../utils/formatear";

/** "★ 4,6" o "★ 4,6 · 38 reseñas". No muestra nada si todavía no hay reseñas. */
export function Puntaje({
  puntaje,
  cantidad,
  conCantidad = false,
  style,
}: {
  puntaje: number;
  cantidad: number;
  conCantidad?: boolean;
  style?: StyleProp<TextStyle>;
}) {
  if (cantidad <= 0) return null;
  return (
    <Text style={[estilos.texto, style]}>
      ★ {formatearPuntaje(puntaje)}
      {conCantidad ? ` · ${cantidad} ${cantidad === 1 ? "reseña" : "reseñas"}` : ""}
    </Text>
  );
}

const estilos = StyleSheet.create({
  texto: { fontFamily: fuentes.texto, fontSize: 12, color: colores.gris },
});
