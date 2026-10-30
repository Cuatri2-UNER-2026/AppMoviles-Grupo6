import { useEffect, useState } from "react";
import { cargarSesionGuardada, escucharSesion, estadoSesion } from "../servicios/auth";

export function useSesion() {
  const [sesion, setSesion] = useState(estadoSesion);

  useEffect(() => {
    const dejar = escucharSesion(setSesion);
    cargarSesionGuardada();
    return dejar;
  }, []);

  return sesion;
}
