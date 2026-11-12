import { StyleSheet, Text, View } from "react-native";
import { colores, fuentes } from "../../tema";
import type { Resena } from "../../tipos";
import { fechaCorta } from "../../utils/fechas";
import { Boton } from "../ui/Boton";
import { Estrellas } from "./Estrellas";

interface Props {
    resena: Resena;
    autor: string;
    /** Es la reseña de la persona que mira: muestra Editar y Borrar. */
    propia?: boolean;
    onEditar?: () => void;
    onBorrar?: () => void;
    /** Si se pasa, aparece "Reportar" (para reseñas de otros). */
    onReportar?: () => void;
    yaReportada?: boolean;
    ocupado?: boolean;
}

/** Reseña de un vecino con la respuesta del comercio. La usan la ficha y la pantalla de reseñas. */
export function TarjetaResena({
    resena,
    autor,
    propia,
    onEditar,
    onBorrar,
    onReportar,
    yaReportada,
    ocupado,
}: Props) {
    return (
        <View style={estilos.tarjeta}>
            <View style={estilos.filaTop}>
                <Text style={estilos.autor} numberOfLines={1}>
                    {autor}
                </Text>
                <Text style={estilos.fecha}>{fechaCorta(resena.creadaEn)}</Text>
            </View>

            <Estrellas cantidad={resena.estrellas} tamano={16} />
            <Text style={estilos.comentario}>{resena.comentario}</Text>

            {!resena.sincronizada && (
                <View style={estilos.pendiente}>
                    <Text style={estilos.textoPendiente}>
                        Pendiente de subir · se envía cuando vuelva la conexión
                    </Text>
                </View>
            )}

            {resena.respuesta && (
                <View style={estilos.respuesta}>
                    <Text style={estilos.tituloRespuesta}>
                        Respuesta del comercio
                    </Text>
                    <Text style={estilos.comentario}>{resena.respuesta}</Text>
                </View>
            )}

            {propia && (onEditar || onBorrar) && (
                <View style={estilos.acciones}>
                    {onEditar && (
                        <Boton
                            texto="Editar"
                            variante="blanco"
                            compacto
                            style={estilos.accion}
                            deshabilitado={ocupado}
                            onPress={onEditar}
                        />
                    )}
                    {onBorrar && (
                        <Boton
                            texto="Borrar"
                            variante="peligro"
                            compacto
                            style={estilos.accion}
                            deshabilitado={ocupado}
                            onPress={onBorrar}
                        />
                    )}
                </View>
            )}

            {!propia && onReportar && (
                <Boton
                    texto={yaReportada ? "Reportada" : "Reportar"}
                    variante="texto"
                    compacto
                    style={estilos.reportar}
                    deshabilitado={ocupado || yaReportada}
                    onPress={onReportar}
                />
            )}
        </View>
    );
}

const estilos = StyleSheet.create({
    tarjeta: {
        backgroundColor: colores.blanco,
        borderRadius: 28,
        padding: 16,
        gap: 8,
    },
    filaTop: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 8,
    },
    autor: {
        flex: 1,
        fontFamily: fuentes.textoNegrita,
        fontSize: 15,
        color: colores.pizarra,
    },
    fecha: { fontFamily: fuentes.texto, fontSize: 12, color: colores.gris },
    comentario: {
        fontFamily: fuentes.texto,
        fontSize: 14,
        lineHeight: 21,
        color: colores.textoSuave,
    },
    pendiente: {
        alignSelf: "flex-start",
        backgroundColor: colores.durazno,
        borderRadius: 999,
        paddingHorizontal: 12,
        paddingVertical: 5,
    },
    textoPendiente: {
        fontFamily: fuentes.textoMedio,
        fontSize: 12,
        color: colores.pizarra,
    },
    respuesta: {
        backgroundColor: colores.niebla,
        borderRadius: 18,
        padding: 12,
        gap: 4,
    },
    tituloRespuesta: {
        fontFamily: fuentes.textoNegrita,
        fontSize: 12,
        color: colores.indigo,
    },
    acciones: { flexDirection: "row", gap: 10, marginTop: 4 },
    accion: { flex: 1, backgroundColor: colores.niebla },
    reportar: { alignSelf: "flex-start", paddingHorizontal: 4 },
});
