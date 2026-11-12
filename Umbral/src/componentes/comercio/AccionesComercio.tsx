import { StyleSheet, View } from "react-native";
import type { Comercio } from "../../tipos";
import { abrirComoLlegar, abrirWhatsApp, llamar } from "../../utils/enlaces";
import { Boton } from "../ui/Boton";

/** Llamar / WhatsApp / Cómo llegar. Los dos primeros se apagan si el comercio no cargó el dato. */
export function AccionesComercio({ comercio }: { comercio: Comercio }) {
    return (
        <View style={estilos.fila}>
            <Boton
                texto="Llamar"
                variante="blanco"
                style={estilos.accion}
                deshabilitado={!comercio.telefono}
                onPress={() => llamar(comercio.telefono!)}
            />
            <Boton
                texto="WhatsApp"
                variante="blanco"
                style={estilos.accion}
                deshabilitado={!comercio.whatsapp}
                onPress={() => abrirWhatsApp(comercio.whatsapp!)}
            />
            <Boton
                texto="Cómo llegar"
                style={estilos.accion}
                onPress={() => abrirComoLlegar(comercio.coordenadas)}
            />
        </View>
    );
}

const estilos = StyleSheet.create({
    fila: { flexDirection: "row", gap: 10 },
    accion: { flex: 1, height: 54, paddingHorizontal: 6 },
});
