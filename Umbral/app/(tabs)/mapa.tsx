import { Ionicons } from "@react-native-vector-icons/ionicons";
import { router } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import MapView, { Marker, type Region } from "react-native-maps";
import { SafeAreaView } from "react-native-safe-area-context";
import { Chip, TarjetaVidrio } from "../../src/componentes/ui";
import { useDirectorio } from "../../src/hooks/useDirectorio";
import { useUbicacion } from "../../src/hooks/useUbicacion";
import { colores, fuentes, radio } from "../../src/tema";
import { estadoApertura } from "../../src/utils/abiertoAhora";
import { abrirComoLlegar } from "../../src/utils/comoLlegar";
import { distanciaMetros, formatearDistancia } from "../../src/utils/distancia";

// Centro de Concepción del Uruguay: se usa hasta tener la ubicación de la persona.
const CENTRO: Region = {
  latitude: -32.4835,
  longitude: -58.2365,
  latitudeDelta: 0.025,
  longitudeDelta: 0.025,
};

export default function Mapa() {
  const { datos, cargando, error, recargar } = useDirectorio();
  const { ubicacion, coordenadas, reintentar } = useUbicacion();
  const mapa = useRef<MapView>(null);

  const [rubroId, setRubroId] = useState<string | null>(null);
  const [seleccionadoId, setSeleccionadoId] = useState<string | null>(null);

  const visibles = useMemo(
    () => (datos?.comercios ?? []).filter((c) => !rubroId || c.rubroId === rubroId),
    [datos, rubroId],
  );
  const seleccionado = visibles.find((c) => c.id === seleccionadoId) ?? null;

  // La primera vez que llega la ubicación, el mapa se centra en la persona.
  const centrado = useRef(false);
  useEffect(() => {
    if (coordenadas && !centrado.current) {
      centrado.current = true;
      mapa.current?.animateToRegion(
        { latitude: coordenadas.latitud, longitude: coordenadas.longitud, latitudeDelta: 0.02, longitudeDelta: 0.02 },
        600,
      );
    }
  }, [coordenadas]);

  const centrarEnMi = () => {
    if (!coordenadas) return reintentar();
    mapa.current?.animateToRegion(
      { latitude: coordenadas.latitud, longitude: coordenadas.longitud, latitudeDelta: 0.015, longitudeDelta: 0.015 },
      400,
    );
  };

  const rubro = seleccionado ? datos?.rubroPorId.get(seleccionado.rubroId) : undefined;
  const apertura = seleccionado ? estadoApertura(seleccionado.horarios) : null;

  return (
    <View style={estilos.pantalla}>
      <MapView
        ref={mapa}
        style={StyleSheet.absoluteFill}
        initialRegion={CENTRO}
        showsUserLocation={ubicacion.estado === "lista"}
        showsMyLocationButton={false}
        toolbarEnabled={false}
        onPress={() => setSeleccionadoId(null)}
      >
        {visibles.map((c) => (
          <Marker
            key={c.id}
            coordinate={{ latitude: c.coordenadas.latitud, longitude: c.coordenadas.longitud }}
            pinColor={datos?.rubroPorId.get(c.rubroId)?.color ?? colores.acento}
            onPress={(e) => {
              e.stopPropagation();
              setSeleccionadoId(c.id);
            }}
          />
        ))}
      </MapView>

      <SafeAreaView edges={["top"]} style={estilos.arriba} pointerEvents="box-none">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={estilos.chips}>
          <Chip texto="Todos" activo={!rubroId} onPress={() => setRubroId(null)} conSombra />
          {datos?.rubros.map((r) => (
            <Chip
              key={r.id}
              texto={r.nombre}
              color={r.color}
              activo={rubroId === r.id}
              conSombra
              onPress={() => {
                setRubroId(rubroId === r.id ? null : r.id);
                setSeleccionadoId(null);
              }}
            />
          ))}
        </ScrollView>

        {(ubicacion.estado === "denegada" || ubicacion.estado === "error") && (
          <View style={estilos.aviso}>
            <Ionicons name="location-outline" size={18} color={colores.texto} />
            <Text style={estilos.textoAviso}>
              {ubicacion.estado === "denegada"
                ? "No tenemos permiso para usar tu ubicación, así que no te mostramos en el mapa. Los comercios se ven igual."
                : "No pudimos obtener tu ubicación."}
            </Text>
            <Pressable
              onPress={() =>
                ubicacion.estado === "denegada" && !ubicacion.puedePreguntar
                  ? Linking.openSettings()
                  : reintentar()
              }
              hitSlop={8}
            >
              <Text style={estilos.enlace}>
                {ubicacion.estado === "denegada" && !ubicacion.puedePreguntar ? "Ajustes" : "Activar"}
              </Text>
            </Pressable>
          </View>
        )}

        {cargando && !datos && (
          <View style={estilos.aviso}>
            <ActivityIndicator color={colores.texto} />
            <Text style={estilos.textoAviso}>Cargando comercios...</Text>
          </View>
        )}
        {error && !datos && (
          <View style={estilos.aviso}>
            <Text style={[estilos.textoAviso, { color: colores.error }]}>{error}</Text>
            <Pressable onPress={recargar} hitSlop={8}>
              <Text style={estilos.enlace}>Reintentar</Text>
            </Pressable>
          </View>
        )}
      </SafeAreaView>

      {ubicacion.estado === "lista" && (
        <Pressable
          style={[estilos.botonMi, seleccionado && { bottom: 200 }]}
          onPress={centrarEnMi}
          accessibilityLabel="Centrar el mapa en mi ubicación"
        >
          <Ionicons name="locate" size={22} color={colores.texto} />
        </Pressable>
      )}

      {seleccionado && (
        <TarjetaVidrio style={estilos.tarjeta} intensidad={60}>
          <View style={{ gap: 4 }}>
          <View style={estilos.filaTitulo}>
            <View style={[estilos.punto, { backgroundColor: rubro?.color ?? colores.acento }]} />
            <Text style={estilos.nombre} numberOfLines={1}>
              {seleccionado.nombre}
            </Text>
            <Pressable onPress={() => setSeleccionadoId(null)} hitSlop={10} accessibilityLabel="Cerrar">
              <Ionicons name="close" size={20} color={colores.textoSuave} />
            </Pressable>
          </View>
          <Text style={estilos.textoSuave} numberOfLines={1}>
            {rubro?.nombre} · {seleccionado.direccion}
          </Text>
          <Text style={estilos.textoSuave}>
            <Text style={{ color: apertura?.abierto ? colores.abierto : colores.cerrado, fontFamily: fuentes.cuerpoFuerte }}>
              {apertura?.abierto ? "Abierto" : "Cerrado"}
            </Text>
            {` · ${apertura?.detalle}`}
            {coordenadas ? ` · ${formatearDistancia(distanciaMetros(coordenadas, seleccionado.coordenadas))}` : ""}
          </Text>
          <View style={estilos.botones}>
            <Pressable
              style={[estilos.boton, estilos.botonClaro]}
              onPress={() => router.push({ pathname: "/comercio/[id]", params: { id: seleccionado.id } })}
            >
              <Text style={[estilos.textoBoton, { color: colores.texto }]}>Ver ficha</Text>
            </Pressable>
            <Pressable
              style={estilos.boton}
              onPress={() => abrirComoLlegar(seleccionado.coordenadas, seleccionado.nombre)}
            >
              <Ionicons name="navigate" size={16} color="#fff" />
              <Text style={estilos.textoBoton}>Cómo llegar</Text>
            </Pressable>
          </View>
  </View>
        </TarjetaVidrio>
      )}
    </View>
  );
}

