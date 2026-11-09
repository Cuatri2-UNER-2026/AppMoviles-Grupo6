import { Stack } from "expo-router";
import { useAvisos } from "../src/hooks/useAvisos";

export default function RootLayout() {
  useAvisos();

  return (
    <Stack screenOptions={{ headerBackTitle: "Volver" }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      {/* El panel tiene su propio Stack con encabezados. */}
      <Stack.Screen name="panel" options={{ headerShown: false }} />
      {/* La promo tiene su propio botón "Volver". */}
      <Stack.Screen name="promo/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="comercio/[id]" options={{ title: "Comercio" }} />
      <Stack.Screen name="prueba-api" options={{ title: "Prueba de la API" }} />
    </Stack>
  );
}
