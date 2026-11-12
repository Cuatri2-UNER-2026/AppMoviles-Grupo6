import { Pressable, StyleSheet, Text, View } from "react-native";
import { colores, fuentes } from "../../tema";

interface Props<T extends string> {
    opciones: { clave: T; etiqueta: string }[];
    valor: T;
    onChange: (clave: T) => void;
}

/** Selector tipo pestañas en píldora (Vigentes / Por vencer / Próximas). */
export function Segmentos<T extends string>({
    opciones,
    valor,
    onChange,
}: Props<T>) {
    return (
        <View style={estilos.selector}>
            {opciones.map((o) => {
                const activa = o.clave === valor;
                return (
                    <Pressable
                        key={o.clave}
                        style={[estilos.opcion, activa && estilos.opcionActiva]}
                        onPress={() => !activa && onChange(o.clave)}
                        accessibilityRole="tab"
                        accessibilityState={{ selected: activa }}>
                        <Text
                            style={[
                                estilos.texto,
                                activa && estilos.textoActivo,
                            ]}>
                            {o.etiqueta}
                        </Text>
                    </Pressable>
                );
            })}
        </View>
    );
}

const estilos = StyleSheet.create({
    selector: {
        flexDirection: "row",
        padding: 5,
        borderRadius: 999,
        backgroundColor: colores.vidrio,
        borderWidth: 1,
        borderColor: colores.bordeVidrio,
    },
    opcion: {
        flex: 1,
        height: 44,
        borderRadius: 999,
        alignItems: "center",
        justifyContent: "center",
    },
    opcionActiva: {
        backgroundColor: colores.blanco,
        shadowColor: "#000",
        shadowOpacity: 0.08,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
    },
    texto: {
        fontFamily: fuentes.textoNegrita,
        fontSize: 14,
        color: colores.gris,
    },
    textoActivo: { color: colores.pizarra },
});
