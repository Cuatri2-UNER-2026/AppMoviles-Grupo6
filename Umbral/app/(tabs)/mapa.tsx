import Ionicons from "@react-native-vector-icons/ionicons";
import { router } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE, type Region } from "react-native-maps";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useComercios } from "../../src/hooks/useComercios";
import { useUbicacion } from "../../src/hooks/useUbicacion";
import { colores, fuentes } from "../../src/tema";
import type { Comercio, Coordenadas } from "../../src/tipos";
import { calcularEstado } from "../../src/utils/abiertoAhora";
import { distanciaEnMetros, formatearDistancia } from "../../src/utils/distancia";

// Centro de Concepción del Uruguay: se usa cuando no hay ubicación de la persona.
const CENTRO_CIUDAD: Region = {
  latitude: -32.4825,
  longitude: -58.2372,
  latitudeDelta: 0.04,
  longitudeDelta: 0.04,
};

const VERDE = "#2E8B63";

function abrirComoLlegar(destino: Coordenadas) {
  // La URL universal de Google Maps abre la app de mapas del teléfono (o el navegador si no hay).
  Linking.openURL(
    `https://www.google.com/maps/dir/?api=1&destination=${destino.latitud},${destino.longitud}&travelmode=walking`,
  );
}

export default function MapaScreen() {
    const insets = useSafeAreaInsets();
    const { comercios, rubros, cargando, error, reintentar } = useComercios();
    const { coordenadas, permiso, solicitar } = useUbicacion();

    const mapaRef = useRef<MapView>(null);
    const [rubroId, setRubroId] = useState<string | null>(null);
    const [seleccionadoId, setSeleccionadoId] = useState<string | null>(null);

    const colorDeRubro = useMemo(() => new Map(rubros.map((r) => [r.id, r.color])), [rubros]);

    const visibles = useMemo(
        () => comercios.filter((c) => (rubroId ? c.rubroId === rubroId : true)),
        [comercios, rubroId],
    );
    const seleccionado = visibles.find((c) => c.id === seleccionadoId) ?? null;

    // Los pines son vistas propias: Android las dibuja en la primera pasada y después las congelamos.
    const [trackear, setTrackear] = useState(true);
    useEffect(() => {
        setTrackear(true);
        const t = setTimeout(() => setTrackear(false), 800);
        return () => clearTimeout(t);
    }, [visibles, seleccionadoId, colorDeRubro]);

    // Cuando llega la ubicación por primera vez, centramos el mapa en la persona.
    const yaCentrado = useRef(false);
    useEffect(() => {
        if (coordenadas && !yaCentrado.current) {
        yaCentrado.current = true;
        mapaRef.current?.animateToRegion(
            {
            latitude: coordenadas.latitud,
            longitude: coordenadas.longitud,
            latitudeDelta: 0.02,
            longitudeDelta: 0.02,
            },
            400,
        );
        }
    }, [coordenadas]);

    const irAMiUbicacion = () => {
        if (!coordenadas) {
        solicitar();
        return;
        }
        mapaRef.current?.animateToRegion(
        {
            latitude: coordenadas.latitud,
            longitude: coordenadas.longitud,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
        },
        400,
        );
    };

    const elegir = (c: Comercio) => {
        setSeleccionadoId(c.id);
        mapaRef.current?.animateToRegion(
        {
            latitude: c.coordenadas.latitud,
            longitude: c.coordenadas.longitud,
            latitudeDelta: 0.012,
            longitudeDelta: 0.012,
        },
        300,
        );
    };

    return (
        <View style={estilos.pantalla}>
        <MapView ref={mapaRef} style={StyleSheet.absoluteFill} provider={PROVIDER_GOOGLE} initialRegion={CENTRO_CIUDAD} showsUserLocation={permiso === "concedido"} showsMyLocationButton={false} toolbarEnabled={false} onPress={() => setSeleccionadoId(null)}>
            {visibles.map((c) => {
            const activo = c.id === seleccionadoId;
            return (
                <Marker
                key={c.id}
                coordinate={{ latitude: c.coordenadas.latitud, longitude: c.coordenadas.longitud }}
                onPress={() => elegir(c)}
                tracksViewChanges={trackear}
                anchor={{ x: 0.5, y: 0.5 }}
                zIndex={activo ? 2 : 1}
                >
                <View
                    style={[
                    estilos.pin,
                    { backgroundColor: colorDeRubro.get(c.rubroId) ?? colores.indigo },
                    activo && estilos.pinActivo,
                    ]}
                />
                </Marker>
            );
            })}
        </MapView>

        {/* Filtro por rubro */}
        <View style={[estilos.superior, { paddingTop: insets.top + 8 }]} pointerEvents="box-none">
            <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={estilos.chips}
            >
            <Chip texto="Todos" activo={rubroId === null} onPress={() => setRubroId(null)} />
            {rubros.map((r) => (
                <Chip
                key={r.id}
                texto={r.nombre}
                color={r.color}
                activo={rubroId === r.id}
                onPress={() => setRubroId(rubroId === r.id ? null : r.id)}
                />
            ))}
            </ScrollView>

            {permiso === "denegado" && (
            <Pressable style={estilos.aviso} onPress={solicitar}>
                <Ionicons name="location-outline" size={18} color={colores.pizarra} />
                <Text style={estilos.textoAviso}>
                No tenemos tu ubicación, así que no podemos mostrarte en el mapa. Tocá para activarla.
                </Text>
            </Pressable>
            )}
        </View>

        {/* Estados de carga y error: el mapa queda de fondo */}
        {cargando && (
            <View style={estilos.estado} pointerEvents="none">
            <ActivityIndicator color={colores.indigo} />
            <Text style={estilos.textoEstado}>Cargando comercios…</Text>
            </View>
        )}
        {!cargando && error && (
            <Pressable style={estilos.estado} onPress={reintentar}>
            <Ionicons name="cloud-offline-outline" size={18} color={colores.pizarra} />
            <Text style={estilos.textoEstado}>{error} Tocá para reintentar.</Text>
            </Pressable>
        )}
        {!cargando && !error && visibles.length === 0 && (
            <View style={estilos.estado} pointerEvents="none">
            <Text style={estilos.textoEstado}>No hay comercios de este rubro.</Text>
            </View>
        )}

        {/* Botón "mi ubicación" */}
        <Pressable
            style={[estilos.botonUbicacion, { bottom: seleccionado ? 190 : 24 }]}
            onPress={irAMiUbicacion}
            accessibilityLabel="Ir a mi ubicación"
        >
            <Ionicons
            name={permiso === "concedido" ? "locate" : "locate-outline"}
            size={22}
            color={colores.pizarra}
            />
        </Pressable>

        {/* Tarjeta del comercio elegido */}
        {seleccionado && (
            <TarjetaMapa
            comercio={seleccionado}
            nombreRubro={rubros.find((r) => r.id === seleccionado.rubroId)?.nombre}
            distancia={coordenadas ? distanciaEnMetros(coordenadas, seleccionado.coordenadas) : null}
            margenInferior={insets.bottom}
            />
        )}
        </View>
    );
}

