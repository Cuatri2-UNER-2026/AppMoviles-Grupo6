import { Stack } from "expo-router";
import { useAvisos } from "../src/hooks/useAvisos";

export default function RootLayout() {
  useAvisos();

  return <Stack />;
}