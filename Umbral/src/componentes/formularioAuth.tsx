import Ionicons from "@react-native-vector-icons/ionicons";
import { LinearGradient } from "expo-linear-gradient";
import { useState, type ComponentProps, type ReactNode } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { colores, fuentes } from "../tema";

export const C = colores;

export const EMAIL_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function PantallaAuth({ fondo, children }: {
  fondo: ComponentProps<typeof LinearGradient>["colors"];
  children: ReactNode;
}) {
  return (
    <LinearGradient colors={fondo} style={estilos.fondo}>
      <KeyboardAvoidingView style={estilos.fondo} behavior={Platform.OS === "android" ? "padding" : undefined}>
        <ScrollView
          contentContainerStyle={estilos.pantalla}
          keyboardShouldPersistTaps="handled"
          automaticallyAdjustKeyboardInsets
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

export function Campo({ etiqueta, valor, alCambiar, error, ayuda, ...resto }: {
  etiqueta: string;
  valor: string;
  alCambiar: (v: string) => void;
  error?: string;
  ayuda?: string;
} & Omit<ComponentProps<typeof TextInput>, "value" | "onChangeText" | "onChange">) {
  const [visible, setVisible] = useState(false);
  const esClave = !!resto.secureTextEntry;

  return (
    <View style={estilos.campo}>
      <Text style={estilos.etiqueta}>{etiqueta}</Text>
      <View>
        <TextInput
          value={valor}
          onChangeText={alCambiar}
          autoCapitalize="none"
          placeholderTextColor={colores.gris}
          accessibilityLabel={etiqueta}
          {...resto}
          secureTextEntry={esClave && !visible}
          style={[
            estilos.input,
            esClave && estilos.inputConOjo,
            resto.multiline && estilos.inputMultilinea,
            error ? estilos.inputError : null,
          ]}
        />
        {esClave && (
          <Pressable
            style={estilos.ojo}
            onPress={() => setVisible((v) => !v)}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
          >
            <Ionicons name={visible ? "eye-off-outline" : "eye-outline"} size={22} color={colores.gris} />
          </Pressable>
        )}
      </View>
      {error ? <Text style={estilos.error}>{error}</Text> : ayuda ? <Text style={estilos.ayuda}>{ayuda}</Text> : null}
    </View>
  );
}

export const estilos = StyleSheet.create({
  fondo: { flex: 1 },
  pantalla: { flexGrow: 1, justifyContent: "center", padding: 20, paddingTop: 70, paddingBottom: 40, gap: 8 },
  titulo: { fontFamily: fuentes.titulo, fontSize: 44, color: colores.pizarra, letterSpacing: -1 },
  subtitulo: { fontFamily: fuentes.texto, fontSize: 16, color: colores.gris, marginBottom: 16 },
  tarjeta: {
    backgroundColor: colores.vidrio,
    borderRadius: 32,
    padding: 20,
    gap: 14,
    borderWidth: 1,
    borderColor: colores.bordeVidrio,
  },
  campo: { gap: 6 },
  etiqueta: { fontFamily: fuentes.textoNegrita, fontSize: 14, color: colores.pizarra, marginLeft: 6 },
  input: {
    backgroundColor: colores.blanco,
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 14,
    fontFamily: fuentes.texto,
    fontSize: 16,
    color: colores.pizarra,
    borderWidth: 1.5,
    borderColor: "transparent",
  },
  inputMultilinea: { borderRadius: 24, minHeight: 110, textAlignVertical: "top" },
  inputConOjo: { paddingRight: 52 },
  inputError: { borderColor: colores.error },
  ojo: { position: "absolute", right: 16, top: 0, bottom: 0, justifyContent: "center" },
  error: { fontFamily: fuentes.textoMedio, color: colores.error, fontSize: 13, marginLeft: 6 },
  ayuda: { fontFamily: fuentes.texto, color: colores.gris, fontSize: 12, marginLeft: 6, lineHeight: 17 },
  errorApi: {
    fontFamily: fuentes.textoNegrita,
    color: colores.error,
    backgroundColor: colores.durazno,
    padding: 12,
    borderRadius: 16,
    fontSize: 14,
  },
  enlace: { fontFamily: fuentes.texto, textAlign: "center", color: colores.gris, fontSize: 15, marginTop: 18 },
  enlaceFuerte: { fontFamily: fuentes.textoNegrita, color: colores.indigo },
});