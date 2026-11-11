import Ionicons from "@react-native-vector-icons/ionicons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Keyboard, Pressable, RefreshControl, ScrollView, StyleSheet, Switch, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useComercios } from "../../src/hooks/useComercios";
import { useUbicacion } from "../../src/hooks/useUbicacion";
import { colores, fuentes } from "../../src/tema";
import type { Promocion } from "../../src/tipos";
import { buscarComercios, type ComercioListado, type Orden } from "../../src/utils/buscar";
import { formatearDistancia } from "../../src/utils/distancia";

const ORDENES: { clave: Orden; etiqueta: string }[] = [
  { clave: "distancia", etiqueta: "Más cerca primero" },
  { clave: "puntaje", etiqueta: "Mejor puntuados" },
  { clave: "nombre", etiqueta: "Por nombre" },
];

export default function BuscarScreen() {
    const insets = useSafeAreaInsets();
    const { comercios, rubros, promoPorComercio, cargando, refrescando, error, recargar, reintentar } =
        useComercios();
    const { coordenadas, permiso, solicitar } = useUbicacion();

    const [texto, setTexto] = useState("");
    const [rubroId, setRubroId] = useState<string | null>(null);
    const [soloAbiertos, setSoloAbiertos] = useState(false);
    const [orden, setOrden] = useState<Orden>("distancia");

    // "Abierto ahora" tiene que ir cambiando mientras la app está abierta.
    const [ahora, setAhora] = useState(() => new Date());
    useEffect(() => {
        const id = setInterval(() => setAhora(new Date()), 60_000);
        return () => clearInterval(id);
    }, []);

    const filas = useMemo(
        () =>
        buscarComercios({
            comercios,
            rubros,
            texto,
            rubroId,
            soloAbiertos,
            orden,
            ubicacion: coordenadas,
            ahora,
        }),
        [comercios, rubros, texto, rubroId, soloAbiertos, orden, coordenadas, ahora],
    );

    const hayFiltros = texto.trim() !== "" || rubroId !== null || soloAbiertos;
    const limpiarFiltros = () => {
        setTexto("");
        setRubroId(null);
        setSoloAbiertos(false);
    };

    const ordenActual = ORDENES.find((o) => o.clave === orden)!;
    const ordenEfectivo = orden === "distancia" && !coordenadas ? ORDENES[2] : ordenActual;
    const siguienteOrden = () => {
        const i = ORDENES.findIndex((o) => o.clave === orden);
        setOrden(ORDENES[(i + 1) % ORDENES.length].clave);
    };

    return (
        <LinearGradient
        colors={[colores.salvia, colores.niebla, colores.niebla, colores.lila]}
        style={[estilos.pantalla, { paddingTop: insets.top + 12 }]}
        >
        <View style={estilos.encabezado}>
            {/* Marca: un umbral (puerta en arco) + nombre + ciudad */}
            <View style={estilos.filaMarca}>
            <View style={estilos.marca}>
                <View style={estilos.arco} accessibilityElementsHidden importantForAccessibility="no">
                <View style={estilos.puerta} />
                </View>
                <Text style={estilos.nombreApp}>Umbral</Text>
            </View>
            <View style={estilos.ciudad}>
                <Ionicons name="location" size={12} color={colores.indigo} />
                <Text style={estilos.textoCiudad}>Concepción del Uruguay</Text>
            </View>
            </View>

            <Text style={estilos.titulo}>Descubrí lo que hay a seis cuadras</Text>

            <View style={estilos.buscador}>
            <Ionicons name="search-outline" size={18} color={colores.pizarra} />
            <TextInput
                style={estilos.input}
                placeholder="Buscar por nombre o por lo que venden"
                placeholderTextColor={colores.gris}
                value={texto}
                onChangeText={setTexto}
                returnKeyType="search"
                onSubmitEditing={Keyboard.dismiss}
                autoCorrect={false}
            />
            {texto !== "" && (
                <Pressable onPress={() => setTexto("")} hitSlop={10} accessibilityLabel="Borrar búsqueda">
                <Ionicons name="close-circle" size={18} color={colores.gris} />
                </Pressable>
            )}
            <Pressable style={estilos.botonBuscar} onPress={Keyboard.dismiss}>
                <Text style={estilos.textoBotonBuscar}>Buscar</Text>
            </Pressable>
            </View>

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
                activo={rubroId === r.id}
                onPress={() => setRubroId(rubroId === r.id ? null : r.id)}
                />
            ))}
            </ScrollView>

            <View style={estilos.filaFiltros}>
            <View style={estilos.filtroAbiertos}>
                <Switch
                value={soloAbiertos}
                onValueChange={setSoloAbiertos}
                trackColor={{ false: "#D1D5DB", true: colores.salvia }}
                thumbColor={soloAbiertos ? colores.verde : colores.indigo}
                ios_backgroundColor="#D1D5DB"
                />
                <Text style={estilos.textoFiltro}>Abierto ahora</Text>
            </View>

            <Pressable style={estilos.orden} onPress={siguienteOrden} accessibilityLabel="Cambiar orden">
                <Text style={estilos.textoOrden}>{ordenEfectivo.etiqueta}</Text>
                <Ionicons name="chevron-down" size={14} color={colores.pizarra} />
            </Pressable>
            </View>

            {permiso === "denegado" && (
            <Pressable style={estilos.avisoUbicacion} onPress={solicitar}>
                <Ionicons name="location-outline" size={16} color={colores.pizarra} />
                <Text style={estilos.textoAviso}>
                Sin tu ubicación no podemos mostrar distancias. Tocá para activarla.
                </Text>
            </Pressable>
            )}
        </View>

        {cargando ? (
            <View style={estilos.centro}>
            <ActivityIndicator size="large" color={colores.indigo} />
            <Text style={estilos.textoEstado}>Cargando comercios…</Text>
            </View>
        ) : error ? (
            <View style={estilos.centro}>
            <Ionicons name="cloud-offline-outline" size={40} color={colores.pizarra} />
            <Text style={estilos.tituloEstado}>No pudimos cargar los comercios</Text>
            <Text style={estilos.textoEstado}>{error}</Text>
            <Pressable style={estilos.botonEstado} onPress={reintentar}>
                <Text style={estilos.textoBotonEstado}>Reintentar</Text>
            </Pressable>
            </View>
        ) : (
            <FlatList
            data={filas}
            keyExtractor={(f) => f.comercio.id}
            renderItem={({ item }) => (
                <Tarjeta fila={item} promo={promoPorComercio[item.comercio.id]} />
            )}
            contentContainerStyle={estilos.lista}
            keyboardShouldPersistTaps="handled"
            refreshControl={
                <RefreshControl refreshing={refrescando} onRefresh={recargar} tintColor={colores.indigo} />
            }
            ListEmptyComponent={
                <View style={estilos.centro}>
                <Ionicons name="storefront-outline" size={40} color={colores.pizarra} />
                <Text style={estilos.tituloEstado}>No encontramos comercios</Text>
                <Text style={estilos.textoEstado}>
                    {hayFiltros
                    ? "Probá con otra palabra o quitá algún filtro."
                    : "Todavía no hay comercios cargados."}
                </Text>
                {hayFiltros && (
                    <Pressable style={estilos.botonEstado} onPress={limpiarFiltros}>
                    <Text style={estilos.textoBotonEstado}>Limpiar filtros</Text>
                    </Pressable>
                )}
                </View>
            }
            />
        )}
        </LinearGradient>
    );
}

