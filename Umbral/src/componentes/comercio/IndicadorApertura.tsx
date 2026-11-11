import { StyleSheet, Text, View } from "react-native";
import { colores, fuentes } from "../../tema";
import type { EstadoApertura } from "../../utils/abiertoAhora";

/** "linea": punto + texto (tarjetas). "chip": píldora (ficha). */
export function IndicadorApertura({
  estado,
  variante = "linea",
}: {
  estado: EstadoApertura;
  variante?: "linea" | "chip";
}) {
  const color = estado.abierto ? colores.verde : colores.grisClaro;
  const esChip = variante === "chip";

  return (
    <View
      style={[
        estilos.fila,
        esChip && estilos.chip,
        esChip && { backgroundColor: estado.abierto ? colores.salvia : colores.grisChip },
      ]}
    >
      <View style={[estilos.punto, esChip && { width: 8, height: 8, borderRadius: 4 }, { backgroundColor: color }]} />
      <Text
        numberOfLines={1}
        style={[
          esChip ? estilos.textoChip : estilos.texto,
          estado.abierto && { color: colores.verde },
        ]}
      >
        {estado.etiqueta}
      </Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  fila: { flexDirection: "row", alignItems: "center", flexShrink: 1 },
  chip: { gap: 7, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8 },
  punto: { width: 7, height: 7, borderRadius: 4, marginRight: 6 },
  texto: { flexShrink: 1, fontFamily: fuentes.texto, fontSize: 12, color: colores.gris },
  textoChip: { fontFamily: fuentes.textoNegrita, fontSize: 13, color: colores.gris },
});
