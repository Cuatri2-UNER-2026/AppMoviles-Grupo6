import { memo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colores, fuentes } from "../../tema";

interface Props {
  texto: string;
  activo: boolean;
  onPress: () => void;
  color?: string;
  solido?: boolean;
}

export const Chip = memo(function Chip({ texto, activo, onPress, color, solido }: Props) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: activo }}
      style={({ pressed }) => [
        estilos.chip,
        solido && estilos.solido,
        activo && estilos.activo,
        pressed && { opacity: 0.85 },
      ]}
    >
      {color && <View style={[estilos.punto, { backgroundColor: color }]} />}
      <Text style={[estilos.texto, activo && estilos.textoActivo]}>{texto}</Text>
    </Pressable>
  );
});

const estilos = StyleSheet.create({
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    height: 34,
    borderRadius: 999,
    backgroundColor: colores.vidrio,
    borderWidth: 1,
    borderColor: colores.bordeVidrio,
  },
  solido: {
    backgroundColor: colores.blanco,
    borderWidth: 0,
    elevation: 3,
    shadowColor: colores.negro,
    shadowOpacity: 0.12,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
  },
  activo: { backgroundColor: colores.pizarra, borderColor: colores.pizarra },
  punto: { width: 9, height: 9, borderRadius: 5 },
  texto: { fontFamily: fuentes.textoMedio, fontSize: 13, color: colores.pizarra },
  textoActivo: { color: colores.blanco },
});
