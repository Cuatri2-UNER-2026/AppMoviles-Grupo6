import { router } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { FlatList, RefreshControl, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { EstadoCarga, EstadoError, EstadoVacio, FiltroRubros, FondoDegradado, Segmentos, TarjetaPromo } from "../../src/componentes";
import { useCarga } from "../../src/hooks/useCarga";
import { useComercios } from "../../src/hooks/useComercios";
import { promocionesService, type Promocion } from "../../src/servicios/promociones";
import { colores, ESPACIO_BARRA, fuentes } from "../../src/tema";

type EstadoPromo = "vigentes" | "por-vencer" | "proximas";

const TABS: { clave: EstadoPromo; etiqueta: string }[] = [
    { clave: "vigentes", etiqueta: "Vigentes" },
    { clave: "por-vencer", etiqueta: "Por vencer" },
    { clave: "proximas", etiqueta: "Próximas" },
];

const MENSAJE_VACIO: Record<EstadoPromo, string> = {
    vigentes: "Por ahora no hay promos vigentes.",
    "por-vencer": "Ninguna promo vence en los próximos días.",
    proximas: "Todavía no hay promos por empezar.",
};

export default function PromosScreen() {
    const insets = useSafeAreaInsets();
    const { comercios, rubros } = useComercios();

    const [tab, setTab] = useState<EstadoPromo>("vigentes");
    const [rubroId, setRubroId] = useState<string | null>(null);

    const { datos, cargando, refrescando, error, reintentar, refrescar } = useCarga(
        () => promocionesService.obtenerPromociones(tab),
        [tab],
    );

    const comercioPorId = useMemo(() => new Map(comercios.map((c) => [c.id, c])), [comercios]);

    // Las vencidas nunca se muestran (requisito); además filtramos por rubro.
    const visibles = useMemo(() => {
        const ahora = Date.now();
        return (datos ?? []).filter((p: Promocion) => {
        if (Date.parse(p.hasta) < ahora) return false;
        return rubroId ? comercioPorId.get(p.comercioId)?.rubroId === rubroId : true;
        });
    }, [datos, rubroId, comercioPorId]);

    const ahora = Date.now();
    const [destacada, ...resto] = visibles;

    const abrir = useCallback(
        (id: string) => router.push({ pathname: "/promo/[id]", params: { id } }),
        [],
    );

    const encabezado = (
        <View style={estilos.encabezado}>
            <View>
                <Text style={estilos.titulo}>Promos</Text>
                <Text style={estilos.subtitulo}>Solo las que están vigentes, nada vencido.</Text>
            </View>

            <Segmentos opciones={TABS} valor={tab} onChange={setTab} />

            {rubros.length > 0 && <FiltroRubros rubros={rubros} rubroId={rubroId} onChange={setRubroId} />}

            {cargando ? (
                <EstadoCarga texto="Cargando promociones…" style={estilos.estado} />
            ) : error ? (
                <EstadoError titulo="No pudimos cargar las promos" texto="Las promociones necesitan internet. Revisá tu conexión e intentá de nuevo." onReintentar={reintentar} style={estilos.estado} />
            ) : visibles.length === 0 ? (
                <EstadoVacio
                icono="pricetag-outline"
                titulo="No hay promociones acá"
                texto={rubroId ? "Probá con otro rubro." : MENSAJE_VACIO[tab]}
                style={estilos.estado}
                />
            ) : (
                destacada && (
                <TarjetaPromo
                    promo={destacada}
                    variante="destacada"
                    nombreComercio={comercioPorId.get(destacada.comercioId)?.nombre}
                    ahora={ahora}
                    onPress={abrir}
                />
                )
            )}
        </View>
    );

    return (
        <FondoDegradado colores={["#DCEBE2", colores.niebla, colores.niebla, "#F6DCCD"]} locations={[0, 0.3, 0.65, 1]} >
            <FlatList
                data={cargando || error ? [] : resto}
                keyExtractor={(p) => p.id}
                numColumns={2}
                columnWrapperStyle={{ gap: 12 }}
                ListHeaderComponent={encabezado}
                renderItem={({ item, index }) => (

                    <TarjetaPromo
                        promo={item}
                        variante="chica"
                        indice={index}
                        nombreComercio={comercioPorId.get(item.comercioId)?.nombre}
                        ahora={ahora}
                        onPress={abrir}
                    />
                )}
                contentContainerStyle={[
                estilos.contenido,
                { paddingTop: insets.top + 20, paddingBottom: ESPACIO_BARRA + insets.bottom + 24 },
                ]}
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refrescando} onRefresh={refrescar} tintColor={colores.indigo} />}
            />
        </FondoDegradado>
    );
}

const estilos = StyleSheet.create({
    contenido: { 
        paddingHorizontal: 20, 
        gap: 12 
    },
    encabezado: { 
        gap: 16, 
        marginBottom: 4 
    },
    titulo: { 
        fontFamily: fuentes.titulo, 
        fontSize: 40, 
        lineHeight: 46, 
        color: colores.pizarra, 
        letterSpacing: -1 
    },
    subtitulo: { 
        fontFamily: fuentes.texto, 
        fontSize: 14, 
        color: colores.gris, 
        marginTop: 2 
    },
    estado: { 
        flex: 0, 
        paddingVertical: 48 
    },
});
