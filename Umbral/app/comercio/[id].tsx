import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { useVideoPlayer, VideoView } from "expo-video";
import * as Haptics from "expo-haptics";
import { obtenerComercio } from "../../src/servicios/comercios";
import { alternarFavorito, esFavorito } from "../../src/servicios/favoritos";
import { uriParaMostrar } from "../../src/servicios/archivos";
import { abrirComoLlegar } from "../../src/utils/comoLlegar";
import { useSesion } from "../../src/hooks/useSesion";
import { ErrorApi } from "../../src/servicios/cliente";
import type { Comercio, Horario } from "../../src/tipos";

const { width } = Dimensions.get("window");
const DIAS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

// Agrupa los turnos por día: "Lunes: 08:00–12:00 y 16:00–20:00".
function horariosPorDia(horarios: Horario[]) {
  const orden = [1, 2, 3, 4, 5, 6, 0];
  return orden
    .map((dia) => {
      const turnos = horarios
        .filter((h) => h.dia === dia)
        .sort((a, b) => a.abre.localeCompare(b.abre))
        .map((h) => `${h.abre}–${h.cierra}`);
      return { dia: DIAS[dia], texto: turnos.length ? turnos.join(" y ") : "Cerrado" };
    });
}

const soloDigitos = (tel: string) => tel.replace(/[^\d]/g, "");

async function abrir(url: string, siFalla: string) {
  try {
    await Linking.openURL(url);
  } catch {
    Alert.alert("No se pudo abrir", siFalla);
  }
}