function Chip({ texto, activo, onPress, color, }: {
    texto: string;
    activo: boolean;
    onPress: () => void;
    color?: string;
    }) {
    return (
        <Pressable
        onPress={onPress}
        style={[estilos.chip, activo && estilos.chipActivo]}
        accessibilityRole="button"
        accessibilityState={{ selected: activo }}
        >
        {color && <View style={[estilos.puntoChip, { backgroundColor: color }]} />}
        <Text style={[estilos.textoChip, activo && estilos.textoChipActivo]}>{texto}</Text>
        </Pressable>
    );
}

function TarjetaMapa({ comercio, nombreRubro, distancia, margenInferior }: {
    comercio: Comercio;
    nombreRubro: string | undefined;
    distancia: number | null;
    margenInferior: number;
    }) {
    const estado = calcularEstado(comercio.horarios);

    return (
        <View style={[estilos.tarjeta, { marginBottom: margenInferior + 12 }]}>
        <View style={estilos.filaNombre}>
            <Text style={estilos.nombre} numberOfLines={1}>
            {comercio.nombre}
            </Text>
            {distancia !== null && <Text style={estilos.distancia}>{formatearDistancia(distancia)}</Text>}
        </View>
        {nombreRubro && <Text style={estilos.rubro}>{nombreRubro}</Text>}
        <Text style={[estilos.estadoApertura, estado.abierto && { color: VERDE }]}>
            {estado.etiqueta}
            {comercio.cantidadResenas > 0 && ` · ★ ${comercio.puntaje.toFixed(1).replace(".", ",")}`}
        </Text>

        <View style={estilos.acciones}>
            <Pressable
            style={[estilos.boton, estilos.botonPrimario]}
            onPress={() => abrirComoLlegar(comercio.coordenadas)}
            >
            <Ionicons name="navigate" size={16} color={colores.blanco} />
            <Text style={estilos.textoBotonPrimario}>Cómo llegar</Text>
            </Pressable>
            <Pressable
            style={[estilos.boton, estilos.botonSecundario]}
            onPress={() => router.push({ pathname: "/comercio/[id]", params: { id: comercio.id } })}
            >
            <Text style={estilos.textoBotonSecundario}>Ver ficha</Text>
            </Pressable>
        </View>
        </View>
    );
}

