import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BotonRedondo, FondoDegradado } from "../../src/componentes";
import { FormularioPromocion, type DatosPromocion } from "../../src/componentes/promo/FormularioPromocion";
import { promocionesService } from "../../src/servicios/promociones";
import { colores, fuentes } from "../../src/tema";

export default function NuevaPromocionScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [guardando, setGuardando] = useState(false);

  async function crear(datos: DatosPromocion) {
    try {
      setGuardando(true);
      await promocionesService.crearPromocion(datos);
      Alert.alert("¡Promoción creada!", "La promoción se guardó correctamente.", [
        { text: "Aceptar", onPress: () => router.back() },
      ]);
    } catch (e: any) {
      Alert.alert("Error", e.message || "No se pudo crear la promoción.");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <FondoDegradado colores={[colores.salvia, colores.niebla, colores.niebla, colores.lila]}>
      <ScrollView
        contentContainerStyle={[estilos.contenido, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 40 }]}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
      >
        <View style={{ alignSelf: "flex-start" }}>
          <BotonRedondo />
        </View>
        <View>
          <Text style={estilos.titulo}>Nueva promoción</Text>
          <Text style={estilos.subtitulo}>Completá los datos para publicar una promoción de tu comercio.</Text>
        </View>

        <FormularioPromocion
          modo="crear"
          textoBoton="Crear promoción"
          guardando={guardando}
          onGuardar={crear}
          onCancelar={() => router.back()}
        />
      </ScrollView>
    </FondoDegradado>
  );
}

const estilos = StyleSheet.create({
  contenido: { paddingHorizontal: 20, gap: 16 },
  titulo: { fontFamily: fuentes.titulo, fontSize: 30, color: colores.pizarra, letterSpacing: -0.5 },
  subtitulo: { fontFamily: fuentes.texto, fontSize: 14, color: colores.gris, marginTop: 4 },
});
