import { Alert, Linking } from "react-native";
import type { Coordenadas } from "../tipos";

export const abrirUrl = (url: string) =>
  Linking.openURL(url).catch(() => Alert.alert("No pudimos abrirlo", "Probá de nuevo."));

export const abrirComoLlegar = (destino: Coordenadas, modo: "walking" | "driving" = "walking") =>
  abrirUrl(
    `https://www.google.com/maps/dir/?api=1&destination=${destino.latitud},${destino.longitud}&travelmode=${modo}`,
  );

export const llamar = (telefono: string) => abrirUrl(`tel:${telefono.replace(/[^\d+]/g, "")}`);

export const abrirWhatsApp = (numero: string) => abrirUrl(`https://wa.me/${numero.replace(/\D/g, "")}`);

export const abrirInstagram = (usuario: string) =>
  abrirUrl(`https://instagram.com/${usuario.replace("@", "")}`);
