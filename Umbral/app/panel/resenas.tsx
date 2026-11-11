import { useState } from "react";
import { Alert, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Boton,
  BotonRedondo,
  Campo,
  EstadoCarga,
  EstadoError,
  EstadoVacio,
  Estrellas,
  FondoDegradado,
  TarjetaVidrio,
} from "../../src/componentes";
import { useCarga } from "../../src/hooks/useCarga";
import { resenasService } from "../../src/servicios/resenas";
import { colores, fuentes } from "../../src/tema";
import type { Resena } from "../../src/tipos";
import { fechaCorta } from "../../src/utils/fechas";

export default function ResenasScreen() {
  const insets = useSafeAreaInsets();
  const { datos, setDatos, cargando, refrescando, error, reintentar, refrescar } = useCarga(
    () => resenasService.obtenerMisResenas(),
    [],
  );
  const [respuestas, setRespuestas] = useState<Record<string, string>>({});
  const [enviando, setEnviando] = useState<string | null>(null);

  // De la más nueva a la más vieja.
  const resenas = [...(datos ?? [])].sort((a, b) => Date.parse(b.creadaEn) - Date.parse(a.creadaEn));
  const sinResponder = resenas.filter((r) => !r.respuesta).length;

  async function responder(resena: Resena) {
    const texto = (respuestas[resena.id] ?? "").trim();
    if (!texto) {
      Alert.alert("Respuesta vacía", "Escribí una respuesta antes de enviarla.");
      return;
    }
    try {
      setEnviando(resena.id);
      const actualizada = await resenasService.responder(resena.id, texto);
      setDatos((prev) => (prev ?? []).map((r) => (r.id === resena.id ? actualizada : r)));
      setRespuestas((prev) => ({ ...prev, [resena.id]: "" }));
    } catch (e) {
      Alert.alert("No se pudo responder", e instanceof Error ? e.message : "Probá de nuevo.");
    } finally {
      setEnviando(null);
    }
  }

  return (
    <FondoDegradado colores={[colores.salvia, colores.niebla, colores.niebla, colores.lila]}>
      <ScrollView
        contentContainerStyle={[estilos.contenido, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 40 }]}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refrescando} onRefresh={refrescar} tintColor={colores.indigo} />}
      >
        <View style={{ alignSelf: "flex-start" }}>
          <BotonRedondo />
        </View>

        <View>
          <Text style={estilos.titulo}>Reseñas</Text>
          <Text style={estilos.subtitulo}>
            {datos && datos.length > 0
              ? `${sinResponder} sin responder · podés responder una vez a cada una.`
              : "Las opiniones de tus clientes aparecen acá."}
          </Text>
        </View>

        {cargando && <EstadoCarga texto="Cargando reseñas…" style={estilos.estado} />}
        {!cargando && error && (
          <EstadoError titulo="No pudimos cargar las reseñas" texto={error} onReintentar={reintentar} style={estilos.estado} />
        )}
        {!cargando && !error && resenas.length === 0 && (
          <EstadoVacio
            icono="chatbubble-outline"
            titulo="Todavía no hay reseñas"
            texto="Cuando tus clientes dejen opiniones, aparecen acá."
            style={estilos.estado}
          />
        )}

        {resenas.map((r) => (
          <TarjetaVidrio key={r.id} style={estilos.tarjeta}>
            <View style={estilos.filaTop}>
              <Estrellas cantidad={r.estrellas} tamano={18} />
              <Text style={estilos.fecha}>{fechaCorta(r.creadaEn)}</Text>
            </View>
            <Text style={estilos.comentario}>{r.comentario}</Text>

            {r.respuesta ? (
              <View style={estilos.respuesta}>
                <Text style={estilos.tituloRespuesta}>Tu respuesta</Text>
                <Text style={estilos.comentario}>{r.respuesta}</Text>
              </View>
            ) : (
              <View style={{ gap: 10 }}>
                <Campo
                  etiqueta="Responder"
                  valor={respuestas[r.id] ?? ""}
                  alCambiar={(t) => setRespuestas((prev) => ({ ...prev, [r.id]: t }))}
                  placeholder="Escribí tu respuesta…"
                  autoCapitalize="sentences"
                  multiline
                  maxLength={500}
                />
                <Boton
                  texto="Enviar respuesta"
                  compacto
                  cargando={enviando === r.id}
                  deshabilitado={enviando !== null}
                  onPress={() => responder(r)}
                />
              </View>
            )}
          </TarjetaVidrio>
        ))}
      </ScrollView>
    </FondoDegradado>
  );
}

const estilos = StyleSheet.create({
  contenido: { paddingHorizontal: 20, gap: 14 },
  titulo: { fontFamily: fuentes.titulo, fontSize: 34, color: colores.pizarra, letterSpacing: -0.5 },
  subtitulo: { fontFamily: fuentes.texto, fontSize: 14, color: colores.gris, marginTop: 2 },
  estado: { flex: 0, paddingVertical: 32 },
  tarjeta: { gap: 10, padding: 16 },
  filaTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  fecha: { fontFamily: fuentes.texto, fontSize: 12, color: colores.gris },
  comentario: { fontFamily: fuentes.texto, fontSize: 15, lineHeight: 22, color: colores.pizarra },
  respuesta: { backgroundColor: colores.niebla, borderRadius: 18, padding: 12, gap: 4 },
  tituloRespuesta: { fontFamily: fuentes.textoNegrita, fontSize: 12, color: colores.indigo },
});