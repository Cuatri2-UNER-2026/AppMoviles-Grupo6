import * as Notifications from "./expoNotificaciones";
import { Platform } from "react-native";
import type { Promocion, Usuario } from "../tipos";
import {
  guardarAvisosActivos,
  guardarPromosAvisadas,
  guardarPromosRecordadas,
  obtenerAvisosActivos,
  obtenerPromosAvisadas,
  obtenerPromosRecordadas,
  obtenerUsuarioGuardado,
} from "../almacenamiento/preferencias";
import { actualizarYo, cargarSesionGuardada, estadoSesion } from "./auth";
import { pedir } from "./cliente";
import { obtenerComercio } from "./comercios";

const CANAL = "promos";
const PREFIJO_VENCE = "vence-";
const UN_DIA = 24 * 60 * 60 * 1000;
const MAX_AVISOS_SUELTOS = 3;

// Con la app abierta también se muestra el aviso arriba.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

// Canal propio de Android. En Expo Go (SDK 57) crear canales falla del lado
// nativo; en ese caso seguimos sin canal y Android usa el de por defecto.
let canal: string | undefined;

async function prepararCanal() {
  if (Platform.OS !== "android" || canal) return;
  try {
    await Notifications.setNotificationChannelAsync(CANAL, {
      name: "Promociones",
      importance: Notifications.AndroidImportance.HIGH,
    });
    canal = CANAL;
  } catch (e) {
    console.warn("[avisos] No se pudo crear el canal, se usa el de por defecto.", e);
  }
}

export async function pedirPermiso() {
  await prepararCanal();
  const actual = await Notifications.getPermissionsAsync();
  if (actual.granted) return true;
  if (!actual.canAskAgain) return false;
  return (await Notifications.requestPermissionsAsync()).granted;
}

function avisarAhora(titulo: string, cuerpo: string, promoId?: string) {
  return Notifications.scheduleNotificationAsync({
    content: { title: titulo, body: cuerpo, data: promoId ? { promoId } : {} },
    trigger: canal ? { channelId: canal } : null,
  });
}

// Usuario para armar los avisos: el de la sesión o, si está bloqueada, la copia guardada.
async function usuarioParaAvisos(): Promise<Usuario | null> {
  const s = await cargarSesionGuardada();
  if (s.estado === "activa") return s.usuario;
  if (s.estado === "bloqueada") return obtenerUsuarioGuardado();
  return null;
}

// Promos vigentes de los favoritos y de los rubros elegidos, sin repetir.
async function promosDeInteres(usuario: Usuario) {
  const filtros = [
    ...usuario.favoritos.map((comercioId) => ({ comercioId })),
    ...usuario.rubrosDeInteres.map((rubroId) => ({ rubroId })),
  ];
  const listas = await Promise.all(
    filtros.map((f) =>
      pedir<Promocion[]>("/promociones", { params: { ...f, porPagina: 100 } })
        .then((r) => r.datos)
        .catch(() => [] as Promocion[]),
    ),
  );
  const porId = new Map<string, Promocion>();
  listas.flat().forEach((p) => porId.set(p.id, p));
  return [...porId.values()];
}

async function nombresDeComercios(ids: string[]) {
  const nombres = new Map<string, string>();
  await Promise.allSettled(
    [...new Set(ids)].map(async (id) => nombres.set(id, (await obtenerComercio(id)).nombre)),
  );
  return nombres;
}

async function cancelarRecordatorios() {
  const programadas = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    programadas
      .filter((n) => n.identifier.startsWith(PREFIJO_VENCE))
      .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)),
  );
}

// Se llama sola al abrir la app, al volver a ella y al cambiar favoritos o rubros.
// Avisa de promos nuevas y deja programado el recordatorio un día antes de que venzan.
export async function revisarPromos() {
  const usuario = await usuarioParaAvisos();
  if (!usuario || usuario.rol !== "vecino") return;
  if (!obtenerAvisosActivos()) {
    await Notifications.cancelAllScheduledNotificationsAsync();
    return;
  }
  if (!(await pedirPermiso())) return;

  const promos = await promosDeInteres(usuario);
  const ahora = Date.now();

  // 1. Promos nuevas
  const avisadas = new Set(obtenerPromosAvisadas());
  const nuevas = promos.filter((p) => !avisadas.has(p.id));

  // 2. Recordatorios de las que vencen
  const recordadas = new Set(obtenerPromosRecordadas());
  const porRecordar = promos.filter((p) => new Date(p.hasta).getTime() > ahora);

  const nombres = await nombresDeComercios(
    [...nuevas, ...porRecordar].map((p) => p.comercioId),
  );
  const deQuien = (p: Promocion) => nombres.get(p.comercioId) ?? "Un comercio";

  if (nuevas.length > MAX_AVISOS_SUELTOS) {
    await avisarAhora(
      "Hay promos nuevas para vos",
      `${nuevas.length} promociones de tus favoritos y rubros elegidos.`,
    );
  } else {
    for (const p of nuevas) {
      await avisarAhora(`Promo nueva en ${deQuien(p)}`, p.titulo, p.id);
    }
  }
  nuevas.forEach((p) => avisadas.add(p.id));
  await guardarPromosAvisadas([...avisadas].slice(-300));

  await cancelarRecordatorios();
  for (const p of porRecordar) {
    const momento = new Date(p.hasta).getTime() - UN_DIA;
    if (momento > ahora) {
      await Notifications.scheduleNotificationAsync({
        identifier: `${PREFIJO_VENCE}${p.id}`,
        content: {
          title: `Mañana vence: ${p.titulo}`,
          body: `${deQuien(p)}. Aprovechala antes de que termine.`,
          data: { promoId: p.id },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: momento,
          channelId: canal,
        },
      });
      recordadas.add(p.id);
    } else if (!recordadas.has(p.id)) {
      // Ya falta menos de un día y todavía no la recordamos.
      await avisarAhora(`Vence hoy: ${p.titulo}`, `${deQuien(p)}. Última oportunidad.`, p.id);
      recordadas.add(p.id);
    }
  }
  await guardarPromosRecordadas([...recordadas].slice(-300));
}

// Interruptor general: apaga o prende todos los avisos.
// Devuelve false si se quisieron prender pero el teléfono no dio permiso.
export async function cambiarAvisos(activos: boolean) {
  if (activos && !(await pedirPermiso())) return false;
  await guardarAvisosActivos(activos);
  if (estadoSesion().estado === "activa") await actualizarYo({ avisosActivos: activos });
  // Si la revisión falla, la preferencia ya quedó guardada: no se revierte.
  if (activos) revisarPromos().catch((e) => console.warn("[avisos] Falló la revisión de promos.", e));
  else await Notifications.cancelAllScheduledNotificationsAsync();
  return true;
}
