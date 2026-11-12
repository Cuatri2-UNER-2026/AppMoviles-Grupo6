import { StyleSheet, Text, View } from "react-native";
import { colores, fuentes } from "../../tema";

export function SeccionTitulo({
    texto,
    ayuda,
}: {
    texto: string;
    ayuda?: string;
}) {
    return (
        <View style={{ gap: 4 }}>
            <Text style={estilos.titulo} accessibilityRole="header">
                {texto}
            </Text>
            {ayuda ? <Text style={estilos.ayuda}>{ayuda}</Text> : null}
        </View>
    );
}

const estilos = StyleSheet.create({
    titulo: {
        fontFamily: fuentes.subtitulo,
        fontSize: 20,
        color: colores.pizarra,
    },
    ayuda: {
        fontFamily: fuentes.texto,
        fontSize: 14,
        color: colores.gris,
        lineHeight: 19,
    },
});
