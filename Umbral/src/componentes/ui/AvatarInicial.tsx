import { StyleSheet, Text, View } from "react-native";
import { colores, fuentes } from "../../tema";

interface Props {
    nombre: string;
    fondo?: string;
    tamano?: number;
    /** Forma orgánica (tarjetas de comercio) en vez de círculo (perfil). */
    organico?: boolean;
}

export function AvatarInicial({
    nombre,
    fondo = colores.lila,
    tamano = 48,
    organico = false,
}: Props) {
    const forma = organico
        ? {
              borderTopLeftRadius: tamano * 0.94,
              borderTopRightRadius: tamano * 0.67,
              borderBottomRightRadius: tamano * 0.71,
              borderBottomLeftRadius: tamano * 0.67,
          }
        : { borderRadius: tamano / 2 };

    return (
        <View
            style={[
                estilos.base,
                { width: tamano, height: tamano, backgroundColor: fondo },
                forma,
            ]}>
            <Text style={[estilos.letra, { fontSize: tamano * 0.42 }]}>
                {nombre.trim().charAt(0).toUpperCase()}
            </Text>
        </View>
    );
}

const estilos = StyleSheet.create({
    base: { alignItems: "center", justifyContent: "center" },
    letra: { fontFamily: fuentes.titulo, color: colores.pizarra },
});
