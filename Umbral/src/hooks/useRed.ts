import { useNetworkState } from "expo-network";

export function useRed() {
  const estado = useNetworkState();
  const conectado = estado.isConnected !== false && estado.isInternetReachable !== false;
  return { conectado, tipo: estado.type };
}
