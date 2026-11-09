import { Ionicons } from "@react-native-vector-icons/ionicons";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Boton, Chip, EstadoCarga, EstadoError } from "../../../src/componentes/ui";
import { invalidarDirectorio } from "../../../src/hooks/useDirectorio";
import {
  LIMITES,
  MEDIOS_DE_PAGO,
  actualizarMiComercio,
  obtenerMiComercio,
  subirArchivo,
  type CambiosFicha,
} from "../../../src/servicios/miComercio";
import { colores, fuentes, radio } from "../../../src/tema";
import type { Comercio, Horario } from "../../../src/tipos";

// Lunes primero, como se lee en un cartel de horarios.
const DIAS: { dia: Horario["dia"]; nombre: string }[] = [
  { dia: 1, nombre: "Lunes" },
  { dia: 2, nombre: "Martes" },
  { dia: 3, nombre: "Miércoles" },
  { dia: 4, nombre: "Jueves" },
  { dia: 5, nombre: "Viernes" },
  { dia: 6, nombre: "Sábado" },
  { dia: 0, nombre: "Domingo" },
];

const HORA = /^([01]\d|2[0-3]):[0-5]\d$/;
const aMin = (h: string) => Number(h.slice(0, 2)) * 60 + Number(h.slice(3, 5));

/** Valida los horarios con las mismas reglas que la API. Devuelve el error o null. */
function validarHorarios(horarios: Horario[]): string | null {
  for (const d of DIAS) {
    const turnos = horarios.filter((h) => h.dia === d.dia);
    for (const t of turnos) {
      if (!HORA.test(t.abre) || !HORA.test(t.cierra)) {
        return `${d.nombre}: las horas tienen que tener el formato HH:MM (por ejemplo 08:30).`;
      }
      if (aMin(t.abre) >= aMin(t.cierra)) {
        return `${d.nombre}: la hora de cierre tiene que ser posterior a la de apertura.`;
      }
    }
    const ordenados = [...turnos].sort((a, b) => aMin(a.abre) - aMin(b.abre));
    for (let i = 1; i < ordenados.length; i++) {
      if (aMin(ordenados[i].abre) < aMin(ordenados[i - 1].cierra)) {
        return `${d.nombre}: hay dos turnos que se superponen.`;
      }
    }
  }
  return null;
}

const vacioANull = (s: string) => (s.trim() ? s.trim() : null);