const sombra = {
  shadowColor: "#000",
  shadowOpacity: 0.12,
  shadowRadius: 8,
  shadowOffset: { width: 0, height: 2 },
  elevation: 4,
};

const estilos = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: colores.fondo },
  arriba: { position: "absolute", top: 0, left: 0, right: 0, gap: 8 },
  chips: { gap: 8, paddingHorizontal: 12, paddingTop: 8 },
  punto: { width: 10, height: 10, borderRadius: 5 },
  aviso: {
    marginHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colores.superficie,
    borderLeftWidth: 4,
    borderLeftColor: colores.aviso,
    borderRadius: radio.s,
    padding: 10,
    ...sombra,
  },
  textoAviso: { flex: 1, fontFamily: fuentes.cuerpo, fontSize: 13, color: colores.texto },
  enlace: { fontFamily: fuentes.cuerpoFuerte, fontSize: 13, color: colores.acentoOscuro },
  botonMi: {
    position: "absolute",
    right: 16,
    bottom: 24,
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colores.superficie,
    alignItems: "center",
    justifyContent: "center",
    ...sombra,
  },
  tarjeta: {
    position: "absolute",
    left: 12,
    right: 12,
    bottom: 16,
    ...sombra,
  },
  filaTitulo: { flexDirection: "row", alignItems: "center", gap: 8 },
  nombre: { flex: 1, fontFamily: fuentes.titulo, fontSize: 17, color: colores.texto },
  textoSuave: { fontFamily: fuentes.cuerpo, fontSize: 13, color: colores.textoSuave },
  botones: { flexDirection: "row", gap: 8, marginTop: 10 },
  boton: {
    flex: 1,
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colores.texto,
    paddingVertical: 11,
    borderRadius: radio.m,
  },
  botonClaro: { backgroundColor: colores.fondo, borderWidth: 1, borderColor: colores.borde },
  textoBoton: { color: "#fff", fontFamily: fuentes.cuerpoFuerte, fontSize: 14 },
});
