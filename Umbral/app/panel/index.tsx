import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { promocionesService, Promocion } from '../../src/servicios/promociones';

export default function PanelComercioScreen() {
  const router = useRouter();
  const [promos, setPromos] = useState<Promocion[]>([]);
  const [cargando, setCargando] = useState(true);

  // Se recarga cada vez que la pantalla vuelve a estar visible
  // (por ejemplo, al volver de crear o editar una promoción).
  const cargarDatosPanel = useCallback(async () => {
    try {
      const data = await promocionesService.obtenerMisPromociones();
      setPromos(data);
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'No se pudieron cargar tus promociones.');
    } finally {
      setCargando(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      cargarDatosPanel();
    }, [cargarDatosPanel])
  );

  const vigente = (p: Promocion) => p.activa && new Date(p.hasta) >= new Date();
  const activas = promos.filter(vigente).length;

  const handleEliminarPromo = (id: string) => {
  Alert.alert(
    'Confirmar baja',
    '¿Estás seguro de que querés dar de baja esta promoción?',
    [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Dar de baja',
        style: 'destructive',
        onPress: async () => {
          try {
            await promocionesService.eliminarPromocion(id);

            setPromos(prev =>
              prev.map(p =>
                p.id === id ? { ...p, activa: false } : p
              )
            );

          } catch (e: any) {
            Alert.alert(
              'Error',
              e.message || 'No se pudo dar de baja la promoción'
            );
          }
        },
      },
    ]
  );
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
      <TouchableOpacity 
          style={styles.botonNueva} 
          onPress={() => router.push("/panel/nueva" as any)}
          >      
        <Text style={styles.botonNuevaTexto}>＋ Nueva promoción</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.botonEscanear} onPress={() => router.push('/panel/escanear' as any)}>
        <Text style={styles.botonEscanearIcono}>📷</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.botonEscanearTitulo}>Escanear Código QR</Text>
          <Text style={styles.botonEscanearSub}>Validar descuento de cliente en caja</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.botonResenas}
        onPress={() => router.push("/panel/resenas" as any)}
      >
        <Text style={styles.botonResenasIcono}>⭐</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.botonResenasTitulo}>Reseñas de clientes</Text>
          <Text style={styles.botonResenasSub}>
            Consultar opiniones y responder a tus clientes
          </Text>
        </View>
      </TouchableOpacity>

      <Text style={styles.seccionTitulo}>Promociones ({activas} activas de {promos.length})</Text>

      <View style={styles.lista}>
        {promos.length === 0 ? (
          <Text style={styles.vacio}>No tenés promociones cargadas.</Text>
        ) : (
          promos.map((item) => (
            <View key={item.id} style={styles.card}>

              <View style={styles.cardHeader}>
                <Text style={styles.cardDescuento}>
                  {item.descuento !== null ? `${item.descuento}%` : "Promoción"}
                </Text>

              <View style={styles.acciones}>
                  {vigente(item) && (
                    <>
                      <TouchableOpacity
                          onPress={() =>
                            router.push(`/panel/editar/${item.id}` as any)
                          }
                        >
                          <Text style={styles.botonEditar}>Editar</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => handleEliminarPromo(item.id)}
                      >
                        <Text style={styles.botonEliminar}>Dar de baja</Text>
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              </View>

              <Text style={styles.cardTitulo}>{item.titulo}</Text>
              <Text style={styles.cardUsos}>
                Usos: {item.usos}
              </Text>
              <Text style={styles.cardEstado}>
                {!item.activa ? "Dada de baja" : vigente(item) ? "Activa" : "Vencida"}
              </Text>
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
  cardUsos: { fontSize: 13, color: "#6C757D", marginTop: 6 },
  cardEstado: {fontSize: 12, color: "#6C757D", marginTop: 4 },
  botonNueva: { backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#1A1D20", padding: 15, borderRadius: 12, alignItems: "center",
  marginBottom: 20 },
  botonNuevaTexto: { color: "#1A1D20", fontSize: 15, fontWeight: "bold" },
  acciones: { flexDirection: "row", alignItems: "center", gap: 16 },
  botonEditar: { color: "#2878B5", fontSize: 13, fontWeight: "600" },
  botonResenas: { flexDirection: "row", backgroundColor: "#FFFFFF", padding: 20, borderRadius: 16, alignItems: "center", marginBottom: 24, gap: 16, borderWidth: 1, borderColor: "#E9ECEF" },
  botonResenasIcono: { fontSize: 30 },
  botonResenasTitulo: { color: "#1A1D20", fontSize: 18, fontWeight: "bold" },
  botonResenasSub: { color: "#6C757D", fontSize: 13, marginTop: 2 },

});