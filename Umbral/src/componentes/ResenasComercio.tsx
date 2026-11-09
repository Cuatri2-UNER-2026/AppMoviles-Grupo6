import { Ionicons } from "@react-native-vector-icons/ionicons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useRed } from "../hooks/useRed";
import { useSesion } from "../hooks/useSesion";
import { ErrorApi } from "../servicios/cliente";
import { resenasService, sincronizarResenasPendientes, type Estrellas } from "../servicios/resenas";
import { colores, fuentes, radio } from "../tema";
import type { Resena } from "../tipos";
import { Boton } from "./ui";

const MAX_COMENTARIO = 1000;

const mensajeDe = (e: unknown, porDefecto: string) =>
  e instanceof Error && e.message ? e.message : porDefecto;

const fecha = (iso: string) =>
  new Date(iso).toLocaleDateString("es-AR", { day: "numeric", month: "short", year: "numeric" });

type Formulario = { modo: "crear" } | { modo: "editar"; resena: Resena };

/**
 * Reseñas de la ficha: promedio, lista de la más nueva a la más vieja, y para
 * el vecino crear, editar, borrar y reportar. Sin red, la reseña nueva queda
 * guardada en el teléfono y se sube sola al volver la conexión.
 */
export function ResenasComercio({
  comercioId,
  puntaje,
  cantidad,
  onCambio,
}: {
  comercioId: string;
  /** Promedio que calcula el servidor (Comercio.puntaje). */
  puntaje: number;
  cantidad: number;
  /** Para que la ficha vuelva a pedir el comercio y actualice el promedio. */
  onCambio: () => void;
}) {
  const sesion = useSesion();
  const { conectado } = useRed();
  const yo = sesion.estado === "activa" ? sesion.usuario : null;

  const [resenas, setResenas] = useState<Resena[]>([]);
  const [pendientes, setPendientes] = useState<Resena[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formulario, setFormulario] = useState<Formulario | null>(null);
  const [reportadas, setReportadas] = useState<Set<string>>(new Set());

  const cargar = useCallback(async () => {
    setError(null);
    const locales = await resenasService.pendientesDe(comercioId).catch(() => []);
    setPendientes(locales);
    try {
      setResenas(await resenasService.obtenerDeComercio(comercioId));
    } catch (e) {
      setError(
        e instanceof ErrorApi && e.codigo === "SIN_RED"
          ? "Sin conexión: no podemos mostrar las reseñas ahora."
          : mensajeDe(e, "No se pudieron cargar las reseñas."),
      );
    } finally {
      setCargando(false);
    }
  }, [comercioId]);

  // Al abrir y cada vez que vuelve la red: primero sube lo pendiente y después recarga.
  useEffect(() => {
    let vigente = true;
    (conectado ? sincronizarResenasPendientes().catch(() => 0) : Promise.resolve(0)).then((subidas) => {
      if (!vigente) return;
      cargar();
      if (subidas > 0) onCambio();
    });
    return () => {
      vigente = false;
    };
  }, [conectado, cargar, onCambio]);

  const mia = yo ? (resenas.find((r) => r.usuarioId === yo.id) ?? pendientes.find((r) => r.usuarioId === yo.id)) : undefined;
  // Las pendientes primero; las de la API ya vienen de la más nueva a la más vieja.
  const lista = [...pendientes, ...resenas.filter((r) => !pendientes.some((p) => p.id === r.id))];

  const puedeEscribir = yo?.rol === "vecino" && !mia;

  async function borrar(r: Resena) {
    Alert.alert("Borrar reseña", "¿Querés borrar tu reseña?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Borrar",
        style: "destructive",
        onPress: async () => {
          try {
            if (!r.sincronizada) {
              await resenasService.descartarPendiente(r.id);
            } else {
              await resenasService.borrar(r.id);
              onCambio();
            }
            await cargar();
          } catch (e) {
            Alert.alert("No se pudo borrar", mensajeDe(e, "Probá de nuevo."));
          }
        },
      },
    ]);
  }

  function reportar(r: Resena) {
    Alert.alert(
      "Reportar reseña",
      "¿Te parece ofensiva? El Centro Comercial la va a revisar.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Reportar",
          style: "destructive",
          onPress: async () => {
            try {
              await resenasService.reportar(r.id);
              setReportadas((s) => new Set(s).add(r.id));
            } catch (e) {
              Alert.alert("No se pudo reportar", mensajeDe(e, "Probá de nuevo."));
            }
          },
        },
      ],
    );
  }

  return (
    <View style={estilos.contenedor}>
      <Text style={estilos.titulo}>Reseñas</Text>

      <View style={estilos.resumen}>
        <Text style={estilos.promedio}>{cantidad > 0 ? puntaje.toFixed(1).replace(".", ",") : "–"}</Text>
        <View style={{ gap: 2 }}>
          <EstrellasFijas valor={Math.round(puntaje)} tamano={18} />
          <Text style={estilos.suave}>
            {cantidad === 0
              ? "Todavía no tiene reseñas"
              : `${cantidad} ${cantidad === 1 ? "reseña" : "reseñas"}`}
          </Text>
        </View>
      </View>

      {formulario ? (
        <FormularioResena
          inicial={formulario.modo === "editar" ? formulario.resena : undefined}
          onCancelar={() => setFormulario(null)}
          onEnviar={async (estrellas, comentario) => {
            if (!yo) return;
            if (formulario.modo === "crear") {
              const r = await resenasService.crear(comercioId, yo.id, estrellas, comentario);
              if (!r.sincronizada) {
                Alert.alert(
                  "Guardada sin conexión",
                  "Tu reseña quedó guardada en el teléfono y se va a publicar sola cuando vuelva la conexión.",
                );
              } else {
                onCambio();
              }
            } else {
              await resenasService.editar(formulario.resena.id, { estrellas, comentario: comentario.trim() });
              onCambio();
            }
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
            setFormulario(null);
            await cargar();
          }}
        />
      ) : puedeEscribir ? (
        <Boton texto="Escribir una reseña" icono="create-outline" variante="secundario" onPress={() => setFormulario({ modo: "crear" })} />
      ) : !yo && sesion.estado !== "cargando" ? (
        <Boton
          texto="Ingresá para opinar"
          icono="log-in-outline"
          variante="secundario"
          onPress={() => router.push(sesion.estado === "bloqueada" ? "/yo" : "/login")}
        />
      ) : null}

      {cargando ? (
        <ActivityIndicator color={colores.texto} />
      ) : (
        <>
          {error && <Text style={estilos.error}>{error}</Text>}
          {!error && lista.length === 0 && (
            <Text style={estilos.suave}>Sé la primera persona en contar cómo te fue.</Text>
          )}
          {lista.map((r) => {
            const esMia = yo?.id === r.usuarioId;
            const reportada = reportadas.has(r.id);
            return (
              <View key={r.id} style={[estilos.resena, esMia && estilos.resenaMia]}>
                <View style={estilos.filaResena}>
                  <EstrellasFijas valor={r.estrellas} tamano={14} />
                  <Text style={estilos.suave}>
                    {esMia ? "Vos" : "Vecino/a"} · {fecha(r.creadaEn)}
                  </Text>
                </View>
                {!r.sincronizada && (
                  <View style={estilos.pendiente}>
                    <Ionicons name="cloud-upload-outline" size={13} color={colores.texto} />
                    <Text style={estilos.textoPendiente}>Pendiente de publicar</Text>
                  </View>
                )}
                <Text style={estilos.comentario}>{r.comentario}</Text>

                {r.respuesta && (
                  <View style={estilos.respuesta}>
                    <Text style={estilos.etiquetaRespuesta}>Respuesta del comercio</Text>
                    <Text style={estilos.comentario}>{r.respuesta}</Text>
                  </View>
                )}

                <View style={estilos.acciones}>
                  {esMia && r.sincronizada && !formulario && (
                    <Pressable onPress={() => setFormulario({ modo: "editar", resena: r })} hitSlop={8}>
                      <Text style={estilos.enlace}>Editar</Text>
                    </Pressable>
                  )}
                  {esMia && (
                    <Pressable onPress={() => borrar(r)} hitSlop={8}>
                      <Text style={[estilos.enlace, { color: colores.error }]}>Borrar</Text>
                    </Pressable>
                  )}
                  {!esMia && yo && r.sincronizada && (
                    reportada ? (
                      <Text style={estilos.suave}>Reportada</Text>
                    ) : (
                      <Pressable onPress={() => reportar(r)} hitSlop={8}>
                        <Text style={estilos.enlaceSuave}>Reportar</Text>
                      </Pressable>
                    )
                  )}
                </View>
              </View>
            );
          })}
        </>
      )}
    </View>
  );
}

