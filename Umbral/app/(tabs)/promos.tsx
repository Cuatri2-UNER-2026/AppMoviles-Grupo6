import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { Chip, EstadoCarga, EstadoError, EstadoVacio } from "../../src/componentes/ui";
import { useDirectorio } from "../../src/hooks/useDirectorio";
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
  const [rubroId, setRubroId] = useState<string | null>(null);
  // Los rubros salen del mismo directorio que usan Buscar y Mapa.
  const { datos: directorio } = useDirectorio();

  // Número de pedido: si llega la respuesta de una pestaña anterior, se descarta.
  const pedidoActual = useRef(0);

  const cargarPromociones = useCallback(async (estado: EstadoPromo, rubro: string | null) => {
    const pedido = ++pedidoActual.current;
    try {
      setError(null);
      const data = await promocionesService.obtenerPromociones(estado, rubro ?? undefined);
      if (pedido !== pedidoActual.current) return;
      setPromos(Array.isArray(data) ? data : []);
    } catch (err: any) {
      if (pedido !== pedidoActual.current) return;
      setError(err?.message || "Error al obtener las promociones");
      setPromos([]);
    } finally {
      if (pedido === pedidoActual.current) {
        setCargando(false);
        setRefrescando(false);
      }
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carga desde la API al cambiar de pestaña
    cargarPromociones(tabActiva, rubroId);
  }, [tabActiva, rubroId, cargarPromociones]);

  const cambiarTab = (estado: EstadoPromo) => {
    if (estado !== tabActiva) {
      setCargando(true);
      setTabActiva(estado);
    }
  };

  const onRefresh = () => {
    setRefrescando(true);
    cargarPromociones(tabActiva, rubroId);
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

      {!!directorio?.rubros.length && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filtros}
          contentContainerStyle={styles.filtrosContenido}
        >
          <Chip
            texto="Todos los rubros"
            activo={!rubroId}
            onPress={() => {
              setCargando(true);
              setRubroId(null);
            }}
          />
          {directorio.rubros.map((r) => (
            <Chip
              key={r.id}
              texto={r.nombre}
              color={r.color}
              activo={rubroId === r.id}
              onPress={() => {
                setCargando(true);
                setRubroId(rubroId === r.id ? null : r.id);
              }}
            />
          ))}
        </ScrollView>
      )}

      {cargando ? (
        <EstadoCarga texto="Cargando promociones..." />
      ) : error ? (
        <EstadoError
          mensaje={error}
          onReintentar={() => {
            setCargando(true);
            cargarPromociones(tabActiva, rubroId);
          }}
        />
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
            <EstadoVacio
              icono="pricetags-outline"
              titulo="No hay promociones acá"
              texto={
                rubroId
                  ? "Este rubro no tiene promociones en esta categoría. Probá con otro rubro."
                  : "No hay promociones disponibles en esta categoría por ahora."
              }
            />
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
                  {item.descuento != null
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
  filtros: { flexGrow: 0, marginBottom: 12 },
  filtrosContenido: { gap: 8, paddingHorizontal: 2 },
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
    paddingHorizontal: 16,
    paddingTop: 50,
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
});
