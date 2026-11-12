export const formatearPuntaje = (puntaje: number) =>
    puntaje.toFixed(1).replace(".", ",");

export const formatearDuracion = (seg: number) =>
    `${Math.floor(seg / 60)}:${String(Math.round(seg % 60)).padStart(2, "0")}`;
