import type { Comercio, Usuario } from "../tipos";
import { estadoSesion, refrescarUsuario } from "./auth";
import { pedir } from "./cliente";
import { obtenerComercio } from "./comercios";
import { revisarPromos } from "./notificaciones";

export function idsFavoritos() {
  const s = estadoSesion();
  return s.estado === "activa" ? s.usuario.favoritos : [];
}

export const esFavorito = (comercioId: string) => idsFavoritos().includes(comercioId);

export async function agregarFavorito(comercioId: string) {
  const { datos } = await pedir<Usuario>(`/yo/favoritos/${comercioId}`, { metodo: "PUT" });
  await refrescarUsuario(datos);
  revisarPromos().catch(() => {});
  return datos.favoritos;
}

export async function quitarFavorito(comercioId: string) {
  await pedir<void>(`/yo/favoritos/${comercioId}`, { metodo: "DELETE" });
  const s = estadoSesion();
  if (s.estado === "activa") {
    const favoritos = s.usuario.favoritos.filter((id) => id !== comercioId);
    await refrescarUsuario({ ...s.usuario, favoritos });
  }
  return idsFavoritos();
}

// Para el botón de la ficha: agrega o quita y devuelve si quedó como favorito.
export async function alternarFavorito(comercioId: string) {
  if (esFavorito(comercioId)) {
    await quitarFavorito(comercioId);
    return false;
  }
  await agregarFavorito(comercioId);
  return true;
}

// Trae la ficha de cada favorito. Si alguno ya no existe, se saltea.
export async function listarFavoritos(): Promise<Comercio[]> {
  const resultados = await Promise.allSettled(idsFavoritos().map(obtenerComercio));
  return resultados
    .filter((r): r is PromiseFulfilledResult<Comercio> => r.status === "fulfilled")
    .map((r) => r.value);
}