export default function EditarFicha() {
  const [original, setOriginal] = useState<Comercio | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [direccion, setDireccion] = useState("");
  const [telefono, setTelefono] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [instagram, setInstagram] = useState("");
  const [medios, setMedios] = useState<string[]>([]);
  const [horarios, setHorarios] = useState<Horario[]>([]);
  const [imagenes, setImagenes] = useState<string[]>([]);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  const [subiendo, setSubiendo] = useState<"imagen" | "video" | null>(null);
  const [guardando, setGuardando] = useState(false);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const c = await obtenerMiComercio();
      setOriginal(c);
      setNombre(c.nombre);
      setDescripcion(c.descripcion);
      setDireccion(c.direccion);
      setTelefono(c.telefono ?? "");
      setWhatsapp(c.whatsapp ?? "");
      setInstagram(c.instagram ?? "");
      setMedios(c.mediosDePago);
      setHorarios(c.horarios);
      setImagenes(c.imagenes);
      setVideoUrl(c.videoUrl);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo cargar tu comercio.");
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carga inicial desde la API
    cargar();
  }, [cargar]);

  // ---------- Horarios ----------

  const cambiarTurno = (indice: number, campo: "abre" | "cierra", valor: string) =>
    setHorarios((hs) => hs.map((h, i) => (i === indice ? { ...h, [campo]: valor } : h)));

  const agregarTurno = (dia: Horario["dia"]) =>
    setHorarios((hs) => {
      const delDia = hs.filter((h) => h.dia === dia);
      // Si ya hay un turno a la mañana, el segundo se propone a la tarde (horario cortado).
      const nuevo = delDia.length ? { dia, abre: "16:30", cierra: "20:30" } : { dia, abre: "08:00", cierra: "12:00" };
      return [...hs, nuevo];
    });

  const quitarTurno = (indice: number) => setHorarios((hs) => hs.filter((_, i) => i !== indice));

  const copiarLunesADiasHabiles = () =>
    setHorarios((hs) => {
      const lunes = hs.filter((h) => h.dia === 1);
      const sinHabiles = hs.filter((h) => h.dia < 2 || h.dia > 5);
      const copias = ([2, 3, 4, 5] as const).flatMap((dia) => lunes.map((t) => ({ ...t, dia })));
      return [...sinHabiles, ...copias];
    });

  // ---------- Fotos y video ----------

  async function elegirFoto() {
    if (imagenes.length >= LIMITES.maxImagenes) {
      Alert.alert("Límite de fotos", `La ficha puede tener hasta ${LIMITES.maxImagenes} fotos.`);
      return;
    }
    const r = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.7,
    });
    if (r.canceled) return;
    const a = r.assets[0];
    if (a.fileSize && a.fileSize > LIMITES.imagenBytes) {
      Alert.alert("Foto muy pesada", "La foto puede pesar hasta 5 MB. Probá con otra.");
      return;
    }
    setSubiendo("imagen");
    try {
      const nombreArchivo = a.fileName ?? `foto-${Date.now()}.jpg`;
      const subido = await subirArchivo(a.uri, nombreArchivo, a.mimeType ?? "image/jpeg");
      setImagenes((imgs) => [...imgs, subido.url]);
    } catch (e) {
      Alert.alert("No se pudo subir la foto", e instanceof Error ? e.message : "Probá de nuevo.");
    } finally {
      setSubiendo(null);
    }
  }

  async function elegirVideo() {
    const r = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["videos"],
      videoMaxDuration: 120,
      quality: 1,
    });
    if (r.canceled) return;
    const a = r.assets[0];
    if (a.fileSize && a.fileSize > LIMITES.videoBytes) {
      Alert.alert("Video muy pesado", "El video puede pesar hasta 30 MB. Probá con uno más corto.");
      return;
    }
    setSubiendo("video");
    try {
      const nombreArchivo = a.fileName ?? `video-${Date.now()}.mp4`;
      const subido = await subirArchivo(a.uri, nombreArchivo, a.mimeType ?? "video/mp4");
      setVideoUrl(subido.url);
    } catch (e) {
      Alert.alert(
        "No se pudo subir el video",
        `${e instanceof Error ? e.message : "Probá de nuevo."}\nLa API acepta videos MP4 de hasta 30 MB.`,
      );
    } finally {
      setSubiendo(null);
    }
  }

  const quitarFoto = (url: string) => setImagenes((imgs) => imgs.filter((u) => u !== url));

  const moverFoto = (indice: number, hacia: -1 | 1) =>
    setImagenes((imgs) => {
      const destino = indice + hacia;
      if (destino < 0 || destino >= imgs.length) return imgs;
      const copia = [...imgs];
      [copia[indice], copia[destino]] = [copia[destino], copia[indice]];
      return copia;
    });

  // ---------- Guardar ----------

  async function guardar() {
    if (!original) return;

    if (nombre.trim().length < 2) return Alert.alert("Falta el nombre", "Escribí el nombre del comercio.");
    const wa = whatsapp.replace(/\D/g, "");
    if (wa && !/^\d{10,15}$/.test(wa)) {
      return Alert.alert("WhatsApp incorrecto", "Escribí solo números con código de país, por ejemplo 5493442421000.");
    }
    const ig = instagram.trim();
    if (ig && !/^@[A-Za-z0-9._]{1,30}$/.test(ig)) {
      return Alert.alert("Instagram incorrecto", "Tiene que empezar con @, por ejemplo @eltornillo.");
    }
    const errorHorarios = validarHorarios(horarios);
    if (errorHorarios) return Alert.alert("Revisá los horarios", errorHorarios);

    // Sólo se mandan los campos que cambiaron.
    const nuevo: CambiosFicha = {
      nombre: nombre.trim(),
      descripcion: descripcion.trim(),
      direccion: direccion.trim(),
      telefono: vacioANull(telefono),
      whatsapp: wa || null,
      instagram: ig || null,
      mediosDePago: medios,
      horarios,
      imagenes,
      videoUrl,
    };
    const cambios: CambiosFicha = {};
    (Object.keys(nuevo) as (keyof CambiosFicha)[]).forEach((k) => {
      if (JSON.stringify(nuevo[k]) !== JSON.stringify(original[k])) {
        (cambios as Record<string, unknown>)[k] = nuevo[k];
      }
    });
    if (!Object.keys(cambios).length) {
      return Alert.alert("Sin cambios", "No modificaste ningún dato de la ficha.");
    }

    setGuardando(true);
    try {
      const actualizado = await actualizarMiComercio(cambios);
      setOriginal(actualizado);
      invalidarDirectorio(); // Buscar y Mapa vuelven a pedir el listado.
      Alert.alert("¡Ficha actualizada!", "Los vecinos ya ven los cambios.", [
        { text: "Aceptar", onPress: () => router.back() },
      ]);
    } catch (e) {
      Alert.alert("No se pudo guardar", e instanceof Error ? e.message : "Probá de nuevo.");
    } finally {
      setGuardando(false);
    }
  }

  if (cargando) return <EstadoCarga texto="Cargando tu ficha..." />;
  if (error || !original) return <EstadoError mensaje={error ?? "No encontramos tu comercio."} onReintentar={cargar} />;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={estilos.pantalla} keyboardShouldPersistTaps="handled">
        {/* Datos */}
        <Seccion titulo="Datos del comercio">
          <Campo etiqueta="Nombre" valor={nombre} alCambiar={setNombre} />
          <Campo etiqueta="Descripción" valor={descripcion} alCambiar={setDescripcion} multilinea
            ayuda="Contá qué vendés: la búsqueda también mira este texto." />
          <Campo etiqueta="Dirección" valor={direccion} alCambiar={setDireccion} />
          <Campo etiqueta="Teléfono" valor={telefono} alCambiar={setTelefono} teclado="phone-pad" />
          <Campo etiqueta="WhatsApp" valor={whatsapp} alCambiar={setWhatsapp} teclado="phone-pad"
            ayuda="Con código de país, sin espacios: 5493442421000" />
          <Campo etiqueta="Instagram" valor={instagram} alCambiar={setInstagram} ayuda="Ejemplo: @eltornillo" />
        </Seccion>

        {/* Medios de pago */}
        <Seccion titulo="Medios de pago">
          <View style={estilos.chips}>
            {MEDIOS_DE_PAGO.map((m) => (
              <Chip
                key={m.id}
                texto={m.nombre}
                activo={medios.includes(m.id)}
                onPress={() =>
                  setMedios((ms) => (ms.includes(m.id) ? ms.filter((x) => x !== m.id) : [...ms, m.id]))
                }
              />
            ))}
          </View>
        </Seccion>

        {/* Horarios */}
        <Seccion titulo="Horarios">
          <Text style={estilos.ayuda}>
            Si cortás al mediodía, cargá dos turnos el mismo día. Un día sin turnos figura como cerrado.
          </Text>
          {DIAS.map((d) => {
            const turnos = horarios.map((h, i) => ({ h, i })).filter(({ h }) => h.dia === d.dia);
            return (
              <View key={d.dia} style={estilos.dia}>
                <View style={estilos.filaDia}>
                  <Text style={estilos.nombreDia}>{d.nombre}</Text>
                  {turnos.length === 0 && <Text style={estilos.cerrado}>Cerrado</Text>}
                  <Pressable onPress={() => agregarTurno(d.dia)} hitSlop={8} accessibilityLabel={`Agregar turno el ${d.nombre}`}>
                    <Text style={estilos.enlace}>+ Turno</Text>
                  </Pressable>
                </View>
                {turnos.map(({ h, i }) => (
                  <View key={i} style={estilos.turno}>
                    <TextInput
                      value={h.abre}
                      onChangeText={(v) => cambiarTurno(i, "abre", v)}
                      style={estilos.hora}
                      placeholder="08:00"
                      keyboardType="numbers-and-punctuation"
                      maxLength={5}
                      accessibilityLabel={`${d.nombre}, abre`}
                    />
                    <Text style={estilos.ayuda}>a</Text>
                    <TextInput
                      value={h.cierra}
                      onChangeText={(v) => cambiarTurno(i, "cierra", v)}
                      style={estilos.hora}
                      placeholder="12:00"
                      keyboardType="numbers-and-punctuation"
                      maxLength={5}
                      accessibilityLabel={`${d.nombre}, cierra`}
                    />
                    <Pressable onPress={() => quitarTurno(i)} hitSlop={8} accessibilityLabel="Quitar turno">
                      <Ionicons name="trash-outline" size={20} color={colores.error} />
                    </Pressable>
                  </View>
                ))}
                {d.dia === 1 && turnos.length > 0 && (
                  <Pressable onPress={copiarLunesADiasHabiles} hitSlop={8}>
                    <Text style={estilos.enlace}>Copiar el lunes de martes a viernes</Text>
                  </Pressable>
                )}
              </View>
            );
          })}
        </Seccion>

        {/* Fotos */}
        <Seccion titulo={`Fotos (${imagenes.length}/${LIMITES.maxImagenes})`}>
          <Text style={estilos.ayuda}>La primera foto es la que se ve primero en la ficha.</Text>
          <View style={estilos.fotos}>
            {imagenes.map((url, i) => (
              <View key={url} style={estilos.foto}>
                <Image source={{ uri: url }} style={StyleSheet.absoluteFill} />
                <View style={estilos.accionesFoto}>
                  <BotonIcono icono="chevron-back" onPress={() => moverFoto(i, -1)} etiqueta="Mover antes" />
                  <BotonIcono icono="close" onPress={() => quitarFoto(url)} etiqueta="Quitar foto" />
                  <BotonIcono icono="chevron-forward" onPress={() => moverFoto(i, 1)} etiqueta="Mover después" />
                </View>
              </View>
            ))}
          </View>
          <Boton
            texto="Agregar foto"
            icono="image-outline"
            variante="secundario"
            onPress={elegirFoto}
            cargando={subiendo === "imagen"}
            deshabilitado={subiendo !== null || imagenes.length >= LIMITES.maxImagenes}
          />
        </Seccion>

        {/* Video */}
        <Seccion titulo="Video de presentación">
          {videoUrl ? (
            <View style={estilos.filaVideo}>
              <Ionicons name="videocam" size={20} color={colores.abierto} />
              <Text style={[estilos.ayuda, { flex: 1 }]} numberOfLines={1}>
                Video cargado
              </Text>
              <Pressable onPress={() => setVideoUrl(null)} hitSlop={8}>
                <Text style={[estilos.enlace, { color: colores.error }]}>Quitar</Text>
              </Pressable>
            </View>
          ) : (
            <Text style={estilos.ayuda}>Todavía no hay video. MP4 de hasta 30 MB.</Text>
          )}
          <Boton
            texto={videoUrl ? "Cambiar video" : "Agregar video"}
            icono="videocam-outline"
            variante="secundario"
            onPress={elegirVideo}
            cargando={subiendo === "video"}
            deshabilitado={subiendo !== null}
          />
        </Seccion>

        <Boton texto="Guardar cambios" icono="checkmark" onPress={guardar} cargando={guardando} deshabilitado={subiendo !== null} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Seccion({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <View style={estilos.seccion}>
      <Text style={estilos.tituloSeccion}>{titulo}</Text>
      {children}
    </View>
  );
}

