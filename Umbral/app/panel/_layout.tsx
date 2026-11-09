
import { useEffect } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
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
    return (
      <Stack screenOptions={{ headerBackTitle: "Volver" }}>
        <Stack.Screen
          name="index"
          options={{
            title: "Mi comercio",
            headerLeft: () => (
              <Pressable onPress={() => router.replace("/(tabs)/yo" as any)} hitSlop={10}>
                <Text style={estilos.salir}>‹ Salir</Text>
              </Pressable>
            ),
          }}
        />
        <Stack.Screen name="nueva" options={{ title: "Nueva promoción" }} />
        <Stack.Screen name="editar/[id]" options={{ title: "Editar promoción" }} />
        {/* Estas dos tienen su propio botón para volver. */}
        <Stack.Screen name="escanear" options={{ headerShown: false }} />
        <Stack.Screen name="resenas" options={{ headerShown: false }} />
      </Stack>
    );
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
  salir: { fontSize: 16, color: "#007AFF" },
});
