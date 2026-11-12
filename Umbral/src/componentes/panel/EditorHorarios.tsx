import Ionicons from "@react-native-vector-icons/ionicons";
import {
    Pressable,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    View,
} from "react-native";
import { colores, fuentes } from "../../tema";
import {
    formatearMientrasEscribe,
    NOMBRE_DIA,
    SEMANA,
    type Tramo,
    type Tramos,
} from "../../utils/horarios";
import { Boton } from "../ui/Boton";
import { TarjetaVidrio } from "../ui/TarjetaVidrio";

interface Props {
    valor: Tramos;
    onChange: (nuevo: Tramos) => void;
    /** Un mensaje por día con problemas (clave = número de día). */
    errores: Record<number, string>;
}

const MAX_TURNOS = 3;

function CampoHora({
    etiqueta,
    valor,
    onChange,
}: {
    etiqueta: string;
    valor: string;
    onChange: (v: string) => void;
}) {
    return (
        <View style={estilos.campoHora}>
            <Text style={estilos.etiqueta}>{etiqueta}</Text>
            <TextInput
                value={valor}
                onChangeText={(t) => onChange(formatearMientrasEscribe(t))}
                placeholder="08:00"
                placeholderTextColor={colores.gris}
                keyboardType="numbers-and-punctuation"
                maxLength={5}
                style={estilos.input}
                accessibilityLabel={etiqueta}
            />
        </View>
    );
}

/** Un bloque por día: se prende o apaga, y cada día tiene hasta tres turnos (mañana, tarde...). */
export function EditorHorarios({ valor, onChange, errores }: Props) {
    const cambiarDia = (dia: number, tramos: Tramo[]) =>
        onChange({ ...valor, [dia]: tramos });

    const copiarLunes = () => {
        const base = valor[1] ?? [];
        const nuevo = { ...valor };
        for (const d of [2, 3, 4, 5]) nuevo[d] = base.map((t) => ({ ...t }));
        onChange(nuevo);
    };

    return (
        <View style={{ gap: 12 }}>
            {SEMANA.map((dia) => {
                const tramos = valor[dia] ?? [];
                const abierto = tramos.length > 0;

                return (
                    <TarjetaVidrio key={dia} style={estilos.tarjeta}>
                        <View style={estilos.cabecera}>
                            <Text style={estilos.dia}>{NOMBRE_DIA[dia]}</Text>
                            <View style={estilos.estado}>
                                <Text style={estilos.textoEstado}>
                                    {abierto ? "Abierto" : "Cerrado"}
                                </Text>
                                <Switch
                                    value={abierto}
                                    onValueChange={(v) =>
                                        cambiarDia(
                                            dia,
                                            v
                                                ? [
                                                      {
                                                          abre: "08:00",
                                                          cierra: "12:00",
                                                      },
                                                  ]
                                                : [],
                                        )
                                    }
                                    trackColor={{
                                        true: colores.indigo,
                                        false: colores.grisBorde,
                                    }}
                                    thumbColor={colores.blanco}
                                    ios_backgroundColor={colores.grisBorde}
                                    accessibilityLabel={`${NOMBRE_DIA[dia]} abierto`}
                                />
                            </View>
                        </View>

                        {tramos.map((t, i) => (
                            <View key={i} style={estilos.fila}>
                                <CampoHora
                                    etiqueta="Abre"
                                    valor={t.abre}
                                    onChange={(v) =>
                                        cambiarDia(
                                            dia,
                                            tramos.map((x, j) =>
                                                j === i ? { ...x, abre: v } : x,
                                            ),
                                        )
                                    }
                                />
                                <CampoHora
                                    etiqueta="Cierra"
                                    valor={t.cierra}
                                    onChange={(v) =>
                                        cambiarDia(
                                            dia,
                                            tramos.map((x, j) =>
                                                j === i
                                                    ? { ...x, cierra: v }
                                                    : x,
                                            ),
                                        )
                                    }
                                />
                                <Pressable
                                    onPress={() =>
                                        cambiarDia(
                                            dia,
                                            tramos.filter((_, j) => j !== i),
                                        )
                                    }
                                    hitSlop={10}
                                    accessibilityLabel={`Quitar turno ${i + 1} del ${NOMBRE_DIA[dia]}`}
                                    style={estilos.quitar}>
                                    <Ionicons
                                        name="close-circle-outline"
                                        size={26}
                                        color={colores.gris}
                                    />
                                </Pressable>
                            </View>
                        ))}

                        {abierto && tramos.length < MAX_TURNOS && (
                            <Boton
                                texto="Agregar otro turno"
                                variante="texto"
                                compacto
                                onPress={() =>
                                    cambiarDia(dia, [
                                        ...tramos,
                                        { abre: "16:30", cierra: "20:30" },
                                    ])
                                }
                            />
                        )}

                        {dia === 1 && abierto && (
                            <Boton
                                texto="Copiar a martes–viernes"
                                variante="blanco"
                                compacto
                                onPress={copiarLunes}
                            />
                        )}

                        {errores[dia] ? (
                            <Text style={estilos.error}>{errores[dia]}</Text>
                        ) : null}
                    </TarjetaVidrio>
                );
            })}
        </View>
    );
}

const estilos = StyleSheet.create({
    tarjeta: { gap: 10, padding: 16 },
    cabecera: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    dia: {
        fontFamily: fuentes.subtitulo,
        fontSize: 17,
        color: colores.pizarra,
    },
    estado: { flexDirection: "row", alignItems: "center", gap: 8 },
    textoEstado: {
        fontFamily: fuentes.textoMedio,
        fontSize: 13,
        color: colores.gris,
    },
    fila: { flexDirection: "row", alignItems: "flex-end", gap: 10 },
    campoHora: { flex: 1, gap: 4 },
    etiqueta: {
        fontFamily: fuentes.textoNegrita,
        fontSize: 13,
        color: colores.pizarra,
        marginLeft: 6,
    },
    input: {
        backgroundColor: colores.blanco,
        borderRadius: 999,
        paddingHorizontal: 18,
        paddingVertical: 12,
        fontFamily: fuentes.textoNegrita,
        fontSize: 18,
        color: colores.pizarra,
        textAlign: "center",
    },
    quitar: { paddingBottom: 10 },
    error: {
        fontFamily: fuentes.textoMedio,
        fontSize: 13,
        color: colores.error,
        marginLeft: 6,
    },
});
