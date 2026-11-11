import { StyleSheet, Text, View } from "react-native";
import { colores, fuentes } from "../../tema";

export function Insignia({ texto = "SOLO APP" }: { texto?: string }) {
  return (
    <View style={estilos.insignia}>
      <Text style={estilos.texto}>{texto}</Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  insignia: {
    alignSelf: "flex-start",
    backgroundColor: colores.blanco,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  texto: { fontFamily: fuentes.textoNegrita, fontSize: 11, color: colores.pizarra, letterSpacing: 0.5 },
});