function Chip({
  texto,
  activo,
  onPress,
}: {
  texto: string;
  activo: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[estilos.chip, activo && estilos.chipActivo]}
      accessibilityRole="button"
      accessibilityState={{ selected: activo }}
    >
      <Text style={[estilos.textoChip, activo && estilos.textoChipActivo]}>{texto}</Text>
    </Pressable>
  );
}

function Tarjeta({ fila, promo }: { fila: ComercioListado; promo: Promocion | undefined }) {
  const { comercio, rubro, distancia, estado } = fila;
  const color = rubro?.color ?? colores.indigo;

  return (
    <Pressable
      style={({ pressed }) => [estilos.tarjeta, pressed && { opacity: 0.85 }]}
      onPress={() => router.push({ pathname: "/comercio/[id]", params: { id: comercio.id } })}
      accessibilityRole="button"
      accessibilityLabel={`${comercio.nombre}. ${estado.etiqueta}`}
    >
      <View style={[estilos.inicial, { backgroundColor: `${color}33` }]}>
        <Text style={estilos.textoInicial}>{comercio.nombre.charAt(0).toUpperCase()}</Text>
      </View>

      <View style={estilos.cuerpoTarjeta}>
        <View style={estilos.filaNombre}>
          <Text style={estilos.nombre} numberOfLines={1}>
            {comercio.nombre}
          </Text>
          {distancia !== null && <Text style={estilos.distancia}>{formatearDistancia(distancia)}</Text>}
        </View>

        <View style={estilos.filaEstado}>
          <View
            style={[
              estilos.punto,
              { backgroundColor: estado.abierto ? colores.verde : colores.grisClaro },
            ]}
          />
          <Text
            style={[estilos.estado, estado.abierto && { color: colores.verde }]}
            numberOfLines={1}
          >
            {estado.etiqueta}
          </Text>
          {comercio.cantidadResenas > 0 && (
            <Text style={estilos.puntaje}>
              {" "}
              · ★ {comercio.puntaje.toFixed(1).replace(".", ",")}
            </Text>
          )}
        </View>

        {promo && (
          <View style={estilos.promo}>
            <Ionicons name="pricetag" size={12} color={colores.pizarra} />
            <Text style={estilos.textoPromo} numberOfLines={1}>
              {promo.titulo}
            </Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  pantalla: { flex: 1 },
  encabezado: { paddingHorizontal: 16, gap: 12 },

  // Marca
  filaMarca: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  marca: { flexDirection: "row", alignItems: "center", gap: 10 },
  arco: {
    width: 30,
    height: 36,
    backgroundColor: colores.indigo,
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
    borderBottomLeftRadius: 6,
    borderBottomRightRadius: 6,
    justifyContent: "flex-end",
    alignItems: "center",
  },
  puerta: {
    width: 14,
    height: 21,
    backgroundColor: colores.niebla,
    borderTopLeftRadius: 7,
    borderTopRightRadius: 7,
  },
  nombreApp: { fontFamily: fuentes.titulo, fontSize: 28, letterSpacing: -0.5, color: colores.pizarra },
  ciudad: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colores.vidrio,
    borderWidth: 1,
    borderColor: colores.bordeVidrio,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  textoCiudad: { fontFamily: fuentes.textoMedio, fontSize: 12, color: colores.pizarra },

  titulo: { fontFamily: fuentes.subtitulo, fontSize: 20, lineHeight: 26, color: colores.pizarra },

  buscador: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colores.blanco,
    borderRadius: 999,
    paddingLeft: 16,
    paddingRight: 6,
    height: 52,
  },
  input: { flex: 1, fontFamily: fuentes.texto, fontSize: 14, color: colores.pizarra, padding: 0 },
  botonBuscar: {
    backgroundColor: colores.indigo,
    borderRadius: 999,
    paddingHorizontal: 16,
    height: 40,
    justifyContent: "center",
  },
  textoBotonBuscar: { fontFamily: fuentes.textoNegrita, fontSize: 13, color: colores.blanco },

  chips: { gap: 8, paddingRight: 16 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    height: 36,
    borderRadius: 999,
    backgroundColor: colores.vidrio,
    borderWidth: 1,
    borderColor: colores.bordeVidrio,
  },
  chipActivo: { backgroundColor: colores.pizarra, borderColor: colores.pizarra },
  textoChip: { fontFamily: fuentes.textoMedio, fontSize: 13, color: colores.pizarra },
  textoChipActivo: { color: colores.blanco },

  filaFiltros: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  filtroAbiertos: { flexDirection: "row", alignItems: "center", gap: 7 },
  textoFiltro: { fontFamily: fuentes.textoNegrita, fontSize: 15, color: colores.pizarra },
  orden: { flexDirection: "row", alignItems: "center", gap: 4, paddingVertical: 6 },
  textoOrden: { fontFamily: fuentes.textoMedio, fontSize: 13, color: colores.pizarra },

  avisoUbicacion: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colores.durazno,
    borderRadius: 16,
    padding: 12,
  },
  textoAviso: { flex: 1, fontFamily: fuentes.texto, fontSize: 12, color: colores.pizarra },

  lista: { padding: 16, paddingTop: 12, gap: 10, flexGrow: 1 },
  tarjeta: {
    flexDirection: "row",
    gap: 12,
    backgroundColor: colores.vidrio,
    borderWidth: 1,
    borderColor: colores.bordeVidrio,
    borderRadius: 28,
    padding: 14,
  },
  inicial: {
    width: 48,
    height: 48,
    borderTopRightRadius: 32,
    borderTopLeftRadius: 45,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 34,
    alignItems: "center",
    justifyContent: "center",
  },
  textoInicial: { fontFamily: fuentes.titulo, fontSize: 20, color: colores.pizarra },
  cuerpoTarjeta: { flex: 1, gap: 4 },
  filaNombre: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  nombre: { flex: 1, fontFamily: fuentes.subtitulo, fontSize: 15, color: colores.pizarra },
  distancia: { fontFamily: fuentes.textoMedio, fontSize: 12, color: colores.pizarra },
  filaEstado: { flexDirection: "row", alignItems: "center" },
  punto: { width: 7, height: 7, borderRadius: 4, marginRight: 6 },
  estado: { flexShrink: 1, fontFamily: fuentes.texto, fontSize: 12, color: colores.gris },
  puntaje: { fontFamily: fuentes.texto, fontSize: 12, color: colores.gris },
  promo: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 5,
    backgroundColor: colores.salvia,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginTop: 2,
  },
  textoPromo: { fontFamily: fuentes.textoMedio, fontSize: 12, color: colores.pizarra },

  centro: { flex: 1, alignItems: "center", justifyContent: "center", gap: 10, padding: 32 },
  tituloEstado: { fontFamily: fuentes.subtitulo, fontSize: 16, color: colores.pizarra, textAlign: "center" },
  textoEstado: { fontFamily: fuentes.texto, fontSize: 13, color: colores.gris, textAlign: "center" },
  botonEstado: {
    backgroundColor: colores.indigo,
    borderRadius: 999,
    paddingHorizontal: 22,
    paddingVertical: 11,
    marginTop: 4,
  },
  textoBotonEstado: { fontFamily: fuentes.textoNegrita, fontSize: 14, color: colores.blanco },
});