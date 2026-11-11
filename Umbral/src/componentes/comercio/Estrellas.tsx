import { StyleSheet, Text, type StyleProp, type TextStyle } from "react-native";
import { colores, fuentes } from "../../tema";

/** ★★★★☆ */
export function Estrellas({
  cantidad,
  tamano = 13,
  style,
}: {
  cantidad: number;
  tamano?: number;
  style?: StyleProp<TextStyle>;
}) {
  const n = Math.max(0, Math.min(5, Math.round(cantidad)));
  return (
    <Text
      style={[estilos.texto, { fontSize: tamano }, style]}
      accessibilityLabel={`${n} de 5 estrellas`}
    >
      {"★".repeat(n)}
      {"☆".repeat(5 - n)}
    </Text>
  );
}

const estilos = StyleSheet.create({
  texto: { fontFamily: fuentes.texto, color: colores.estrella, letterSpacing: 1 },
});
