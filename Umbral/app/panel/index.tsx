import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    useWindowDimensions,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Boton, FondoDegradado, BotonRedondo } from "../../src/componentes";
import { useSesion } from "../../src/hooks/useSesion";
import { obtenerComercio } from "../../src/servicios/comercios";
import {
    promocionesService,
    type Promocion,
} from "../../src/servicios/promociones";
import { resenasService } from "../../src/servicios/resenas";
import { colores, fuentes } from "../../src/tema";

const estaVigente = (p: Promocion) =>
    p.activa && Date.parse(p.hasta) >= Date.now();

export default function PanelComercioScreen() {
    const insets = useSafeAreaInsets();
    const { width } = useWindowDimensions();
    const sesion = useSesion();
    const comercioId =
        sesion.estado === "activa" ? sesion.usuario.comercioId : null;

    const [nombre, setNombre] = useState<string | null>(null);
    const [promos, setPromos] = useState<Promocion[] | null>(null);
    const [sinResponder, setSinResponder] = useState<number | null>(null);

    // Se recarga cada vez que la pantalla vuelve a estar a la vista (después de validar, responder o editar).
    useFocusEffect(
        useCallback(() => {
            if (!comercioId) return;
            Promise.allSettled([
                obtenerComercio(comercioId),
                promocionesService.obtenerMisPromociones(),
                resenasService.obtenerMisResenas(),
            ]).then(([c, p, r]) => {
                if (c.status === "fulfilled") setNombre(c.value.nombre);
                if (p.status === "fulfilled") setPromos(p.value);
                if (r.status === "fulfilled")
                    setSinResponder(r.value.filter((x) => !x.respuesta).length);
            });
        }, [comercioId]),
    );

    // Promo vigente con más usos; si no hay ninguna vigente, el total de usos.
    const vigentes = (promos ?? []).filter(estaVigente);
    const destacada = [...vigentes].sort((a, b) => b.usos - a.usos)[0];
    const usos = destacada
        ? destacada.usos
        : (promos ?? []).reduce((suma, p) => suma + p.usos, 0);
    const etiquetaUsos = destacada
        ? `usos de “${destacada.titulo}”`
        : "usos de tus promociones";

    const externo = Math.min(width * 0.6, 250);
    const medio = externo * 0.81;
    const interno = externo * 0.62;

    return (
        <FondoDegradado
            colores={[
                colores.salvia,
                colores.niebla,
                colores.niebla,
                colores.durazno,
            ]}
            locations={[0, 0.3, 0.7, 1]}>
            <ScrollView
                contentContainerStyle={[
                    estilos.contenido,
                    {
                        paddingTop: insets.top + 16,
                        paddingBottom: insets.bottom + 40,
                    },
                ]}
                showsVerticalScrollIndicator={false}>
                <View>
                    <BotonRedondo style={{ marginBottom: 10 }} />
                    <Text style={estilos.etiqueta}>Mi local</Text>
                    <Text style={estilos.titulo}>
                        Hola, {nombre ?? "tu comercio"}
                    </Text>
                </View>

                {/* Círculo de escaneo: la pantalla de escanear pide la huella antes de abrir la cámara. */}
                <View style={estilos.zonaCirculo}>
                    <View
                        style={[
                            estilos.anillo,
                            {
                                width: externo,
                                height: externo,
                                borderRadius: externo / 2,
                                backgroundColor: "rgba(124,140,224,0.12)",
                            },
                        ]}>
                        <View
                            style={[
                                estilos.anillo,
                                {
                                    width: medio,
                                    height: medio,
                                    borderRadius: medio / 2,
                                    backgroundColor: "rgba(124,140,224,0.2)",
                                },
                            ]}>
                            <Pressable
                                onPress={() =>
                                    router.push("/panel/escanear" as any)
                                }
                                accessibilityRole="button"
                                accessibilityLabel="Escanear cliente"
                                style={({ pressed }) => [
                                    estilos.anillo,
                                    {
                                        width: interno,
                                        height: interno,
                                        borderRadius: interno / 2,
                                        backgroundColor:
                                            "rgba(124,140,224,0.28)",
                                    },
                                    pressed && { opacity: 0.8 },
                                ]}>
                                <Text style={estilos.textoCirculo}>
                                    Escanear{"\n"}cliente
                                </Text>
                            </Pressable>
                        </View>
                    </View>
                </View>

                <Text style={estilos.ayuda}>
                    Tocá el círculo. Te pedimos la huella para entrar.
                </Text>

                <View style={estilos.filaTarjetas}>
                    <Pressable
                        style={[estilos.tarjeta, estilos.formaUno]}
                        onPress={() => router.push("/panel/promociones" as any)}
                        accessibilityRole="button">
                        <Text style={estilos.numero}>
                            {promos === null ? "–" : usos}
                        </Text>
                        <Text style={estilos.descripcion} numberOfLines={3}>
                            {etiquetaUsos}
                        </Text>
                    </Pressable>

                    <Pressable
                        style={[estilos.tarjeta, estilos.formaDos]}
                        onPress={() => router.push("/panel/resenas" as any)}
                        accessibilityRole="button">
                        <Text style={estilos.numero}>
                            {sinResponder === null ? "–" : sinResponder}
                        </Text>
                        <Text style={estilos.descripcion} numberOfLines={3}>
                            {sinResponder === 1
                                ? "reseña sin responder"
                                : "reseñas sin responder"}
                        </Text>
                    </Pressable>
                </View>

                <View style={estilos.filaBotones}>
                    <Boton
                        texto="Mis promociones"
                        variante="claro"
                        style={estilos.boton}
                        onPress={() => router.push("/panel/promociones" as any)}
                    />
                    <Boton
                        texto="Mi ficha"
                        variante="claro"
                        style={estilos.boton}
                        deshabilitado={!comercioId}
                        onPress={() =>
                            router.push({
                                pathname: "/comercio/[id]",
                                params: { id: comercioId! },
                            })
                        }
                    />
                </View>
                <Boton
                    texto="Editar mi ficha"
                    variante="indigo"
                    style={estilos.boton}
                    onPress={() => router.push("/panel/ficha" as any)}
                />
            </ScrollView>
        </FondoDegradado>
    );
}

