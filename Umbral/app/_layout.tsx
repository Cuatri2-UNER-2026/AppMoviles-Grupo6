import { PlusJakartaSans_400Regular } from "@expo-google-fonts/plus-jakarta-sans/400Regular";
import { PlusJakartaSans_600SemiBold } from "@expo-google-fonts/plus-jakarta-sans/600SemiBold";
import { Sora_600SemiBold } from "@expo-google-fonts/sora/600SemiBold";
import { Sora_700Bold } from "@expo-google-fonts/sora/700Bold";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { useAvisos } from "../src/hooks/useAvisos";
import { colores, fuentes } from "../src/tema";

// La pantalla de presentación queda visible hasta que cargan las fuentes.
SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  useAvisos();

  // Los nombres coinciden con src/tema (fuentes.titulo, fuentes.cuerpo, ...).
  const [fuentesListas, errorFuentes] = useFonts({
    Sora_600SemiBold,
    Sora_700Bold,
    PlusJakartaSans_400Regular,
    PlusJakartaSans_600SemiBold,
  });

  const listo = fuentesListas || !!errorFuentes;

  useEffect(() => {
    if (listo) SplashScreen.hideAsync().catch(() => {});
  }, [listo]);

  // Si fallan las fuentes, la app sigue con las del sistema.
  if (!listo) return null;

  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerBackTitle: "Volver",
          headerTitleStyle: { fontFamily: fuentes.titulo, color: colores.texto },
          headerTintColor: colores.texto,
          contentStyle: { backgroundColor: colores.fondo },
        }}
      >
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
    </>
  );
}
