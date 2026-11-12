import Ionicons from "@react-native-vector-icons/ionicons";
import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { subirArchivo } from "../../servicios/miComercio";
import { colores, fuentes } from "../../tema";
import { Boton } from "../ui/Boton";
import { TarjetaVidrio } from "../ui/TarjetaVidrio";

type Asset = ImagePicker.ImagePickerAsset;

interface Props {
  imagenes: string[];
  videoUrl: string | null;
  onImagenes: (urls: string[]) => void;
  onVideo: (url: string | null) => void;
  onError: (mensaje: string | null) => void;
  /** Avisa si hay una subida en curso (para apagar "Guardar"). */
  onSubiendo: (subiendo: boolean) => void;
}

// Límites de la API: fotos 5 MB, videos 30 MB (y el PRD pide 30 segundos).
const MAX_FOTOS = 8;
const MB = 1024 * 1024;
const MAX_FOTO = 5 * MB;
const MAX_VIDEO = 30 * MB;
const MAX_SEGUNDOS = 30;

const https = (url: string) =>
  url.replace(/^http:\/\/(?!localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/, "https://");

export function EditorMedios({ imagenes, videoUrl, onImagenes, onVideo, onError, onSubiendo }: Props) {
  const [subiendo, setSubiendo] = useState<"foto" | "video" | null>(null);

  async function conSubida(tipo: "foto" | "video", trabajo: () => Promise<void>) {
    setSubiendo(tipo);
    onSubiendo(true);
    onError(null);
    try {
      await trabajo();
    } catch (e) {
      onError(e instanceof Error ? e.message : "No pudimos subir el archivo. Probá de nuevo.");
    } finally {
      setSubiendo(null);
      onSubiendo(false);
    }
  }

  async function subirFotos(assets: Asset[]) {
    const nuevas: string[] = [];
    try {
      for (const a of assets) {
        if (a.fileSize && a.fileSize > MAX_FOTO) {
          throw new Error("Una de las fotos pesa más de 5 MB. Probá con otra.");
        }
        nuevas.push(
          await subirArchivo({ uri: a.uri, nombre: a.fileName ?? "foto.jpg", tipo: a.mimeType ?? "image/jpeg" }),
        );
      }
    } finally {
      // Si una falla, las que ya subieron no se pierden.
      if (nuevas.length > 0) onImagenes([...imagenes, ...nuevas]);
    }
  }

  async function subirVideo(a: Asset) {
    if (a.duration && a.duration > (MAX_SEGUNDOS + 1) * 1000) {
      throw new Error("El video dura más de 30 segundos. Elegí uno más corto.");
    }
    if (a.fileSize && a.fileSize > MAX_VIDEO) {
      throw new Error(
        `El video pesa ${Math.round(a.fileSize / MB)} MB y el máximo es 30 MB. Probá con uno más corto o de menor calidad.`,
      );
    }
    onVideo(await subirArchivo({ uri: a.uri, nombre: a.fileName ?? "video.mp4", tipo: a.mimeType ?? "video/mp4" }));
  }

  async function sacarFoto() {
    const permiso = await ImagePicker.requestCameraPermissionsAsync();
    if (!permiso.granted) {
      onError("Necesitamos permiso de la cámara para sacar la foto. Podés darlo en los ajustes del teléfono.");
      return;
    }
    const r = await ImagePicker.launchCameraAsync({ mediaTypes: ["images"], quality: 0.7 });
    if (!r.canceled) await conSubida("foto", () => subirFotos(r.assets));
  }

  async function elegirFotos() {
    const r = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.7,
      allowsMultipleSelection: true,
      selectionLimit: MAX_FOTOS - imagenes.length,
    });
    if (!r.canceled) await conSubida("foto", () => subirFotos(r.assets));
  }

  async function grabarVideo() {
    const permiso = await ImagePicker.requestCameraPermissionsAsync();
    if (!permiso.granted) {
      onError("Necesitamos permiso de la cámara para grabar el video. Podés darlo en los ajustes del teléfono.");
      return;
    }
    const r = await ImagePicker.launchCameraAsync({ mediaTypes: ["videos"], videoMaxDuration: MAX_SEGUNDOS });
    if (!r.canceled) await conSubida("video", () => subirVideo(r.assets[0]));
  }

  async function elegirVideo() {
    const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["videos"], videoMaxDuration: MAX_SEGUNDOS });
    if (!r.canceled) await conSubida("video", () => subirVideo(r.assets[0]));
  }

  const menu = (titulo: string, camara: () => void, galeria: () => void) =>
    Alert.alert(titulo, "¿De dónde lo querés tomar?", [
      { text: "Cámara", onPress: camara },
      { text: "Galería", onPress: galeria },
      { text: "Cancelar", style: "cancel" },
    ]);

  const ocupado = subiendo !== null;

  return (
    <View style={{ gap: 12 }}>
      {/* Fotos */}
      <TarjetaVidrio style={estilos.tarjeta}>
        <Text style={estilos.titulo}>Fotos del local</Text>
        <Text style={estilos.ayuda}>
          {imagenes.length} de {MAX_FOTOS}. La primera es la que se ve al abrir la ficha si no hay video.
        </Text>

        {imagenes.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
            {imagenes.map((url) => (
              <View key={url}>
                <Image source={{ uri: https(url) }} style={estilos.miniatura} />
                <Pressable
                  onPress={() => onImagenes(imagenes.filter((u) => u !== url))}
                  hitSlop={8}
                  accessibilityLabel="Quitar foto"
                  style={estilos.quitar}
                  disabled={ocupado}
                >
                  <Ionicons name="close" size={16} color={colores.blanco} />
                </Pressable>
              </View>
            ))}
          </ScrollView>
        )}

        {subiendo === "foto" && (
          <View style={estilos.subiendo}>
            <ActivityIndicator color={colores.indigo} />
            <Text style={estilos.ayuda}>Subiendo foto…</Text>
          </View>
        )}

        <Boton
          texto="Agregar foto"
          icono="camera-outline"
          variante="blanco"
          compacto
          deshabilitado={ocupado || imagenes.length >= MAX_FOTOS}
          onPress={() => menu("Agregar foto", sacarFoto, elegirFotos)}
        />
      </TarjetaVidrio>

      {/* Video */}
      <TarjetaVidrio style={estilos.tarjeta}>
        <Text style={estilos.titulo}>Video de presentación</Text>
        <Text style={estilos.ayuda}>De hasta 30 segundos, formato MP4, que pese menos de 30 MB.</Text>

        {videoUrl && subiendo !== "video" && (
          <View style={estilos.videoCargado}>
            <Ionicons name="videocam" size={22} color={colores.pizarra} />
            <Text style={estilos.textoVideo}>Video cargado</Text>
          </View>
        )}

        {subiendo === "video" && (
          <View style={estilos.subiendo}>
            <ActivityIndicator color={colores.indigo} />
            <Text style={estilos.ayuda}>Subiendo video, puede tardar un poco…</Text>
          </View>
        )}

        <View style={estilos.acciones}>
          <Boton
            texto={videoUrl ? "Reemplazar video" : "Agregar video"}
            icono="videocam-outline"
            variante="blanco"
            compacto
            style={{ flex: 1 }}
            deshabilitado={ocupado}
            onPress={() => menu("Agregar video", grabarVideo, elegirVideo)}
          />
          {videoUrl && (
            <Boton
              texto="Quitar"
              variante="peligro"
              compacto
              style={{ flex: 1 }}
              deshabilitado={ocupado}
              onPress={() => onVideo(null)}
            />
          )}
        </View>
      </TarjetaVidrio>
    </View>
  );
}

const estilos = StyleSheet.create({
  tarjeta: { gap: 10, padding: 16 },
  titulo: { fontFamily: fuentes.subtitulo, fontSize: 17, color: colores.pizarra },
  ayuda: { fontFamily: fuentes.texto, fontSize: 13, lineHeight: 18, color: colores.gris },
  miniatura: { width: 104, height: 104, borderRadius: 20, backgroundColor: colores.niebla },
  quitar: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colores.velo,
    alignItems: "center",
    justifyContent: "center",
  },
  subiendo: { flexDirection: "row", alignItems: "center", gap: 10 },
  videoCargado: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colores.salvia,
    borderRadius: 18,
    padding: 12,
  },
  textoVideo: { fontFamily: fuentes.textoNegrita, fontSize: 14, color: colores.pizarra },
  acciones: { flexDirection: "row", gap: 10 },
});