const estilos = StyleSheet.create({
    pantalla: {
        flex: 1, 
        backgroundColor: colores.niebla 
    },
    pin: {
        width: 22,
        height: 22,
        borderRadius: 11,
        borderWidth: 3,
        borderColor: colores.blanco,
    },
    pinActivo: { 
        width: 32, 
        height: 32, 
        borderRadius: 16, 
        borderWidth: 4, 
        borderColor: colores.pizarra },

    superior: { position: "absolute", top: 0, left: 0, right: 0, gap: 8 },
    chips: { gap: 8, paddingHorizontal: 12 },
    chip: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        paddingHorizontal: 14,
        height: 34,
        borderRadius: 17,
        backgroundColor: colores.blanco,
        elevation: 3,
        shadowColor: "#000",
        shadowOpacity: 0.12,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 1 },
    },
    chipActivo: { backgroundColor: colores.pizarra },
    puntoChip: { width: 9, height: 9, borderRadius: 5 },
    textoChip: { fontFamily: fuentes.textoMedio, fontSize: 13, color: colores.pizarra },
    textoChipActivo: { color: colores.blanco },

    aviso: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginHorizontal: 12,
        backgroundColor: colores.durazno,
        borderRadius: 12,
        padding: 10,
    },
    textoAviso: { flex: 1, fontFamily: fuentes.texto, fontSize: 12, color: colores.pizarra },

    estado: {
        position: "absolute",
        alignSelf: "center",
        top: "45%",
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        backgroundColor: colores.blanco,
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 10,
        maxWidth: "85%",
        elevation: 4,
    },
    textoEstado: { fontFamily: fuentes.textoMedio, fontSize: 13, color: colores.pizarra, flexShrink: 1 },

    botonUbicacion: {
        position: "absolute",
        right: 16,
        width: 46,
        height: 46,
        borderRadius: 23,
        backgroundColor: colores.blanco,
        alignItems: "center",
        justifyContent: "center",
        elevation: 4,
    },

    tarjeta: {
        position: "absolute",
        left: 12,
        right: 12,
        bottom: 0,
        backgroundColor: colores.blanco,
        borderRadius: 18,
        padding: 14,
        gap: 4,
        elevation: 6,
        shadowColor: "#000",
        shadowOpacity: 0.15,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
    },
    filaNombre: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
    nombre: { flex: 1, fontFamily: fuentes.subtitulo, fontSize: 16, color: colores.pizarra },
    distancia: { fontFamily: fuentes.textoMedio, fontSize: 12, color: colores.pizarra },
    rubro: { fontFamily: fuentes.texto, fontSize: 12, color: "#5B6573" },
    estadoApertura: { fontFamily: fuentes.textoMedio, fontSize: 12, color: "#5B6573" },
    acciones: { flexDirection: "row", gap: 8, marginTop: 8 },
    boton: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        height: 40,
        borderRadius: 12,
    },
    botonPrimario: { backgroundColor: colores.indigo },
    textoBotonPrimario: { fontFamily: fuentes.textoNegrita, fontSize: 13, color: colores.blanco },
    botonSecundario: { backgroundColor: colores.niebla },
    textoBotonSecundario: { fontFamily: fuentes.textoNegrita, fontSize: 13, color: colores.pizarra },
});