import { obtenerToken } from "../almacenamiento/seguro";
import type { Meta } from "../tipos/api";

const BASE = process.env.EXPO_PUBLIC_API_URL;

export class ErrorApi extends Error {
  constructor(
    public codigo: string,
    mensaje: string,
    public estado: number,
  ) {
    super(mensaje);
  }
}

interface Opciones {
  metodo?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  cuerpo?: unknown;
  params?: Record<string, string | number | undefined>;
}

export async function pedir<T>(
  ruta: string,
  op: Opciones = {},
): Promise<{ datos: T; meta: Meta | null }> {
  if (!BASE) {
    throw new ErrorApi("SIN_CONFIGURAR", "Falta EXPO_PUBLIC_API_URL en el .env", 0);
  }

  const pares = Object.entries(op.params ?? {})
    .filter(([, v]) => v !== undefined)
    .map(([k, v]) => [k, String(v)] as [string, string]);
  const query = pares.length ? `?${new URLSearchParams(pares).toString()}` : "";

  const token = await obtenerToken();
  let res: Response;
  try {
    res = await fetch(`${BASE}${ruta}${query}`, {
      method: op.metodo ?? "GET",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: op.cuerpo ? JSON.stringify(op.cuerpo) : undefined,
    });
  } catch {
    throw new ErrorApi("SIN_RED", "No pudimos conectarnos. Revisá tu conexión.", 0);
  }

  if (res.status === 204) return { datos: undefined as T, meta: null };

  const json = await res.json().catch(() => null);
  if (!res.ok || json?.error) {
    throw new ErrorApi(
      json?.error?.codigo ?? "ERROR",
      json?.error?.mensaje ?? "Algo salió mal.",
      res.status,
    );
  }
  return { datos: json.datos as T, meta: json.meta };
}