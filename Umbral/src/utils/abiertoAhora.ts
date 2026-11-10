import type { Horario } from "../tipos";

const diaDeLaSemana = (fecha: Date) => fecha.getDay();

const MIN_POR_DIA = 24 * 60;
const MIN_POR_SEMANA = 7 * MIN_POR_DIA;
const NOMBRES_DIA = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];

export interface EstadoApertura {
  abierto: boolean;
  etiqueta: string;
}

interface Tramo {
  inicio: number; // minutos desde el domingo 00:00
  fin: number;
}

function aMinutos(hhmm: string): number | null {
  const m = /^(\d{1,2}):(\d{2})/.exec((hhmm ?? "").trim());
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 24 || min > 59) return null;
  return h * 60 + min;
}

function aHHmm(minutosDelDia: number): string {
  const m = ((minutosDelDia % MIN_POR_DIA) + MIN_POR_DIA) % MIN_POR_DIA;
  const h = Math.floor(m / 60);
  return `${String(h).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}

function construirTramos(horarios: Horario[]): Tramo[] {
  const base: Tramo[] = [];
  for (const h of horarios) {
    const abre = aMinutos(h.abre);
    let cierra = aMinutos(h.cierra);
    if (abre === null || cierra === null) continue;
    if (cierra <= abre) cierra += MIN_POR_DIA;
    base.push({ inicio: h.dia * MIN_POR_DIA + abre, fin: h.dia * MIN_POR_DIA + cierra });
  }
  const todos = [-MIN_POR_SEMANA, 0, MIN_POR_SEMANA].flatMap((desfase) =>
    base.map((t) => ({ inicio: t.inicio + desfase, fin: t.fin + desfase })),
  );
  todos.sort((a, b) => a.inicio - b.inicio);

  const unidos: Tramo[] = [];
  for (const t of todos) {
    const ultimo = unidos[unidos.length - 1];
    if (ultimo && t.inicio <= ultimo.fin) ultimo.fin = Math.max(ultimo.fin, t.fin);
    else unidos.push({ ...t });
  }
  return unidos;
}

export function calcularEstado(
  horarios: Horario[] | null | undefined,
  ahora: Date = new Date(),
): EstadoApertura {
  const tramos = construirTramos(horarios ?? []);
  if (tramos.length === 0) return { abierto: false, etiqueta: "Sin horarios" };

  const dia = diaDeLaSemana(ahora);
  const ahoraMin = dia * MIN_POR_DIA + ahora.getHours() * 60 + ahora.getMinutes();

  const actual = tramos.find((t) => t.inicio <= ahoraMin && ahoraMin < t.fin);
  if (actual) return { abierto: true, etiqueta: `Abierto · cierra ${aHHmm(actual.fin)}` };

  const proximo = tramos.find((t) => t.inicio > ahoraMin);
  if (!proximo) return { abierto: false, etiqueta: "Cerrado" };

  const diaProximo = Math.floor(proximo.inicio / MIN_POR_DIA);
  const diferencia = diaProximo - dia;
  const hora = aHHmm(proximo.inicio);
  const cuando =
    diferencia === 0
      ? hora
      : diferencia === 1
        ? `mañana ${hora}`
        : `${NOMBRES_DIA[((diaProximo % 7) + 7) % 7]} ${hora}`;
  return { abierto: false, etiqueta: `Cerrado · abre ${cuando}` };
}

export function abiertoAhora(
  horarios: Horario[] | null | undefined,
  ahora: Date = new Date(),
): boolean {
  return calcularEstado(horarios, ahora).abierto;
}