import Ionicons from "@react-native-vector-icons/ionicons";
import { router } from "expo-router";
import type { ComponentProps } from "react";
import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from "react-native";
import { colores } from "../../tema";

interface Props {
  icono?: ComponentProps<typeof Ionicons>["name"];
  /** Por defecto vuelve a la pantalla anterior. */
  onPress?: () => void;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}

export function BotonRedondo({
  icono = "chevron-back",
  onPress = () => router.back(),
  accessibilityLabel = "Volver",
  style,
}: Props) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [estilos.boton, style, pressed && { opacity: 0.8 }]}
    >
      <Ionicons name={icono} size={22} color={colores.pizarra} />
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  boton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colores.vidrioFuerte,
    alignItems: "center",
    justifyContent: "center",
  },
});
