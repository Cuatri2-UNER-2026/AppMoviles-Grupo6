import Ionicons from "@react-native-vector-icons/ionicons";
import { Tabs } from "expo-router";
import { colores, fuentes } from "../../src/tema";
import {ColorValue} from "react-native";

type NombreIcono = React.ComponentProps<typeof Ionicons>["name"];

function icono(activo: NombreIcono, inactivo: NombreIcono) {
  return ({ focused, color, size }: { focused: boolean; color: ColorValue; size: number }) => (
    <Ionicons name={focused ? activo : inactivo} size={size} color={color} />
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colores.indigo,
        tabBarInactiveTintColor: colores.pizarra,
        tabBarLabelStyle: { fontFamily: fuentes.textoMedio, fontSize: 11 },
        tabBarStyle: { backgroundColor: colores.niebla },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Buscar", tabBarIcon: icono("search", "search-outline") }} />
      <Tabs.Screen name="promos" options={{ title: "Promos", tabBarIcon: icono("pricetag", "pricetag-outline") }} />
      <Tabs.Screen name="mapa" options={{ title: "Mapa", tabBarIcon: icono("map", "map-outline") }} />
      <Tabs.Screen name="yo" options={{ title: "Yo", tabBarIcon: icono("person", "person-outline") }} />
    </Tabs>
  );
}