import type { ReactNode } from "react";
import {
    Pressable,
    StyleSheet,
    View,
    type StyleProp,
    type ViewStyle,
} from "react-native";
import { colores } from "../../tema";

interface Props {
    children: ReactNode;
    onPress?: () => void;
    style?: StyleProp<ViewStyle>;
    accessibilityLabel?: string;
}

/** Tarjeta translúcida del tema. Si recibe `onPress` se vuelve tocable. */
export function TarjetaVidrio({
    children,
    onPress,
    style,
    accessibilityLabel,
}: Props) {
    if (!onPress) return <View style={[estilos.base, style]}>{children}</View>;
    return (
        <Pressable
            onPress={onPress}
            accessibilityRole="button"
            accessibilityLabel={accessibilityLabel}
            style={({ pressed }) => [
                estilos.base,
                style,
                pressed && { opacity: 0.85 },
            ]}>
            {children}
        </Pressable>
    );
}

const estilos = StyleSheet.create({
    base: {
        backgroundColor: colores.vidrio,
        borderWidth: 1,
        borderColor: colores.bordeVidrio,
        borderRadius: 28,
        padding: 14,
    },
});
