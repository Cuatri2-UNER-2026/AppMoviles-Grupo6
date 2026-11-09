import { Redirect } from "expo-router";

// La app abre directo en las pestañas.
// La pantalla de prueba de la API sigue disponible en /prueba-api.
export default function Inicio() {
  return <Redirect href="/(tabs)" />;
}
