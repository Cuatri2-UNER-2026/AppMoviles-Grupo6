import * as Location from "expo-location";
import { useCallback, useEffect, useState } from "react";
import type { Coordenadas } from "../tipos";

export type EstadoUbicacion =
  | { estado: "cargando" }
  | { estado: "denegada"; puedePreguntar: boolean }
  | { estado: "error" }
  | { estado: "lista"; coordenadas: Coordenadas };

// Ubicación de la persona. Si niega el permiso la app sigue funcionando:
// Buscar ordena por nombre y el mapa muestra un aviso.
export function useUbicacion() {
  const [ubicacion, setUbicacion] = useState<EstadoUbicacion>({ estado: "cargando" });

  const pedir = useCallback(async () => {
    try {
      const permiso = await Location.requestForegroundPermissionsAsync();
      if (!permiso.granted) {
        setUbicacion({ estado: "denegada", puedePreguntar: permiso.canAskAgain });
        return;
      }

      // Primero la última conocida (instantánea) y después la precisa.
      const ultima = await Location.getLastKnownPositionAsync();
      if (ultima) {
        setUbicacion({
          estado: "lista",
          coordenadas: { latitud: ultima.coords.latitude, longitud: ultima.coords.longitude },
        });
      }
      const actual = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setUbicacion({
        estado: "lista",
        coordenadas: { latitud: actual.coords.latitude, longitud: actual.coords.longitude },
      });
    } catch (e) {
      console.warn("[ubicacion]", e);
      setUbicacion((previa) => (previa.estado === "lista" ? previa : { estado: "error" }));
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- pide la ubicación al montar
    pedir();
  }, [pedir]);

  const coordenadas = ubicacion.estado === "lista" ? ubicacion.coordenadas : null;

  return { ubicacion, coordenadas, reintentar: pedir };
}
