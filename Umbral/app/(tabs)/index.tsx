import { View, Text, StyleSheet } from 'react-native';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Inicio</Text>
      <Text style={styles.subtitulo}>Bienvenido a Umbral</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8F9FA' },
  titulo: { fontSize: 28, fontWeight: 'bold', color: '#1A1D20' },
  subtitulo: { fontSize: 16, color: '#6C757D', marginTop: 8 },
});