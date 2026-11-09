import { Alert, Linking, Platform } from "react-native";
import type { Coordenadas } from "../tipos";

/** Abre la app de mapas del teléfono con el comercio como destino. */
export async function abrirComoLlegar(destino: Coordenadas, nombre: string) {
  const { latitud, longitud } = destino;
  const etiqueta = encodeURIComponent(nombre);
  const nativa = Platform.select({
    ios: `maps:0,0?daddr=${latitud},${longitud}&q=${etiqueta}`,
    default: `google.navigation:q=${latitud},${longitud}`,
  });
  const web = `https://www.google.com/maps/dir/?api=1&destination=${latitud},${longitud}`;

  try {
    await Linking.openURL(nativa);
  } catch {
    try {
      await Linking.openURL(web);
    } catch {
      Alert.alert("No se pudo abrir el mapa", "Instalá una app de mapas para ver cómo llegar.");
    }
  }
}
