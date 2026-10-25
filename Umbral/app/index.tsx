import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text } from "react-native";
import { ingresar, salir } from "../src/servicios/auth";
import { pedir } from "../src/servicios/cliente";
import { listarComercios } from "../src/servicios/comercios";
import type { Usuario } from "../src/tipos";

export default function PruebaApi() {
  const [resultado, setResultado] = useState("Tocá un botón para probar.");

  async function ejecutar(nombre: string, accion: () => Promise<unknown>) {
    setResultado(`${nombre}...`);
    try {
      const r = await accion();
      setResultado(`${nombre}: OK\n\n${JSON.stringify(r, null, 2)}`);
    } catch (e) {
      const err = e as Error & { codigo?: string; estado?: number };
      setResultado(
        `${nombre}: ERROR\n\ncódigo: ${err.codigo ?? "-"}\nestado: ${err.estado ?? "-"}\nmensaje: ${err.message}`,
      );
    }
  }

  return (
    <ScrollView contentContainerStyle={estilos.pantalla}>
      <Text style={estilos.titulo}>Prueba de la API</Text>

      <Boton
        texto="1. Ver comercios (sin sesión)"
        onPress={() =>
          ejecutar("Comercios", async () => {
            const r = await listarComercios({ porPagina: 3 });
            return r.datos.map((c) => c.nombre);
          })
        }
      />
      <Boton
        texto="2. Ver mi cuenta (/yo)"
        onPress={() =>
          ejecutar("Mi cuenta", async () => (await pedir<Usuario>("/yo")).datos)
        }
      />
      <Boton
        texto="3. Ingresar como Marta"
        onPress={() =>
          ejecutar("Ingreso", () => ingresar("marta@mail.com", "demo1234"))
        }
      />
      <Boton
        texto="4. Ingresar con clave incorrecta"
        onPress={() =>
          ejecutar("Ingreso incorrecto", () =>
            ingresar("marta@mail.com", "claveMala"),
          )
        }
      />
      <Boton
        texto="5. Cerrar sesión"
        onPress={() =>
          ejecutar("Cerrar sesión", async () => {
            await salir();
            return "Sesión cerrada";
          })
        }
      />

      <Text style={estilos.resultado}>{resultado}</Text>
    </ScrollView>
  );
}

function Boton({ texto, onPress }: { texto: string; onPress: () => void }) {
  return (
    <Pressable style={estilos.boton} onPress={onPress}>
      <Text style={estilos.textoBoton}>{texto}</Text>
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  pantalla: { padding: 20, paddingTop: 70, gap: 10 },
  titulo: { fontSize: 22, fontWeight: "700", marginBottom: 6 },
  boton: { backgroundColor: "#2B3441", padding: 14, borderRadius: 10 },
  textoBoton: { color: "#fff", fontWeight: "600" },
  resultado: {
    marginTop: 14,
    padding: 12,
    backgroundColor: "#F2F4F7",
    borderRadius: 10,
    fontFamily: "monospace",
    fontSize: 12,
  },
});