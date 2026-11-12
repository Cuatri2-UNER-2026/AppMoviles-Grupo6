import Ionicons from "@react-native-vector-icons/ionicons";
import { router } from "expo-router";
import { memo, type ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { colores, fuentes } from "../../tema";
import type { Comercio, Promocion, Rubro } from "../../tipos";
import { calcularEstado, type EstadoApertura } from "../../utils/abiertoAhora";
import { formatearDistancia } from "../../utils/distancia";
import { AvatarInicial } from "../ui/AvatarInicial";
import { TarjetaVidrio } from "../ui/TarjetaVidrio";
import { IndicadorApertura } from "./IndicadorApertura";
import { Puntaje } from "./Puntaje";

interface Props {
    comercio: Comercio;
    rubro?: Rubro;
    distancia?: number | null;
    /** Si no se pasa, se calcula con los horarios. */
    estado?: EstadoApertura;
    promo?: Promocion;
    /** Contenido a la derecha (ej. botón "Quitar" en Favoritos). */
    derecha?: ReactNode;
    /** Por defecto abre la ficha del comercio. */
    onPress?: () => void;
}

export const TarjetaComercio = memo(function TarjetaComercio({
    comercio,
    rubro,
    distancia = null,
    estado,
    promo,
    derecha,
    onPress,
}: Props) {
    const est = estado ?? calcularEstado(comercio.horarios);
    const color = rubro?.color ?? colores.indigo;
    const abrir =
        onPress ??
        (() =>
            router.push({
                pathname: "/comercio/[id]",
                params: { id: comercio.id },
            }));

    return (
        <TarjetaVidrio
            onPress={abrir}
            style={estilos.tarjeta}
            accessibilityLabel={`${comercio.nombre}. ${est.etiqueta}`}>
            <AvatarInicial
                nombre={comercio.nombre}
                fondo={`${color}33`}
                organico
            />

            <View style={estilos.cuerpo}>
                <View style={estilos.filaNombre}>
                    <Text style={estilos.nombre} numberOfLines={1}>
                        {comercio.nombre}
                    </Text>
                    {distancia !== null && (
                        <Text style={estilos.distancia}>
                            {formatearDistancia(distancia)}
                        </Text>
                    )}
                </View>

                <View style={estilos.filaEstado}>
                    <IndicadorApertura estado={est} />
                    {comercio.cantidadResenas > 0 && (
                        <Puntaje
                            puntaje={comercio.puntaje}
                            cantidad={comercio.cantidadResenas}
                            style={{ marginLeft: 4 }}
                        />
                    )}
                </View>

                {promo && (
                    <View style={estilos.promo}>
                        <Ionicons
                            name="pricetag"
                            size={12}
                            color={colores.pizarra}
                        />
                        <Text style={estilos.textoPromo} numberOfLines={1}>
                            {promo.titulo}
                        </Text>
                    </View>
                )}
            </View>

            {derecha}
        </TarjetaVidrio>
    );
});

const estilos = StyleSheet.create({
    tarjeta: { flexDirection: "row", gap: 12 },
    cuerpo: { flex: 1, gap: 4 },
    filaNombre: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 8,
    },
    nombre: {
        flex: 1,
        fontFamily: fuentes.subtitulo,
        fontSize: 15,
        color: colores.pizarra,
    },
    distancia: {
        fontFamily: fuentes.textoMedio,
        fontSize: 12,
        color: colores.pizarra,
    },
    filaEstado: { flexDirection: "row", alignItems: "center" },
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
    textoPromo: {
        fontFamily: fuentes.textoMedio,
        fontSize: 12,
        color: colores.pizarra,
    },
});
