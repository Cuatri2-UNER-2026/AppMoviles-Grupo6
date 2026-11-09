import { Ionicons, type IoniconsIconName } from "@react-native-vector-icons/ionicons";
import { Tabs } from "expo-router";
import { colores, fuentes } from "../../src/tema";

import type { ColorValue } from "react-native";

type Icono = IoniconsIconName;

function icono(activo: Icono, inactivo: Icono) {
  function IconoPestana({ color, focused, size }: { color: ColorValue; focused: boolean; size: number }) {
    return <Ionicons name={focused ? activo : inactivo} color={color} size={size} />;
  }
  return IconoPestana;
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colores.texto,
        tabBarInactiveTintColor: colores.textoSuave,
        tabBarLabelStyle: { fontFamily: fuentes.cuerpoFuerte, fontSize: 11 },
        tabBarStyle: { backgroundColor: colores.superficie, borderTopColor: colores.borde },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Buscar", tabBarIcon: icono("search", "search-outline") }} />
      <Tabs.Screen name="promos" options={{ title: "Promos", tabBarIcon: icono("pricetags", "pricetags-outline") }} />
      <Tabs.Screen name="mapa" options={{ title: "Mapa", tabBarIcon: icono("map", "map-outline") }} />
      <Tabs.Screen name="yo" options={{ title: "Yo", tabBarIcon: icono("person", "person-outline") }} />
    </Tabs>
  );
}
