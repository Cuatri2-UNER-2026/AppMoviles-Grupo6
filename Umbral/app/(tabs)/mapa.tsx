import Ionicons from "@react-native-vector-icons/ionicons";
import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Keyboard, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Aviso, AvisoDatosViejos, Boton, EstadoCarga, EstadoError, EstadoVacio, FiltroRubros, IndicadorApertura, Puntaje } from "../../src/componentes";
import { MapaLeaflet, type FocoMapa, type PinMapa } from "../../src/componentes/comercio/MapaLeaflet";
import { useComercios } from "../../src/hooks/useComercios";
import { useUbicacion } from "../../src/hooks/useUbicacion";
import { colores, ESPACIO_BARRA, fuentes } from "../../src/tema";
import type { Comercio } from "../../src/tipos";
import { calcularEstado } from "../../src/utils/abiertoAhora";
import { normalizar } from "../../src/utils/buscar";
import { distanciaEnMetros, formatearDistancia } from "../../src/utils/distancia";
import { abrirComoLlegar } from "../../src/utils/enlaces";

export default function MapaScreen() {
    const insets = useSafeAreaInsets();
    const { comercios, rubros, cargando, error, reintentar, desactualizado, actualizadoEn } = useComercios();
    const { coordenadas, permiso, solicitar } = useUbicacion();

    const [rubroId, setRubroId] = useState<string | null>(null);
    const [texto, setTexto] = useState("");
    const [seleccionadoId, setSeleccionadoId] = useState<string | null>(null);
    const [foco, setFoco] = useState<FocoMapa | null>(null);

    // El mapa termina arriba de la barra de pestañas para que la atribución de OpenStreetMap quede visible.
    const base = ESPACIO_BARRA + insets.bottom;

    const colorDeRubro = useMemo(() => new Map(rubros.map((r) => [r.id, r.color])), [rubros]);

    const palabras = useMemo(() => normalizar(texto).split(/\s+/).filter(Boolean), [texto]);
    const nombreDeRubro = useMemo(() => new Map(rubros.map((r) => [r.id, r.nombre])), [rubros]);

    // Filtra por rubro y por lo que se escribe (nombre, descripción o rubro), igual que Buscar.
    const visibles = useMemo(
        () =>
        comercios.filter((c) => {
            if (rubroId && c.rubroId !== rubroId) return false;
            if (palabras.length === 0) return true;
            const pajar = normalizar(`${c.nombre} ${c.descripcion} ${nombreDeRubro.get(c.rubroId) ?? ""}`);
            return palabras.every((p) => pajar.includes(p));
        }),
        [comercios, rubroId, palabras, nombreDeRubro],
    );
    const seleccionado = visibles.find((c) => c.id === seleccionadoId) ?? null;

    const pines = useMemo<PinMapa[]>(
        () =>
        visibles.map((c) => ({
            id: c.id,
            lat: c.coordenadas.latitud,
            lng: c.coordenadas.longitud,
            color: colorDeRubro.get(c.rubroId) ?? colores.indigo,
        })),
        [visibles, colorDeRubro],
    );

    // Cuando llega la ubicación por primera vez, centramos el mapa en la persona.
    const yaCentrado = useRef(false);
    useEffect(() => {
        if (coordenadas && !yaCentrado.current) {
        yaCentrado.current = true;
        setFoco({ latitud: coordenadas.latitud, longitud: coordenadas.longitud, zoom: 15 });
        }
    }, [coordenadas]);

    const irAMiUbicacion = () => {
        if (!coordenadas) {
        solicitar();
        return;
        }
        setFoco({ latitud: coordenadas.latitud, longitud: coordenadas.longitud, zoom: 16 });
    };

    const elegir = useCallback(
        (id: string) => {
        setSeleccionadoId(id);
        const c = comercios.find((x) => x.id === id);
        if (c) setFoco({ latitud: c.coordenadas.latitud, longitud: c.coordenadas.longitud, zoom: 16 });
        },
        [comercios],
    );

    // Al buscar: se cierra el teclado y, si hay un solo resultado, se lo elige.
    const buscar = () => {
        Keyboard.dismiss();
        if (visibles.length === 1) elegir(visibles[0].id);
    };

    return (
        <View style={estilos.pantalla}>
            <View style={[estilos.zonaMapa, { bottom: base }]}>
                <MapaLeaflet
                pines={pines}
                activoId={seleccionadoId}
                ubicacion={permiso === "concedido" ? coordenadas : null}
                foco={foco}
                onElegir={elegir}
                onTocarMapa={() => setSeleccionadoId(null)}
                />

                {/* Filtro por rubro + aviso de ubicación */}
                <View style={[estilos.superior, { paddingTop: insets.top + 8 }]} pointerEvents="box-none">
                    <View style={estilos.buscador}>
                        <TextInput
                        style={estilos.input}
                        placeholder="Buscar en el mapa"
                        placeholderTextColor={colores.gris}
                        value={texto}
                        onChangeText={setTexto}
                        returnKeyType="search"
                        onSubmitEditing={buscar}
                        autoCorrect={false}
                        accessibilityLabel="Buscar en el mapa"
                        />
                        {texto !== "" && (
                        <Pressable onPress={() => setTexto("")} hitSlop={10} accessibilityLabel="Borrar búsqueda">
                            <Ionicons name="close-circle" size={18} color={colores.gris} />
                        </Pressable>
                        )}
                    </View>
                    <FiltroRubros
                        rubros={rubros}
                        rubroId={rubroId}
                        onChange={setRubroId}
                        conColor
                        solido
                        contentStyle={{ paddingHorizontal: 16 }}
                    />

                    {desactualizado && <AvisoDatosViejos actualizadoEn={actualizadoEn} style={estilos.aviso} />}

                    {permiso === "denegado" && (
                        <Aviso
                        icono="location-outline"
                        texto="No tenemos tu ubicación, así que no podemos mostrarte en el mapa. Tocá para activarla."
                        onPress={solicitar}
                        style={estilos.aviso}
                        />
                    )}
                </View>

                {/* Estados de carga, error y vacío: el mapa queda de fondo */}
                {cargando && (
                <View style={estilos.flotante} pointerEvents="none">
                    <EstadoCarga texto="Cargando comercios…" style={estilos.estado} />
                </View>
                )}
                {!cargando && error && (
                <View style={estilos.flotante}>
                    <EstadoError texto={error} onReintentar={reintentar} style={estilos.estado} />
                </View>
                )}
                {!cargando && !error && visibles.length === 0 && (
                <View style={estilos.flotante} pointerEvents="none">
                    <EstadoVacio titulo="No encontramos comercios" texto="Probá con otra palabra o quitá el filtro." style={estilos.estado} />
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
                />
                )}
            </View>
        </View>
    );
}

