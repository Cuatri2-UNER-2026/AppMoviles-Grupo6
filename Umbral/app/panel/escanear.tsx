import { CameraView, useCameraPermissions } from "expo-camera";
import * as Haptics from "expo-haptics";
import * as LocalAuthentication from "expo-local-authentication";
import { useEffect, useState, type ReactNode } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
    Boton,
    BotonRedondo,
    EstadoCarga,
    EstadoVacio,
    FondoDegradado,
} from "../../src/componentes";
import { promocionesService } from "../../src/servicios/promociones";
import { colores, fuentes } from "../../src/tema";

/** Fondo común de las pantallas previas a la cámara (permiso y huella). */
function Fondo({ children }: { children: ReactNode }) {
    const insets = useSafeAreaInsets();
    return (
        <FondoDegradado
            colores={[
                colores.salvia,
                colores.niebla,
                colores.niebla,
                colores.lila,
            ]}>
            {children}
            <BotonRedondo
                style={{ position: "absolute", left: 20, top: insets.top + 8 }}
            />
        </FondoDegradado>
    );
}

export default function EscanearScreen() {
    const insets = useSafeAreaInsets();
    const [permission, requestPermission] = useCameraPermissions();
    const [autenticado, setAutenticado] = useState(false);
    const [escaneado, setEscaneado] = useState(false);

    // Pedimos huella o rostro antes de abrir la cámara. Sin biometría, se entra directo.
    async function verificarBiometria() {
        try {
            const hayHardware = await LocalAuthentication.hasHardwareAsync();
            const hayHuella = await LocalAuthentication.isEnrolledAsync();

            if (hayHardware && hayHuella) {
                const resultado = await LocalAuthentication.authenticateAsync({
                    promptMessage: "Confirmá tu identidad para escanear el QR",
                    fallbackLabel: "Usar el PIN del teléfono",
                });
                if (resultado.success) setAutenticado(true);
                else
                    Alert.alert(
                        "No pudimos verificarte",
                        "Probá de nuevo para abrir la cámara.",
                    );
            } else {
                setAutenticado(true);
            }
        } catch {
            setAutenticado(true);
        }
    }

    useEffect(() => {
        verificarBiometria();
    }, []);

    async function alEscanear({ data }: { data: string }) {
        setEscaneado(true);
        try {
            await promocionesService.validarCodigoQR(data);
            await Haptics.notificationAsync(
                Haptics.NotificationFeedbackType.Success,
            );
            Alert.alert(
                "¡Promoción validada!",
                "El código se registró como usado.",
                [{ text: "Aceptar", onPress: () => setEscaneado(false) }],
            );
        } catch (e) {
            await Haptics.notificationAsync(
                Haptics.NotificationFeedbackType.Error,
            );
            Alert.alert(
                "No se pudo validar",
                e instanceof Error ? e.message : "Código inválido o vencido.",
                [{ text: "Reintentar", onPress: () => setEscaneado(false) }],
            );
        }
    }

    if (!permission) {
        return (
            <Fondo>
                <EstadoCarga texto="" />
            </Fondo>
        );
    }

    if (!permission.granted) {
        return (
            <Fondo>
                <EstadoVacio
                    icono="camera-outline"
                    titulo="Necesitamos la cámara"
                    texto="Es para leer el código QR que te muestra el cliente."
                    accion={{
                        etiqueta: "Conceder permiso",
                        onPress: () => requestPermission(),
                    }}
                />
            </Fondo>
        );
    }

    if (!autenticado) {
        return (
            <Fondo>
                <EstadoVacio
                    icono="finger-print-outline"
                    titulo="Confirmá que sos vos"
                    texto="Te pedimos la huella, el rostro o el PIN del teléfono antes de abrir la cámara."
                    accion={{
                        etiqueta: "Reintentar",
                        onPress: verificarBiometria,
                    }}
                />
            </Fondo>
        );
    }

    return (
        <View style={estilos.pantalla}>
            <CameraView
                style={StyleSheet.absoluteFill}
                facing="back"
                onBarcodeScanned={escaneado ? undefined : alEscanear}
                barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
            />

            <BotonRedondo
                icono="close"
                accessibilityLabel="Cancelar"
                style={{ position: "absolute", left: 20, top: insets.top + 8 }}
            />

            <View style={[estilos.pie, { bottom: insets.bottom + 24 }]}>
                <View style={estilos.cartel}>
                    <Text style={estilos.textoCartel}>
                        Apuntá la cámara al código QR del cliente
                    </Text>
                </View>
                {escaneado && (
                    <Boton
                        texto="Escanear de nuevo"
                        variante="blanco"
                        onPress={() => setEscaneado(false)}
                    />
                )}
            </View>
        </View>
    );
}

const estilos = StyleSheet.create({
    pantalla: {
        flex: 1,
        backgroundColor: colores.negro,
    },
    pie: {
        position: "absolute",
        left: 20,
        right: 20,
        gap: 12,
    },
    cartel: {
        backgroundColor: colores.velo,
        borderRadius: 18,
        padding: 16,
        alignItems: "center",
    },
    textoCartel: {
        fontFamily: fuentes.textoMedio,
        fontSize: 14,
        color: colores.blanco,
        textAlign: "center",
    },
});
