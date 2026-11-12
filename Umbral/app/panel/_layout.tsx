import { router, Stack } from "expo-router";
import { useEffect } from "react";
import { EstadoCarga, FondoDegradado } from "../../src/componentes";
import { useSesion } from "../../src/hooks/useSesion";
import { colores } from "../../src/tema";

export default function PanelLayout() {
    const sesion = useSesion();
    const esComercio =
        sesion.estado === "activa" && sesion.usuario.rol === "comercio";

    useEffect(() => {
        if (sesion.estado === "cargando" || esComercio) return;

        if (sesion.estado === "bloqueada") router.replace("/yo" as any);
        else if (sesion.estado === "sin-sesion")
            router.replace("/login" as any);
        else router.replace("/(tabs)" as any); // vecino: no tiene acceso al panel
    }, [sesion, esComercio]);

    if (esComercio) return <Stack screenOptions={{ headerShown: false }} />;

    return (
        <FondoDegradado
            colores={[
                colores.salvia,
                colores.niebla,
                colores.niebla,
                colores.lila,
            ]}>
            <EstadoCarga texto="" />
        </FondoDegradado>
    );
}