function TarjetaMapa({ comercio, nombreRubro, distancia, }: { comercio: Comercio; nombreRubro: string | undefined; distancia: number | null; }) {
    const estado = calcularEstado(comercio.horarios);

    return (
        <View style={estilos.tarjeta}>
            <View style={estilos.filaNombre}>
                <Text style={estilos.nombre} numberOfLines={1}>
                {comercio.nombre}
                </Text>
                {distancia !== null && <Text style={estilos.distancia}>{formatearDistancia(distancia)}</Text>}
            </View>
            {nombreRubro && <Text style={estilos.rubro}>{nombreRubro}</Text>}
            <View style={estilos.filaEstado}>
                <IndicadorApertura estado={estado} />
                <Puntaje puntaje={comercio.puntaje} cantidad={comercio.cantidadResenas} style={{ marginLeft: 4 }} />
            </View>

            <View style={estilos.acciones}>
                <Boton
                texto="Cómo llegar"
                icono="navigate"
                variante="indigo"
                compacto
                style={estilos.accion}
                onPress={() => abrirComoLlegar(comercio.coordenadas)}
                />

                <Boton
                texto="Ver ficha"
                variante="blanco"
                compacto
                style={[estilos.accion, { backgroundColor: colores.niebla }]}
                onPress={() => router.push({ pathname: "/comercio/[id]", params: { id: comercio.id } })}
                />
            </View>
        </View>
    );
}

const estilos = StyleSheet.create({
    pantalla: { 
        flex: 1, 
        backgroundColor: colores.niebla 
    },
    zonaMapa: { 
        position: "absolute", 
        top: 0, 
        left: 0, 
        right: 0 
    },
    superior: { 
        position: "absolute", 
        top: 0, 
        left: 0, 
        right: 0, 
        gap: 8 
    },
    aviso: { 
        marginHorizontal: 12 
    },
    buscador: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginHorizontal: 16,
        height: 52,
        paddingHorizontal: 20,
        borderRadius: 999,
        backgroundColor: colores.vidrioFuerte,
        elevation: 3,
        shadowColor: colores.negro,
        shadowOpacity: 0.08,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
    },
    input: { 
        flex: 1, 
        fontFamily: fuentes.texto, 
        fontSize: 15, 
        color: colores.pizarra, 
        padding: 0 
    },

    // carga / error / vacío flotando sobre el mapa
    flotante: { 
        position: "absolute", 
        top: "40%", 
        alignSelf: "center", 
        maxWidth: "85%" 
    },
    estado: {
        flex: 0,
        backgroundColor: colores.blanco,
        borderRadius: 18,
        paddingVertical: 16,
        paddingHorizontal: 20,
        elevation: 4,
    },
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
        bottom: 12,
        backgroundColor: colores.blanco,
        borderRadius: 18,
        padding: 14,
        gap: 4,
        elevation: 6,
        shadowColor: colores.negro,
        shadowOpacity: 0.15,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
    },
    filaNombre: { 
        flexDirection: "row", 
        alignItems: "center", 
        justifyContent: "space-between", 
        gap: 8 
    },
    nombre: { 
        flex: 1, 
        fontFamily: fuentes.subtitulo, 
        fontSize: 16, 
        color: colores.pizarra 
    },
    distancia: { 
        fontFamily: fuentes.textoMedio, 
        fontSize: 12, 
        color: colores.pizarra 
    },
    rubro: { 
        fontFamily: fuentes.texto, 
        fontSize: 12, 
        color: colores.textoSuave 
    },
    filaEstado: { 
        flexDirection: "row", 
        alignItems: "center" 
    },
    acciones: { 
        flexDirection: "row", 
        gap: 8, 
        marginTop: 8 
    },
    accion: { 
        flex: 1 
    },
});