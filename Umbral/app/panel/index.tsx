import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { promocionesService, Promocion } from '../../src/servicios/promociones';

export default function PanelComercioScreen() {
  const router = useRouter();
  const [promos, setPromos] = useState<Promocion[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    cargarDatosPanel();
  }, []);

  const cargarDatosPanel = async () => {
    try {
      const data = await promocionesService.obtenerPromociones();
      setPromos(data);
    } catch (e) {
      console.error(e);
    } finally {
      setCargando(false);
    }
  };

  const handleEliminarPromo = (id: string) => {
    Alert.alert('Confirmar baja', '¿Estás seguro de que querés dar de baja esta promoción?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          try {
            await promocionesService.eliminarPromocion(id);
            setPromos(prev => prev.filter(p => p.id !== id));
          } catch (e: any) {
            Alert.alert('Error', e.message || 'No se pudo eliminar la promoción');
          }
        },
      },
    ]);
  };

  if (cargando) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1A1D20" />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.titulo}>Panel de Comercio</Text>
      <Text style={styles.subtitulo}>Gestión de promociones y escaneo de clientes</Text>

      <TouchableOpacity style={styles.botonEscanear} onPress={() => router.push('/panel/escanear' as any)}>
        <Text style={styles.botonEscanearIcono}>📷</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.botonEscanearTitulo}>Escanear Código QR</Text>
          <Text style={styles.botonEscanearSub}>Validar descuento de cliente en caja</Text>
        </View>
      </TouchableOpacity>

      <Text style={styles.seccionTitulo}>Promociones Activas ({promos.length})</Text>

      <View style={styles.lista}>
        {promos.length === 0 ? (
          <Text style={styles.vacio}>No tenés promociones cargadas.</Text>
        ) : (
          promos.map((item) => (
            <View key={item.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardDescuento}>{item.descuento}</Text>
                <TouchableOpacity onPress={() => handleEliminarPromo(item.id)}>
                  <Text style={styles.botonEliminar}>Dar de baja</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.cardTitulo}>{item.titulo}</Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: '#F8F9FA', flexGrow: 1, paddingTop: 50 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  titulo: { fontSize: 30, fontWeight: 'bold', color: '#1A1D20' },
  subtitulo: { fontSize: 14, color: '#6C757D', marginBottom: 20 },
  botonEscanear: { flexDirection: 'row', backgroundColor: '#1A1D20', padding: 20, borderRadius: 16, alignItems: 'center', marginBottom: 24, gap: 16 },
  botonEscanearIcono: { fontSize: 30 },
  botonEscanearTitulo: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold' },
  botonEscanearSub: { color: '#ADB5BD', fontSize: 13, marginTop: 2 },
  seccionTitulo: { fontSize: 18, fontWeight: 'bold', color: '#1A1D20', marginBottom: 12 },
  lista: { gap: 12 },
  vacio: { color: '#6C757D', fontStyle: 'italic' },
  card: { backgroundColor: '#FFFFFF', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#E9ECEF' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardDescuento: { fontSize: 22, fontWeight: 'bold', color: '#1A1D20' },
  botonEliminar: { color: '#D9534F', fontSize: 13, fontWeight: '600' },
  cardTitulo: { fontSize: 15, color: '#495057', marginTop: 4 },
});