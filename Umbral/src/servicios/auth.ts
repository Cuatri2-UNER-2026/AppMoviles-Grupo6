import * as LocalAuthentication from "expo-local-authentication";
import type { Sesion } from "../tipos/api";
import type { Usuario } from "../tipos";
import { borrarToken, guardarToken, obtenerToken } from "../almacenamiento/seguro";
import {
  borrarUsuarioGuardado,
  guardarUltimoEmail,
  guardarUsuario,
  obtenerUsuarioGuardado,
} from "../almacenamiento/preferencias";
import { ErrorApi, pedir } from "./cliente";

// Estado de la sesión compartido por toda la app.
// "bloqueada": hay token guardado pero la persona todavía no se identificó
// con huella, rostro o contraseña desde que abrió la app.
export type EstadoSesion =
  | { estado: "cargando" }
  | { estado: "sin-sesion" }
  | { estado: "bloqueada" }
  | { estado: "activa"; usuario: Usuario };

let actual: EstadoSesion = { estado: "cargando" };
const oyentes = new Set<(e: EstadoSesion) => void>();

export const estadoSesion = () => actual;

export function escucharSesion(oyente: (e: EstadoSesion) => void) {
  oyentes.add(oyente);
  return () => {
    oyentes.delete(oyente);
  };
}

function cambiar(nuevo: EstadoSesion) {
  actual = nuevo;
  oyentes.forEach((o) => o(nuevo));
}

async function abrirSesion(datos: Sesion, email: string) {
  await guardarToken(datos.token);
  await guardarUltimoEmail(email.trim().toLowerCase());
  await guardarUsuario(datos.usuario);
  cambiar({ estado: "activa", usuario: datos.usuario });
  return datos.usuario;
}

export async function ingresar(email: string, contrasena: string) {
  const { datos } = await pedir<Sesion>("/auth/ingreso", {
    metodo: "POST",
    cuerpo: { email: email.trim(), contrasena },
  });
  return abrirSesion(datos, email);
}

export async function registrar(nombre: string, email: string, contrasena: string) {
  const { datos } = await pedir<Sesion>("/auth/registro", {
    metodo: "POST",
    cuerpo: { nombre: nombre.trim(), email: email.trim(), contrasena },
  });
  return abrirSesion(datos, email);
}

export async function salir() {
  await borrarToken();
  await borrarUsuarioGuardado();
  cambiar({ estado: "sin-sesion" });
}

// Al abrir la app: si quedó un token guardado, la sesión sigue pero bloqueada.
export async function cargarSesionGuardada() {
  if (actual.estado !== "cargando") return actual;
  const token = await obtenerToken();
  cambiar(token ? { estado: "bloqueada" } : { estado: "sin-sesion" });
  return actual;
}

export async function obtenerYo() {
  try {
    const { datos } = await pedir<Usuario>("/yo");
    await guardarUsuario(datos);
    return datos;
  } catch (e) {
    // Sin red usamos la última copia guardada.
    const guardado = obtenerUsuarioGuardado();
    if (e instanceof ErrorApi && e.codigo === "SIN_RED" && guardado) return guardado;
    throw e;
  }
}

export async function actualizarYo(
  cambios: Partial<Pick<Usuario, "nombre" | "rubrosDeInteres" | "avisosActivos">>,
) {
  const { datos } = await pedir<Usuario>("/yo", { metodo: "PATCH", cuerpo: cambios });
  await guardarUsuario(datos);
  cambiar({ estado: "activa", usuario: datos });
  return datos;
}

// Para que otros servicios (favoritos) avisen que el usuario cambió.
export async function refrescarUsuario(usuario: Usuario) {
  await guardarUsuario(usuario);
  cambiar({ estado: "activa", usuario });
}

async function activarConToken() {
  try {
    const usuario = await obtenerYo();
    cambiar({ estado: "activa", usuario });
    return usuario;
  } catch (e) {
    // Token vencido o inválido: hay que volver a ingresar.
    if (e instanceof ErrorApi && e.estado === 401) await salir();
    throw e;
  }
}

// ¿El teléfono tiene huella o rostro configurados?
export async function hayBiometria() {
  const [hardware, registrada] = await Promise.all([
    LocalAuthentication.hasHardwareAsync(),
    LocalAuthentication.isEnrolledAsync(),
  ]);
  return hardware && registrada;
}

// Reingreso con huella o rostro. Devuelve false si la persona cancela.
export async function desbloquearConBiometria() {
  const resultado = await LocalAuthentication.authenticateAsync({
    promptMessage: "Ingresá a Umbral",
    cancelLabel: "Cancelar",
    fallbackLabel: "Usar el PIN del teléfono",
  });
  if (!resultado.success) return false;
  await activarConToken();
  return true;
}
