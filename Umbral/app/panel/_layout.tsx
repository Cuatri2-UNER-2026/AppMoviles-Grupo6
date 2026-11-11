
import { useEffect } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { Stack, router } from "expo-router";
import { useSesion } from "../../src/hooks/useSesion";

export default function PanelLayout() {
  const sesion = useSesion();

  useEffect(() => {
    if (sesion.estado === "cargando") return;

    if (
      sesion.estado === "activa" &&
      sesion.usuario.rol === "comercio"
    ) {
      return;
    }

    if (sesion.estado === "bloqueada") {
      router.replace("/yo" as any);
      return;
    }

    if (sesion.estado === "sin-sesion") {
      router.replace("/login" as any);
      return;
    }

    if (sesion.estado === "activa") {
      router.replace("/(tabs)" as any);
    }
  }, [sesion]);

  if (
    sesion.estado === "activa" &&
    sesion.usuario.rol === "comercio"
  ) {
    return <Stack screenOptions={{ headerShown: false }} />;
  }

  return (
    <View style={estilos.cargando}>
      <ActivityIndicator size="large" color="#6C63FF" />
    </View>
  );
}

const estilos = StyleSheet.create({
  cargando: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
  },
});
