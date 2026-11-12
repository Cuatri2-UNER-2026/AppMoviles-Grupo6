import { Pressable, StyleSheet, Text, View } from "react-native";
import { colores, fuentes } from "../../tema";

interface Props {
  valor: number;
  onChange: (estrellas: 1 | 2 | 3 | 4 | 5) => void;
  tamano?: number;
}

/** Cinco estrellas tocables para puntuar. Con 0 no hay ninguna elegida. */
export function SelectorEstrellas({ valor, onChange, tamano = 40 }: Props) {
  return (
    <View style={estilos.fila} accessibilityRole="radiogroup">
      {([1, 2, 3, 4, 5] as const).map((n) => (
        <Pressable
          key={n}
          onPress={() => onChange(n)}
          hitSlop={6}
          accessibilityRole="radio"
          accessibilityState={{ selected: n === valor }}
          accessibilityLabel={`${n} ${n === 1 ? "estrella" : "estrellas"}`}
        >
          <Text style={[estilos.estrella, { fontSize: tamano, lineHeight: tamano + 6 }]}>{n <= valor ? "★" : "☆"}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const estilos = StyleSheet.create({
  fila: { flexDirection: "row", gap: 6, marginLeft: 2 },
  estrella: { fontFamily: fuentes.texto, color: colores.estrella },
});