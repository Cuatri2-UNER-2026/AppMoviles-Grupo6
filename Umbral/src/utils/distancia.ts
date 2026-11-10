import type { Coordenadas } from "../tipos";

const RADIO_TIERRA_M = 6371000;

const aRadianes = (grados: number) => (grados * Math.PI) / 180;

export function distanciaEnMetros(a: Coordenadas, b: Coordenadas): number {
  const dLat = aRadianes(b.latitud - a.latitud);
  const dLon = aRadianes(b.longitud - a.longitud);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(aRadianes(a.latitud)) * Math.cos(aRadianes(b.latitud)) * Math.sin(dLon / 2) ** 2;
  return 2 * RADIO_TIERRA_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function formatearDistancia(metros: number): string {
  if (!Number.isFinite(metros)) return "";
  if (metros < 1000) {
    const redondeado = Math.max(10, Math.round(metros / 10) * 10);
    return redondeado >= 1000 ? "1 km" : `${redondeado} m`;
  }
  const km = Math.round(metros / 100) / 10;
  return `${String(km).replace(".", ",")} km`;
}