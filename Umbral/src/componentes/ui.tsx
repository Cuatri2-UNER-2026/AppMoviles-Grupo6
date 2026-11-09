// Componentes compartidos por todas las pantallas: tarjeta de vidrio, chip,
// botón y los estados de carga, vacío y error.
import { Ionicons, type IoniconsIconName } from "@react-native-vector-icons/ionicons";
import { BlurView } from "expo-blur";
import type { ReactNode } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { colores, fuentes, radio } from "../tema";

// ---------- Tarjeta de vidrio ----------

/**
 * Tarjeta translúcida con desenfoque. En iOS el desenfoque es nativo; en Android
 * expo-blur dibuja un fondo semitransparente, así que se ve igual de prolija.
 */
export function TarjetaVidrio({
  children,
  style,
  intensidad = 40,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  intensidad?: number;
}) {
  return (
    <View style={[ui.vidrio, style]}>
      <BlurView
        intensity={intensidad}
        tint="light"
        style={StyleSheet.absoluteFill}
      />
      <View style={ui.vidrioContenido}>{children}</View>
    </View>
  );
}

// ---------- Chip ----------

export function Chip({
  texto,
  activo = false,
  onPress,
  color,
  icono,
  conSombra = false,
}: {
  texto: string;
  activo?: boolean;
  onPress?: () => void;
  /** Punto de color a la izquierda (por ejemplo, el color del rubro). */
  color?: string;
  icono?: IoniconsIconName;
  /** Para chips que flotan sobre el mapa. */
  conSombra?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [
        ui.chip,
        activo && ui.chipActivo,
        conSombra && ui.sombra,
        pressed && { opacity: 0.7 },
      ]}
      accessibilityRole="button"
      accessibilityState={{ selected: activo }}
    >
      {color && <View style={[ui.punto, { backgroundColor: color }]} />}
      {icono && <Ionicons name={icono} size={14} color={activo ? "#fff" : colores.texto} />}
      <Text style={[ui.textoChip, activo && { color: "#fff" }]}>{texto}</Text>
    </Pressable>
  );
}

// ---------- Botón ----------

type Variante = "primario" | "secundario" | "peligro";

export function Boton({
  texto,
  onPress,
  variante = "primario",
  icono,
  cargando = false,
  deshabilitado = false,
  style,
}: {
  texto: string;
  onPress: () => void;
  variante?: Variante;
  icono?: IoniconsIconName;
  cargando?: boolean;
  deshabilitado?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const colorTexto = variante === "secundario" ? colores.texto : "#fff";
  const inactivo = deshabilitado || cargando;
  return (
    <Pressable
      onPress={onPress}
      disabled={inactivo}
      style={({ pressed }) => [
        ui.boton,
        variante === "secundario" && ui.botonSecundario,
        variante === "peligro" && { backgroundColor: colores.error },
        (pressed || inactivo) && { opacity: inactivo ? 0.5 : 0.8 },
        style,
      ]}
      accessibilityRole="button"
      accessibilityState={{ disabled: inactivo, busy: cargando }}
    >
      {cargando ? (
        <ActivityIndicator color={colorTexto} />
      ) : (
        <>
          {icono && <Ionicons name={icono} size={17} color={colorTexto} />}
          <Text style={[ui.textoBoton, { color: colorTexto }]}>{texto}</Text>
        </>
      )}
    </Pressable>
  );
}

// ---------- Estados de pantalla ----------

export function EstadoCarga({ texto }: { texto?: string }) {
  return (
    <View style={ui.estado}>
      <ActivityIndicator size="large" color={colores.texto} />
      {texto && <Text style={ui.textoEstado}>{texto}</Text>}
    </View>
  );
}

export function EstadoVacio({
  titulo,
  texto,
  icono = "file-tray-outline",
  accion,
}: {
  titulo: string;
  texto?: string;
  icono?: IoniconsIconName;
  accion?: { texto: string; onPress: () => void };
}) {
  return (
    <View style={ui.estado}>
      <View style={ui.iconoEstado}>
        <Ionicons name={icono} size={30} color={colores.acentoOscuro} />
      </View>
      <Text style={ui.tituloEstado}>{titulo}</Text>
      {texto && <Text style={ui.textoEstado}>{texto}</Text>}
      {accion && <Boton texto={accion.texto} onPress={accion.onPress} variante="secundario" />}
    </View>
  );
}

export function EstadoError({
  mensaje,
  onReintentar,
}: {
  mensaje: string;
  onReintentar?: () => void;
}) {
  return (
    <View style={ui.estado}>
      <View style={[ui.iconoEstado, { backgroundColor: "#F6E1DE" }]}>
        <Ionicons name="cloud-offline-outline" size={30} color={colores.error} />
      </View>
      <Text style={ui.tituloEstado}>No pudimos cargar esto</Text>
      <Text style={ui.textoEstado}>{mensaje}</Text>
      {onReintentar && <Boton texto="Reintentar" icono="refresh" onPress={onReintentar} />}
    </View>
  );
}

// ---------- Estilos ----------

const sombra: ViewStyle = Platform.select({
  android: { elevation: 4 },
  default: {
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
}) as ViewStyle;

const ui = StyleSheet.create({
  vidrio: {
    borderRadius: radio.l,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.7)",
    backgroundColor: Platform.OS === "android" ? "rgba(255,255,255,0.88)" : "rgba(255,255,255,0.45)",
  },
  vidrioContenido: { padding: 16 },
  sombra,
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radio.pill,
    backgroundColor: colores.superficie,
    borderWidth: 1,
    borderColor: colores.borde,
  },
  chipActivo: { backgroundColor: colores.texto, borderColor: colores.texto },
  textoChip: { fontFamily: fuentes.cuerpoFuerte, fontSize: 13, color: colores.texto },
  punto: { width: 9, height: 9, borderRadius: 5 },
  boton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    minHeight: 46,
    paddingHorizontal: 18,
    borderRadius: radio.m,
    backgroundColor: colores.texto,
  },
  botonSecundario: {
    backgroundColor: colores.superficie,
    borderWidth: 1,
    borderColor: colores.borde,
  },
  textoBoton: { fontFamily: fuentes.cuerpoFuerte, fontSize: 15 },
  estado: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32, gap: 12 },
  iconoEstado: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colores.lila,
  },
  tituloEstado: { fontFamily: fuentes.titulo, fontSize: 17, color: colores.texto, textAlign: "center" },
  textoEstado: {
    fontFamily: fuentes.cuerpo,
    fontSize: 14,
    color: colores.textoSuave,
    textAlign: "center",
    maxWidth: 320,
  },
});
