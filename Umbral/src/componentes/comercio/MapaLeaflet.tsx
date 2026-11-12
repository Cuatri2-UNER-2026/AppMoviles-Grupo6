import { useCallback, useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { useRef } from "react";
import { WebView, type WebViewMessageEvent } from "react-native-webview";
import { colores } from "../../tema";
import type { Coordenadas } from "../../tipos";
import { EstadoCarga, EstadoError } from "../estados/Estados";

export interface PinMapa {
    id: string;
    lat: number;
    lng: number;
    color: string;
}

export interface FocoMapa {
    latitud: number;
    longitud: number;
    zoom: number;
}

interface Props {
    pines: PinMapa[];
    activoId: string | null;
    ubicacion: Coordenadas | null;
    /** Cada vez que llega un objeto nuevo, el mapa se mueve ahí. */
    foco: FocoMapa | null;
    onElegir: (id: string) => void;
    onTocarMapa: () => void;
}

// Centro de Concepción del Uruguay.
const CENTRO = { lat: -32.4825, lng: -58.2372, zoom: 14 };

const HTML = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
<style>
  html, body, #mapa { height: 100%; margin: 0; background: ${colores.niebla}; }
  .pin { line-height: 0; filter: drop-shadow(0 2px 3px rgba(0,0,0,.35)); }
  .pin.activo { filter: drop-shadow(0 3px 5px rgba(0,0,0,.5)); }
  .yo { width: 16px; height: 16px; border-radius: 50%; background: #4285F4; border: 3px solid #fff; box-sizing: content-box; box-shadow: 0 0 0 6px rgba(66,133,244,.25); }
  .leaflet-control-attribution { font-size: 10px; }
</style>
</head>
<body>
<div id="mapa"></div>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script>
(function () {
  function enviar(o) { window.ReactNativeWebView.postMessage(JSON.stringify(o)); }
  if (typeof L === 'undefined') { enviar({ tipo: 'error' }); return; }

  var mapa = L.map('mapa', { zoomControl: false }).setView([${CENTRO.lat}, ${CENTRO.lng}], ${CENTRO.zoom});
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
  }).addTo(mapa);

  var capa = L.layerGroup().addTo(mapa);
  var pines = {};
  var activoId = null;
  var yo = null;

  function icono(color, activo) {
    var w = activo ? 44 : 34;
    var h = Math.round(w * 42 / 34);
    var svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 34 42" width="' + w + '" height="' + h + '">' +
      '<path d="M17 1C8.7 1 2 7.6 2 15.8c0 10.6 12.2 24 14.2 25.9.5.5 1.2.5 1.6 0C19.8 39.8 32 26.4 32 15.8 32 7.6 25.3 1 17 1z" fill="' + color + '" stroke="#fff" stroke-width="2.5"/>' +
      '<circle cx="17" cy="15.8" r="5.5" fill="#fff"/></svg>';
    return L.divIcon({
      className: '',
      html: '<div class="pin' + (activo ? ' activo' : '') + '">' + svg + '</div>',
      iconSize: [w, h],
      iconAnchor: [w / 2, h]
    });
  }

  window.setPines = function (lista) {
    capa.clearLayers();
    pines = {};
    lista.forEach(function (p) {
      var m = L.marker([p.lat, p.lng], { icon: icono(p.color, p.id === activoId), zIndexOffset: p.id === activoId ? 1000 : 0 });
      m.on('click', function () { enviar({ tipo: 'pin', id: p.id }); });
      m.addTo(capa);
      pines[p.id] = { marker: m, color: p.color };
    });
  };

  window.setActivo = function (id) {
    if (activoId && pines[activoId]) {
      pines[activoId].marker.setIcon(icono(pines[activoId].color, false));
      pines[activoId].marker.setZIndexOffset(0);
    }
    activoId = id;
    if (id && pines[id]) {
      pines[id].marker.setIcon(icono(pines[id].color, true));
      pines[id].marker.setZIndexOffset(1000);
    }
  };

  window.setYo = function (lat, lng) {
    if (yo) { mapa.removeLayer(yo); yo = null; }
    if (lat === null || lng === null) return;
    yo = L.marker([lat, lng], {
      icon: L.divIcon({ className: '', html: '<div class="yo"></div>', iconSize: [22, 22], iconAnchor: [11, 11] }),
      interactive: false,
      zIndexOffset: 2000
    }).addTo(mapa);
  };

  window.irA = function (lat, lng, zoom) {
    mapa.setView([lat, lng], zoom, { animate: true });
  };

  mapa.on('click', function () { enviar({ tipo: 'mapa' }); });
  enviar({ tipo: 'listo' });
})();
</script>
</body>
</html>`;

const FUENTE = { html: HTML, baseUrl: "https://umbral.app" };

/** Mapa de OpenStreetMap con Leaflet dentro de un WebView. Los pines y la ubicación se envían por JS. */
export function MapaLeaflet({
    pines,
    activoId,
    ubicacion,
    foco,
    onElegir,
    onTocarMapa,
}: Props) {
    const ref = useRef<WebView>(null);
    const [listo, setListo] = useState(false);
    const [falla, setFalla] = useState(false);
    const [intento, setIntento] = useState(0);

    const ejecutar = useCallback(
        (js: string) => ref.current?.injectJavaScript(`${js}; true;`),
        [],
    );

    // Si en 15 segundos no cargó (sin internet, por ejemplo), mostramos el error.
    useEffect(() => {
        if (listo) return;
        const t = setTimeout(() => setFalla(true), 15000);
        return () => clearTimeout(t);
    }, [listo, intento]);

    useEffect(() => {
        if (listo) ejecutar(`window.setPines(${JSON.stringify(pines)})`);
    }, [listo, pines, ejecutar]);

    useEffect(() => {
        if (listo) ejecutar(`window.setActivo(${JSON.stringify(activoId)})`);
    }, [listo, activoId, pines, ejecutar]);

    useEffect(() => {
        if (!listo) return;
        ejecutar(
            ubicacion
                ? `window.setYo(${ubicacion.latitud}, ${ubicacion.longitud})`
                : "window.setYo(null, null)",
        );
    }, [listo, ubicacion, ejecutar]);

    useEffect(() => {
        if (listo && foco)
            ejecutar(
                `window.irA(${foco.latitud}, ${foco.longitud}, ${foco.zoom})`,
            );
    }, [listo, foco, ejecutar]);

    function alMensaje(e: WebViewMessageEvent) {
        try {
            const m = JSON.parse(e.nativeEvent.data);
            if (m.tipo === "listo") {
                setListo(true);
                setFalla(false);
            } else if (m.tipo === "error") setFalla(true);
            else if (m.tipo === "pin") onElegir(m.id);
            else if (m.tipo === "mapa") onTocarMapa();
        } catch {
            // mensaje que no es nuestro: se ignora
        }
    }

    function reintentar() {
        setListo(false);
        setFalla(false);
        setIntento((i) => i + 1);
    }

    return (
        <View style={estilos.contenedor}>
            <WebView
                key={intento}
                ref={ref}
                source={FUENTE}
                originWhitelist={["*"]}
                javaScriptEnabled
                domStorageEnabled
                setSupportMultipleWindows={false}
                overScrollMode="never"
                onMessage={alMensaje}
                onError={() => setFalla(true)}
                style={estilos.web}
            />
            {!listo && !falla && (
                <View style={estilos.capa} pointerEvents="none">
                    <EstadoCarga texto="Cargando mapa…" />
                </View>
            )}
            {falla && !listo && (
                <View
                    style={[estilos.capa, { backgroundColor: colores.niebla }]}>
                    <EstadoError
                        titulo="No pudimos cargar el mapa"
                        texto="Revisá tu conexión e intentá de nuevo."
                        onReintentar={reintentar}
                    />
                </View>
            )}
        </View>
    );
}

const estilos = StyleSheet.create({
    contenedor: { flex: 1, backgroundColor: colores.niebla },
    web: { flex: 1, backgroundColor: "transparent" },
    capa: {
        ...StyleSheet.absoluteFill,
        alignItems: "center",
        justifyContent: "center",
    },
});
