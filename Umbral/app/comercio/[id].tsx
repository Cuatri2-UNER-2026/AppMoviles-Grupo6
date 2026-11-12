import Ionicons from "@react-native-vector-icons/ionicons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { useVideoPlayer, VideoView } from "expo-video";
import { useEffect, useState } from "react";
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";
import {
  AccionesComercio,
  Aviso,
  Boton,
  BotonRedondo,
  EstadoCarga,
  EstadoError,
  IndicadorApertura,
  Insignia,
  Puntaje,
  SeccionResenas,
  SeccionTitulo,
} from "../../src/componentes";
import { useCarga } from "../../src/hooks/useCarga";
import { useSesion } from "../../src/hooks/useSesion";
import { pedir } from "../../src/servicios/cliente";
import { listarRubros, obtenerComercio } from "../../src/servicios/comercios";
import { archivoLocal, guardarMediosComercio, mediosGuardados } from "../../src/servicios/archivos";
import { alternarFavorito } from "../../src/servicios/favoritos";
import { colores, fuentes } from "../../src/tema";
import type { Comercio, Promocion, Rubro } from "../../src/tipos";
import { calcularEstado } from "../../src/utils/abiertoAhora";
import { abrirInstagram } from "../../src/utils/enlaces";
import { fechaCorta } from "../../src/utils/fechas";
import { formatearDuracion } from "../../src/utils/formatear";
import { estaVigente } from "../../src/utils/promos";

const ALTO_HERO = 300;
const SEMANA = [1, 2, 3, 4, 5, 6, 0] as const; // lunes primero
const DIAS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const MEDIOS: Record<string, string> = {
    efectivo: "Efectivo",
    debito: "Débito",
    credito: "Crédito",
    transferencia: "Transferencia",
    billetera_virtual: "Billetera virtual",
};

const aMin = (hhmm: string) => {
    const [h, m] = hhmm.split(":").map(Number);
    return h * 60 + m;
};

const tramosDelDia = (c: Comercio, dia: number) =>
  c.horarios.filter((h) => h.dia === dia).sort((a, b) => a.abre.localeCompare(b.abre));

