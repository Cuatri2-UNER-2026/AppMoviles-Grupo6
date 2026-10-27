import { Stack } from "expo-router";
import { useAvisos } from "../src/hooks/useAvisos";

export default function RootLayout() {
  // Avisos de promos que se programan solos (Parte 2).
  useAvisos();
  return <Stack />;
}
