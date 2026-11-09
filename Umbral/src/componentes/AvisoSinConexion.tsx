import { Ionicons } from "@react-native-vector-icons/ionicons";
import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRed } from "../hooks/useRed";
import { colores, fuentes } from "../tema";

/**
 * Franja visible arriba de todas las pantallas mientras no hay conexión.
 * Se monta una sola vez en el layout raíz.
 */
export function AvisoSinConexion() {
  const { sinConexion } = useRed();
  const insets = useSafeAreaInsets();

  if (!sinConexion) return null;

  return (
    <View
      style={[estilos.franja, { paddingTop: insets.top + 4 }]}
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      pointerEvents="none"
    >
      <Ionicons name="cloud-offline" size={15} color="#fff" />
      <Text style={estilos.texto}>Sin conexión · mostramos los datos guardados</Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  franja: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingBottom: 6,
    backgroundColor: colores.texto,
  },
  texto: { color: "#fff", fontFamily: fuentes.cuerpoFuerte, fontSize: 13 },
});
