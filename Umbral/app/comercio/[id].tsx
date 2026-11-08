import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert, Dimensions } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

export default function ComercioDetalleScreen() {
  const { id } = useLocalSearchParams();
  const [isFavorite, setIsFavorite] = useState(false);

  // Comercio de ejemplo (puedes adaptarlo con datos reales o SQLite)
  const comercio = {
    nombre: "Comercio de Ejemplo",
    descripcion: "Un lugar excelente para disfrutar, comprar y conocer.",
    horarios: "Lunes a Sábados de 09:00 a 20:00 hs",
    telefono: "+5493431234567",
    whatsapp: "+5493431234567",
    redes: "@comercioejemplo",
    mediosPago: ["Efectivo", "Tarjeta de Débito", "Mercado Pago"],
    fotos: [], // Caso sin fotos probado
    cerradoPorVacaciones: false,
    // URL de video de prueba (o null para probar el caso "sin video")
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4", 
  };

  // Configuración del reproductor expo-video
  const player = useVideoPlayer(comercio.videoUrl, (playerInstance) => {
    playerInstance.loop = false;
  });

  // Manejador del botón de favorito con respuesta háptica
  const handleToggleFavorite = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsFavorite(!isFavorite);
  };

  return (
    <ScrollView style={styles.container}>
      {/* Cabecera / Fotos */}
      {comercio.fotos.length > 0 ? (
        <ScrollView horizontal pagingEnabled style={styles.slider}>
          {comercio.fotos.map((foto, index) => (
            <Image key={index} source={{ uri: foto }} style={styles.foto} />
          ))}
        </ScrollView>
      ) : (
        <View style={styles.sinFotosContainer}>
          <Text style={styles.sinFotosText}>📸 Sin fotos disponibles</Text>
        </View>
      )}

      {/* Aviso de Cerrado por Vacaciones */}
      {comercio.cerradoPorVacaciones && (
        <View style={styles.bannerVacaciones}>
          <Text style={styles.textoVacaciones}>⚠️ Cerrado por vacaciones</Text>
        </View>
      )}

      <View style={styles.content}>
        <View style={styles.headerRow}>
          <Text style={styles.titulo}>{comercio.nombre}</Text>
          <TouchableOpacity onPress={handleToggleFavorite} style={styles.favButton}>
            <Text style={{ fontSize: 24 }}>{isFavorite ? "❤️" : "🤍"}</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.descripcion}>{comercio.descripcion}</Text>
        
        <Text style={styles.seccionTitulo}>Horarios</Text>
        <Text style={styles.textoComun}>{comercio.horarios}</Text>

        <Text style={styles.seccionTitulo}>Medios de Pago</Text>
        <Text style={styles.textoComun}>{comercio.mediosPago.join(", ")}</Text>

        {/* Sección de Video con expo-video (Requerimiento Parte 3) */}
        <Text style={styles.seccionTitulo}>Video institucional</Text>
        {comercio.videoUrl ? (
          <View style={styles.videoContainer}>
            <VideoView
              player={player}
              style={styles.video}
              allowsFullscreen
              allowsPictureInPicture
            />
          </View>
        ) : (
          <View style={styles.sinVideoContainer}>
            <Text style={styles.sinVideoText}>🎥 Este comercio no cuenta con video institucional.</Text>
          </View>
        )}

        {/* Botones de Acción: Llamar, WhatsApp, Ir */}
        <View style={styles.accionesContainer}>
          <TouchableOpacity style={styles.botonAccion} onPress={() => Alert.alert("Llamando...")}>
            <Text style={styles.textoBoton}>📞 Llamar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.botonAccion} onPress={() => Alert.alert("Abriendo WhatsApp...")}>
            <Text style={styles.textoBoton}>💬 WhatsApp</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.botonAccion} onPress={() => Alert.alert("Abriendo Mapas...")}>
            <Text style={styles.textoBoton}>📍 Ir</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  slider: { height: 220 },
  foto: { width: width, height: 220, resizeMode: 'cover' },
  sinFotosContainer: { height: 180, backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center' },
  sinFotosText: { color: '#666', fontSize: 16 },
  bannerVacaciones: { backgroundColor: '#ffcc00', padding: 10, alignItems: 'center' },
  textoVacaciones: { fontWeight: 'bold', color: '#333' },
  content: { padding: 16 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  titulo: { fontSize: 24, fontWeight: 'bold', flex: 1 },
  favButton: { padding: 4 },
  descripcion: { fontSize: 14, color: '#555', marginBottom: 16 },
  seccionTitulo: { fontSize: 16, fontWeight: 'bold', marginTop: 16, marginBottom: 6, color: '#333' },
  textoComun: { fontSize: 14, color: '#666', marginBottom: 8 },
  videoContainer: { width: '100%', height: 200, backgroundColor: '#000', borderRadius: 8, overflow: 'hidden', marginVertical: 8 },
  video: { width: '100%', height: '100%' },
  sinVideoContainer: { padding: 16, backgroundColor: '#f9f9f9', borderRadius: 8, alignItems: 'center', marginVertical: 8 },
  sinVideoText: { color: '#777', fontSize: 13, fontStyle: 'italic' },
  accionesContainer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 24, marginBottom: 20 },
  botonAccion: { flex: 1, backgroundColor: '#007AFF', padding: 12, marginHorizontal: 4, borderRadius: 8, alignItems: 'center' },
  textoBoton: { color: '#fff', fontWeight: 'bold', fontSize: 14 }
});