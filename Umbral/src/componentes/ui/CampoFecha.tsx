import DateTimePicker, {
    DateTimePickerAndroid,
} from "@react-native-community/datetimepicker";
import Ionicons from "@react-native-vector-icons/ionicons";
import { useState } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { colores, fuentes } from "../../tema";
import { estilos as base } from "../formularioAuth";

interface Props {
    etiqueta: string;
    /** "AAAA-MM-DD", o "" si todavía no hay fecha. */
    valor: string;
    alCambiar: (valor: string) => void;
    error?: string;
    ayuda?: string;
    /** Muestra una X para borrar la fecha (campos opcionales). */
    limpiable?: boolean;
    /** No deja elegir fechas anteriores a esta. */
    fechaMinima?: Date;
}

const dosDigitos = (n: number) => String(n).padStart(2, "0");

const aTexto = (f: Date) =>
    `${f.getFullYear()}-${dosDigitos(f.getMonth() + 1)}-${dosDigitos(f.getDate())}`;

function aFecha(valor: string): Date | null {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(valor);
    if (!m) return null;
    return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
}

const aMostrar = (f: Date) =>
    `${dosDigitos(f.getDate())}/${dosDigitos(f.getMonth() + 1)}/${f.getFullYear()}`;

/** Selector de fecha con calendario. Guarda el valor como "AAAA-MM-DD", igual que los campos de texto anteriores. */
export function CampoFecha({
    etiqueta,
    valor,
    alCambiar,
    error,
    ayuda,
    limpiable,
    fechaMinima,
}: Props) {
    const [abierto, setAbierto] = useState(false); // solo se usa en iOS
    const fecha = aFecha(valor);

    function abrir() {
        if (Platform.OS === "android") {
            DateTimePickerAndroid.open({
                value: fecha ?? fechaMinima ?? new Date(),
                mode: "date",
                minimumDate: fechaMinima,
                onValueChange: (_, elegida) => {
                    if (elegida) alCambiar(aTexto(elegida));
                },
            });
        } else {
            setAbierto((a) => !a);
        }
    }

    return (
        <View style={base.campo}>
            <Text style={base.etiqueta}>{etiqueta}</Text>

            <Pressable
                onPress={abrir}
                accessibilityRole="button"
                accessibilityLabel={`${etiqueta}: ${fecha ? aMostrar(fecha) : "sin elegir"}`}
                style={[local.caja, error ? base.inputError : null]}>
                <Ionicons
                    name="calendar-outline"
                    size={20}
                    color={colores.gris}
                />
                <Text style={[local.texto, !fecha && { color: colores.gris }]}>
                    {fecha ? aMostrar(fecha) : "Elegí una fecha"}
                </Text>
                {limpiable && fecha && (
                    <Pressable
                        onPress={() => alCambiar("")}
                        hitSlop={10}
                        accessibilityLabel="Borrar fecha">
                        <Ionicons
                            name="close-circle"
                            size={20}
                            color={colores.gris}
                        />
                    </Pressable>
                )}
            </Pressable>

            {abierto && Platform.OS === "ios" && (
                <DateTimePicker
                    value={fecha ?? fechaMinima ?? new Date()}
                    mode="date"
                    display="inline"
                    minimumDate={fechaMinima}
                    onValueChange={(_, elegida) => {
                        if (elegida) alCambiar(aTexto(elegida));
                    }}
                />
            )}

            {error ? (
                <Text style={base.error}>{error}</Text>
            ) : ayuda ? (
                <Text style={base.ayuda}>{ayuda}</Text>
            ) : null}
        </View>
    );
}

const local = StyleSheet.create({
    caja: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        backgroundColor: colores.blanco,
        borderRadius: 999,
        paddingHorizontal: 18,
        paddingVertical: 14,
        borderWidth: 1.5,
        borderColor: "transparent",
    },
    texto: {
        flex: 1,
        fontFamily: fuentes.texto,
        fontSize: 16,
        color: colores.pizarra,
    },
});
