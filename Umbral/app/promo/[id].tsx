import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import QRCode from 'react-native-qrcode-svg';
import { promocionesService, Promocion } from '../../src/servicios/promociones';

export default function DetallePromoScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [promo, setPromo] = useState<Promocion | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      cargarDetalle();
    }
  }, [id]);

  const cargarDetalle = async () => {
    try {
      setError(null);
      const data = await promocionesService.obtenerPromocionPorId(id!);
      setPromo(data);
    } catch (err: any) {
      setError(err.message || 'Error al cargar la promoción');
    } finally {
      setCargando(false);
    }
  };

  if (cargando) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1A1D20" />
      </View>
    );
  }

  if (error || !promo) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorTexto}>{error || 'Promoción no encontrada'}</Text>
        <TouchableOpacity style={styles.botonVolver} onPress={() => router.back()}>
          <Text style={styles.botonVolverTexto}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const codigoParaQR = promo.codigoQR || `PROMO-${promo.id}`;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <TouchableOpacity style={styles.botonAtras} onPress={() => router.back()}>
        <Text style={styles.botonAtrasTexto}>← Volver</Text>
      </TouchableOpacity>

      <View style={styles.cardHeader}>
        {promo.esExclusivaApp && <Text style={styles.badge}>SOLO APP</Text>}
        <Text style={styles.descuento}>{promo.descuento}</Text>
        <Text style={styles.titulo}>{promo.titulo}</Text>
        {promo.nombreComercio && <Text style={styles.comercio}>{promo.nombreComercio}</Text>}
      </View>

      <View style={styles.seccion}>
        <Text style={styles.seccionTitulo}>Condiciones</Text>
        <Text style={styles.descripcion}>{promo.descripcion}</Text>
        <Text style={styles.fecha}>
          Válido hasta el {new Date(promo.fechaFin).toLocaleDateString()}
        </Text>
      </View>

      {/* Si es exclusiva de la app, dibujamos el código QR */}
      {promo.esExclusivaApp && (
        <View style={styles.qrContainer}>
          <Text style={styles.qrTitulo}>Presentá este código en el local</Text>
          <View style={styles.qrWrapper}>
            <QRCode value={codigoParaQR} size={200} />
          </View>
          <Text style={styles.qrCodigoTexto}>{codigoParaQR}</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: '#F8F9FA', flexGrow: 1, paddingTop: 50 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  botonAtras: { marginBottom: 16 },
  botonAtrasTexto: { fontSize: 16, color: '#1A1D20', fontWeight: 'bold' },
  cardHeader: { backgroundColor: '#FFEAD2', padding: 24, borderRadius: 20, marginBottom: 20 },
  badge: { fontSize: 12, fontWeight: 'bold', color: '#6C757D', marginBottom: 6 },
  descuento: { fontSize: 42, fontWeight: 'bold', color: '#1A1D20' },
  titulo: { fontSize: 22, fontWeight: 'bold', color: '#1A1D20', marginTop: 6 },
  comercio: { fontSize: 16, color: '#6C757D', marginTop: 4 },
  seccion: { backgroundColor: '#FFFFFF', padding: 20, borderRadius: 16, marginBottom: 20 },
  seccionTitulo: { fontSize: 18, fontWeight: 'bold', color: '#1A1D20', marginBottom: 8 },
  descripcion: { fontSize: 15, color: '#495057', lineHeight: 22 },
  fecha: { fontSize: 13, color: '#6C757D', marginTop: 12, fontWeight: '500' },
  qrContainer: { backgroundColor: '#FFFFFF', padding: 24, borderRadius: 20, alignItems: 'center' },
  qrTitulo: { fontSize: 16, fontWeight: 'bold', color: '#1A1D20', marginBottom: 16 },
  qrWrapper: { padding: 12, backgroundColor: '#FFFFFF', borderRadius: 12, elevation: 2 },
  qrCodigoTexto: { marginTop: 12, fontSize: 14, color: '#6C757D', fontWeight: '500' },
  errorTexto: { color: '#D9534F', fontSize: 16, textAlign: 'center', marginBottom: 16 },
  botonVolver: { backgroundColor: '#1A1D20', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 },
  botonVolverTexto: { color: '#FFFFFF', fontWeight: 'bold' },
});