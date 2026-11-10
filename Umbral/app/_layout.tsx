import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { useAvisos } from "../src/hooks/useAvisos";
import { archivosDeFuentes } from "../src/tema";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useAvisos();
  const [fuentesListas, errorFuentes] = useFonts(archivosDeFuentes);

  useEffect(() => {
    if (fuentesListas || errorFuentes) SplashScreen.hideAsync();
  }, [fuentesListas, errorFuentes]);

  if (!fuentesListas && !errorFuentes) return null;

  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}