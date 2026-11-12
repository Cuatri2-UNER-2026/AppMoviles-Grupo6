import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
    BotonRedondo,
    EstadoCarga,
    EstadoError,
    FondoDegradado,
    ScrollFormulario,
} from "../../../src/componentes";
import {
    FormularioPromocion,
    type DatosPromocion,
    type ValoresPromocion,
} from "../../../src/componentes/promo/FormularioPromocion";
import { useCarga } from "../../../src/hooks/useCarga";
import {
    promocionesService,
    type ActualizarPromocionInput,
    type Promocion,
} from "../../../src/servicios/promociones";
import { colores, fuentes } from "../../../src/tema";
import { fechaParaInput } from "../../../src/utils/fechas";

const aValores = (p: Promocion): ValoresPromocion => ({
    titulo: p.titulo,
    detalle: p.detalle,
    descuento: p.descuento !== null ? String(p.descuento) : "",
    desde: fechaParaInput(p.desde),
    hasta: fechaParaInput(p.hasta),
    soloApp: p.soloApp,
});

export default function EditarPromocionScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { id } = useLocalSearchParams<{ id: string }>();
    const [guardando, setGuardando] = useState(false);

    const {
        datos: promocion,
        cargando,
        error,
        reintentar,
    } = useCarga(async () => {
        const lista = await promocionesService.obtenerMisPromociones();
        const encontrada = lista.find((p) => p.id === id);
        if (!encontrada) throw new Error("No se encontró la promoción.");
        return encontrada;
    }, [id]);

    async function guardar(nuevos: DatosPromocion) {
        if (!promocion) return;

        // Mandamos solo lo que cambió.
        const cambios: ActualizarPromocionInput = {};
        if (nuevos.titulo !== promocion.titulo) cambios.titulo = nuevos.titulo;
        if (nuevos.detalle !== promocion.detalle)
            cambios.detalle = nuevos.detalle;
        if (nuevos.descuento !== promocion.descuento)
            cambios.descuento = nuevos.descuento;
        if (
            nuevos.desde &&
            fechaParaInput(nuevos.desde) !== fechaParaInput(promocion.desde)
        )
            cambios.desde = nuevos.desde;
        if (fechaParaInput(nuevos.hasta) !== fechaParaInput(promocion.hasta))
            cambios.hasta = nuevos.hasta;
        if (nuevos.soloApp !== promocion.soloApp)
            cambios.soloApp = nuevos.soloApp;

        if (Object.keys(cambios).length === 0) {
            Alert.alert(
                "Sin cambios",
                "No modificaste ningún dato de la promoción.",
            );
            return;
        }

        try {
            setGuardando(true);
            await promocionesService.actualizarPromocion(promocion.id, cambios);
            Alert.alert(
                "¡Cambios guardados!",
                "La promoción se actualizó correctamente.",
                [{ text: "Aceptar", onPress: () => router.back() }],
            );
        } catch (e: any) {
            Alert.alert(
                "Error",
                e.message || "No se pudieron guardar los cambios.",
            );
        } finally {
            setGuardando(false);
        }
    }

    // Botón de volver fijo arriba, para que también se vea mientras carga o si hay un error.
    const volver = (
        <View
            style={{
                paddingTop: insets.top + 12,
                paddingHorizontal: 20,
                alignItems: "flex-start",
            }}>
            <BotonRedondo />
        </View>
    );

    return (
        <FondoDegradado
            colores={[
                colores.salvia,
                colores.niebla,
                colores.niebla,
                colores.lila,
            ]}>
            {cargando ? (
                <>
                    {volver}
                    <EstadoCarga texto="Cargando promoción…" />
                </>
            ) : error || !promocion ? (
                <>
                    {volver}
                    <EstadoError
                        titulo="No pudimos abrir la promoción"
                        texto={error}
                        onReintentar={reintentar}
                    />
                </>
            ) : (
                <ScrollFormulario
                    contentContainerStyle={[
                        estilos.contenido,
                        {
                            paddingTop: insets.top + 12,
                            paddingBottom: insets.bottom + 40,
                        },
                    ]}
                    keyboardShouldPersistTaps="handled"
                    automaticallyAdjustKeyboardInsets>
                    <View style={{ alignSelf: "flex-start" }}>
                        <BotonRedondo />
                    </View>
                    <View>
                        <Text style={estilos.titulo}>Editar promoción</Text>
                        <Text style={estilos.subtitulo}>
                            Modificá los datos de tu promoción.
                        </Text>
                    </View>

                    <FormularioPromocion
                        modo="editar"
                        valoresIniciales={aValores(promocion)}
                        textoBoton="Guardar cambios"
                        guardando={guardando}
                        bloqueado={new Date(promocion.hasta) < new Date()}
                        mensajeBloqueo="Esta promoción ya venció y no se puede editar."
                        onGuardar={guardar}
                        onCancelar={() => router.back()}
                    />
                </ScrollFormulario>
            )}
        </FondoDegradado>
    );
}

const estilos = StyleSheet.create({
    contenido: {
        paddingHorizontal: 20,
        gap: 16,
    },
    titulo: {
        fontFamily: fuentes.titulo,
        fontSize: 30,
        color: colores.pizarra,
        letterSpacing: -0.5,
    },
    subtitulo: {
        fontFamily: fuentes.texto,
        fontSize: 14,
        color: colores.gris,
        marginTop: 4,
    },
});
