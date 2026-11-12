import { LinearGradient } from "expo-linear-gradient";
import { memo } from "react";
import {
    Pressable,
    StyleSheet,
    Text,
    useWindowDimensions,
    View,
} from "react-native";
import { colores, fuentes } from "../../tema";
import type { Promocion } from "../../tipos";
import { partirTitulo, vigencia } from "../../utils/promos";
import { Insignia } from "../ui/Insignia";

const DEGRADES: [string, string][] = [
    [colores.salvia, colores.celeste],
    [colores.lilaClaro, colores.lila],
    [colores.celeste, colores.lila],
];

const FORMAS = [
    {
        borderTopLeftRadius: 32,
        borderTopRightRadius: 64,
        borderBottomRightRadius: 88,
        borderBottomLeftRadius: 32,
    },
    {
        borderTopLeftRadius: 64,
        borderTopRightRadius: 32,
        borderBottomRightRadius: 32,
        borderBottomLeftRadius: 64,
    },
] as const;

interface Props {
    promo: Promocion;
    nombreComercio?: string;
    /** "destacada": grande, ancho completo. "chica": mitad de ancho (grilla de 2 columnas). */
    variante: "destacada" | "chica";
    /** Posición en la grilla; cambia el degradé y la forma. */
    indice?: number;
    /** Date.now() de la pantalla, para que todas calculen la vigencia con el mismo "ahora". */
    ahora: number;
    onPress: (id: string) => void;
}

export const TarjetaPromo = memo(function TarjetaPromo({
    promo,
    nombreComercio,
    variante,
    indice = 0,
    ahora,
    onPress,
}: Props) {
    const { width } = useWindowDimensions();
    const { grande, resto } = partirTitulo(promo);
    const texto = vigencia(promo, ahora);

    if (variante === "destacada") {
        return (
            <Pressable
                onPress={() => onPress(promo.id)}
                accessibilityRole="button">
                <LinearGradient
                    colors={[colores.duraznoClaro, colores.durazno]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0.6, y: 1 }}
                    style={estilos.destacada}>
                    {promo.soloApp && <Insignia />}
                    <Text
                        style={estilos.numeroGrande}
                        numberOfLines={1}
                        adjustsFontSizeToFit>
                        {grande}
                    </Text>
                    <Text style={estilos.tituloDestacada}>{resto}</Text>
                    <Text style={estilos.comercio}>
                        {nombreComercio ?? "Comercio asociado"}
                    </Text>
                    <View style={estilos.pildora}>
                        <Text style={estilos.textoPildora}>{texto}</Text>
                    </View>
                </LinearGradient>
            </Pressable>
        );
    }

    const ancho = (width - 40 - 12) / 2; // padding de pantalla 20 + separación 12
    return (
        <Pressable
            onPress={() => onPress(promo.id)}
            accessibilityRole="button"
            style={{ width: ancho }}>
            <LinearGradient
                colors={DEGRADES[indice % DEGRADES.length]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[estilos.chica, FORMAS[indice % 2]]}>
                <Text
                    style={estilos.numeroChico}
                    numberOfLines={1}
                    adjustsFontSizeToFit>
                    {grande}
                </Text>
                <Text style={estilos.tituloChica} numberOfLines={2}>
                    {resto}
                </Text>
                <Text style={estilos.detalleChica} numberOfLines={2}>
                    {nombreComercio
                        ? `${nombreComercio} · ${texto.toLowerCase()}`
                        : texto}
                </Text>
            </LinearGradient>
        </Pressable>
    );
});

const estilos = StyleSheet.create({
    destacada: {
        padding: 22,
        gap: 2,
        minHeight: 230,
        borderTopLeftRadius: 40,
        borderTopRightRadius: 64,
        borderBottomRightRadius: 72,
        borderBottomLeftRadius: 36,
    },
    numeroGrande: {
        fontFamily: fuentes.titulo,
        fontSize: 88,
        lineHeight: 96,
        color: colores.pizarra,
        letterSpacing: -3,
    },
    tituloDestacada: {
        fontFamily: fuentes.titulo,
        fontSize: 20,
        color: colores.pizarra,
    },
    comercio: { fontFamily: fuentes.texto, fontSize: 14, color: colores.gris },
    pildora: {
        alignSelf: "flex-start",
        backgroundColor: colores.blanco,
        borderRadius: 999,
        paddingHorizontal: 14,
        paddingVertical: 8,
        marginTop: 10,
    },
    textoPildora: {
        fontFamily: fuentes.textoNegrita,
        fontSize: 13,
        color: colores.pizarra,
    },
    chica: { padding: 18, gap: 2, minHeight: 150 },
    numeroChico: {
        fontFamily: fuentes.titulo,
        fontSize: 44,
        lineHeight: 52,
        color: colores.pizarra,
        letterSpacing: -1.5,
    },
    tituloChica: {
        fontFamily: fuentes.titulo,
        fontSize: 17,
        lineHeight: 22,
        color: colores.pizarra,
    },
    detalleChica: {
        fontFamily: fuentes.texto,
        fontSize: 12,
        lineHeight: 17,
        color: colores.gris,
        marginTop: 2,
    },
});
