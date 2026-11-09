import { useNetworkState } from "expo-network";

/**
 * Estado de la conexión con expo-network.
 * - conectado: hay red (wifi o datos).
 * - sinConexion: seguro que no hay internet. Mientras el sistema todavía no sabe
 *   (valores undefined al arrancar) se asume que hay, para no mostrar el aviso de más.
 */
export function useRed() {
  const red = useNetworkState();
  const sinConexion = red.isConnected === false || red.isInternetReachable === false;
  return { sinConexion, conectado: !sinConexion, tipo: red.type };
}
