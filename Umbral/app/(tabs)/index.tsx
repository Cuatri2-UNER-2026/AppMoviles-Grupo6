import Ionicons from "@react-native-vector-icons/ionicons";
import { useMemo, useState } from "react";
import { FlatList, Image, Keyboard, Pressable, RefreshControl, StyleSheet, Switch, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Aviso,
  EstadoCarga,
  EstadoError,
  EstadoVacio,
  FiltroRubros,
  FondoDegradado,
  TarjetaComercio,
} from "../../src/componentes";
import { useAhora } from "../../src/hooks/useAhora";
import { useComercios } from "../../src/hooks/useComercios";
import { useUbicacion } from "../../src/hooks/useUbicacion";
import { colores, ESPACIO_BARRA, fuentes } from "../../src/tema";
import { buscarComercios, type Orden } from "../../src/utils/buscar";

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
  const ahora = useAhora();

  const [texto, setTexto] = useState("");
  const [rubroId, setRubroId] = useState<string | null>(null);
  const [soloAbiertos, setSoloAbiertos] = useState(false);
  const [orden, setOrden] = useState<Orden>("distancia");

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
    <FondoDegradado
      colores={[colores.salvia, colores.niebla, colores.niebla, colores.lila]}
      style={{ paddingTop: insets.top + 12 }}
    >
      <View style={estilos.encabezado}>
        <View style={estilos.filaMarca}>
          <View style={estilos.marca}>
            <Image source={require("../../assets/images/icono.png")} style={estilos.logo} />
            <Text style={estilos.nombreApp}>Umbral</Text>
          </View>
          <View style={estilos.ciudad}>
            <Ionicons name="location" size={12} color={colores.indigo} />
            <Text style={estilos.textoCiudad}>Concepción del Uruguay</Text>
          </View>
        </View>

        <Text style={estilos.titulo}>Cruzá el umbral de los comercios de tu ciudad</Text>

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

        <FiltroRubros rubros={rubros} rubroId={rubroId} onChange={setRubroId} />

        <View style={estilos.filaFiltros}>
          <View style={estilos.filtroAbiertos}>
            <Switch
              value={soloAbiertos}
              onValueChange={setSoloAbiertos}
              trackColor={{ false: colores.grisBorde, true: colores.salvia }}
              thumbColor={soloAbiertos ? colores.verde : colores.indigo}
              ios_backgroundColor={colores.grisBorde}
            />
            <Text style={estilos.textoFiltro}>Abierto ahora</Text>
          </View>

          <Pressable style={estilos.orden} onPress={siguienteOrden} accessibilityLabel="Cambiar orden">
            <Text style={estilos.textoOrden}>{ordenEfectivo.etiqueta}</Text>
            <Ionicons name="chevron-down" size={14} color={colores.pizarra} />
          </Pressable>
        </View>

        {permiso === "denegado" && (
          <Aviso
            icono="location-outline"
            texto="Sin tu ubicación no podemos mostrar distancias. Tocá para activarla."
            onPress={solicitar}
          />
        )}
      </View>

      {cargando ? (
        <EstadoCarga texto="Cargando comercios…" />
      ) : error ? (
        <EstadoError titulo="No pudimos cargar los comercios" texto={error} onReintentar={reintentar} />
      ) : (
        <FlatList
          data={filas}
          keyExtractor={(f) => f.comercio.id}
          renderItem={({ item }) => (
            <TarjetaComercio
              comercio={item.comercio}
              rubro={item.rubro}
              distancia={item.distancia}
              estado={item.estado}
              promo={promoPorComercio[item.comercio.id]}
            />
          )}
          contentContainerStyle={[estilos.lista, { paddingBottom: ESPACIO_BARRA + insets.bottom + 16 }]}
          keyboardShouldPersistTaps="handled"
          refreshControl={<RefreshControl refreshing={refrescando} onRefresh={recargar} tintColor={colores.indigo} />}
          ListEmptyComponent={
            <EstadoVacio
              titulo="No encontramos comercios"
              texto={hayFiltros ? "Probá con otra palabra o quitá algún filtro." : "Todavía no hay comercios cargados."}
              accion={hayFiltros ? { etiqueta: "Limpiar filtros", onPress: limpiarFiltros } : undefined}
            />
          }
        />
      )}
    </FondoDegradado>
  );
}

const estilos = StyleSheet.create({
  encabezado: { paddingHorizontal: 16, gap: 12 },
  filaMarca: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  marca: { flexDirection: "row", alignItems: "center", gap: 10 },
  logo: { width: 26, height: 26 },
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
  filaFiltros: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  filtroAbiertos: { flexDirection: "row", alignItems: "center", gap: 7 },
  textoFiltro: { fontFamily: fuentes.textoNegrita, fontSize: 15, color: colores.pizarra },
  orden: { flexDirection: "row", alignItems: "center", gap: 4, paddingVertical: 6 },
  textoOrden: { fontFamily: fuentes.textoMedio, fontSize: 13, color: colores.pizarra },
  lista: { padding: 16, paddingTop: 12, gap: 10, flexGrow: 1 },
});