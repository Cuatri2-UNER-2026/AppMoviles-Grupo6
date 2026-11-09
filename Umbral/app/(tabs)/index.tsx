import { Ionicons } from "@react-native-vector-icons/ionicons";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Chip, EstadoCarga, EstadoError, EstadoVacio } from "../../src/componentes/ui";
import { datosViejos, useDirectorio } from "../../src/hooks/useDirectorio";
import { useUbicacion } from "../../src/hooks/useUbicacion";
import { colores, fuentes, radio } from "../../src/tema";
import type { Comercio, Rubro } from "../../src/tipos";
import { estadoApertura } from "../../src/utils/abiertoAhora";
import { distanciaMetros, formatearDistancia } from "../../src/utils/distancia";

// Minúsculas y sin tildes, para que "ferreteria" encuentre "Ferretería".
const normalizar = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

type Orden = "distancia" | "nombre";

const formatearFecha = (d: Date) =>
  d.toLocaleString("es-AR", { day: "numeric", month: "numeric", hour: "2-digit", minute: "2-digit" });

export default function Buscar() {
  const { datos, cargando, error, recargar } = useDirectorio();
  const { ubicacion, coordenadas } = useUbicacion();

  const [texto, setTexto] = useState("");
  const [rubroId, setRubroId] = useState<string | null>(null);
  const [soloAbiertos, setSoloAbiertos] = useState(false);
  const [orden, setOrden] = useState<Orden>("distancia");
  const [refrescando, setRefrescando] = useState(false);

  // "Abierto ahora" se recalcula cada minuto mientras la pantalla está abierta.
  const [ahora, setAhora] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setAhora(new Date()), 60_000);
    return () => clearInterval(t);
  }, []);

  const ordenEfectivo: Orden = coordenadas ? orden : "nombre";

  const resultados = useMemo(() => {
    if (!datos) return [];
    const q = normalizar(texto);

    return datos.comercios
      .filter((c) => !rubroId || c.rubroId === rubroId)
      .filter((c) => {
        if (!q) return true;
        // Busca por nombre y por lo que vende (descripción y rubro).
        const rubro = datos.rubroPorId.get(c.rubroId)?.nombre ?? "";
        return normalizar(`${c.nombre} ${c.descripcion} ${rubro}`).includes(q);
      })
      .map((c) => ({
        comercio: c,
        apertura: estadoApertura(c.horarios, ahora),
        metros: coordenadas ? distanciaMetros(coordenadas, c.coordenadas) : null,
      }))
      .filter((r) => !soloAbiertos || r.apertura.abierto)
      .sort((a, b) =>
        ordenEfectivo === "distancia" && a.metros != null && b.metros != null
          ? a.metros - b.metros
          : a.comercio.nombre.localeCompare(b.comercio.nombre, "es"),
      );
  }, [datos, texto, rubroId, soloAbiertos, ordenEfectivo, coordenadas, ahora]);

  const onRefresh = async () => {
    setRefrescando(true);
    await recargar();
    setRefrescando(false);
  };

  return (
    <SafeAreaView style={estilos.pantalla} edges={["top"]}>
      <View style={estilos.encabezado}>
        <Text style={estilos.titulo}>Buscar</Text>
        <View style={estilos.buscador}>
          <Ionicons name="search" size={18} color={colores.textoSuave} />
          <TextInput
            value={texto}
            onChangeText={setTexto}
            placeholder="Comercio o lo que necesitás (ej: pintura)"
            placeholderTextColor={colores.textoSuave}
            style={estilos.input}
            returnKeyType="search"
            autoCorrect={false}
            accessibilityLabel="Buscar comercios"
          />
          {!!texto && (
            <Pressable onPress={() => setTexto("")} hitSlop={10} accessibilityLabel="Borrar búsqueda">
              <Ionicons name="close-circle" size={18} color={colores.textoSuave} />
            </Pressable>
          )}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={estilos.chips}>
          <Chip
            texto="Abierto ahora"
            icono="time-outline"
            activo={soloAbiertos}
            onPress={() => setSoloAbiertos((v) => !v)}
          />
          {coordenadas && (
            <Chip
              texto={orden === "distancia" ? "Más cerca" : "A–Z"}
              icono="swap-vertical"
              activo
              onPress={() => setOrden((o) => (o === "distancia" ? "nombre" : "distancia"))}
            />
          )}
          <View style={estilos.separador} />
          <Chip texto="Todos" activo={!rubroId} onPress={() => setRubroId(null)} />
          {datos?.rubros.map((r) => (
            <Chip
              key={r.id}
              texto={r.nombre}
              color={r.color}
              activo={rubroId === r.id}
              onPress={() => setRubroId(rubroId === r.id ? null : r.id)}
            />
          ))}
        </ScrollView>

        {ubicacion.estado === "denegada" && (
          <Text style={estilos.nota}>
            Sin permiso de ubicación: ordenamos por nombre y no mostramos distancias.
          </Text>
        )}
      </View>

      {datos && (datos.desdeCopiaLocal || datosViejos(datos)) && (
        <View style={estilos.avisoDatos}>
          <Ionicons name="time-outline" size={15} color={colores.texto} />
          <Text style={estilos.textoAvisoDatos}>
            Datos guardados del {formatearFecha(datos.actualizadoEn)}. Puede haber cambios.
          </Text>
        </View>
      )}

      {cargando && !datos ? (
        <EstadoCarga texto="Cargando comercios..." />
      ) : error && !datos ? (
        <EstadoError mensaje={error} onReintentar={recargar} />
      ) : (
        <FlatList
          data={resultados}
          keyExtractor={(r) => r.comercio.id}
          contentContainerStyle={estilos.lista}
          keyboardShouldPersistTaps="handled"
          refreshControl={<RefreshControl refreshing={refrescando} onRefresh={onRefresh} />}
          ListHeaderComponent={
            <Text style={estilos.contador}>
              {resultados.length} {resultados.length === 1 ? "comercio" : "comercios"}
            </Text>
          }
          ListEmptyComponent={
            <EstadoVacio
              icono="search-outline"
              titulo="No encontramos comercios"
              texto="Probá con otra palabra o quitá algún filtro."
              accion={
                texto || rubroId || soloAbiertos
                  ? {
                      texto: "Quitar filtros",
                      onPress: () => {
                        setTexto("");
                        setRubroId(null);
                        setSoloAbiertos(false);
                      },
                    }
                  : undefined
              }
            />
          }
          renderItem={({ item }) => (
            <TarjetaComercio
              comercio={item.comercio}
              rubro={datos?.rubroPorId.get(item.comercio.rubroId)}
              abierto={item.apertura.abierto}
              detalleApertura={item.apertura.detalle}
              metros={item.metros}
              tienePromo={!!datos?.conPromo.has(item.comercio.id)}
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}

function TarjetaComercio({
  comercio,
  rubro,
  abierto,
  detalleApertura,
  metros,
  tienePromo,
}: {
  comercio: Comercio;
  rubro?: Rubro;
  abierto: boolean;
  detalleApertura: string;
  metros: number | null;
  tienePromo: boolean;
}) {
  return (
    <Pressable
      style={estilos.tarjeta}
      onPress={() => router.push({ pathname: "/comercio/[id]", params: { id: comercio.id } })}
    >
      <View style={[estilos.franja, { backgroundColor: rubro?.color ?? colores.acento }]} />
      <View style={estilos.cuerpoTarjeta}>
        <View style={estilos.filaTitulo}>
          <Text style={estilos.nombre} numberOfLines={1}>
            {comercio.nombre}
          </Text>
          {metros != null && <Text style={estilos.distancia}>{formatearDistancia(metros)}</Text>}
        </View>
        <Text style={estilos.textoSuave} numberOfLines={1}>
          {rubro?.nombre ?? "Comercio"} · {comercio.direccion}
        </Text>
        <View style={estilos.filaEstado}>
          <View style={[estilos.estado, { backgroundColor: abierto ? colores.abierto : colores.cerrado }]} />
          <Text style={[estilos.textoEstado, { color: abierto ? colores.abierto : colores.cerrado }]}>
            {abierto ? "Abierto" : "Cerrado"}
          </Text>
          <Text style={estilos.textoSuave}> · {detalleApertura}</Text>
          {tienePromo && (
            <View style={estilos.promo}>
              <Ionicons name="pricetag" size={11} color={colores.texto} />
              <Text style={estilos.textoPromo}>Promo</Text>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: colores.fondo },
  encabezado: { paddingHorizontal: 16, paddingTop: 8, gap: 10 },
  titulo: { fontFamily: fuentes.tituloFuerte, fontSize: 28, color: colores.texto },
  buscador: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colores.superficie,
    borderRadius: radio.m,
    borderWidth: 1,
    borderColor: colores.borde,
    paddingHorizontal: 12,
  },
  input: { flex: 1, paddingVertical: 10, fontFamily: fuentes.cuerpo, fontSize: 15, color: colores.texto },
  chips: { gap: 8, paddingVertical: 2, alignItems: "center" },
  separador: { width: 1, height: 20, backgroundColor: colores.borde },
  nota: { fontFamily: fuentes.cuerpo, fontSize: 12, color: colores.textoSuave },
  lista: { padding: 16, gap: 10, flexGrow: 1 },
  avisoDatos: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginHorizontal: 16,
    marginTop: 8,
    padding: 8,
    borderRadius: radio.s,
    backgroundColor: colores.durazno,
  },
  textoAvisoDatos: { flex: 1, fontFamily: fuentes.cuerpo, fontSize: 12, color: colores.texto },
  contador: { fontFamily: fuentes.cuerpo, fontSize: 12, color: colores.textoSuave },
  tarjeta: {
    flexDirection: "row",
    backgroundColor: colores.superficie,
    borderRadius: radio.m,
    borderWidth: 1,
    borderColor: colores.borde,
    overflow: "hidden",
  },
  franja: { width: 5 },
  cuerpoTarjeta: { flex: 1, padding: 12, gap: 4 },
  filaTitulo: { flexDirection: "row", alignItems: "center", gap: 8 },
  nombre: { flex: 1, fontFamily: fuentes.titulo, fontSize: 16, color: colores.texto },
  distancia: { fontFamily: fuentes.cuerpoFuerte, fontSize: 13, color: colores.acentoOscuro },
  textoSuave: { fontFamily: fuentes.cuerpo, fontSize: 13, color: colores.textoSuave },
  filaEstado: { flexDirection: "row", alignItems: "center", flexWrap: "wrap" },
  estado: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  textoEstado: { fontFamily: fuentes.cuerpoFuerte, fontSize: 13 },
  promo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginLeft: "auto",
    backgroundColor: colores.durazno,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radio.pill,
  },
  textoPromo: { fontFamily: fuentes.cuerpoFuerte, fontSize: 11, color: colores.texto },
});
