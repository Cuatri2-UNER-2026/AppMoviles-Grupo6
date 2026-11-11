import Ionicons from "@react-native-vector-icons/ionicons";
import type { ComponentProps } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { colores, fuentes } from "../../tema";

type Icono = ComponentProps<typeof Ionicons>["name"];
export type VarianteBoton = "primario" | "claro" | "blanco" | "peligro" | "indigo" | "texto";

const VARIANTES: Record<VarianteBoton, { fondo: string; texto: string }> = {
  primario: { fondo: colores.pizarra, texto: colores.blanco },
  claro: { fondo: colores.vidrioFuerte, texto: colores.pizarra },
  blanco: { fondo: colores.blanco, texto: colores.pizarra },
  peligro: { fondo: colores.vidrioFuerte, texto: colores.error },
  indigo: { fondo: colores.indigo, texto: colores.blanco },
  texto: { fondo: "transparent", texto: colores.indigo },
};

interface Props {
  texto: string;
  onPress: () => void;
  variante?: VarianteBoton;
  cargando?: boolean;
  deshabilitado?: boolean;
  icono?: Icono;
  /** Versión chica (alto 40) para tarjetas. */
  compacto?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function Boton({
  texto,
  onPress,
  variante = "primario",
  cargando,
  deshabilitado,
  icono,
  compacto,
  style,
}: Props) {
  const v = VARIANTES[variante];
  const apagado = !!(cargando || deshabilitado);

  return (
    <Pressable
      onPress={onPress}
      disabled={apagado}
      accessibilityRole="button"
      accessibilityLabel={texto}
      accessibilityState={{ disabled: apagado, busy: !!cargando }}
      style={({ pressed }) => [
        estilos.base,
        compacto && estilos.compacto,
        { backgroundColor: v.fondo },
        apagado && estilos.apagado,
        pressed && estilos.presionado,
        style,
      ]}
    >
      {cargando ? (
        <ActivityIndicator color={v.texto} />
      ) : (
        <>
          {icono && <Ionicons name={icono} size={compacto ? 16 : 18} color={v.texto} />}
          <Text
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.75}
            style={[estilos.texto, compacto && estilos.textoCompacto, { color: v.texto }]}
          >
            {texto}
          </Text>
        </>
      )}
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  base: {
    minHeight: 52,
    borderRadius: 999,
    paddingHorizontal: 22,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  compacto: { minHeight: 40, paddingHorizontal: 16 },
  apagado: { opacity: 0.55 },
  presionado: { opacity: 0.85 },
  texto: { fontFamily: fuentes.textoNegrita, fontSize: 16, flexShrink: 1 },
  textoCompacto: { fontSize: 13 },
});