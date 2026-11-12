import Ionicons from "@react-native-vector-icons/ionicons";
import type { ComponentProps } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colores, fuentes } from "../../tema";
import { TarjetaVidrio } from "./TarjetaVidrio";

type Icono = ComponentProps<typeof Ionicons>["name"];

interface Props {
    icono: Icono;
    titulo: string;
    subtitulo?: string;
    /** Versión oscura (acción principal). */
    oscura?: boolean;
    onPress: () => void;
}

/** Fila grande y tocable: ícono + título + subtítulo. Para el panel del comercio. */
export function TarjetaAccion({
    icono,
    titulo,
    subtitulo,
    oscura = false,
    onPress,
}: Props) {
    const contenido = (
        <>
            <View style={[estilos.icono, oscura && estilos.iconoOscuro]}>
                <Ionicons
                    name={icono}
                    size={26}
                    color={oscura ? colores.blanco : colores.pizarra}
                />
            </View>
            <View style={{ flex: 1 }}>
                <Text
                    style={[
                        estilos.titulo,
                        oscura && { color: colores.blanco },
                    ]}>
                    {titulo}
                </Text>
                {subtitulo ? (
                    <Text
                        style={[
                            estilos.subtitulo,
                            oscura && { color: colores.grisChip },
                        ]}>
                        {subtitulo}
                    </Text>
                ) : null}
            </View>
            <Ionicons
                name="chevron-forward"
                size={20}
                color={oscura ? colores.blanco : colores.gris}
            />
        </>
    );

    if (!oscura) {
        return (
            <TarjetaVidrio
                onPress={onPress}
                style={estilos.fila}
                accessibilityLabel={titulo}>
                {contenido}
            </TarjetaVidrio>
        );
    }

    return (
        <Pressable
            onPress={onPress}
            accessibilityRole="button"
            accessibilityLabel={titulo}
            style={({ pressed }) => [
                estilos.fila,
                estilos.oscura,
                pressed && { opacity: 0.85 },
            ]}>
            {contenido}
        </Pressable>
    );
}

const estilos = StyleSheet.create({
    fila: { flexDirection: "row", alignItems: "center", gap: 14 },
    oscura: { backgroundColor: colores.pizarra, borderRadius: 28, padding: 14 },
    icono: {
        width: 52,
        height: 52,
        borderRadius: 26,
        backgroundColor: colores.lila,
        alignItems: "center",
        justifyContent: "center",
    },
    iconoOscuro: { backgroundColor: "rgba(255,255,255,0.14)" },
    titulo: {
        fontFamily: fuentes.subtitulo,
        fontSize: 16,
        color: colores.pizarra,
    },
    subtitulo: {
        fontFamily: fuentes.texto,
        fontSize: 13,
        color: colores.gris,
        marginTop: 2,
    },
});