const asegurarHttps = (url: string) =>
  url.replace(/^http:\/\/(?!localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/, "https://");

export default function FichaComercio() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const sesion = useSesion();

  // Comercio + rubro: cargando / error / reintentar salen de useCarga.
  const { datos, cargando, error, reintentar } = useCarga(async () => {
    const [c, rubros] = await Promise.all([
      obtenerComercio(id),
      listarRubros().catch(() => [] as Rubro[]),
    ]);
    return { comercio: c, rubro: rubros.find((r) => r.id === c.rubroId) ?? null };
  }, [id]);
  const comercio = datos?.comercio ?? null;
  const rubro = datos?.rubro ?? null;

  const [promos, setPromos] = useState<Promocion[]>([]);
  const [verSemana, setVerSemana] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [reproduciendo, setReproduciendo] = useState(false);
  const [descarga, setDescarga] = useState<"pendiente" | "guardando" | "guardado">("pendiente");

  // Si las fotos y el video ya están en el teléfono, se muestra como guardado.
  useEffect(() => {
    if (comercio) setDescarga(mediosGuardados(comercio) ? "guardado" : "pendiente");
  }, [comercio]);

  async function guardarParaSinDatos() {
    if (!comercio) return;
    setDescarga("guardando");
    const { fallidos } = await guardarMediosComercio(comercio);
    if (fallidos > 0) {
      setDescarga("pendiente");
      Alert.alert("No pudimos guardar todo", "Revisá tu conexión e intentá de nuevo.");
    } else {
      setDescarga("guardado");
    }
  }

  // Las promos cargan aparte: si fallan, la ficha se ve igual. Las reseñas las carga SeccionResenas.
  useEffect(() => {
    let activo = true;
    pedir<Promocion[]>("/promociones", { params: { comercioId: id, porPagina: 20 } })
      .then((r) => activo && setPromos(r.datos.filter((p) => estaVigente(p))))
      .catch(() => activo && setPromos([]));
    return () => {
      activo = false;
    };
  }, [id]);

  const esFavorito = sesion.estado === "activa" && sesion.usuario.favoritos.includes(id);

  async function alternar() {
    if (sesion.estado === "sin-sesion") {
      router.push("/login");
      return;
    }
    if (sesion.estado !== "activa") {
      router.push("/yo");
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setGuardando(true);
    try {
      await alternarFavorito(id);
    } catch (e) {
      Alert.alert("No pudimos guardar", e instanceof Error ? e.message : "Probá de nuevo.");
    } finally {
      setGuardando(false);
    }
  }

  const barra = (
    <View style={[estilos.barra, { top: insets.top + 8 }]} pointerEvents="box-none">
      <BotonRedondo />
      {comercio && (
        <Boton
          texto={esFavorito ? "Guardado" : "Guardar"}
          icono={esFavorito ? "heart" : "heart-outline"}
          variante={esFavorito ? "primario" : "claro"}
          compacto
          cargando={guardando}
          onPress={alternar}
          style={estilos.guardar}
        />
      )}
    </View>
  );

  if (cargando || error || !comercio) {
    return (
      <View style={estilos.pantalla}>
        <LinearGradient
          colors={[colores.celeste, colores.lila, colores.durazno]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[estilos.hero, { height: ALTO_HERO - 90 + insets.top }]}
        />
        {barra}
        {cargando ? (
          <EstadoCarga texto="Cargando comercio…" />
        ) : (
          <EstadoError titulo="No pudimos cargar este comercio" texto={error} onReintentar={reintentar} />
        )}
      </View>
    );
  }

  const estado = calcularEstado(comercio.horarios);
  const hoy = new Date().getDay();
  const tramosHoy = tramosDelDia(comercio, hoy);
  const ahoraMin = new Date().getHours() * 60 + new Date().getMinutes();
  const esActivo = (abre: string, cierra: string) =>
    aMin(cierra) > aMin(abre)
      ? aMin(abre) <= ahoraMin && ahoraMin < aMin(cierra)
      : ahoraMin >= aMin(abre);
  const altoHero = ALTO_HERO + insets.top;
  // Si ya se guardaron en el teléfono, se usan esas copias (funcionan sin datos).
  const fotos = comercio.imagenes.map((u) => archivoLocal(u, comercio.id) ?? asegurarHttps(u));
  const tieneVideo = !!comercio.videoUrl;

  return (
    <View style={estilos.pantalla}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 28 }}>
        {/* ───── Portada ───── */}
        <View style={{ height: altoHero }}>
          {tieneVideo ? (
            <VideoPortada
              url={archivoLocal(comercio.videoUrl!, comercio.id) ?? asegurarHttps(comercio.videoUrl!)}
              alto={altoHero}
              reproduciendo={reproduciendo}
              alIniciar={() => setReproduciendo(true)}
            />
          ) : fotos.length > 0 ? (
            <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false}>
              {fotos.map((uri) => (
                <Image key={uri} source={{ uri }} style={{ width, height: altoHero }} />
              ))}
            </ScrollView>
          ) : (
            <LinearGradient
              colors={[colores.celeste, colores.lila, colores.durazno]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[estilos.hero, estilos.sinMedios, { height: altoHero }]}
            >
              <Ionicons name="storefront-outline" size={44} color={colores.pizarra} />
              <Text style={estilos.textoSinMedios}>Todavía no cargó fotos ni video</Text>
            </LinearGradient>
          )}
          {!reproduciendo && <Onda />}
          {barra}
        </View>

        <View style={estilos.contenido}>
          {/* ───── Identidad ───── */}
          <View style={{ gap: 6 }}>
            <Text style={estilos.nombre}>{comercio.nombre}</Text>
            <Text style={estilos.subtitulo}>
              {[rubro?.nombre, comercio.direccion].filter(Boolean).join(" · ")}
            </Text>
            <View style={estilos.filaEstado}>
              <IndicadorApertura estado={estado} variante="chip" />
              <Puntaje
                puntaje={comercio.puntaje}
                cantidad={comercio.cantidadResenas}
                conCantidad
                style={estilos.puntaje}
              />
            </View>
          </View>

          {!comercio.activo && (
            <Aviso texto="Este comercio ya no forma parte del Centro Comercial." />
          )}
          {comercio.activo && comercio.horarios.length === 0 && (
            <Aviso icono="sunny-outline" texto="Cerrado temporalmente. Todavía no hay horarios cargados." />
          )}

          {/* ───── Acciones ───── */}
          <AccionesComercio comercio={comercio} />

          {/* ───── Horarios ───── */}
          {comercio.horarios.length > 0 && (
            <View style={estilos.tarjeta}>
              <View style={estilos.filaHorario}>
                <Text style={estilos.dia}>Hoy</Text>
                <View style={estilos.tramos}>
                  {tramosHoy.length === 0 ? (
                    <View style={estilos.tramo}>
                      <Text style={estilos.textoTramo}>Cerrado hoy</Text>
                    </View>
                  ) : (
                    tramosHoy.map((t) => {
                      const activo = esActivo(t.abre, t.cierra);
                      return (
                        <View key={t.abre} style={[estilos.tramo, activo && estilos.tramoActivo]}>
                          <Text style={[estilos.textoTramo, activo && { color: colores.blanco }]}>
                            {t.abre}–{t.cierra}
                          </Text>
                        </View>
                      );
                    })
                  )}
                </View>
              </View>

              {verSemana &&
                SEMANA.map((d) => {
                  const lista = tramosDelDia(comercio, d);
                  return (
                    <View key={d} style={estilos.filaSemana}>
                      <Text style={[estilos.diaSemana, d === hoy && estilos.diaSemanaHoy]}>{DIAS[d]}</Text>
                      <Text style={[estilos.textoSemana, d === hoy && estilos.diaSemanaHoy]}>
                        {lista.length ? lista.map((t) => `${t.abre}–${t.cierra}`).join("   ") : "Cerrado"}
                      </Text>
                    </View>
                  );
                })}

              <Pressable onPress={() => setVerSemana((v) => !v)} hitSlop={8}>
                <Text style={estilos.enlace}>{verSemana ? "Ocultar semana" : "Ver toda la semana"}</Text>
              </Pressable>
            </View>
          )}

          {/* ───── Promociones ───── */}
          {promos.map((p) => (
            <LinearGradient
              key={p.id}
              colors={[colores.salvia, colores.durazno, colores.lila]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={estilos.promo}
            >
              {p.soloApp && <Insignia />}
              <Text style={estilos.tituloPromo}>{p.titulo}</Text>
              <Text style={estilos.detallePromo} numberOfLines={1}>
                Hasta el {fechaCorta(p.hasta)} · {p.detalle.split(".")[0]}
              </Text>
              <Boton
                texto={p.soloApp ? "Mostrar mi código" : "Ver promoción"}
                onPress={() => router.push({ pathname: "/promo/[id]", params: { id: p.id } })}
                style={estilos.botonPromo}
              />
            </LinearGradient>
          ))}

          {/* ───── Reseñas ───── */}
          <SeccionResenas comercioId={id} puntaje={comercio.puntaje} cantidad={comercio.cantidadResenas} />

          {/* ───── Sobre el local ───── */}
          <View style={estilos.tarjeta}>
            <SeccionTitulo texto="Sobre el local" />
            <Text style={estilos.parrafo}>{comercio.descripcion}</Text>
            {comercio.mediosDePago.length > 0 && (
              <View style={estilos.chips}>
                {comercio.mediosDePago.map((m) => (
                  <View key={m} style={estilos.chip}>
                    <Text style={estilos.textoChip}>{MEDIOS[m] ?? m}</Text>
                  </View>
                ))}
              </View>
            )}
            {comercio.instagram && (
              <Pressable style={estilos.filaInstagram} onPress={() => abrirInstagram(comercio.instagram!)}>
                <Ionicons name="logo-instagram" size={18} color={colores.pizarra} />
                <Text style={estilos.textoInstagram}>{comercio.instagram}</Text>
              </Pressable>
            )}
            {tieneVideo && fotos.length > 0 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
                {fotos.map((uri) => (
                  <Image key={uri} source={{ uri }} style={estilos.miniatura} />
                ))}
              </ScrollView>
            )}
            {(fotos.length > 0 || tieneVideo) && (
              <Boton
                texto={
                  descarga === "guardado"
                    ? "Guardado para ver sin datos"
                    : descarga === "guardando"
                      ? "Guardando…"
                      : "Guardar fotos y video en el teléfono"
                }
                icono={descarga === "guardado" ? "checkmark-circle" : "download-outline"}
                variante="blanco"
                compacto
                cargando={descarga === "guardando"}
                deshabilitado={descarga === "guardado"}
                style={estilos.botonGuardarMedios}
                onPress={guardarParaSinDatos}
              />
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

/* ───────── piezas ───────── */

function Onda() {
  return (
    <Svg
      width="100%"
      height={44}
      viewBox="0 0 400 44"
      preserveAspectRatio="none"
      style={estilos.onda}
      pointerEvents="none"
    >
      <Path d="M0 30 C 70 6, 130 6, 200 24 S 330 46, 400 14 L400 44 L0 44 Z" fill={colores.niebla} />
    </Svg>
  );
}

function VideoPortada({
  url,
  alto,
  reproduciendo,
  alIniciar,
}: {
  url: string;
  alto: number;
  reproduciendo: boolean;
  alIniciar: () => void;
}) {
  const player = useVideoPlayer(url, (p) => {
    p.loop = false;
  });
  const [segundos, setSegundos] = useState(0);
  const [fallo, setFallo] = useState(false);

  useEffect(() => {
    const cargado = player.addListener("sourceLoad", (e) => setSegundos(e.duration));
    const estado = player.addListener("statusChange", (e) => {
      if (e.status === "error") setFallo(true);
    });
    return () => {
      cargado.remove();
      estado.remove();
    };
  }, [player]);

  if (fallo) {
    return (
      <LinearGradient
        colors={[colores.celeste, colores.lila, colores.durazno]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[estilos.hero, estilos.sinMedios, { height: alto }]}
      >
        <Ionicons name="videocam-off-outline" size={44} color={colores.pizarra} />
        <Text style={estilos.textoSinMedios}>No pudimos reproducir el video</Text>
      </LinearGradient>
    );
  }

  if (reproduciendo) {
    return (
      <View style={[estilos.hero, { height: alto, backgroundColor: colores.negro }]}>
        <VideoView
          player={player}
          style={StyleSheet.absoluteFill}
          nativeControls
          contentFit="contain"
          fullscreenOptions={{ enable: true }}
        />
      </View>
    );
  }

  return (
    <LinearGradient
      colors={[colores.celeste, colores.lila, colores.durazno]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[estilos.hero, { height: alto, alignItems: "center", justifyContent: "center" }]}
    >
      <Pressable
        style={estilos.play}
        onPress={() => {
          player.play();
          alIniciar();
        }}
        accessibilityLabel="Reproducir video"
      >
        <Ionicons name="play" size={40} color={colores.pizarra} style={{ marginLeft: 4 }} />
      </Pressable>
      <View style={estilos.pildoraVideo}>
        <Text style={estilos.textoPildora}>
          Video{segundos > 0 ? ` · ${formatearDuracion(segundos)}` : ""}
        </Text>
      </View>
    </LinearGradient>
  );
}

const estilos = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: colores.niebla },
  hero: { width: "100%" },
  contenido: { backgroundColor: colores.niebla, paddingHorizontal: 20, paddingTop: 4, gap: 16 },

  // portada
  barra: {
    position: "absolute",
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
  },
  guardar: { height: 46, paddingHorizontal: 18 },
  play: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "rgba(255,255,255,0.7)",
    borderWidth: 1,
    borderColor: colores.bordeVidrio,
    alignItems: "center",
    justifyContent: "center",
  },
  pildoraVideo: {
    position: "absolute",
    left: 20,
    bottom: 58,
    backgroundColor: colores.vidrioFuerte,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  textoPildora: { fontFamily: fuentes.textoNegrita, fontSize: 13, color: colores.pizarra },
  onda: { position: "absolute", left: 0, right: 0, bottom: -1 },
  sinMedios: { alignItems: "center", justifyContent: "center", gap: 8, paddingBottom: 30 },
  textoSinMedios: { fontFamily: fuentes.textoMedio, fontSize: 14, color: colores.pizarra },

  // identidad
  nombre: { fontFamily: fuentes.titulo, fontSize: 30, lineHeight: 36, color: colores.pizarra, letterSpacing: -0.5 },
  subtitulo: { fontFamily: fuentes.textoMedio, fontSize: 14, color: colores.gris },
  filaEstado: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 10, marginTop: 4 },
  puntaje: { fontFamily: fuentes.textoMedio, fontSize: 13 },

  // tarjetas
  tarjeta: { backgroundColor: colores.blanco, borderRadius: 28, padding: 16, gap: 12 },
  parrafo: { fontFamily: fuentes.texto, fontSize: 14, lineHeight: 21, color: colores.gris },
  enlace: { fontFamily: fuentes.textoNegrita, fontSize: 13, color: colores.indigo },

  // horarios
  filaHorario: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  dia: { fontFamily: fuentes.textoNegrita, fontSize: 15, color: colores.pizarra },
  tramos: { flexDirection: "row", flexWrap: "wrap", justifyContent: "flex-end", gap: 8, flexShrink: 1 },
  tramo: { backgroundColor: colores.grisChip, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8 },
  tramoActivo: { backgroundColor: colores.pizarra },
  textoTramo: { fontFamily: fuentes.textoNegrita, fontSize: 13, color: colores.pizarra },
  filaSemana: { flexDirection: "row", justifyContent: "space-between", gap: 12 },
  diaSemana: { fontFamily: fuentes.textoMedio, fontSize: 14, color: colores.gris },
  textoSemana: { fontFamily: fuentes.texto, fontSize: 14, color: colores.gris, flexShrink: 1, textAlign: "right" },
  diaSemanaHoy: { fontFamily: fuentes.textoNegrita, color: colores.pizarra },

  // promo
  promo: {
    padding: 22,
    gap: 6,
    borderTopLeftRadius: 56,
    borderTopRightRadius: 28,
    borderBottomRightRadius: 56,
    borderBottomLeftRadius: 28,
  },
  tituloPromo: { fontFamily: fuentes.titulo, fontSize: 30, lineHeight: 36, color: colores.pizarra, letterSpacing: -0.5 },
  detallePromo: { fontFamily: fuentes.textoMedio, fontSize: 14, color: colores.gris },
  botonPromo: { alignSelf: "flex-start", marginTop: 12 },

  // sobre el local
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { backgroundColor: colores.lila, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
  textoChip: { fontFamily: fuentes.textoMedio, fontSize: 12, color: colores.pizarra },
  filaInstagram: { flexDirection: "row", alignItems: "center", gap: 8 },
  textoInstagram: { fontFamily: fuentes.textoMedio, fontSize: 14, color: colores.pizarra },
  miniatura: { width: 120, height: 90, borderRadius: 18, backgroundColor: colores.niebla },
  botonGuardarMedios: { backgroundColor: colores.niebla },
});