function EstrellasFijas({ valor, tamano }: { valor: number; tamano: number }) {
  return (
    <View style={{ flexDirection: "row", gap: 1 }} accessibilityLabel={`${valor} de 5 estrellas`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Ionicons key={n} name={n <= valor ? "star" : "star-outline"} size={tamano} color="#E0A800" />
      ))}
    </View>
  );
}

function FormularioResena({
  inicial,
  onEnviar,
  onCancelar,
}: {
  inicial?: Resena;
  onEnviar: (estrellas: Estrellas, comentario: string) => Promise<void>;
  onCancelar: () => void;
}) {
  const [estrellas, setEstrellas] = useState<Estrellas | 0>(inicial?.estrellas ?? 0);
  const [comentario, setComentario] = useState(inicial?.comentario ?? "");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function enviar() {
    if (!estrellas) return setError("Elegí de 1 a 5 estrellas.");
    if (!comentario.trim()) return setError("Escribí un comentario.");
    setError(null);
    setEnviando(true);
    try {
      await onEnviar(estrellas, comentario);
    } catch (e) {
      setError(mensajeDe(e, "No se pudo enviar la reseña."));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <View style={estilos.formulario}>
      <Text style={estilos.etiqueta}>{inicial ? "Editá tu reseña" : "¿Cómo te fue?"}</Text>
      <View style={{ flexDirection: "row", gap: 6 }}>
        {([1, 2, 3, 4, 5] as const).map((n) => (
          <Pressable
            key={n}
            onPress={() => {
              setEstrellas(n);
              Haptics.selectionAsync().catch(() => {});
            }}
            hitSlop={6}
            accessibilityRole="button"
            accessibilityLabel={`${n} ${n === 1 ? "estrella" : "estrellas"}`}
            accessibilityState={{ selected: estrellas === n }}
          >
            <Ionicons name={n <= estrellas ? "star" : "star-outline"} size={32} color="#E0A800" />
          </Pressable>
        ))}
      </View>
      <TextInput
        value={comentario}
        onChangeText={setComentario}
        placeholder="Contá tu experiencia"
        placeholderTextColor={colores.textoSuave}
        multiline
        maxLength={MAX_COMENTARIO}
        style={estilos.input}
        accessibilityLabel="Comentario"
      />
      <Text style={[estilos.suave, { textAlign: "right" }]}>
        {comentario.length}/{MAX_COMENTARIO}
      </Text>
      {error && <Text style={estilos.error}>{error}</Text>}
      <View style={{ flexDirection: "row", gap: 8 }}>
        <Boton texto="Cancelar" variante="secundario" onPress={onCancelar} deshabilitado={enviando} style={{ flex: 1 }} />
        <Boton texto={inicial ? "Guardar" : "Publicar"} onPress={enviar} cargando={enviando} style={{ flex: 1 }} />
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: { gap: 12, marginTop: 16 },
  titulo: { fontFamily: fuentes.titulo, fontSize: 16, color: colores.texto },
  resumen: { flexDirection: "row", alignItems: "center", gap: 12 },
  promedio: { fontFamily: fuentes.tituloFuerte, fontSize: 36, color: colores.texto },
  suave: { fontFamily: fuentes.cuerpo, fontSize: 12, color: colores.textoSuave },
  error: { fontFamily: fuentes.cuerpo, fontSize: 13, color: colores.error },
  resena: {
    gap: 6,
    padding: 12,
    borderRadius: radio.m,
    backgroundColor: colores.fondo,
    borderWidth: 1,
    borderColor: colores.borde,
  },
  resenaMia: { borderColor: colores.acento },
  filaResena: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  comentario: { fontFamily: fuentes.cuerpo, fontSize: 14, color: colores.texto },
  pendiente: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: "flex-start",
    backgroundColor: colores.durazno,
    borderRadius: radio.pill,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  textoPendiente: { fontFamily: fuentes.cuerpoFuerte, fontSize: 11, color: colores.texto },
  respuesta: {
    marginTop: 4,
    paddingLeft: 10,
    borderLeftWidth: 3,
    borderLeftColor: colores.salvia,
    gap: 2,
  },
  etiquetaRespuesta: { fontFamily: fuentes.cuerpoFuerte, fontSize: 12, color: colores.textoSuave },
  acciones: { flexDirection: "row", gap: 16, justifyContent: "flex-end" },
  enlace: { fontFamily: fuentes.cuerpoFuerte, fontSize: 13, color: colores.acentoOscuro },
  enlaceSuave: { fontFamily: fuentes.cuerpo, fontSize: 13, color: colores.textoSuave },
  formulario: {
    gap: 10,
    padding: 14,
    borderRadius: radio.m,
    borderWidth: 1,
    borderColor: colores.acento,
    backgroundColor: colores.superficie,
  },
  etiqueta: { fontFamily: fuentes.cuerpoFuerte, fontSize: 14, color: colores.texto },
  input: {
    minHeight: 90,
    textAlignVertical: "top",
    borderWidth: 1,
    borderColor: colores.borde,
    borderRadius: radio.s,
    padding: 10,
    fontFamily: fuentes.cuerpo,
    fontSize: 14,
    color: colores.texto,
    backgroundColor: colores.fondo,
  },
});
