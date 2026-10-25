import type { Sesion } from "../tipos/api";
import { borrarToken, guardarToken } from "../almacenamiento/seguro";
import { pedir } from "./cliente";

export async function ingresar(email: string, contrasena: string) {
  const { datos } = await pedir<Sesion>("/auth/ingreso", {
    metodo: "POST",
    cuerpo: { email, contrasena },
  });
  await guardarToken(datos.token);
  return datos.usuario;
}

export async function registrar(nombre: string, email: string, contrasena: string) {
  const { datos } = await pedir<Sesion>("/auth/registro", {
    metodo: "POST",
    cuerpo: { nombre, email, contrasena },
  });
  await guardarToken(datos.token);
  return datos.usuario;
}

export const salir = () => borrarToken();