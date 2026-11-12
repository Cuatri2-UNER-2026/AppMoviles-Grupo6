export const DIA_MS = 24 * 60 * 60 * 1000;

export function validarFecha(fecha: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return false;
  const [anio, mes, dia] = fecha.split("-").map(Number);
  const f = new Date(anio, mes - 1, dia);
  return f.getFullYear() === anio && f.getMonth() === mes - 1 && f.getDate() === dia;
}

export const fechaCorta = (iso: string) =>
  new Date(iso).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit" });

export function fechaParaInput(valor: string): string {
  const f = new Date(valor);
  if (isNaN(f.getTime())) return "";
  const mes = String(f.getMonth() + 1).padStart(2, "0");
  const dia = String(f.getDate()).padStart(2, "0");
  return `${f.getFullYear()}-${mes}-${dia}`;
}

export const inicioDelDia = (aaaammdd: string) => `${aaaammdd}T00:00:00-03:00`;
export const finDelDia = (aaaammdd: string) => `${aaaammdd}T23:59:59-03:00`;

/** "hace unos minutos", "hace 3 horas", "hace 2 días"… */
export function hace(desdeMs: number, ahoraMs: number = Date.now()): string {
  const min = Math.max(0, Math.round((ahoraMs - desdeMs) / 60_000));
  if (min < 2) return "hace un momento";
  if (min < 60) return `hace ${min} minutos`;
  const horas = Math.round(min / 60);
  if (horas < 24) return `hace ${horas} ${horas === 1 ? "hora" : "horas"}`;
  const dias = Math.round(horas / 24);
  return `hace ${dias} ${dias === 1 ? "día" : "días"}`;
}