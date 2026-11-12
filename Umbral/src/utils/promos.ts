import type { Promocion } from "../tipos";
import { DIA_MS, fechaCorta } from "./fechas";

export function partirTitulo(p: Promocion): { grande: string; resto: string } {
    if (p.descuento !== null) {
        const resto = p.titulo
            .replace(new RegExp(`^\\s*${p.descuento}\\s*%\\s*`), "")
            .trim();
        return { grande: `${p.descuento}%`, resto: resto || p.titulo };
    }
    const m = /^(\S{1,5})\s+(.+)$/.exec(p.titulo.trim());
    if (m && /\d/.test(m[1])) return { grande: m[1], resto: m[2] };
    return { grande: "Promo", resto: p.titulo };
}

export function vigencia(p: Promocion, ahora: number): string {
    const desde = Date.parse(p.desde);
    const hasta = Date.parse(p.hasta);
    if (desde > ahora) {
        const dias = Math.ceil((desde - ahora) / DIA_MS);
        if (dias <= 1) return "Arranca mañana";
        if (dias <= 7) {
            const dia = new Date(desde).toLocaleDateString("es-AR", {
                weekday: "long",
            });
            return `Arranca el ${dia}`;
        }
        return `Desde el ${fechaCorta(p.desde)}`;
    }
    const dias = Math.ceil((hasta - ahora) / DIA_MS);
    if (dias <= 1) return "Vence hoy";
    if (dias <= 3) return `Vence en ${dias} días`;
    return `Hasta el ${fechaCorta(p.hasta)}`;
}

export const estaVencida = (p: Promocion, ahora = Date.now()) =>
    Date.parse(p.hasta) < ahora;
export const estaVigente = (p: Promocion, ahora = Date.now()) =>
    p.activa && Date.parse(p.desde) <= ahora && !estaVencida(p, ahora);
