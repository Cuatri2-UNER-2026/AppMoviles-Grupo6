import type { Horario } from "../tipos";

// "Abierto ahora" se calcula en el teléfono con los horarios del comercio
// y la hora del dispositivo.
//
// - Turnos cortados: un día puede tener varios turnos (8:00–12:00 y 16:30–20:30).
// - Sábados y domingos: cada día tiene sus propios turnos (dia 0 = domingo, 6 = sábado).
// - Turnos que pasan la medianoche (20:00–02:00): la parte de después de las 00:00
//   cuenta para el día siguiente.
// - Sin horarios (por ejemplo, cerrado por vacaciones): siempre cerrado.

const aMinutos = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + (m || 0);
};

export interface EstadoApertura {
  abierto: boolean;
  /** "Cierra 12:00", "Abre 16:30", "Abre el lunes 08:00" o "Sin horarios". */
  detalle: string;
}

const DIAS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];

export function estaAbierto(horarios: Horario[], ahora: Date = new Date()): boolean {
  return estadoApertura(horarios, ahora).abierto;
}

export function estadoApertura(horarios: Horario[], ahora: Date = new Date()): EstadoApertura {
  if (!horarios.length) return { abierto: false, detalle: "Sin horarios" };

  const hoy = ahora.getDay();
  const ayer = (hoy + 6) % 7;
  const minuto = ahora.getHours() * 60 + ahora.getMinutes();

  for (const h of horarios) {
    const abre = aMinutos(h.abre);
    const cierra = aMinutos(h.cierra);
    const cruzaMedianoche = cierra <= abre;

    if (h.dia === hoy) {
      if (!cruzaMedianoche && minuto >= abre && minuto < cierra) {
        return { abierto: true, detalle: `Cierra ${h.cierra}` };
      }
      if (cruzaMedianoche && minuto >= abre) {
        return { abierto: true, detalle: `Cierra ${h.cierra}` };
      }
    }
    // Parte de un turno de ayer que sigue después de las 00:00.
    if (h.dia === ayer && cruzaMedianoche && minuto < cierra) {
      return { abierto: true, detalle: `Cierra ${h.cierra}` };
    }
  }

  return { abierto: false, detalle: proximaApertura(horarios, hoy, minuto) };
}

// Busca el próximo turno en los 7 días siguientes.
function proximaApertura(horarios: Horario[], hoy: number, minuto: number): string {
  for (let i = 0; i < 7; i++) {
    const dia = (hoy + i) % 7;
    const turnos = horarios
      .filter((h) => h.dia === dia && (i > 0 || aMinutos(h.abre) > minuto))
      .sort((a, b) => aMinutos(a.abre) - aMinutos(b.abre));
    if (turnos.length) {
      const cuando = i === 0 ? "" : i === 1 ? " mañana" : ` el ${DIAS[dia]}`;
      return `Abre${cuando} ${turnos[0].abre}`;
    }
  }
  return "Cerrado";
}
