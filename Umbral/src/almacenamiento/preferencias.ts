import Storage from "expo-sqlite/kv-store";
import type { Usuario } from "../tipos";

// Preferencias que no son secretas: viven en kv-store (el token va en seguro.ts).
const CLAVES = {
  avisosActivos: "avisos_activos",
  rubrosDeInteres: "rubros_de_interes",
  ultimoEmail: "ultimo_email",
  usuario: "usuario_guardado",
  promosAvisadas: "promos_avisadas",
  promosRecordadas: "promos_recordadas",
};

function leerJson<T>(clave: string, porDefecto: T): T {
  const valor = Storage.getItemSync(clave);
  if (valor == null) return porDefecto;
  try {
    return JSON.parse(valor) as T;
  } catch {
    return porDefecto;
  }
}

const guardarJson = (clave: string, valor: unknown) =>
  Storage.setItemAsync(clave, JSON.stringify(valor));

// Avisos: prendidos salvo que la persona los apague.
export const obtenerAvisosActivos = () => leerJson(CLAVES.avisosActivos, true);
export const guardarAvisosActivos = (activos: boolean) =>
  guardarJson(CLAVES.avisosActivos, activos);

export const obtenerRubrosDeInteres = () => leerJson<string[]>(CLAVES.rubrosDeInteres, []);
export const guardarRubrosDeInteres = (ids: string[]) =>
  guardarJson(CLAVES.rubrosDeInteres, ids);

// Último email usado, para completar el ingreso cuando no hay biometría.
export const obtenerUltimoEmail = () => Storage.getItemSync(CLAVES.ultimoEmail);
export const guardarUltimoEmail = (email: string) =>
  Storage.setItemAsync(CLAVES.ultimoEmail, email);

// Copia del usuario para mostrar la cuenta y armar los avisos sin red.
export const obtenerUsuarioGuardado = () => leerJson<Usuario | null>(CLAVES.usuario, null);
export async function guardarUsuario(usuario: Usuario) {
  await guardarJson(CLAVES.usuario, usuario);
  await guardarAvisosActivos(usuario.avisosActivos);
  await guardarRubrosDeInteres(usuario.rubrosDeInteres);
}
export const borrarUsuarioGuardado = () => Storage.removeItemAsync(CLAVES.usuario);

// Promos de las que ya avisamos, para no repetir la notificación.
export const obtenerPromosAvisadas = () => leerJson<string[]>(CLAVES.promosAvisadas, []);
export const guardarPromosAvisadas = (ids: string[]) =>
  guardarJson(CLAVES.promosAvisadas, ids);

export const obtenerPromosRecordadas = () => leerJson<string[]>(CLAVES.promosRecordadas, []);
export const guardarPromosRecordadas = (ids: string[]) =>
  guardarJson(CLAVES.promosRecordadas, ids);
