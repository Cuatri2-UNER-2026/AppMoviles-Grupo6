import { LinearGradient } from "expo-linear-gradient";
import type { ComponentProps, ReactNode } from "react";
import { StyleSheet, type StyleProp, type ViewStyle } from "react-native";

type Colores = ComponentProps<typeof LinearGradient>["colors"];

interface Props {
    colores: Colores;
    locations?: ComponentProps<typeof LinearGradient>["locations"];
    style?: StyleProp<ViewStyle>;
    children: ReactNode;
}

/** Fondo de pantalla con degradé (ocupa todo el espacio). */
export function FondoDegradado({ colores, locations, style, children }: Props) {
    return (
        <LinearGradient
            colors={colores}
            locations={locations}
            style={[estilos.fondo, style]}>
            {children}
        </LinearGradient>
    );
}

const estilos = StyleSheet.create({ fondo: { flex: 1 } });
