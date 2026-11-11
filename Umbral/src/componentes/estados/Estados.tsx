import Ionicons from "@react-native-vector-icons/ionicons";
import type { ComponentProps } from "react";
import { ActivityIndicator, StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";
import { colores, fuentes } from "../../tema";
import { Boton } from "../ui/Boton";

type Icono = ComponentProps<typeof Ionicons>["name"];
interface Base {
  style?: StyleProp<ViewStyle>;
}

export function EstadoCarga({ texto = "Cargando…", style }: Base & { texto?: string }) {
  return (
    <View style={[estilos.centro, style]} accessibilityRole="progressbar">
      <ActivityIndicator size="large" color={colores.indigo} />
      <Text style={estilos.texto}>{texto}</Text>
    </View>
  );
}

export function EstadoVacio({
  icono = "storefront-outline",
  titulo,
  texto,
  accion,
  style,
}: Base & {
  icono?: Icono;
  titulo: string;
  texto?: string;
  accion?: { etiqueta: string; onPress: () => void };
}) {
  return (
    <View style={[estilos.centro, style]}>
      <Ionicons name={icono} size={40} color={colores.pizarra} />
      <Text style={estilos.titulo}>{titulo}</Text>
      {texto ? <Text style={estilos.texto}>{texto}</Text> : null}
      {accion && <Boton texto={accion.etiqueta} onPress={accion.onPress} variante="indigo" compacto />}
    </View>
  );
}

export function EstadoError({
  titulo = "No pudimos cargar los datos",
  texto,
  onReintentar,
  style,
}: Base & { titulo?: string; texto?: string | null; onReintentar?: () => void }) {
  return (
    <View style={[estilos.centro, style]}>
      <Ionicons name="cloud-offline-outline" size={40} color={colores.pizarra} />
      <Text style={estilos.titulo}>{titulo}</Text>
      {texto ? <Text style={estilos.texto}>{texto}</Text> : null}
      {onReintentar && <Boton texto="Reintentar" onPress={onReintentar} variante="indigo" compacto />}
    </View>
  );
}

const estilos = StyleSheet.create({
  centro: { flex: 1, alignItems: "center", justifyContent: "center", gap: 10, padding: 32 },
  titulo: { fontFamily: fuentes.subtitulo, fontSize: 16, color: colores.pizarra, textAlign: "center" },
  texto: { fontFamily: fuentes.texto, fontSize: 13, color: colores.gris, textAlign: "center" },
});
