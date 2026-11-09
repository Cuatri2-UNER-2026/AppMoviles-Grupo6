// Tema de Umbral: colores y fuentes compartidos por todas las pantallas.
// Las fuentes se cargan una sola vez en app/_layout.tsx.

export const colores = {
  fondo: "#F2F4F7", // niebla
  superficie: "#FFFFFF",
  texto: "#2B3441", // pizarra
  textoSuave: "#6B7280",
  borde: "#E3E6EC",
  acento: "#7C8CE0", // índigo
  acentoOscuro: "#4F5FB8",
  lila: "#D9D4F0",
  salvia: "#CFE3D8",
  durazno: "#F8D9C8",
  celeste: "#CFE2F3",
  abierto: "#2F8A57",
  cerrado: "#B4483C",
  aviso: "#F5C451",
  error: "#B4483C",
};

export const fuentes = {
  titulo: "Sora_600SemiBold",
  tituloFuerte: "Sora_700Bold",
  cuerpo: "PlusJakartaSans_400Regular",
  cuerpoFuerte: "PlusJakartaSans_600SemiBold",
};

export const espacio = { xs: 4, s: 8, m: 12, l: 16, xl: 24 };
export const radio = { s: 8, m: 12, l: 20, pill: 999 };

export const tema = { colores, fuentes, espacio, radio };
export default tema;
