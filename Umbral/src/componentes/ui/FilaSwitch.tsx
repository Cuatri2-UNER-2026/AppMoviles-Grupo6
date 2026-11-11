import { StyleSheet, Switch, Text, View, type StyleProp, type ViewStyle } from "react-native";
import { colores, fuentes } from "../../tema";
import { TarjetaVidrio } from "./TarjetaVidrio";

interface Props {
  titulo: string;
  descripcion?: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
  style?: StyleProp<ViewStyle>;
}

export function FilaSwitch({ titulo, descripcion, value, onValueChange, style }: Props) {
  return (
    <TarjetaVidrio style={[estilos.fila, style]}>
      <View style={{ flex: 1 }}>
        <Text style={estilos.titulo}>{titulo}</Text>
        {descripcion ? <Text style={estilos.descripcion}>{descripcion}</Text> : null}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ true: colores.indigo, false: colores.grisBorde  }}
        thumbColor={colores.blanco}
        ios_backgroundColor={colores.grisBorde}
      />
    </TarjetaVidrio>
  );
}

const estilos = StyleSheet.create({
  fila: { flexDirection: "row", alignItems: "center", gap: 12, padding: 16 },
  titulo: { fontFamily: fuentes.textoNegrita, fontSize: 15, color: colores.pizarra },
  descripcion: { fontFamily: fuentes.texto, fontSize: 13, lineHeight: 18, color: colores.gris, marginTop: 2 },
});
