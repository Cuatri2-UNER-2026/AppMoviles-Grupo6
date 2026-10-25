import type { Usuario } from "./index";

export interface Meta {
  total: number;
  pagina: number;
  porPagina: number;
}

export interface Sesion {
  token: string;
  usuario: Usuario;
}