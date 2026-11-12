import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
    Alert,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
    Boton,
    BotonRedondo,
    EstadoCarga,
    EstadoError,
    EstadoVacio,
    FondoDegradado,
    Insignia,
    SeccionTitulo,
    TarjetaVidrio,
} from "../../src/componentes";
import {
    promocionesService,
    type Promocion,
} from "../../src/servicios/promociones";
import { colores, fuentes } from "../../src/tema";
import { fechaCorta } from "../../src/utils/fechas";

type EstadoPromo = "Activa" | "Vencida" | "Dada de baja";

const estadoDe = (p: Promocion): EstadoPromo =>
    !p.activa
        ? "Dada de baja"
        : Date.parse(p.hasta) < Date.now()
          ? "Vencida"
          : "Activa";

export default function MisPromocionesScreen() {
    const insets = useSafeAreaInsets();
    const [promos, setPromos] = useState<Promocion[] | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [refrescando, setRefrescando] = useState(false);

    const cargar = useCallback(async () => {
        setError(null);
        try {
            setPromos(await promocionesService.obtenerMisPromociones());
        } catch (e) {
            setError(
                e instanceof Error
                    ? e.message
                    : "No pudimos cargar tus promociones.",
            );
        }
    }, []);

    // Se recarga cada vez que la pantalla vuelve a estar a la vista (después de crear o editar).
    useFocusEffect(
        useCallback(() => {
            cargar();
        }, [cargar]),
    );

    async function refrescar() {
        setRefrescando(true);
        await cargar();
        setRefrescando(false);
    }

    function darDeBaja(id: string) {
        Alert.alert(
            "Dar de baja",
            "¿Seguro que querés dar de baja esta promoción? Los clientes dejarán de verla.",
            [
                { text: "Cancelar", style: "cancel" },
                {
                    text: "Dar de baja",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await promocionesService.eliminarPromocion(id);
                            setPromos((prev) =>
                                (prev ?? []).map((p) =>
                                    p.id === id ? { ...p, activa: false } : p,
                                ),
                            );
                        } catch (e) {
                            Alert.alert(
                                "No se pudo dar de baja",
                                e instanceof Error
                                    ? e.message
                                    : "Probá de nuevo.",
                            );
                        }
                    },
                },
            ],
        );
    }

    const activas = (promos ?? []).filter(
        (p) => estadoDe(p) === "Activa",
    ).length;

    return (
        <FondoDegradado
            colores={[
                colores.salvia,
                colores.niebla,
                colores.niebla,
                colores.lila,
            ]}>
            <ScrollView
                contentContainerStyle={[
                    estilos.contenido,
                    {
                        paddingTop: insets.top + 12,
                        paddingBottom: insets.bottom + 40,
                    },
                ]}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refrescando}
                        onRefresh={refrescar}
                        tintColor={colores.indigo}
                    />
                }>
                <View style={{ alignSelf: "flex-start" }}>
                    <BotonRedondo />
                </View>

                <View>
                    <Text style={estilos.titulo}>Mis promociones</Text>
                    <Text style={estilos.subtitulo}>
                        Cargá, editá y mirá cuántas veces se usó cada una.
                    </Text>
                </View>

                <Boton
                    texto="Nueva promoción"
                    icono="add"
                    variante="indigo"
                    onPress={() => router.push("/panel/nueva" as any)}
                />

                <SeccionTitulo
                    texto={
                        promos
                            ? `${activas} ${activas === 1 ? "activa" : "activas"}`
                            : "Promociones"
                    }
                    ayuda="Podés editar o dar de baja las que siguen vigentes."
                />

                {promos === null && !error && (
                    <EstadoCarga
                        texto="Cargando promociones…"
                        style={estilos.estado}
                    />
                )}
                {promos === null && error && (
                    <EstadoError
                        titulo="No pudimos cargar tus promociones"
                        texto={error}
                        onReintentar={cargar}
                        style={estilos.estado}
                    />
                )}
                {promos?.length === 0 && (
                    <EstadoVacio
                        icono="pricetag-outline"
                        titulo="Todavía no cargaste promociones"
                        texto="Creá la primera para que los vecinos la vean."
                        style={estilos.estado}
                    />
                )}

                {promos?.map((p) => {
                    const estado = estadoDe(p);
                    return (
                        <TarjetaVidrio key={p.id} style={estilos.tarjeta}>
                            <View style={estilos.filaTop}>
                                <Text style={estilos.descuento}>
                                    {p.descuento !== null
                                        ? `${p.descuento}%`
                                        : "Promo"}
                                </Text>
                                <Insignia texto={estado.toUpperCase()} />
                            </View>
                            <Text style={estilos.tituloPromo}>{p.titulo}</Text>
                            <Text style={estilos.usos}>
                                {p.usos} {p.usos === 1 ? "uso" : "usos"} · vence
                                el {fechaCorta(p.hasta)}
                            </Text>
                            {estado === "Activa" && (
                                <View style={estilos.acciones}>
                                    <Boton
                                        texto="Editar"
                                        variante="blanco"
                                        compacto
                                        style={{ flex: 1 }}
                                        onPress={() =>
                                            router.push(
                                                `/panel/editar/${p.id}` as any,
                                            )
                                        }
                                    />
                                    <Boton
                                        texto="Dar de baja"
                                        variante="peligro"
                                        compacto
                                        style={{ flex: 1 }}
                                        onPress={() => darDeBaja(p.id)}
                                    />
                                </View>
                            )}
                        </TarjetaVidrio>
                    );
                })}
            </ScrollView>
        </FondoDegradado>
    );
}

const estilos = StyleSheet.create({
    contenido: { paddingHorizontal: 20, gap: 14 },
    titulo: {
        fontFamily: fuentes.titulo,
        fontSize: 34,
        color: colores.pizarra,
        letterSpacing: -0.5,
    },
    subtitulo: {
        fontFamily: fuentes.texto,
        fontSize: 14,
        color: colores.gris,
        marginTop: 2,
    },
    estado: { flex: 0, paddingVertical: 32 },
    tarjeta: { gap: 6, padding: 16 },
    filaTop: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    descuento: {
        fontFamily: fuentes.titulo,
        fontSize: 28,
        color: colores.pizarra,
    },
    tituloPromo: {
        fontFamily: fuentes.subtitulo,
        fontSize: 16,
        color: colores.pizarra,
    },
    usos: { fontFamily: fuentes.texto, fontSize: 13, color: colores.gris },
    acciones: { flexDirection: "row", gap: 10, marginTop: 8 },
});
