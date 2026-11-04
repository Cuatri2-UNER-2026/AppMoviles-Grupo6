
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { promocionesService } from "../../src/servicios/promociones";

export default function NuevaPromocionScreen() {
  const router = useRouter();

  const [titulo, setTitulo] = useState("");
  const [detalle, setDetalle] = useState("");
  const [descuento, setDescuento] = useState("");
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [soloApp, setSoloApp] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const validarFecha = (fecha: string): boolean => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
      return false;
    }

    const [anio, mes, dia] = fecha.split("-").map(Number);
    const fechaValida = new Date(anio, mes - 1, dia);

    return (
      fechaValida.getFullYear() === anio &&
      fechaValida.getMonth() === mes - 1 &&
      fechaValida.getDate() === dia
    );
  };

  const guardarPromocion = async () => {
    if (!titulo.trim() || !detalle.trim() || !hasta.trim()) {
      Alert.alert(
        "Datos incompletos",
        "Completá el título, el detalle y la fecha de vencimiento."
      );
      return;
    }

    if (!validarFecha(hasta)) {
      Alert.alert(
        "Fecha incorrecta",
        "Ingresá la fecha de vencimiento con formato AAAA-MM-DD."
      );
      return;
    }

    if (desde.trim() && !validarFecha(desde)) {
      Alert.alert(
        "Fecha incorrecta",
        "Ingresá la fecha de inicio con formato AAAA-MM-DD."
      );
      return;
    }

    const fechaVencimiento = new Date(`${hasta}T23:59:59-03:00`);

    if (fechaVencimiento <= new Date()) {
      Alert.alert(
        "Fecha incorrecta",
        "La fecha de vencimiento debe ser posterior al momento actual."
      );
      return;
    }

    if (desde.trim()) {
      const fechaInicio = new Date(`${desde}T00:00:00-03:00`);

      if (fechaInicio <= new Date()) {
        Alert.alert(
          "Fecha incorrecta",
          "La fecha de inicio debe ser futura. Si querés que comience ahora, dejá ese campo vacío."
        );
        return;
      }

      if (fechaVencimiento <= fechaInicio) {
        Alert.alert(
          "Fechas incorrectas",
          "El vencimiento debe ser posterior a la fecha de inicio."
        );
        return;
      }
    }

    let descuentoNumerico: number | null = null;

    if (descuento.trim()) {
      descuentoNumerico = Number(descuento);

      if (
        !Number.isInteger(descuentoNumerico) ||
        descuentoNumerico < 1 ||
        descuentoNumerico > 100
      ) {
        Alert.alert(
          "Descuento incorrecto",
          "El descuento debe ser un número entero entre 1 y 100."
        );
        return;
      }
    }

    try {
      setGuardando(true);

      await promocionesService.crearPromocion({
        titulo: titulo.trim(),
        detalle: detalle.trim(),
        descuento: descuentoNumerico,
        ...(desde.trim()
          ? { desde: `${desde}T00:00:00-03:00` }
          : {}),
        hasta: `${hasta}T23:59:59-03:00`,
        soloApp,
      });

      Alert.alert(
        "¡Promoción creada!",
        "La promoción se guardó correctamente.",
        [
          {
            text: "Aceptar",
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error: any) {
      Alert.alert(
        "Error",
        error.message || "No se pudo crear la promoción."
      );
    } finally {
      setGuardando(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contenido}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.titulo}>Nueva promoción</Text>

      <Text style={styles.subtitulo}>
        Completá los datos para publicar una promoción de tu comercio.
      </Text>

      <Text style={styles.label}>Título *</Text>
      <TextInput
        style={styles.input}
        placeholder="Ej: 20% en pinturas"
        placeholderTextColor="#ADB5BD"
        value={titulo}
        onChangeText={setTitulo}
        maxLength={100}
      />

      <Text style={styles.label}>Detalle y condiciones *</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Describí la promoción y sus condiciones..."
        placeholderTextColor="#ADB5BD"
        value={detalle}
        onChangeText={setDetalle}
        multiline
        textAlignVertical="top"
        maxLength={500}
      />

      <Text style={styles.label}>Descuento (%)</Text>
      <TextInput
        style={styles.input}
        placeholder="Ej: 20 (opcional)"
        placeholderTextColor="#ADB5BD"
        value={descuento}
        onChangeText={setDescuento}
        keyboardType="numeric"
      />

      <Text style={styles.label}>Fecha de inicio</Text>
      <TextInput
        style={styles.input}
        placeholder="AAAA-MM-DD (opcional)"
        placeholderTextColor="#ADB5BD"
        value={desde}
        onChangeText={setDesde}
        keyboardType="numbers-and-punctuation"
      />
      <Text style={styles.ayuda}>
        Si lo dejás vacío, la promoción comienza según la fecha que asigne el servidor.
      </Text>

      <Text style={styles.label}>Fecha de vencimiento *</Text>
      <TextInput
        style={styles.input}
        placeholder="AAAA-MM-DD"
        placeholderTextColor="#ADB5BD"
        value={hasta}
        onChangeText={setHasta}
        keyboardType="numbers-and-punctuation"
      />

      <View style={styles.filaSwitch}>
        <View style={styles.switchTexto}>
          <Text style={styles.labelSwitch}>Solo para usuarios de la app</Text>
          <Text style={styles.ayuda}>
            La promoción será exclusiva para quienes utilicen Umbral.
          </Text>
        </View>

        <Switch
          value={soloApp}
          onValueChange={setSoloApp}
          trackColor={{ false: "#CED4DA", true: "#8AB6A0" }}
          thumbColor={soloApp ? "#FFFFFF" : "#F8F9FA"}
        />
      </View>

      <Text style={styles.obligatorio}>
        * Campos obligatorios
      </Text>

      <TouchableOpacity
        style={[
          styles.botonGuardar,
          guardando && styles.botonDeshabilitado,
        ]}
        onPress={guardarPromocion}
        disabled={guardando}
      >
        {guardando ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.botonGuardarTexto}>
            Crear promoción
          </Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.botonCancelar}
        onPress={() => router.back()}
        disabled={guardando}
      >
        <Text style={styles.botonCancelarTexto}>Cancelar</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  contenido: {
    padding: 20,
    paddingTop: 55,
    paddingBottom: 40,
  },
  titulo: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1A1D20",
  },
  subtitulo: {
    fontSize: 14,
    color: "#6C757D",
    marginTop: 6,
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1A1D20",
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DEE2E6",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 15,
    color: "#1A1D20",
  },
  textArea: {
    minHeight: 110,
  },
  ayuda: {
    fontSize: 12,
    color: "#6C757D",
    marginTop: 6,
    lineHeight: 18,
  },
  filaSwitch: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 12,
    marginTop: 24,
    borderWidth: 1,
    borderColor: "#DEE2E6",
  },
  switchTexto: {
    flex: 1,
    paddingRight: 12,
  },
  labelSwitch: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1A1D20",
  },
  obligatorio: {
    color: "#6C757D",
    fontSize: 12,
    marginTop: 18,
  },
  botonGuardar: {
    backgroundColor: "#1A1D20",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 20,
  },
  botonDeshabilitado: {
    opacity: 0.6,
  },
  botonGuardarTexto: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  botonCancelar: {
    padding: 14,
    alignItems: "center",
    marginTop: 8,
  },
  botonCancelarTexto: {
    color: "#6C757D",
    fontWeight: "600",
  },
});
