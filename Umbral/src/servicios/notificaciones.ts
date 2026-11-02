
import * as Notifications from "./expoNotificaciones";
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

import {
  actualizarYo,
  cargarSesionGuardada,
  estadoSesion,
} from "./auth";

import { pedir } from "./cliente";
import { obtenerComercio } from "./comercios";

const PREFIJO_VENCE = "vence-";
const UN_DIA = 24 * 60 * 60 * 1000;
const MAX_AVISOS_SUELTOS = 3;

// Configuración para mostrar notificaciones con la app abierta.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

// Solicita permisos para enviar notificaciones.
export async function pedirPermiso() {
  const actual = await Notifications.getPermissionsAsync();

  if (actual.granted) return true;
  if (!actual.canAskAgain) return false;

  return (await Notifications.requestPermissionsAsync()).granted;
}

// Envía una notificación inmediata.
function avisarAhora(
  titulo: string,
  cuerpo: string,
  promoId?: string,
) {
  return Notifications.scheduleNotificationAsync({
    content: {
      title: titulo,
      body: cuerpo,
      data: promoId ? { promoId } : {},
    },
    trigger: null,
  });
}

// Obtiene el usuario de la sesión o, si está bloqueada,
// utiliza la copia guardada.
async function usuarioParaAvisos(): Promise<Usuario | null> {
  const s = await cargarSesionGuardada();

  if (s.estado === "activa") return s.usuario;
  if (s.estado === "bloqueada") return obtenerUsuarioGuardado();

  return null;
}

// Obtiene promociones de favoritos y rubros elegidos,
// evitando promociones duplicadas.
async function promosDeInteres(usuario: Usuario) {
  const filtros = [
    ...usuario.favoritos.map((comercioId) => ({ comercioId })),
    ...usuario.rubrosDeInteres.map((rubroId) => ({ rubroId })),
  ];

  const listas = await Promise.all(
    filtros.map((f) =>
      pedir<Promocion[]>("/promociones", {
        params: { ...f, porPagina: 100 },
      })
        .then((r) => r.datos)
        .catch(() => [] as Promocion[]),
    ),
  );

  const porId = new Map<string, Promocion>();

  listas.flat().forEach((p) => porId.set(p.id, p));

  return [...porId.values()];
}

// Obtiene los nombres de los comercios.
async function nombresDeComercios(ids: string[]) {
  const nombres = new Map<string, string>();

  await Promise.allSettled(
    [...new Set(ids)].map(async (id) =>
      nombres.set(id, (await obtenerComercio(id)).nombre),
    ),
  );

  return nombres;
}

// Cancela los recordatorios de vencimiento programados.
async function cancelarRecordatorios() {
  const programadas =
    await Notifications.getAllScheduledNotificationsAsync();

  await Promise.all(
    programadas
      .filter((n) => n.identifier.startsWith(PREFIJO_VENCE))
      .map((n) =>
        Notifications.cancelScheduledNotificationAsync(n.identifier),
      ),
  );
}

// Revisa promociones al abrir la app y al volver a primer plano.
// Avisa sobre promociones nuevas y programa recordatorios de vencimiento.
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

  // Promociones nuevas.
  const avisadas = new Set(obtenerPromosAvisadas());
  const nuevas = promos.filter((p) => !avisadas.has(p.id));

  // Promociones que todavía no vencieron.
  const recordadas = new Set(obtenerPromosRecordadas());
  const porRecordar = promos.filter(
    (p) => new Date(p.hasta).getTime() > ahora,
  );

  const nombres = await nombresDeComercios(
    [...nuevas, ...porRecordar].map((p) => p.comercioId),
  );

  const deQuien = (p: Promocion) =>
    nombres.get(p.comercioId) ?? "Un comercio";

  // Envía avisos individuales o un resumen.
  if (nuevas.length > MAX_AVISOS_SUELTOS) {
    await avisarAhora(
      "Hay promos nuevas para vos",
      `${nuevas.length} promociones de tus favoritos y rubros elegidos.`,
    );
  } else {
    for (const p of nuevas) {
      await avisarAhora(
        `Promo nueva en ${deQuien(p)}`,
        p.titulo,
        p.id,
      );
    }
  }

  nuevas.forEach((p) => avisadas.add(p.id));

  await guardarPromosAvisadas([...avisadas].slice(-300));

  // Actualiza los recordatorios de vencimiento.
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
        },
      });

      recordadas.add(p.id);
    } else if (!recordadas.has(p.id)) {
      // Si falta menos de un día, avisa que vence hoy.
      await avisarAhora(
        `Vence hoy: ${p.titulo}`,
        `${deQuien(p)}. Última oportunidad.`,
        p.id,
      );

      recordadas.add(p.id);
    }
  }

  await guardarPromosRecordadas([...recordadas].slice(-300));
}

// Activa o desactiva las notificaciones.
// Devuelve false si el teléfono no concede el permiso.
export async function cambiarAvisos(activos: boolean) {
  if (activos && !(await pedirPermiso())) return false;

  await guardarAvisosActivos(activos);

  if (estadoSesion().estado === "activa") {
    await actualizarYo({ avisosActivos: activos });
  }

  if (activos) {
    revisarPromos().catch((e) =>
      console.warn("[avisos] Falló la revisión de promos.", e),
    );
  } else {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }

  return true;
}
