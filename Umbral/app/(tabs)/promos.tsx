import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { promocionesService, Promocion } from '../../src/servicios/promociones';

export default function PromosScreen() {
  const router = useRouter();
  const [tabActiva, setTabActiva] = useState<'vigentes' | 'porVencer' | 'proximas'>('vigentes');
  const [promos, setPromos] = useState<Promocion[]>([]);
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cargarPromociones = async () => {
    try {
      setError(null);
      const data = await promocionesService.obtenerPromociones();
      
      const hoy = new Date();
      // Filtro para eliminar vencidas
      const noVencidas = data.filter(p => new Date(p.fechaFin) >= hoy);
      setPromos(noVencidas);
    } catch (err: any) {
      setError(err.message || 'Error al obtener las promociones');
    } finally {
      setCargando(false);
      setRefrescando(false);
    }
  };

  useEffect(() => {
    cargarPromociones();
  }, []);

  const onRefresh = () => {
    setRefrescando(true);
    cargarPromociones();
  };

  // Filtrado según la solapa activa
  const promocionesFiltradas = promos.filter(p => {
    const hoy = new Date();
    const fin = new Date(p.fechaFin);
    const inicio = new Date(p.fechaInicio);
    
    // Diferencia en días hasta el vencimiento
    const diasParaVencer = Math.ceil((fin.getTime() - hoy.getTime()) / (1000 * 3600 * 24));

    if (tabActiva === 'proximas') {
      return inicio > hoy;
    }
    if (tabActiva === 'porVencer') {
      return inicio <= hoy && diasParaVencer <= 3 && diasParaVencer >= 0;
    }
    // Vigentes
    return inicio <= hoy && fin >= hoy;
  });

  if (cargando) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1A1D20" />
        <Text style={styles.cargandoTexto}>Cargando promociones...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Promos</Text>
      <Text style={styles.subtitulo}>Solo las que están vigentes, nada vencido.</Text>

      {/* Selectores de estado (Tabs) */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, tabActiva === 'vigentes' && styles.tabActivo]}
          onPress={() => setTabActiva('vigentes')}
        >
          <Text style={tabActiva === 'vigentes' ? styles.tabTextActivo : styles.tabText}>Vigentes</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, tabActiva === 'porVencer' && styles.tabActivo]}
          onPress={() => setTabActiva('porVencer')}
        >
          <Text style={tabActiva === 'porVencer' ? styles.tabTextActivo : styles.tabText}>Por vencer</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, tabActiva === 'proximas' && styles.tabActivo]}
          onPress={() => setTabActiva('proximas')}
        >
          <Text style={tabActiva === 'proximas' ? styles.tabTextActivo : styles.tabText}>Próximas</Text>
        </TouchableOpacity>
      </View>

      {error ? (
        <View style={styles.center}>
          <Text style={styles.errorTexto}>{error}</Text>
          <TouchableOpacity style={styles.botonReintentar} onPress={cargarPromociones}>
            <Text style={styles.botonReintentarTexto}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.lista}
          refreshControl={<RefreshControl refreshing={refrescando} onRefresh={onRefresh} />}
        >
          {promocionesFiltradas.length === 0 ? (
            <Text style={styles.vacioTexto}>No hay promociones disponibles en esta categoría.</Text>
          ) : (
            promocionesFiltradas.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.card}
                onPress={() => router.push(`/promo/${item.id}` as any)}
              >
                {item.esExclusivaApp && <Text style={styles.badge}>SOLO APP</Text>}
                <Text style={styles.cardPorcentaje}>{item.descuento}</Text>
                <Text style={styles.cardTitulo}>{item.titulo}</Text>
                {item.nombreComercio && <Text style={styles.cardComercio}>{item.nombreComercio}</Text>}
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA', paddingHorizontal: 16, paddingTop: 50 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  cargandoTexto: { marginTop: 10, color: '#6C757D' },
  errorTexto: { color: '#D9534F', fontSize: 16, textAlign: 'center', marginBottom: 12 },
  vacioTexto: { textAlign: 'center', color: '#6C757D', marginTop: 40, fontSize: 16 },
  titulo: { fontSize: 32, fontWeight: 'bold', color: '#1A1D20' },
  subtitulo: { fontSize: 14, color: '#6C757D', marginBottom: 16 },
  tabContainer: { flexDirection: 'row', backgroundColor: '#E9ECEF', borderRadius: 20, padding: 4, marginBottom: 16 },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 16 },
  tabActivo: { backgroundColor: '#FFFFFF' },
  tabText: { color: '#6C757D', fontWeight: '500' },
  tabTextActivo: { color: '#1A1D20', fontWeight: 'bold' },
  lista: { paddingBottom: 24, gap: 12 },
  card: { backgroundColor: '#FFEAD2', padding: 20, borderRadius: 20 },
  badge: { fontSize: 11, fontWeight: 'bold', color: '#6C757D', marginBottom: 4 },
  cardPorcentaje: { fontSize: 36, fontWeight: 'bold', color: '#1A1D20' },
  cardTitulo: { fontSize: 18, fontWeight: '600', color: '#1A1D20', marginTop: 4 },
  cardComercio: { fontSize: 14, color: '#6C757D', marginTop: 2 },
  botonReintentar: { backgroundColor: '#1A1D20', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 },
  botonReintentarTexto: { color: '#FFFFFF', fontWeight: 'bold' },
});