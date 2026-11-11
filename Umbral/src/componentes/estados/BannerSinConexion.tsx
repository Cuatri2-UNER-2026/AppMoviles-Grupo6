import Ionicons from "@react-native-vector-icons/ionicons";
import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRed } from "../../hooks/useRed";
import { colores, fuentes } from "../../tema";

/** Cartel flotante "Sin conexión". Va una sola vez en app/_layout.tsx. */
export function BannerSinConexion() {
  const { conectado } = useRed();
  const insets = useSafeAreaInsets();
  if (conectado) return null;

  return (
    <View
      style={[estilos.banner, { top: insets.top + 6 }]}
      pointerEvents="none"
      accessibilityRole="alert"
    >
      <Ionicons name="cloud-offline-outline" size={16} color={colores.pizarra} />
      <Text style={estilos.texto}>Sin conexión. Mostrando lo último que guardamos.</Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  banner: {
    position: "absolute",
    alignSelf: "center",
    zIndex: 200,
    elevation: 200,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colores.durazno,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  texto: { fontFamily: fuentes.textoMedio, fontSize: 12, color: colores.pizarra },
});
