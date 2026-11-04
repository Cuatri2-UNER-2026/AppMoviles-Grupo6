
import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { resenasService } from "../../src/servicios/resenas";
import type { Resena } from "../../src/tipos";

export default function ResenasScreen() {
  const router = useRouter();

  const [resenas, setResenas] = useState<Resena[]>([]);
  const [respuestas, setRespuestas] = useState<Record<string, string>>({});
  const [cargando, setCargando] = useState(true);
  const [actualizando, setActualizando] = useState(false);
  const [enviando, setEnviando] = useState<string | null>(null);
  const [error, setError] = useState("");

  const cargarResenas = useCallback(async () => {
    try {
      setError("");
      const datos = await resenasService.obtenerMisResenas();
      setResenas(datos);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "No se pudieron cargar las reseñas."
      );
    } finally {
      setCargando(false);
      setActualizando(false);
    }
  }, []);

  useEffect(() => {
    cargarResenas();
  }, [cargarResenas]);

  const actualizar = () => {
    setActualizando(true);
    cargarResenas();
  };

  const enviarRespuesta = async (resena: Resena) => {
    const respuesta = (respuestas[resena.id] || "").trim();

    if (!respuesta) {
      Alert.alert("Respuesta vacía", "Escribí una respuesta antes de enviarla.");
      return;
    }

    try {
      setEnviando(resena.id);

      const actualizada = await resenasService.responder(
        resena.id,
        respuesta
      );

      setResenas((anteriores) =>
        anteriores.map((item) =>
          item.id === resena.id ? actualizada : item
        )
      );

      setRespuestas((anteriores) => ({
        ...anteriores,
        [resena.id]: "",
      }));

      Alert.alert("Respuesta enviada", "Tu respuesta se publicó correctamente.");
    } catch (e) {
      Alert.alert(
        "No se pudo responder",
        e instanceof Error ? e.message : "Ocurrió un error."
      );
    } finally {
      setEnviando(null);
    }
  };

  const formatoFecha = (fecha: string) =>
    new Date(fecha).toLocaleDateString("es-AR");

  if (cargando) {
    return (
      <View style={styles.centrado}>
        <ActivityIndicator size="large" color="#6C63FF" />
        <Text style={styles.textoCargando}>Cargando reseñas...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.contenedor}
      contentContainerStyle={styles.contenido}
      refreshControl={
        <RefreshControl
          refreshing={actualizando}
          onRefresh={actualizar}
        />
      }
    >
      <TouchableOpacity
        style={styles.volver}
        onPress={() => router.back()}
      >
        <Text style={styles.volverTexto}>‹ Volver al panel</Text>
      </TouchableOpacity>

      <Text style={styles.titulo}>Reseñas de mi comercio</Text>
      <Text style={styles.subtitulo}>
        Consultá las opiniones y respondé a tus clientes.
      </Text>

      {error ? (
        <View style={styles.errorCaja}>
          <Text style={styles.errorTexto}>{error}</Text>
          <TouchableOpacity onPress={actualizar}>
            <Text style={styles.reintentar}>Volver a intentar</Text>
          </TouchableOpacity>
        </View>
      ) : resenas.length === 0 ? (
        <View style={styles.vacio}>
          <Text style={styles.vacioTitulo}>Todavía no hay reseñas</Text>
          <Text style={styles.vacioTexto}>
            Cuando tus clientes dejen opiniones, aparecerán acá.
          </Text>
        </View>
      ) : (
        <>
          <Text style={styles.contador}>
            {resenas.length} {resenas.length === 1 ? "reseña" : "reseñas"}
          </Text>

          {resenas.map((resena) => (
            <View key={resena.id} style={styles.tarjeta}>
              <View style={styles.encabezado}>
                <Text style={styles.estrellas}>
                  {"★".repeat(resena.estrellas)}
                  {"☆".repeat(5 - resena.estrellas)}
                </Text>
                <Text style={styles.fecha}>
                  {formatoFecha(resena.creadaEn)}
                </Text>
              </View>

              <Text style={styles.comentario}>
                {resena.comentario}
              </Text>

              {resena.respuesta ? (
                <View style={styles.respuestaExistente}>
                  <Text style={styles.respuestaTitulo}>
                    Tu respuesta
                  </Text>
                  <Text style={styles.respuestaTexto}>
                    {resena.respuesta}
                  </Text>
                </View>
              ) : (
                <View style={styles.formulario}>
                  <Text style={styles.etiqueta}>Responder reseña</Text>

                  <TextInput
                    style={styles.input}
                    placeholder="Escribí tu respuesta..."
                    placeholderTextColor="#999"
                    multiline
                    value={respuestas[resena.id] || ""}
                    onChangeText={(texto) =>
                      setRespuestas((anteriores) => ({
                        ...anteriores,
                        [resena.id]: texto,
                      }))
                    }
                  />

                  <TouchableOpacity
                    style={[
                      styles.botonResponder,
                      enviando === resena.id && styles.botonDeshabilitado,
                    ]}
                    disabled={enviando !== null}
                    onPress={() => enviarRespuesta(resena)}
                  >
                    {enviando === resena.id ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <Text style={styles.botonTexto}>
                        Enviar respuesta
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: "#F7F7FB",
  },
  contenido: {
    padding: 20,
    paddingBottom: 40,
  },
  centrado: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F7F7FB",
  },
  textoCargando: {
    marginTop: 12,
    color: "#666",
  },
  volver: {
    marginBottom: 20,
  },
  volverTexto: {
    color: "#6C63FF",
    fontSize: 16,
    fontWeight: "600",
  },
  titulo: {
    fontSize: 25,
    fontWeight: "bold",
    color: "#29263D",
  },
  subtitulo: {
    fontSize: 14,
    color: "#777",
    marginTop: 6,
    marginBottom: 22,
  },
  contador: {
    fontSize: 15,
    fontWeight: "600",
    color: "#555",
    marginBottom: 12,
  },
  tarjeta: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#ECEAF5",
  },
  encabezado: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  estrellas: {
    color: "#F2B544",
    fontSize: 20,
    letterSpacing: 2,
  },
  fecha: {
    color: "#888",
    fontSize: 12,
  },
  comentario: {
    color: "#333",
    fontSize: 15,
    lineHeight: 22,
  },
  respuestaExistente: {
    marginTop: 16,
    padding: 12,
    backgroundColor: "#F0EFFA",
    borderRadius: 10,
  },
  respuestaTitulo: {
    color: "#6C63FF",
    fontWeight: "bold",
    marginBottom: 6,
  },
  respuestaTexto: {
    color: "#444",
    lineHeight: 21,
  },
  formulario: {
    marginTop: 18,
  },
  etiqueta: {
    color: "#555",
    fontWeight: "600",
    marginBottom: 8,
  },
  input: {
    minHeight: 90,
    borderWidth: 1,
    borderColor: "#DDD9EA",
    borderRadius: 10,
    padding: 12,
    textAlignVertical: "top",
    color: "#333",
    backgroundColor: "#FFFFFF",
  },
  botonResponder: {
    backgroundColor: "#6C63FF",
    padding: 13,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
  },
  botonDeshabilitado: {
    opacity: 0.6,
  },
  botonTexto: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  vacio: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
  },
  vacioTitulo: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#333",
  },
  vacioTexto: {
    color: "#777",
    textAlign: "center",
    marginTop: 8,
    lineHeight: 21,
  },
  errorCaja: {
    backgroundColor: "#FCECEC",
    padding: 16,
    borderRadius: 12,
  },
  errorTexto: {
    color: "#B42318",
  },
  reintentar: {
    color: "#6C63FF",
    fontWeight: "bold",
    marginTop: 12,
  },
});
