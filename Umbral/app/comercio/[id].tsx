import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { VideoView, useVideoPlayer } from 'expo-video';
import * as Haptics from 'expo-haptics';
// Importa tus servicios o componentes compartidos según corresponda

export default function ComercioDetalleScreen() {
  const { id } = useLocalSearchParams();
  const [isFavorite, setIsFavorite] = useState(false);

  // Ejemplo de estado del comercio (esto luego se conectará con SQLite / base de datos)
  const comercio = {
    nombre: "Comercio de Ejemplo",
    descripcion: "Un lugar excelente para disfrutar y comprar de todo.",
    horarios: "Lunes a Sábados de 09:00 a 20:00 hs",
    telefono: "+5493431234567",
    whatsapp: "+5493431234567",
    redes: "@comercioejemplo",
    mediosPago: ["Efectivo", "Tarjeta de Débito", "Mercado Pago"],
    fotos: [], // Probar caso sin fotos
    cerradoPorVacaciones: false,
    videoUrl: null, // Probar caso sin video
  };

  // Manejador del botón de favorito con vibración háptica requerida
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
            <Text>{isFavorite ? "❤️" : "🤍"}</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.descripcion}>{comercio.descripcion}</Text>
        
        <Text style={styles.seccionTitulo}>Horarios</Text>
        <Text style={styles.textoComun}>{comercio.horarios}</Text>

        <Text style={styles.seccionTitulo}>Medios de Pago</Text>
        <Text style={styles.textoComun}>{comercio.mediosPago.join(", ")}</Text>

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
  foto: { width: 400, height: 220, resizeMode: 'cover' },
  sinFotosContainer: { height: 180, backgroundColor: '#e0e0e0', justifyContent: 'center', alignItems: 'center' },
  sinFotosText: { color: '#666', fontSize: 16 },
  bannerVacaciones: { backgroundColor: '#ffcc00', padding: 10, alignItems: 'center' },
  textoVacaciones: { fontWeight: 'bold', color: '#333' },
  content: { padding: 16 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  titulo: { fontSize: 24, fontWeight: 'bold', flex: 1 },
  favButton: { padding: 8, fontSize: 20 },
  descripcion: { fontSize: 14, color: '#555', marginBottom: 16 },
  seccionTitulo: { fontSize: 16, fontWeight: 'bold', marginTop: 12, marginBottom: 4, color: '#333' },
  textoComun: { fontSize: 14, color: '#666', marginBottom: 8 },
  accionesContainer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 },
  botonAccion: { flex: 1, backgroundColor: '#007AFF', padding: 12, marginHorizontal: 4, borderRadius: 8, alignItems: 'center' },
  textoBoton: { color: '#fff', fontWeight: 'bold', fontSize: 14 }
});
