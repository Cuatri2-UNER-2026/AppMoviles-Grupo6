import type { ComponentProps } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";

// Piezas compartidas por las pantallas de cuenta (Parte 2)
// TODO: tomar los colores de src/tema cuando esté (Parte 1)
export const C = {
  niebla: "#F2F4F7",
  salvia: "#CFE3D8",
  lila: "#D9D4F0",
  durazno: "#F8D9C8",
  celeste: "#CFE2F3",
  pizarra: "#2B3441",
  gris: "#6B7280",
  indigo: "#7C8CE0",
  error: "#B4483C",
};

export const EMAIL_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function Campo({
  etiqueta,
  valor,
  alCambiar,
  error,
  ...resto
}: {
  etiqueta: string;
  valor: string;
  alCambiar: (v: string) => void;
  error?: string;
} & Omit<ComponentProps<typeof TextInput>, "value" | "onChangeText" | "onChange">) {
  return (
    <View style={estilos.campo}>
      <Text style={estilos.etiqueta}>{etiqueta}</Text>
      <TextInput
        value={valor}
        onChangeText={alCambiar}
        autoCapitalize="none"
        placeholderTextColor={C.gris}
        style={[estilos.input, error ? estilos.inputError : null]}
        {...resto}
      />
      {error ? <Text style={estilos.error}>{error}</Text> : null}
    </View>
  );
}

export const estilos = StyleSheet.create({
  fondo: { flex: 1 },
  pantalla: { flexGrow: 1, justifyContent: "center", padding: 20, paddingTop: 70, gap: 8 },
  titulo: { fontSize: 44, fontWeight: "800", color: C.pizarra, letterSpacing: -1 },
  subtitulo: { fontSize: 16, color: C.gris, marginBottom: 16 },
  tarjeta: {
    backgroundColor: "rgba(255,255,255,0.75)",
    borderRadius: 32,
    padding: 20,
    gap: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.9)",
  },
  campo: { gap: 6 },
  etiqueta: { fontSize: 14, fontWeight: "600", color: C.pizarra, marginLeft: 6 },
  input: {
    backgroundColor: "#fff",
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 14,
    fontSize: 16,
    color: C.pizarra,
    borderWidth: 1.5,
    borderColor: "transparent",
  },
  inputError: { borderColor: C.error },
  error: { color: C.error, fontSize: 13, marginLeft: 6 },
  errorApi: {
    color: C.error,
    backgroundColor: C.durazno,
    padding: 12,
    borderRadius: 16,
    fontSize: 14,
    fontWeight: "600",
  },
  boton: {
    backgroundColor: C.pizarra,
    borderRadius: 999,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 4,
  },
  botonApagado: { opacity: 0.6 },
  textoBoton: { color: "#fff", fontSize: 17, fontWeight: "700" },
  enlace: { textAlign: "center", color: C.gris, fontSize: 15, marginTop: 18 },
  enlaceFuerte: { color: C.indigo, fontWeight: "700" },
});
