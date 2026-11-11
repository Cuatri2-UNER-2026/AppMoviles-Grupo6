import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import QRCode from "react-native-qrcode-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Aviso,
  Boton,
  BotonRedondo,
  EstadoCarga,
  EstadoError,
  FondoDegradado,
  Insignia,
  SeccionTitulo,
  TarjetaVidrio,
} from "../../src/componentes";
import { useCarga } from "../../src/hooks/useCarga";
import { useSesion } from "../../src/hooks/useSesion";
import { promocionesService } from "../../src/servicios/promociones";
import { colores, fuentes } from "../../src/tema";
import type { UsoDePromocion } from "../../src/tipos";
import { partirTitulo } from "../../src/utils/promos";

const FONDO = [colores.salvia, colores.niebla, colores.niebla, colores.lila] as const;

export default function DetallePromoScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const sesion = useSesion();

  const { datos: promo, cargando, error, reintentar } = useCarga(
    () => promocionesService.obtenerPromocionPorId(id),
    [id],
  );

  const [uso, setUso] = useState<UsoDePromocion | null>(null);
  const [cargandoUso, setCargandoUso] = useState(false);
  const [generando, setGenerando] = useState(false);
  const [errorUso, setErrorUso] = useState<string | null>(null);

  const esVecino = sesion.estado === "activa" && sesion.usuario.rol === "vecino";

  // Si ya pidió el código antes, lo recuperamos (la API devuelve el mismo hasta que se use).
  useEffect(() => {
    if (!promo?.soloApp || !esVecino) return;
    let activo = true;
    setCargandoUso(true);
    promocionesService
      .obtenerMisUsos()
      .then((usos) => activo && setUso(usos.find((u) => u.promocionId === promo.id) ?? null))
      .catch((e) => activo && setErrorUso(e instanceof Error ? e.message : "No pudimos cargar tu código."))
      .finally(() => activo && setCargandoUso(false));
    return () => {
      activo = false;
    };
  }, [promo?.id, promo?.soloApp, esVecino]);

  async function generar() {
    if (!promo) return;
    setErrorUso(null);
    setGenerando(true);
    try {
      setUso(await promocionesService.generarCodigo(promo.id));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    } catch (e) {
      setErrorUso(e instanceof Error ? e.message : "No pudimos generar tu código.");
    } finally {
      setGenerando(false);
    }
  }

  if (cargando || error || !promo) {
    return (
      <FondoDegradado colores={FONDO}>
        <View style={{ paddingTop: insets.top + 12, paddingHorizontal: 20, alignItems: "flex-start" }}>
          <BotonRedondo />
        </View>
        {cargando ? (
          <EstadoCarga texto="Cargando promoción…" />
        ) : (
          <EstadoError titulo="No pudimos abrir la promoción" texto={error} onReintentar={reintentar} />
        )}
      </FondoDegradado>
    );
  }

  const { grande, resto } = partirTitulo(promo);
  const hastaMs = Date.parse(promo.hasta);
  const hasta = Number.isNaN(hastaMs)
    ? "fecha no disponible"
    : new Date(hastaMs).toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" });

  return (
    <FondoDegradado colores={FONDO}>
      <ScrollView
        contentContainerStyle={[estilos.contenido, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ alignSelf: "flex-start" }}>
          <BotonRedondo />
        </View>

        <LinearGradient
          colors={[colores.duraznoClaro, colores.durazno]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0.6, y: 1 }}
          style={estilos.cabecera}
        >
          {promo.soloApp && <Insignia />}
          <Text style={estilos.grande} numberOfLines={1} adjustsFontSizeToFit>
            {grande}
          </Text>
          <Text style={estilos.titulo}>{resto}</Text>
        </LinearGradient>

        <TarjetaVidrio style={estilos.tarjeta}>
          <SeccionTitulo texto="Condiciones" />
          <Text style={estilos.parrafo}>{promo.detalle || "No hay condiciones adicionales."}</Text>
          <Text style={estilos.fecha}>Válida hasta el {hasta}</Text>
        </TarjetaVidrio>

        {promo.soloApp && (
          <TarjetaVidrio style={estilos.tarjeta}>
            <SeccionTitulo texto="Tu código" ayuda="Mostralo en el local. Se usa una sola vez." />

            {sesion.estado === "cargando" || cargandoUso ? (
              <EstadoCarga texto="" style={estilos.estado} />
            ) : sesion.estado === "sin-sesion" ? (
              <>
                <Aviso texto="Necesitás una cuenta para usar esta promo." />
                <Boton texto="Ingresar o crear cuenta" onPress={() => router.push("/login")} />
              </>
            ) : sesion.estado === "bloqueada" ? (
              <>
                <Aviso texto="Desbloqueá tu cuenta para pedir tu código." />
                <Boton texto="Desbloquear mi cuenta" onPress={() => router.push("/yo")} />
              </>
            ) : !esVecino ? (
              <Aviso texto="Las cuentas de comercio no generan códigos." />
            ) : uso?.validadoEn ? (
              <Aviso icono="checkmark-circle-outline" texto="Este código ya se usó." />
            ) : uso ? (
              <View style={estilos.qr}>
                <View style={estilos.qrMarco}>
                  <QRCode value={uso.codigo} size={200} />
                </View>
                <Text style={estilos.codigo}>{uso.codigo}</Text>
              </View>
            ) : (
              <Boton texto="Obtener mi código" icono="qr-code-outline" onPress={generar} cargando={generando} />
            )}

            {errorUso && <Aviso icono="alert-circle-outline" texto={errorUso} />}
          </TarjetaVidrio>
        )}
      </ScrollView>
    </FondoDegradado>
  );
}

const estilos = StyleSheet.create({
  contenido: { paddingHorizontal: 20, gap: 16 },
  cabecera: {
    padding: 22,
    gap: 2,
    borderTopLeftRadius: 40,
    borderTopRightRadius: 64,
    borderBottomRightRadius: 72,
    borderBottomLeftRadius: 36,
  },
  grande: { fontFamily: fuentes.titulo, fontSize: 72, lineHeight: 80, color: colores.pizarra, letterSpacing: -2 },
  titulo: { fontFamily: fuentes.titulo, fontSize: 22, color: colores.pizarra },
  tarjeta: { gap: 12, padding: 18 },
  parrafo: { fontFamily: fuentes.texto, fontSize: 15, lineHeight: 22, color: colores.textoSuave },
  fecha: { fontFamily: fuentes.textoMedio, fontSize: 13, color: colores.gris },
  estado: { flex: 0, paddingVertical: 24 },
  qr: { alignItems: "center", gap: 12 },
  qrMarco: { padding: 14, backgroundColor: colores.blanco, borderRadius: 20 },
  codigo: { fontFamily: fuentes.textoNegrita, fontSize: 16, letterSpacing: 1, color: colores.pizarra },
});