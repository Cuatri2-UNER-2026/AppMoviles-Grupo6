
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import QRCode from 'react-native-qrcode-svg';
import {
  promocionesService,
  Promocion,
} from '../../src/servicios/promociones';

export default function DetallePromoScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [promo, setPromo] = useState<Promocion | null>(null);
  const [codigoQR, setCodigoQR] = useState<string | null>(null);
  const [mensajeQR, setMensajeQR] = useState('');
  const [cargando, setCargando] = useState(true);
  const [cargandoQR, setCargandoQR] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let activo = true;

    const cargarDetalle = async () => {
      if (!id || typeof id !== 'string') {
        setError('No se recibió el identificador de la promoción');
        setCargando(false);
        return;
      }

      try {
        setCargando(true);
        setError(null);

        const data = await promocionesService.obtenerPromocionPorId(id);

        if (!activo) return;

        setPromo(data);

        if (data.soloApp) {
          setCargandoQR(true);
          setMensajeQR('');

          try {
            const usos = await promocionesService.obtenerMisUsos();

            if (!activo) return;

            const usoEncontrado = usos.find(
              (uso) => uso.promocionId === data.id
            );

            if (!usoEncontrado) {
              setMensajeQR(
                'Todavía no tenés un código de canje para esta promoción.'
              );
            } else if (usoEncontrado.validadoEn) {
              setMensajeQR('Este código ya fue utilizado.');
            } else {
              setCodigoQR(usoEncontrado.codigo);
            }
          } catch (err: any) {
            if (activo) {
              setMensajeQR(
                err.message || 'No se pudieron cargar tus códigos.'
              );
            }
          } finally {
            if (activo) {
              setCargandoQR(false);
            }
          }
        }
      } catch (err: any) {
        if (activo) {
          setError(err.message || 'Error al cargar la promoción');
        }
      } finally {
        if (activo) {
          setCargando(false);
        }
      }
    };

    cargarDetalle();

    return () => {
      activo = false;
    };
  }, [id]);

  if (cargando) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1A1D20" />
        <Text style={styles.textoCargando}>Cargando promoción...</Text>
      </View>
    );
  }

  if (error || !promo) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorTexto}>
          {error || 'Promoción no encontrada'}
        </Text>

        <TouchableOpacity
          style={styles.botonVolver}
          onPress={() => router.back()}
        >
          <Text style={styles.botonVolverTexto}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const fechaHasta =
    promo.hasta && !Number.isNaN(Date.parse(promo.hasta))
      ? new Date(promo.hasta).toLocaleDateString('es-AR', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })
      : 'Fecha no disponible';

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <TouchableOpacity
        style={styles.botonAtras}
        onPress={() => router.back()}
      >
        <Text style={styles.botonAtrasTexto}>← Volver</Text>
      </TouchableOpacity>

      <View style={styles.cardHeader}>
        {promo.soloApp && (
          <Text style={styles.badge}>SOLO APP</Text>
        )}

        <Text style={styles.descuento}>
          {promo.descuento != null
            ? `${promo.descuento}% OFF`
            : 'Beneficio especial'}
        </Text>

        <Text style={styles.titulo}>{promo.titulo}</Text>
      </View>

      <View style={styles.seccion}>
        <Text style={styles.seccionTitulo}>Condiciones</Text>

        <Text style={styles.descripcion}>
          {promo.detalle || 'No hay condiciones adicionales.'}
        </Text>

        <Text style={styles.fecha}>
          Válido hasta el {fechaHasta}
        </Text>
      </View>

      {promo.soloApp && (
        <View style={styles.qrContainer}>
          <Text style={styles.qrTitulo}>
            Presentá este código en el local
          </Text>

          {cargandoQR ? (
            <ActivityIndicator size="large" color="#1A1D20" />
          ) : codigoQR ? (
            <>
              <View style={styles.qrWrapper}>
                <QRCode value={codigoQR} size={200} />
              </View>

              <Text style={styles.qrCodigoTexto}>
                {codigoQR}
              </Text>
            </>
          ) : (
            <Text style={styles.qrPendiente}>
              {mensajeQR}
            </Text>
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#F8F9FA',
    flexGrow: 1,
    paddingTop: 50,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  textoCargando: {
    marginTop: 12,
    color: '#6C757D',
  },
  botonAtras: {
    marginBottom: 16,
  },
  botonAtrasTexto: {
    fontSize: 16,
    color: '#1A1D20',
    fontWeight: 'bold',
  },
  cardHeader: {
    backgroundColor: '#FFEAD2',
    padding: 24,
    borderRadius: 20,
    marginBottom: 20,
  },
  badge: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#6C757D',
    marginBottom: 6,
  },
  descuento: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#1A1D20',
  },
  titulo: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1A1D20',
    marginTop: 6,
  },
  seccion: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
  },
  seccionTitulo: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1D20',
    marginBottom: 8,
  },
  descripcion: {
    fontSize: 15,
    color: '#495057',
    lineHeight: 22,
  },
  fecha: {
    fontSize: 13,
    color: '#6C757D',
    marginTop: 12,
    fontWeight: '500',
  },
  qrContainer: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderRadius: 20,
    alignItems: 'center',
    marginBottom: 20,
  },
  qrTitulo: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1A1D20',
    marginBottom: 16,
    textAlign: 'center',
  },
  qrWrapper: {
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    elevation: 2,
  },
  qrCodigoTexto: {
    marginTop: 12,
    fontSize: 14,
    color: '#6C757D',
    fontWeight: '500',
  },
  qrPendiente: {
    fontSize: 14,
    color: '#6C757D',
    textAlign: 'center',
    lineHeight: 21,
  },
  errorTexto: {
    color: '#D9534F',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  botonVolver: {
    backgroundColor: '#1A1D20',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  botonVolverTexto: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});
