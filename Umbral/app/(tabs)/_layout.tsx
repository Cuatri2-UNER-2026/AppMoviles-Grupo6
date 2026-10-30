import { Tabs } from 'expo-router';
import React from 'react';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#1A1D20',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
        }}
      />
      <Tabs.Screen
        name="promos"
        options={{
          title: 'Promos',
        }}
      />
      <Tabs.Screen
        name="mapa"
        options={{
          title: 'Mapa',
        }}
      />
      <Tabs.Screen
        name="yo"
        options={{
          title: 'Mi Cuenta',
        }}
      />
    </Tabs>
  );
}