const estilos = StyleSheet.create({
    contenido: { paddingHorizontal: 16, gap: 16 },
    etiqueta: {
        fontFamily: fuentes.textoMedio,
        fontSize: 14,
        color: colores.gris,
    },
    titulo: {
        fontFamily: fuentes.titulo,
        fontSize: 30,
        lineHeight: 38,
        color: colores.pizarra,
        letterSpacing: -0.5,
    },

    zonaCirculo: { alignItems: "center", marginVertical: 8 },
    anillo: { alignItems: "center", justifyContent: "center" },
    textoCirculo: {
        fontFamily: fuentes.titulo,
        fontSize: 24,
        lineHeight: 30,
        color: colores.pizarra,
        textAlign: "center",
    },
    ayuda: { fontFamily: fuentes.texto, fontSize: 14, color: colores.gris },

    filaTarjetas: { flexDirection: "row", gap: 12 },
    tarjeta: {
        flex: 1,
        minHeight: 130,
        padding: 18,
        gap: 4,
        backgroundColor: colores.vidrioFuerte,
        borderWidth: 1,
        borderColor: colores.bordeVidrio,
    },
    formaUno: {
        borderTopLeftRadius: 32,
        borderTopRightRadius: 56,
        borderBottomRightRadius: 56,
        borderBottomLeftRadius: 32,
    },
    formaDos: {
        borderTopLeftRadius: 56,
        borderTopRightRadius: 32,
        borderBottomRightRadius: 32,
        borderBottomLeftRadius: 56,
    },
    numero: {
        fontFamily: fuentes.titulo,
        fontSize: 44,
        lineHeight: 52,
        color: colores.pizarra,
        letterSpacing: -1,
    },
    descripcion: {
        fontFamily: fuentes.texto,
        fontSize: 13,
        lineHeight: 18,
        color: colores.gris,
    },

    filaBotones: { flexDirection: "row", gap: 10 },
    boton: { flex: 1 },
});
