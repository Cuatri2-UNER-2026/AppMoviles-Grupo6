import { useFonts } from "expo-font";
import { router, Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import { Introduccion } from "../src/componentes/intro";
import { useAvisos } from "../src/hooks/useAvisos";
import { useSincronizarResenas } from "../src/hooks/useSincronizarResenas";
import { archivosDeFuentes } from "../src/tema";
import { BannerSinConexion } from "../src/componentes/estados/BannerSinConexion";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useAvisos();
  useSincronizarResenas();
  const [fuentesListas, errorFuentes] = useFonts(archivosDeFuentes);
  const [intro, setIntro] = useState(true);

  useEffect(() => {
    if (fuentesListas || errorFuentes) SplashScreen.hideAsync();
  }, [fuentesListas, errorFuentes]);

  if (!fuentesListas && !errorFuentes) return null;

  return (
    <>
      <Stack screenOptions={{ headerShown: false }} />
      <BannerSinConexion />
      {intro && (
        <Introduccion
          alNavegar={(destino) => {
            if (destino === "login") router.push("/login");
          }}
          alCerrar={() => setIntro(false)}
        />
      )}
    </>
  );
}