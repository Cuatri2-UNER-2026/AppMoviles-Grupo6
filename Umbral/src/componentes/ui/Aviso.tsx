import Ionicons from "@react-native-vector-icons/ionicons";
import type { ComponentProps } from "react";
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";
import { colores, fuentes } from "../../tema";

interface Props {
  icono?: ComponentProps<typeof Ionicons>["name"];
  texto: string;
  /** Si lo pasás, el aviso se puede tocar (ej. "Tocá para activar la ubicación"). */
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

export function Aviso({ icono = "information-circle-outline", texto, onPress, style }: Props) {
  const contenido = (
    <>
      <Ionicons name={icono} size={18} color={colores.pizarra} />
      <Text style={estilos.texto}>{texto}</Text>
    </>
  );
  if (onPress) {
    return (
      <Pressable style={[estilos.aviso, style]} onPress={onPress} accessibilityRole="button">
        {contenido}
      </Pressable>
    );
  }
  return <View style={[estilos.aviso, style]}>{contenido}</View>;
}

const estilos = StyleSheet.create({
  aviso: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colores.durazno,
    borderRadius: 18,
    padding: 12,
  },
  texto: { flex: 1, fontFamily: fuentes.textoMedio, fontSize: 13, color: colores.pizarra },
});
