import type { Horario } from "../tipos";

export interface Tramo {
  abre: string;
  cierra: string;
}
/** Tramos por día de la semana (0 = domingo). Un día sin tramos es un día cerrado. */
export type Tramos = Record<number, Tramo[]>;

/** Lunes primero, como se lee en un cartel de comercio. */
export const SEMANA = [1, 2, 3, 4, 5, 6, 0] as const;
export const NOMBRE_DIA = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

export function aMinutos(hora: string): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(hora.trim());
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 23 || min > 59) return null;
  return h * 60 + min;
}

/** "8:30" -> "08:30". Si no es una hora válida la devuelve igual. */
export function normalizarHora(hora: string): string {
  const m = aMinutos(hora);
  if (m === null) return hora;
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}

/** Mientras se escribe: "0830" -> "08:30". */
export function formatearMientrasEscribe(texto: string): string {
  const limpio = texto.replace(/[^\d:]/g, "");
  if (!limpio.includes(":") && limpio.length >= 3) return `${limpio.slice(0, 2)}:${limpio.slice(2, 4)}`;
  return limpio.slice(0, 5);
}

export function horariosATramos(horarios: Horario[]): Tramos {
  const t: Tramos = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };
  for (const h of horarios) t[h.dia].push({ abre: h.abre, cierra: h.cierra });
  for (const dia of SEMANA) t[dia].sort((a, b) => a.abre.localeCompare(b.abre));
  return t;
}

export function tramosAHorarios(t: Tramos): Horario[] {
  return SEMANA.flatMap((dia) =>
    (t[dia] ?? []).map((x) => ({
      dia: dia as Horario["dia"],
      abre: normalizarHora(x.abre),
      cierra: normalizarHora(x.cierra),
    })),
  );
}

/** Devuelve un mensaje por día con problemas. Un objeto vacío significa que está todo bien. */
export function validarTramos(t: Tramos): Record<number, string> {
  const errores: Record<number, string> = {};
  for (const dia of SEMANA) {
    const lista = (t[dia] ?? []).map((x) => ({ abre: aMinutos(x.abre), cierra: aMinutos(x.cierra) }));
    if (lista.some((x) => x.abre === null || x.cierra === null)) {
      errores[dia] = "Escribí las horas así: 08:30.";
      continue;
    }
    const validos = lista as { abre: number; cierra: number }[];
    if (validos.some((x) => x.cierra <= x.abre)) {
      errores[dia] = "El cierre tiene que ser después de la apertura.";
      continue;
    }
    const ordenados = [...validos].sort((a, b) => a.abre - b.abre);
    for (let i = 1; i < ordenados.length; i++) {
      if (ordenados[i].abre < ordenados[i - 1].cierra) {
        errores[dia] = "Los turnos de este día se pisan.";
        break;
      }
    }
  }
  return errores;
}

/** Para saber si los horarios cambiaron, sin importar el orden. */
export const claveHorarios = (h: Horario[]) =>
  JSON.stringify(
    [...h]
      .sort((a, b) => a.dia - b.dia || a.abre.localeCompare(b.abre))
      .map((x) => [x.dia, x.abre, x.cierra]),
  );