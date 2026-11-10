import * as Location from "expo-location";
import { useCallback, useEffect, useRef, useState } from "react";
import { AppState, Linking } from "react-native";
import type { Coordenadas } from "../tipos";

export type EstadoPermiso = "cargando" | "concedido" | "denegado";

export interface UbicacionActual {
  coordenadas: Coordenadas | null;
  permiso: EstadoPermiso;
  solicitar: () => Promise<void>;
  actualizar: () => Promise<void>;
}

export function useUbicacion(): UbicacionActual {
  const [permiso, setPermiso] = useState<EstadoPermiso>("cargando");
  const [coordenadas, setCoordenadas] = useState<Coordenadas | null>(null);
  const montado = useRef(true);

  const leerPosicion = useCallback(async () => {
    try {
      const ultima = await Location.getLastKnownPositionAsync();
      if (ultima && montado.current) {
        setCoordenadas({ latitud: ultima.coords.latitude, longitud: ultima.coords.longitude });
      }
      const actual = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      if (montado.current) {
        setCoordenadas({ latitud: actual.coords.latitude, longitud: actual.coords.longitude });
      }
    } catch {
        
    }
  }, []);

  const revisar = useCallback(
    async (preguntar: boolean) => {
      let estado = await Location.getForegroundPermissionsAsync();
      if (!estado.granted && estado.canAskAgain && preguntar) {
        estado = await Location.requestForegroundPermissionsAsync();
      }
      if (!montado.current) return;
      if (estado.granted) {
        setPermiso("concedido");
        await leerPosicion();
      } else {
        setPermiso("denegado");
        setCoordenadas(null);
      }
    },
    [leerPosicion],
  );

  useEffect(() => {
    montado.current = true;
    revisar(true);

    const suscripcion = AppState.addEventListener("change", (s) => {
      if (s === "active") revisar(false);
    });
    return () => {
      montado.current = false;
      suscripcion.remove();
    };
  }, [revisar]);

  const solicitar = useCallback(async () => {
    const estado = await Location.getForegroundPermissionsAsync();
    if (!estado.granted && !estado.canAskAgain) {
      await Linking.openSettings();
      return;
    }
    await revisar(true);
  }, [revisar]);

  const actualizar = useCallback(() => revisar(false), [revisar]);

  return { coordenadas, permiso, solicitar, actualizar };
}