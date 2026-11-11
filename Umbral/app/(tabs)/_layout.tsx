import { Tabs } from "expo-router";
import type { ComponentProps } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colores, fuentes } from "../../src/tema";

type BarraProps = Parameters<NonNullable<ComponentProps<typeof Tabs>["tabBar"]>>[0];

function BarraInferior({ state, descriptors, navigation }: BarraProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[estilos.contenedor, { bottom: insets.bottom + 10 }]} pointerEvents="box-none">
      <View style={estilos.barra}>
        {state.routes.map((ruta, i) => {
          const { options } = descriptors[ruta.key];
          const titulo = options.title ?? ruta.name;
          const activa = state.index === i;

          const alTocar = () => {
            const evento = navigation.emit({
              type: "tabPress",
              target: ruta.key,
              canPreventDefault: true,
            });
            if (!activa && !evento.defaultPrevented) navigation.navigate(ruta.name, ruta.params);
          };

          return (
            <Pressable
              key={ruta.key}
              onPress={alTocar}
              accessibilityRole="tab"
              accessibilityState={{ selected: activa }}
              accessibilityLabel={titulo}
              style={[estilos.item, activa && estilos.itemActivo]}
            >
              <Text style={[estilos.texto, activa && estilos.textoActivo]}>{titulo}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <BarraInferior {...props} />}
      screenOptions={{ headerShown: false, tabBarStyle: { position: "absolute" } }}
    >
      <Tabs.Screen name="index" options={{ title: "Buscar" }} />
      <Tabs.Screen name="promos" options={{ title: "Promos" }} />
      <Tabs.Screen name="mapa" options={{ title: "Mapa" }} />
      <Tabs.Screen name="yo" options={{ title: "Yo" }} />
    </Tabs>
  );
}

const estilos = StyleSheet.create({
    contenedor: { 
        position: "absolute", 
        left: 0, 
        right: 0, 
        paddingHorizontal: 16 
    },
    barra: {
        flexDirection: "row",
        padding: 6,
        borderRadius: 999,
        backgroundColor: "rgba(255,255,255,0.82)",
        borderWidth: 1,
        borderColor: colores.bordeVidrio,
    },
    item: { 
        flex: 1, 
        height: 50, 
        borderRadius: 999, 
        alignItems: "center", 
        justifyContent: "center" 
    },
    itemActivo: {
        backgroundColor: colores.blanco,
        shadowColor: "#000",
        shadowOpacity: 0.08,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
    },
    texto: { 
        fontFamily: fuentes.textoNegrita, 
        fontSize: 14, 
        color: colores.gris 
    },
    textoActivo: { 
        color: colores.pizarra 
    },
});