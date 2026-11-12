import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Alert, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Aviso,
  Boton,
  BotonRedondo,
  EstadoCarga,
  EstadoError,
  EstadoVacio,
  FondoDegradado,
  SeccionTitulo,
} from "../../src/componentes";
import { FormularioResena } from "../../src/componentes/comercio/FormularioResena";
import { Puntaje } from "../../src/componentes/comercio/Puntaje";
import { nombreDeAutor } from "../../src/componentes/comercio/SeccionResenas";
import { TarjetaResena } from "../../src/componentes/comercio/TarjetaResena";
import { useCarga } from "../../src/hooks/useCarga";
import { useResenas } from "../../src/hooks/useResenas";
import { useSesion } from "../../src/hooks/useSesion";
import { ErrorApi } from "../../src/servicios/cliente";
import { obtenerComercio } from "../../src/servicios/comercios";
import { resenasService } from "../../src/servicios/resenas";
import { colores, fuentes } from "../../src/tema";
import type { Resena } from "../../src/tipos";

const FONDO = [colores.salvia, colores.niebla, colores.niebla, colores.lila] as const;

const mensajeDe = (e: unknown) => (e instanceof ErrorApi || e instanceof Error ? e.message : "Algo salió mal. Probá de nuevo.");

export default function ResenasComercioScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const sesion = useSesion();
  const { lista, otras, propia, usuarioId, sinRed, cargando, refrescando, error, reintentar, refrescar } =
    useResenas(id);
  const { datos: comercio } = useCarga(() => obtenerComercio(id), [id]);

  const [formulario, setFormulario] = useState<"nueva" | "editar" | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [errorForm, setErrorForm] = useState<string | null>(null);
  const [reportadas, setReportadas] = useState<string[]>([]);
  const [ocupado, setOcupado] = useState(false);

  const esVecino = sesion.estado === "activa" && sesion.usuario.rol === "vecino";
  const hayPendientes = lista.some((r) => !r.sincronizada);

  function cerrarFormulario() {
    setFormulario(null);
    setErrorForm(null);
  }

  async function publicar(datos: { estrellas: 1 | 2 | 3 | 4 | 5; comentario: string }) {
    if (!usuarioId) return;
    setErrorForm(null);
    setGuardando(true);
    try {
      const { pendiente } = await resenasService.crear(id, datos, usuarioId);
      cerrarFormulario();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      if (pendiente) {
        Alert.alert("Sin conexión", "Guardamos tu reseña en el teléfono y la subimos apenas vuelva la conexión.");
      }
      await refrescar();
    } catch (e) {
      setErrorForm(mensajeDe(e));
    } finally {
      setGuardando(false);
    }
  }

  async function guardarEdicion(datos: { estrellas: 1 | 2 | 3 | 4 | 5; comentario: string }) {
    if (!propia) return;
    // Mandamos solo lo que cambió.
    const cambios: Partial<typeof datos> = {};
    if (datos.estrellas !== propia.estrellas) cambios.estrellas = datos.estrellas;
    if (datos.comentario !== propia.comentario) cambios.comentario = datos.comentario;
    if (Object.keys(cambios).length === 0) {
      cerrarFormulario();
      return;
    }
    setErrorForm(null);
    setGuardando(true);
    try {
      await resenasService.editar(propia, cambios);
      cerrarFormulario();
      await refrescar();
    } catch (e) {
      setErrorForm(mensajeDe(e));
    } finally {
      setGuardando(false);
    }
  }

  function borrar() {
    if (!propia) return;
    Alert.alert("Borrar reseña", "¿Seguro que querés borrar tu reseña?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Borrar",
        style: "destructive",
        onPress: async () => {
          setOcupado(true);
          try {
            await resenasService.borrar(propia);
            await refrescar();
          } catch (e) {
            Alert.alert("No se pudo borrar", mensajeDe(e));
          } finally {
            setOcupado(false);
          }
        },
      },
    ]);
  }

  function reportar(r: Resena) {
    Alert.alert("Reportar reseña", "¿Querés reportar esta reseña como ofensiva?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Reportar",
        style: "destructive",
        onPress: async () => {
          setOcupado(true);
          try {
            await resenasService.reportar(r.id);
            setReportadas((prev) => [...prev, r.id]);
            Alert.alert("Gracias", "Recibimos tu reporte.");
          } catch (e) {
            Alert.alert("No se pudo reportar", mensajeDe(e));
          } finally {
            setOcupado(false);
          }
        },
      },
    ]);
  }

  const cuenta = (() => {
    if (sesion.estado === "cargando") return null;
    if (sesion.estado === "sin-sesion") {
      return (
        <>
          <Aviso texto="Necesitás una cuenta para dejar una reseña." />
          <Boton texto="Ingresar o crear cuenta" onPress={() => router.push("/login")} />
        </>
      );
    }
    if (sesion.estado === "bloqueada") {
      return (
        <>
          <Aviso texto="Desbloqueá tu cuenta para dejar una reseña." />
          <Boton texto="Desbloquear mi cuenta" onPress={() => router.push("/yo")} />
        </>
      );
    }
    if (!esVecino) return <Aviso texto="Las cuentas de comercio no pueden dejar reseñas." />;

    if (formulario === "nueva") {
      return (
        <FormularioResena
          textoBoton="Publicar reseña"
          guardando={guardando}
          errorApi={errorForm}
          onGuardar={publicar}
          onCancelar={cerrarFormulario}
        />
      );
    }
    if (!propia) {
      return <Boton texto="Escribir una reseña" icono="create-outline" variante="indigo" onPress={() => setFormulario("nueva")} />;
    }
    return (
      <View style={{ gap: 10 }}>
        <SeccionTitulo texto="Tu reseña" />
        {formulario === "editar" ? (
          <FormularioResena
            valoresIniciales={{ estrellas: propia.estrellas, comentario: propia.comentario }}
            textoBoton="Guardar cambios"
            guardando={guardando}
            errorApi={errorForm}
            onGuardar={guardarEdicion}
            onCancelar={cerrarFormulario}
          />
        ) : (
          <TarjetaResena
            resena={propia}
            autor="Vos"
            propia
            ocupado={ocupado}
            onEditar={() => setFormulario("editar")}
            onBorrar={borrar}
          />
        )}
      </View>
    );
  })();

  return (
    <FondoDegradado colores={FONDO}>
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
          <Text style={estilos.subtitulo} numberOfLines={1}>
            {comercio?.nombre ?? " "}
          </Text>
          {comercio && (
            <Puntaje puntaje={comercio.puntaje} cantidad={comercio.cantidadResenas} conCantidad style={estilos.puntaje} />
          )}
        </View>

        {sinRed && <Aviso icono="cloud-offline-outline" texto="Sin conexión: las reseñas necesitan internet para actualizarse." />}
        {hayPendientes && !sinRed && <Aviso texto="Tenés una reseña pendiente de subir. Se envía sola." />}

        {cuenta}

        {cargando && <EstadoCarga texto="Cargando reseñas…" style={estilos.estado} />}
        {!cargando && error && (
          <EstadoError titulo="No pudimos cargar las reseñas" texto={error} onReintentar={reintentar} style={estilos.estado} />
        )}
        {!cargando && !error && lista.length === 0 && (
          <EstadoVacio
            icono="chatbubble-outline"
            titulo="Todavía no hay reseñas"
            texto="Sé el primero en contar cómo te fue."
            style={estilos.estado}
          />
        )}

        {!cargando && !error && otras.length > 0 && (
          <View style={{ gap: 12 }}>
            <SeccionTitulo texto={propia ? "Otras reseñas" : "Opiniones de los vecinos"} />
            {otras.map((r) => (
              <TarjetaResena
                key={r.id}
                resena={r}
                autor={nombreDeAutor(r)}
                ocupado={ocupado}
                yaReportada={r.reportada || reportadas.includes(r.id)}
                onReportar={sesion.estado === "activa" ? () => reportar(r) : undefined}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </FondoDegradado>
  );
}

const estilos = StyleSheet.create({
  contenido: { paddingHorizontal: 20, gap: 14 },
  titulo: { fontFamily: fuentes.titulo, fontSize: 34, color: colores.pizarra, letterSpacing: -0.5 },
  subtitulo: { fontFamily: fuentes.textoMedio, fontSize: 15, color: colores.gris, marginTop: 2 },
  puntaje: { fontFamily: fuentes.textoMedio, fontSize: 13, marginTop: 2 },
  estado: { flex: 0, paddingVertical: 32 },
});