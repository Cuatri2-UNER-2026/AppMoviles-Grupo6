import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    type ScrollViewProps,
} from "react-native";

/**
 * ScrollView para pantallas con formularios: cuando aparece el teclado,
 * la pantalla se acomoda y no tapa el campo que se está escribiendo.
 */
export function ScrollFormulario({ children, ...resto }: ScrollViewProps) {
    return (
        <KeyboardAvoidingView
            style={estilos.ocupar}
            behavior={Platform.OS === "android" ? "padding" : undefined}>
            <ScrollView
                keyboardShouldPersistTaps="handled"
                automaticallyAdjustKeyboardInsets
                showsVerticalScrollIndicator={false}
                {...resto}>
                {children}
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const estilos = StyleSheet.create({ ocupar: { flex: 1 } });
