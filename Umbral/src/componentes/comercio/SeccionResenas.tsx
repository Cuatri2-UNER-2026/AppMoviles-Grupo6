import { router } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { useResenas } from "../../hooks/useResenas";
import { colores, fuentes } from "../../tema";
import { EstadoCarga } from "../estados/Estados";
import { Boton } from "../ui/Boton";
import { SeccionTitulo } from "../ui/SeccionTitulo";
import { Puntaje } from "./Puntaje";
import { TarjetaResena } from "./TarjetaResena";

const VISIBLES = 3;
export const nombreDeAutor = (r: unknown) => (r as { usuarioNombre?: string }).usuarioNombre ?? "Vecino";

/** Bloque de reseñas de la ficha: las últimas y un acceso a la pantalla completa. */
export function SeccionResenas({
  comercioId,
  puntaje,
  cantidad,
}: {
  comercioId: string;
  puntaje: number;
  cantidad: number;
}) {
  const { lista, cargando, error, sinRed } = useResenas(comercioId);
  const abrir = () => router.push(`/resenas/${comercioId}` as any);

  return (
    <View style={{ gap: 12 }}>
      <View style={estilos.encabezado}>
        <SeccionTitulo texto="Reseñas" />
        <Puntaje puntaje={puntaje} cantidad={cantidad} conCantidad style={estilos.puntaje} />
      </View>

      {cargando && <EstadoCarga texto="Cargando reseñas…" style={estilos.carga} />}
      {!cargando && error && <Text style={estilos.estado}>No pudimos cargar las reseñas ahora.</Text>}
      {!cargando && !error && sinRed && lista.length === 0 && (
        <Text style={estilos.estado}>Las reseñas necesitan conexión. Probá de nuevo con internet.</Text>
      )}
      {!cargando && !error && !sinRed && lista.length === 0 && (
        <View style={estilos.vacio}>
          <Text style={estilos.estado}>Todavía no hay reseñas de este comercio.</Text>
        </View>
      )}

      {lista.slice(0, VISIBLES).map((r) => (
        <TarjetaResena key={r.id} resena={r} autor={nombreDeAutor(r)} />
      ))}

      {!cargando && !error && (
        <Boton
          texto={lista.length > VISIBLES ? "Ver todas y dejar la tuya" : "Dejar una reseña"}
          variante="blanco"
          onPress={abrir}
        />
      )}
    </View>
  );
}

const estilos = StyleSheet.create({
  encabezado: { gap: 2 },
  puntaje: { fontFamily: fuentes.textoMedio, fontSize: 13 },
  carga: { flex: 0, paddingVertical: 16 },
  vacio: { backgroundColor: colores.blanco, borderRadius: 28, padding: 16 },
  estado: { fontFamily: fuentes.texto, fontSize: 13, color: colores.gris, textAlign: "center" },
});