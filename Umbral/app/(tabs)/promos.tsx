import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import {
  promocionesService,
  Promocion,
} from "../../src/servicios/promociones";

type EstadoPromo = "vigentes" | "por-vencer" | "proximas";

export default function PromosScreen() {
  const router = useRouter();

  const [tabActiva, setTabActiva] = useState<EstadoPromo>("vigentes");
  const [promos, setPromos] = useState<Promocion[]>([]);
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cargarPromociones = async (estado: EstadoPromo = tabActiva) => {
    try {
      setError(null);

      const data = await promocionesService.obtenerPromociones(estado);

      console.log("Promociones recibidas:", data);

      setPromos(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.log("Error al cargar promociones:", err);

      setError(err.message || "Error al obtener las promociones");
      setPromos([]);
    } finally {
      setCargando(false);
      setRefrescando(false);
    }
  };

  useEffect(() => {
    setCargando(true);
    cargarPromociones(tabActiva);
  }, [tabActiva]);

  const cambiarTab = (estado: EstadoPromo) => {
    if (estado !== tabActiva) {
      setCargando(true);
      setTabActiva(estado);
    }
  };

  const onRefresh = () => {
    setRefrescando(true);
    cargarPromociones();
  };

  const formatearFecha = (fecha: string) => {
    const fechaValida = new Date(fecha);

    if (Number.isNaN(fechaValida.getTime())) {
      return "Fecha no disponible";
    }

    return fechaValida.toLocaleDateString("es-AR");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Promos</Text>

      <Text style={styles.subtitulo}>
        Descubrí promociones vigentes y próximas.
      </Text>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[
            styles.tab,
            tabActiva === "vigentes" && styles.tabActivo,
          ]}
          onPress={() => cambiarTab("vigentes")}
        >
          <Text
            style={
              tabActiva === "vigentes"
                ? styles.tabTextActivo
                : styles.tabText
            }
          >
            Vigentes
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tab,
            tabActiva === "por-vencer" && styles.tabActivo,
          ]}
          onPress={() => cambiarTab("por-vencer")}
        >
          <Text
            style={
              tabActiva === "por-vencer"
                ? styles.tabTextActivo
                : styles.tabText
            }
          >
            Por vencer
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tab,
            tabActiva === "proximas" && styles.tabActivo,
          ]}
          onPress={() => cambiarTab("proximas")}
        >
          <Text
            style={
              tabActiva === "proximas"
                ? styles.tabTextActivo
                : styles.tabText
            }
          >
            Próximas
          </Text>
        </TouchableOpacity>
      </View>

      {cargando ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#1A1D20" />
          <Text style={styles.cargandoTexto}>
            Cargando promociones...
          </Text>
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.errorTexto}>{error}</Text>

          <TouchableOpacity
            style={styles.botonReintentar}
            onPress={() => {
              setCargando(true);
              cargarPromociones();
            }}
          >
            <Text style={styles.botonReintentarTexto}>
              Reintentar
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.lista}
          refreshControl={
            <RefreshControl
              refreshing={refrescando}
              onRefresh={onRefresh}
            />
          }
        >
          {promos.length === 0 ? (
            <Text style={styles.vacioTexto}>
              No hay promociones disponibles en esta categoría.
            </Text>
          ) : (
            promos.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.card}
                onPress={() =>
                  router.push(`/promo/${item.id}` as any)
                }
              >
                {item.soloApp && (
                  <Text style={styles.badge}>
                    SOLO APP
                  </Text>
                )}

                <Text style={styles.cardPorcentaje}>
                  {item.descuento !== null
                    ? `${item.descuento}%`
                    : "PROMO"}
                </Text>

                <Text style={styles.cardTitulo}>
                  {item.titulo}
                </Text>

                <Text style={styles.cardComercio}>
                  {item.detalle}
                </Text>

                <Text style={styles.cardFechas}>
                  Desde: {formatearFecha(item.desde)}
                </Text>

                <Text style={styles.cardFechas}>
                  Hasta: {formatearFecha(item.hasta)}
                </Text>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
    paddingHorizontal: 16,
    paddingTop: 50,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  cargandoTexto: {
    marginTop: 10,
    color: "#6C757D",
  },
  errorTexto: {
    color: "#D9534F",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 12,
  },
  vacioTexto: {
    textAlign: "center",
    color: "#6C757D",
    marginTop: 40,
    fontSize: 16,
  },
  titulo: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#1A1D20",
  },
  subtitulo: {
    fontSize: 14,
    color: "#6C757D",
    marginBottom: 16,
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#E9ECEF",
    borderRadius: 20,
    padding: 4,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 16,
  },
  tabActivo: {
    backgroundColor: "#FFFFFF",
  },
  tabText: {
    color: "#6C757D",
    fontWeight: "500",
  },
  tabTextActivo: {
    color: "#1A1D20",
    fontWeight: "bold",
  },
  lista: {
    paddingBottom: 24,
    gap: 12,
  },
  card: {
    backgroundColor: "#FFEAD2",
    padding: 20,
    borderRadius: 20,
  },
  badge: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#6C757D",
    marginBottom: 4,
  },
  cardPorcentaje: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#1A1D20",
  },
  cardTitulo: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1A1D20",
    marginTop: 4,
  },
  cardComercio: {
    fontSize: 14,
    color: "#6C757D",
    marginTop: 6,
  },
  cardFechas: {
    fontSize: 12,
    color: "#6C757D",
    marginTop: 6,
  },
  botonReintentar: {
    backgroundColor: "#1A1D20",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  botonReintentarTexto: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },
});
