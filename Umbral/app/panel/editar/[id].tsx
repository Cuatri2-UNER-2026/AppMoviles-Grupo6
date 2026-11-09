
import React, { useCallback, useEffect, useState } from "react";
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
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  promocionesService,
  Promocion,
  ActualizarPromocionInput,
} from "../../../src/servicios/promociones";

// Las fechas se cargan y se guardan en hora de Argentina (-03:00),
// sin importar la zona horaria del teléfono.
const fechaParaInput = (valor: string) => {
  const fecha = new Date(valor);

  if (isNaN(fecha.getTime())) return "";

  const enArgentina = new Date(fecha.getTime() - 3 * 60 * 60 * 1000);
  const anio = enArgentina.getUTCFullYear();
  const mes = String(enArgentina.getUTCMonth() + 1).padStart(2, "0");
  const dia = String(enArgentina.getUTCDate()).padStart(2, "0");

  return `${anio}-${mes}-${dia}`;
};

const validarFecha = (fecha: string): boolean => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return false;

  const [anio, mes, dia] = fecha.split("-").map(Number);
  const fechaValida = new Date(anio, mes - 1, dia);

  return (
    fechaValida.getFullYear() === anio &&
    fechaValida.getMonth() === mes - 1 &&
    fechaValida.getDate() === dia
  );
};

export default function EditarPromocionScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [promocion, setPromocion] = useState<Promocion | null>(null);
  const [titulo, setTitulo] = useState("");
  const [detalle, setDetalle] = useState("");
  const [descuento, setDescuento] = useState("");
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [soloApp, setSoloApp] = useState(false);

  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);

  const cargarPromocion = useCallback(async () => {
    try {
      setCargando(true);

      const promociones =
        await promocionesService.obtenerMisPromociones();

      const encontrada = promociones.find((p) => p.id === id);

      if (!encontrada) {
        Alert.alert("Error", "No se encontró la promoción.");
        router.back();
        return;
      }

      setPromocion(encontrada);
      setTitulo(encontrada.titulo);
      setDetalle(encontrada.detalle);
      setDescuento(
        encontrada.descuento !== null
          ? String(encontrada.descuento)
          : ""
      );
      setDesde(fechaParaInput(encontrada.desde));
      setHasta(fechaParaInput(encontrada.hasta));
      setSoloApp(encontrada.soloApp);
    } catch (error: any) {
      Alert.alert(
        "Error",
        error.message || "No se pudo cargar la promoción."
      );
      router.back();
    } finally {
      setCargando(false);
    }
  }, [id, router]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carga inicial
    cargarPromocion();
  }, [cargarPromocion]);

  const guardarCambios = async () => {
    if (!promocion) return;

    if (!titulo.trim() || !detalle.trim()) {
      Alert.alert(
        "Datos incompletos",
        "Completá el título y el detalle de la promoción."
      );
      return;
    }

    if (!validarFecha(desde) || !validarFecha(hasta)) {
      Alert.alert(
        "Fechas incorrectas",
        "Usá el formato AAAA-MM-DD para las fechas."
      );
      return;
    }

    const fechaInicio = new Date(`${desde}T00:00:00-03:00`);
    const fechaVencimiento = new Date(`${hasta}T23:59:59-03:00`);

    if (fechaVencimiento <= new Date()) {
      Alert.alert(
        "Fecha incorrecta",
        "La fecha de vencimiento debe ser futura."
      );
      return;
    }

    if (fechaVencimiento <= fechaInicio) {
      Alert.alert(
        "Fechas incorrectas",
        "El vencimiento debe ser posterior al inicio."
      );
      return;
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

    const datos: ActualizarPromocionInput = {};

    if (titulo.trim() !== promocion.titulo) {
      datos.titulo = titulo.trim();
    }

    if (detalle.trim() !== promocion.detalle) {
      datos.detalle = detalle.trim();
    }

    if (descuentoNumerico !== promocion.descuento) {
      datos.descuento = descuentoNumerico;
    }

    if (desde !== fechaParaInput(promocion.desde)) {
      datos.desde = `${desde}T00:00:00-03:00`;
    }

    if (hasta !== fechaParaInput(promocion.hasta)) {
      datos.hasta = `${hasta}T23:59:59-03:00`;
    }

    if (soloApp !== promocion.soloApp) {
      datos.soloApp = soloApp;
    }

    if (Object.keys(datos).length === 0) {
      Alert.alert(
        "Sin cambios",
        "No modificaste ningún dato de la promoción."
      );
      return;
    }

    try {
      setGuardando(true);

      await promocionesService.actualizarPromocion(
        promocion.id,
        datos
      );

      Alert.alert(
        "¡Cambios guardados!",
        "La promoción se actualizó correctamente.",
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
        error.message || "No se pudieron guardar los cambios."
      );
    } finally {
      setGuardando(false);
    }
  };

  if (cargando) {
    return (
      <View style={styles.centro}>
        <ActivityIndicator size="large" color="#1A1D20" />
      </View>
    );
  }

  if (!promocion) return null;

  const vencida = new Date(promocion.hasta) < new Date();

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contenido}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.titulo}>Editar promoción</Text>

      <Text style={styles.subtitulo}>
        Modificá los datos de tu promoción.
      </Text>

      <Text style={styles.label}>Título *</Text>
      <TextInput
        style={styles.input}
        value={titulo}
        onChangeText={setTitulo}
        maxLength={100}
      />

      <Text style={styles.label}>Detalle y condiciones *</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
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
        value={descuento}
        onChangeText={setDescuento}
        keyboardType="numeric"
      />

      <Text style={styles.label}>Fecha de inicio</Text>
      <TextInput
        style={styles.input}
        value={desde}
        onChangeText={setDesde}
        placeholder="AAAA-MM-DD"
      />

      <Text style={styles.label}>Fecha de vencimiento</Text>
      <TextInput
        style={styles.input}
        value={hasta}
        onChangeText={setHasta}
        placeholder="AAAA-MM-DD"
      />

      <View style={styles.filaSwitch}>
        <View style={{ flex: 1, paddingRight: 12 }}>
          <Text style={styles.labelSwitch}>
            Solo para usuarios de la app
          </Text>
          <Text style={styles.ayuda}>
            Promoción exclusiva para usuarios de Umbral.
          </Text>
        </View>

        <Switch
          value={soloApp}
          onValueChange={setSoloApp}
        />
      </View>

      {vencida && (
        <Text style={styles.aviso}>
          Esta promoción ya venció y no se puede editar.
        </Text>
      )}

      <TouchableOpacity
        style={[
          styles.botonGuardar,
          (guardando || vencida) && styles.deshabilitado,
        ]}
        onPress={guardarCambios}
        disabled={guardando || vencida}
      >
        {guardando ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.botonGuardarTexto}>
            Guardar cambios
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
  centro: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
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
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1A1D20",
    marginTop: 16,
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DEE2E6",
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: "#1A1D20",
  },
  textArea: {
    minHeight: 110,
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
  labelSwitch: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1A1D20",
  },
  ayuda: {
    fontSize: 12,
    color: "#6C757D",
    marginTop: 5,
  },
  aviso: {
    color: "#B45309",
    fontSize: 13,
    marginTop: 16,
  },
  botonGuardar: {
    backgroundColor: "#1A1D20",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 24,
  },
  deshabilitado: {
    opacity: 0.5,
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