function Campo({
  etiqueta,
  valor,
  alCambiar,
  multilinea,
  teclado,
  ayuda,
}: {
  etiqueta: string;
  valor: string;
  alCambiar: (v: string) => void;
  multilinea?: boolean;
  teclado?: "default" | "phone-pad";
  ayuda?: string;
}) {
  return (
    <View style={{ gap: 4 }}>
      <Text style={estilos.etiqueta}>{etiqueta}</Text>
      <TextInput
        value={valor}
        onChangeText={alCambiar}
        style={[estilos.input, multilinea && { minHeight: 90, textAlignVertical: "top" }]}
        multiline={multilinea}
        keyboardType={teclado}
        accessibilityLabel={etiqueta}
      />
      {ayuda && <Text style={estilos.ayuda}>{ayuda}</Text>}
    </View>
  );
}

function BotonIcono({
  icono,
  onPress,
  etiqueta,
}: {
  icono: "chevron-back" | "chevron-forward" | "close";
  onPress: () => void;
  etiqueta: string;
}) {
  return (
    <Pressable onPress={onPress} style={estilos.botonIcono} hitSlop={4} accessibilityLabel={etiqueta}>
      <Ionicons name={icono} size={16} color="#fff" />
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  pantalla: { padding: 16, gap: 16, paddingBottom: 40, backgroundColor: colores.fondo },
  seccion: {
    backgroundColor: colores.superficie,
    borderRadius: radio.m,
    borderWidth: 1,
    borderColor: colores.borde,
    padding: 16,
    gap: 12,
  },
  tituloSeccion: { fontFamily: fuentes.titulo, fontSize: 16, color: colores.texto },
  etiqueta: { fontFamily: fuentes.cuerpoFuerte, fontSize: 13, color: colores.texto },
  input: {
    borderWidth: 1,
    borderColor: colores.borde,
    borderRadius: radio.s,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: fuentes.cuerpo,
    fontSize: 15,
    color: colores.texto,
    backgroundColor: colores.fondo,
  },
  ayuda: { fontFamily: fuentes.cuerpo, fontSize: 12, color: colores.textoSuave },
  enlace: { fontFamily: fuentes.cuerpoFuerte, fontSize: 13, color: colores.acentoOscuro },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  dia: { gap: 6, paddingVertical: 6, borderTopWidth: 1, borderTopColor: colores.borde },
  filaDia: { flexDirection: "row", alignItems: "center", gap: 8 },
  nombreDia: { flex: 1, fontFamily: fuentes.cuerpoFuerte, fontSize: 14, color: colores.texto },
  cerrado: { fontFamily: fuentes.cuerpo, fontSize: 13, color: colores.textoSuave },
  turno: { flexDirection: "row", alignItems: "center", gap: 8 },
  hora: {
    width: 76,
    textAlign: "center",
    borderWidth: 1,
    borderColor: colores.borde,
    borderRadius: radio.s,
    paddingVertical: 8,
    fontFamily: fuentes.cuerpoFuerte,
    fontSize: 15,
    color: colores.texto,
    backgroundColor: colores.fondo,
  },
  fotos: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  foto: { width: "48%", aspectRatio: 16 / 9, borderRadius: radio.s, overflow: "hidden", backgroundColor: colores.borde },
  accionesFoto: {
    position: "absolute",
    bottom: 4,
    left: 4,
    right: 4,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  botonIcono: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  filaVideo: { flexDirection: "row", alignItems: "center", gap: 8 },
});