export default function ComercioDetalleScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const sesion = useSesion();

  const [comercio, setComercio] = useState<Comercio | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [guardandoFav, setGuardandoFav] = useState(false);

  const cargar = useCallback(async () => {
    if (!id) return;
    setCargando(true);
    setError(null);
    try {
      setComercio(await obtenerComercio(id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo cargar el comercio.");
    } finally {
      setCargando(false);
    }
  }, [id]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carga inicial desde la API
    cargar();
  }, [cargar]);

  // Se recalcula en cada render: el estado de sesión trae los favoritos actualizados.
  const favorito = comercio != null && sesion.estado === "activa" && esFavorito(comercio.id);

  const handleToggleFavorite = async () => {
    if (!comercio) return;
    if (sesion.estado !== "activa") {
      Alert.alert("Ingresá a tu cuenta", "Necesitás una cuenta para guardar favoritos.", [
        { text: "Cancelar", style: "cancel" },
        { text: "Ingresar", onPress: () => router.push(sesion.estado === "bloqueada" ? "/yo" : "/login") },
      ]);
      return;
    }
    if (sesion.usuario.rol !== "vecino") {
      Alert.alert("Sólo para vecinos", "Las cuentas de comercio no guardan favoritos.");
      return;
    }
    setGuardandoFav(true);
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await alternarFavorito(comercio.id);
    } catch (e) {
      Alert.alert("Error", e instanceof ErrorApi ? e.message : "No se pudo actualizar el favorito.");
    } finally {
      setGuardandoFav(false);
    }
  };

  if (cargando) {
    return (
      <View style={styles.center}>
        <Stack.Screen options={{ title: "Comercio" }} />
        <ActivityIndicator size="large" color="#1A1D20" />
      </View>
    );
  }

  if (error || !comercio) {
    return (
      <View style={styles.center}>
        <Stack.Screen options={{ title: "Comercio" }} />
        <Text style={styles.errorTexto}>{error ?? "No encontramos este comercio."}</Text>
        <TouchableOpacity style={styles.botonReintentar} onPress={cargar}>
          <Text style={styles.textoBoton}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Según la API (decisión D2), un comercio cerrado por vacaciones viene sin horarios.
  const cerradoPorVacaciones = comercio.horarios.length === 0;

  const llamar = () => abrir(`tel:${comercio.telefono}`, "Este teléfono no puede hacer llamadas.");
  const whatsapp = () =>
    abrir(`https://wa.me/${soloDigitos(comercio.whatsapp ?? "")}`, "No se pudo abrir WhatsApp.");
  const instagram = () =>
    abrir(`https://instagram.com/${(comercio.instagram ?? "").replace(/^@/, "")}`, "No se pudo abrir Instagram.");
  const comoLlegar = () => abrirComoLlegar(comercio.coordenadas, comercio.nombre);

  return (
    <ScrollView style={styles.container}>
      <Stack.Screen options={{ title: comercio.nombre }} />

      {/* Fotos */}
      {comercio.imagenes.length > 0 ? (
        <ScrollView horizontal pagingEnabled style={styles.slider} showsHorizontalScrollIndicator={false}>
          {comercio.imagenes.map((foto) => (
            <Image key={foto} source={{ uri: uriParaMostrar(foto) }} style={styles.foto} />
          ))}
        </ScrollView>
      ) : (
        <View style={styles.sinFotosContainer}>
          <Text style={styles.sinFotosText}>📸 Sin fotos disponibles</Text>
        </View>
      )}

      {cerradoPorVacaciones && (
        <View style={styles.bannerVacaciones}>
          <Text style={styles.textoVacaciones}>⚠️ Cerrado por vacaciones</Text>
        </View>
      )}

      <View style={styles.content}>
        <View style={styles.headerRow}>
          <Text style={styles.titulo}>{comercio.nombre}</Text>
          <TouchableOpacity
            onPress={handleToggleFavorite}
            style={styles.favButton}
            disabled={guardandoFav}
            accessibilityLabel={favorito ? "Quitar de favoritos" : "Guardar en favoritos"}
          >
            <Text style={{ fontSize: 24 }}>{favorito ? "❤️" : "🤍"}</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.puntaje}>
          {comercio.cantidadResenas > 0
            ? `★ ${comercio.puntaje.toFixed(1)} · ${comercio.cantidadResenas} ${comercio.cantidadResenas === 1 ? "reseña" : "reseñas"}`
            : "Sin reseñas todavía"}
        </Text>
        <Text style={styles.direccion}>{comercio.direccion}</Text>
        <Text style={styles.descripcion}>{comercio.descripcion}</Text>

        <Text style={styles.seccionTitulo}>Horarios</Text>
        {cerradoPorVacaciones ? (
          <Text style={styles.textoComun}>Sin atención por el momento.</Text>
        ) : (
          horariosPorDia(comercio.horarios).map((h) => (
            <View key={h.dia} style={styles.filaHorario}>
              <Text style={styles.textoComun}>{h.dia}</Text>
              <Text style={styles.textoComun}>{h.texto}</Text>
            </View>
          ))
        )}

        {comercio.mediosDePago.length > 0 && (
          <>
            <Text style={styles.seccionTitulo}>Medios de pago</Text>
            <Text style={styles.textoComun}>{comercio.mediosDePago.join(", ")}</Text>
          </>
        )}

        {comercio.instagram && (
          <>
            <Text style={styles.seccionTitulo}>Redes</Text>
            <TouchableOpacity onPress={instagram}>
              <Text style={styles.enlace}>Instagram: {comercio.instagram}</Text>
            </TouchableOpacity>
          </>
        )}

        <Text style={styles.seccionTitulo}>Video institucional</Text>
        {comercio.videoUrl ? (
          <VideoComercio url={comercio.videoUrl} />
        ) : (
          <View style={styles.sinVideoContainer}>
            <Text style={styles.sinVideoText}>🎥 Este comercio no cuenta con video institucional.</Text>
          </View>
        )}

        <View style={styles.accionesContainer}>
          {comercio.telefono && (
            <TouchableOpacity style={styles.botonAccion} onPress={llamar}>
              <Text style={styles.textoBoton}>📞 Llamar</Text>
            </TouchableOpacity>
          )}
          {comercio.whatsapp && (
            <TouchableOpacity style={styles.botonAccion} onPress={whatsapp}>
              <Text style={styles.textoBoton}>💬 WhatsApp</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.botonAccion} onPress={comoLlegar}>
            <Text style={styles.textoBoton}>📍 Ir</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

// Componente aparte para crear el reproductor sólo cuando hay video.
function VideoComercio({ url }: { url: string }) {
  const player = useVideoPlayer(uriParaMostrar(url), (p) => {
    p.loop = false;
  });

  return (
    <View style={styles.videoContainer}>
      <VideoView
        player={player}
        style={styles.video}
        nativeControls
        fullscreenOptions={{ enable: true }}
        allowsPictureInPicture
        contentFit="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24, backgroundColor: "#fff" },
  errorTexto: { color: "#B00020", textAlign: "center", marginBottom: 16 },
  botonReintentar: { backgroundColor: "#007AFF", paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8 },
  slider: { height: 220 },
  foto: { width, height: 220, resizeMode: "cover" },
  sinFotosContainer: { height: 180, backgroundColor: "#f0f0f0", justifyContent: "center", alignItems: "center" },
  sinFotosText: { color: "#666", fontSize: 16 },
  bannerVacaciones: { backgroundColor: "#ffcc00", padding: 10, alignItems: "center" },
  textoVacaciones: { fontWeight: "bold", color: "#333" },
  content: { padding: 16 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  titulo: { fontSize: 24, fontWeight: "bold", flex: 1 },
  favButton: { padding: 4 },
  puntaje: { fontSize: 14, color: "#8a6d00", marginBottom: 4 },
  direccion: { fontSize: 14, color: "#555", marginBottom: 8 },
  descripcion: { fontSize: 14, color: "#555", marginBottom: 8 },
  seccionTitulo: { fontSize: 16, fontWeight: "bold", marginTop: 16, marginBottom: 6, color: "#333" },
  textoComun: { fontSize: 14, color: "#666", marginBottom: 4 },
  filaHorario: { flexDirection: "row", justifyContent: "space-between" },
  enlace: { fontSize: 14, color: "#007AFF" },
  videoContainer: { width: "100%", height: 200, backgroundColor: "#000", borderRadius: 8, overflow: "hidden", marginVertical: 8 },
  video: { width: "100%", height: "100%" },
  sinVideoContainer: { padding: 16, backgroundColor: "#f9f9f9", borderRadius: 8, alignItems: "center", marginVertical: 8 },
  sinVideoText: { color: "#777", fontSize: 13, fontStyle: "italic" },
  accionesContainer: { flexDirection: "row", justifyContent: "space-between", marginTop: 24, marginBottom: 20 },
  botonAccion: { flex: 1, backgroundColor: "#007AFF", padding: 12, marginHorizontal: 4, borderRadius: 8, alignItems: "center" },
  textoBoton: { color: "#fff", fontWeight: "bold", fontSize: 14 },
});
