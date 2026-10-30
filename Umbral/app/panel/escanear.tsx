import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import * as LocalAuthentication from 'expo-local-authentication';
import { useRouter } from 'expo-router';
import { promocionesService } from '../../src/servicios/promociones';

export default function EscanearScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [autenticado, setAutenticado] = useState(false);
  const [escaneado, setEscaneado] = useState(false);

  useEffect(() => {
    verificarBiometria();
  }, []);

  const verificarBiometria = async () => {
    try {
      const tieneBiometria = await LocalAuthentication.hasHardwareAsync();
      const estaEnrolado = await LocalAuthentication.isEnrolledAsync();

      if (tieneBiometria && estaEnrolado) {
        const resultado = await LocalAuthentication.authenticateAsync({
          promptMessage: 'Confirmá tu identidad para escanear el QR',
          fallbackLabel: 'Usar contraseña del dispositivo',
        });

        if (resultado.success) {
          setAutenticado(true);
        } else {
          Alert.alert('Autenticación fallida', 'No se pudo verificar la identidad.');
        }
      } else {
        // Dispositivo sin biometría disponible
        setAutenticado(true);
      }
    } catch (e) {
      setAutenticado(true);
    }
  };

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    setEscaneado(true);
    try {
      await promocionesService.validarCodigoQR(data);
      // Vibración de éxito (Háptica)
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('¡Promoción Validada!', 'El código QR fue aceptado con éxito.', [
        { text: 'Aceptar', onPress: () => setEscaneado(false) }
      ]);
    } catch (e: any) {
      // Vibración de error (Háptica)
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error de Validación', e.message || 'Código inválido o expirado.', [
        { text: 'Reintentar', onPress: () => setEscaneado(false) }
      ]);
    }
  };

  if (!permission) return <View style={styles.center} />;

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.textoInfo}>Se necesitan permisos de cámara para escanear el QR.</Text>
        <TouchableOpacity style={styles.boton} onPress={requestPermission}>
          <Text style={styles.botonTexto}>Conceder permiso</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!autenticado) {
    return (
      <View style={styles.center}>
        <Text style={styles.textoInfo}>Esperando autenticación de seguridad...</Text>
        <TouchableOpacity style={styles.boton} onPress={verificarBiometria}>
          <Text style={styles.botonTexto}>Reintentar autenticación</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.botonVolver} onPress={() => router.back()}>
        <Text style={styles.botonVolverTexto}>← Cancelar</Text>
      </TouchableOpacity>

      <CameraView
        style={StyleSheet.absoluteFillObject}
        onBarcodeScanned={escaneado ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ['qr'],
        }}
      />

      <View style={styles.overlay}>
        <Text style={styles.overlayTexto}>Apuntá la cámara al código QR del cliente</Text>
      </View>

      {escaneado && (
        <TouchableOpacity style={styles.botonReescanear} onPress={() => setEscaneado(false)}>
          <Text style={styles.botonTexto}>Escanear de nuevo</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  textoInfo: { fontSize: 16, textAlign: 'center', marginBottom: 16, color: '#333' },
  overlay: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  overlayTexto: { color: '#FFFFFF', fontSize: 14, fontWeight: '500' },
  botonVolver: { position: 'absolute', top: 50, left: 20, zIndex: 10, backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  botonVolverTexto: { color: '#FFFFFF', fontWeight: 'bold' },
  boton: { backgroundColor: '#1A1D20', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 10 },
  botonReescanear: { position: 'absolute', bottom: 100, alignSelf: 'center', backgroundColor: '#1A1D20', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 10 },
  botonTexto: { color: '#FFFFFF', fontWeight: 'bold' },
});