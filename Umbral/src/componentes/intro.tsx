import Ionicons from "@react-native-vector-icons/ionicons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import Storage from "expo-sqlite/kv-store";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Animated, Easing, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View, type NativeScrollEvent, type NativeSyntheticEvent } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Circle, Defs, Ellipse, LinearGradient as SvgDegradado, Path, RadialGradient, Rect, Stop } from "react-native-svg";
import { colores, fuentes } from "../tema";
import {Boton} from "./ui/Boton";

const MOSTRAR_SIEMPRE = false;
const CLAVE_VISTO = "onboarding_visto";

export type Destino = "login" | "inicio";

const LOGO_W = 170;
const ESCALA = LOGO_W / 514;
const LOGO_H = 592 * ESCALA;
const VISTA = "255 216 514 592";

/*  Logo animado  */

function Capa({ children, estilo }: { children: ReactNode; estilo: object }) {
  return (
    <Animated.View style={[StyleSheet.absoluteFill, estilo]}>
      <Svg width={LOGO_W} height={LOGO_H} viewBox={VISTA}>
        {children}
      </Svg>
    </Animated.View>
  );
}

function LogoAnimado({ detener, alTerminar }: { detener: boolean; alTerminar: () => void }) {
  const v = useRef({
    u: new Animated.Value(0),
    bola: new Animated.Value(0),
    sombra: new Animated.Value(0),
    nombre: new Animated.Value(0),
    frase: new Animated.Value(0),
  }).current;

  const animacion = useRef<Animated.CompositeAnimation | null>(null);
  const terminado = useRef(false);
  const finRef = useRef(alTerminar);
  finRef.current = alTerminar;

  const fin = () => {
    if (terminado.current) return;
    terminado.current = true;
    finRef.current();
  };

  useEffect(() => {
    // Vibración suave justo cuando la bolita toca el fondo de la "U".
    const toque = {
      start: (cb?: (r: { finished: boolean }) => void) => {
        setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {}), 330);
        cb?.({ finished: true });
      },
      stop: () => {},
      reset: () => {},
    } as Animated.CompositeAnimation;

    animacion.current = Animated.sequence([
      Animated.spring(v.u, { toValue: 1, friction: 6, tension: 60, useNativeDriver: true }),
      Animated.delay(120),
      Animated.parallel([
        toque,
        Animated.timing(v.bola, {
          toValue: 1,
          duration: 950,
          easing: Easing.bounce,
          useNativeDriver: true,
        }),
        Animated.timing(v.sombra, {
          toValue: 1,
          duration: 950,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(v.nombre, {
        toValue: 1,
        duration: 500,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(v.frase, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.delay(900),
    ]);
    animacion.current.start(({ finished }) => finished && fin());
    return () => animacion.current?.stop();
  }, []);

  // Tocar la pantalla saltea la animación.
  useEffect(() => {
    if (!detener) return;
    animacion.current?.stop();
    Object.values(v).forEach((valor) => valor.setValue(1));
    fin();
  }, [detener]);

  const subir = (valor: Animated.Value, px: number) =>
    valor.interpolate({ inputRange: [0, 1], outputRange: [px, 0] });

  return (
    <View style={estilos.centroLogo} accessible accessibilityLabel="Umbral">
      <View style={{ width: LOGO_W, height: LOGO_H }}>
        {/* La "U" */}
        <Capa
          estilo={{
            opacity: v.u.interpolate({ inputRange: [0, 0.5], outputRange: [0, 1], extrapolate: "clamp" }),
            transform: [
              { scale: v.u.interpolate({ inputRange: [0, 1], outputRange: [0.55, 1] }) },
              { translateY: subir(v.u, 24) },
            ],
          }}
        >
          <Defs>
            <SvgDegradado id="u" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor="#8F9BEA" />
              <Stop offset="1" stopColor="#6672CC" />
            </SvgDegradado>
          </Defs>
          <Path
            d="M255 291 A75 75 0 0 1 405 291 L405 551 A107 107 0 0 0 619 551 L619 291 A75 75 0 0 1 769 291 L769 551 A257 257 0 0 1 255 551 Z"
            fill="url(#u)"
          />
          <Rect x={289} y={294} width={14} height={259} rx={7} fill="#FFFFFF" opacity={0.28} />
        </Capa>

        {/* Sombra de la bolita */}
        <Capa
          estilo={{
            opacity: v.sombra,
            transform: [{ scaleX: v.sombra.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }) }],
          }}
        >
          <Ellipse cx={512} cy={641} rx={52} ry={11} fill="#5E7A70" opacity={0.25} />
        </Capa>

        {/* La bolita que cae */}
        <Capa
          estilo={{
            opacity: v.bola.interpolate({ inputRange: [0, 0.04], outputRange: [0, 1], extrapolate: "clamp" }),
            transform: [{ translateY: subir(v.bola, -400 * ESCALA) }],
          }}
        >
          <Defs>
            <RadialGradient id="b" cx="35%" cy="30%" r="75%">
              <Stop offset="0" stopColor="#F9E0D2" />
              <Stop offset="1" stopColor="#F4A987" />
            </RadialGradient>
          </Defs>
          <Circle cx={512} cy={521} r={62} fill="url(#b)" />
          <Circle cx={512} cy={521} r={21} fill="#FFFFFF" />
        </Capa>
      </View>

      <Animated.Text
        style={[
          estilos.nombre,
          { opacity: v.nombre, transform: [{ translateY: subir(v.nombre, 14) }] },
        ]}
      >
        UMBRAL
      </Animated.Text>
      <Animated.Text
        style={[estilos.frase, { opacity: v.frase, transform: [{ translateY: subir(v.frase, 8) }] }]}
      >
        Los comercios de tu ciudad, a un paso.
      </Animated.Text>
    </View>
  );
}

/*  Guía  */

type Diapositiva = {
  icono: React.ComponentProps<typeof Ionicons>["name"];
  fondo: [string, string];
  titulo: string;
  texto: string;
};

const DIAPOSITIVAS: Diapositiva[] = [
  {
    icono: "storefront-outline",
    fondo: [colores.salvia, colores.celeste],
    titulo: "Todo el comercio local, en un solo lugar",
    texto:
      "Más de 600 comercios de Concepción del Uruguay. Buscá por nombre, por rubro o por lo que necesitás.",
  },
  {
    icono: "location-outline",
    fondo: [colores.celeste, colores.lila],
    titulo: "Lo que está cerca y abierto ahora",
    texto: "Mirá en el mapa qué tenés a pocas cuadras, con horarios al día y cómo llegar.",
  },
  {
    icono: "pricetag-outline",
    fondo: [colores.durazno, colores.lila],
    titulo: "Promos, favoritos y tu opinión",
    texto:
      "Enterate de las promociones vigentes, mostrá tu código en el mostrador y dejá reseñas para ayudar a otros vecinos.",
  },
];

const FORMAS = [
  { borderTopLeftRadius: 90, borderTopRightRadius: 60, borderBottomRightRadius: 100, borderBottomLeftRadius: 56 },
  { borderTopLeftRadius: 60, borderTopRightRadius: 100, borderBottomRightRadius: 56, borderBottomLeftRadius: 90 },
  { borderTopLeftRadius: 100, borderTopRightRadius: 56, borderBottomRightRadius: 90, borderBottomLeftRadius: 60 },
] as const;

function Guia({ alElegir }: { alElegir: (d: Destino) => void }) {
    const insets = useSafeAreaInsets();
    const { width } = useWindowDimensions();
    const pager = useRef<ScrollView>(null);
    const aparecer = useRef(new Animated.Value(0)).current;
    const [pagina, setPagina] = useState(0);
    const ultima = pagina === DIAPOSITIVAS.length - 1;

    useEffect(() => {
        Animated.timing(aparecer, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    }, [aparecer]);

    const irA = (i: number) => pager.current?.scrollTo({ x: width * i, animated: true });
    const alTerminarDeDeslizar = (e: NativeSyntheticEvent<NativeScrollEvent>) =>
        setPagina(Math.round(e.nativeEvent.contentOffset.x / width));

    return (
        <Animated.View style={{ flex: 1, opacity: aparecer, paddingTop: insets.top + 8, paddingBottom: insets.bottom + 20 }}>
            <View style={estilos.cabecera}>
                {!ultima && (
                <Pressable onPress={() => irA(DIAPOSITIVAS.length - 1)} hitSlop={12}>
                    <Text style={estilos.saltar}>Saltar</Text>
                </Pressable>
                )}
            </View>

            <ScrollView
                ref={pager}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={alTerminarDeDeslizar}
                style={{ flex: 1 }}
            >
                {DIAPOSITIVAS.map((d, i) => (
                <View key={d.titulo} style={[estilos.pagina, { width }]}>
                    <LinearGradient
                    colors={d.fondo}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[estilos.ilustracion, FORMAS[i % FORMAS.length]]}
                    >
                    <Ionicons name={d.icono} size={88} color={colores.pizarra} />
                    </LinearGradient>
                    <Text style={estilos.titulo}>{d.titulo}</Text>
                    <Text style={estilos.texto}>{d.texto}</Text>
                </View>
                ))}
            </ScrollView>

            <View style={estilos.puntos}>
                {DIAPOSITIVAS.map((d, i) => (
                <View key={d.titulo} style={[estilos.punto, i === pagina && estilos.puntoActivo]} />
                ))}
            </View>

            <View style={estilos.botones}>
                {ultima ? (
                <>
                    <Boton texto="Ingresar o crear cuenta" onPress={() => alElegir("login")} />
                    <Boton texto="Explorar sin cuenta" variante="texto" onPress={() => alElegir("inicio")} />
                </>
                ) : (
                <Boton texto="Siguiente" onPress={() => irA(pagina + 1)} />
                )}
            </View>
        </Animated.View>
    );
}

export function Introduccion({
  alNavegar,
  alCerrar,
}: {
  /** Cuando la persona elige ir al login. */
  alNavegar: (destino: Destino) => void;
  /** Cuando la intro termino de desvanecerse. */
  alCerrar: () => void;
}) {
  const primeraVez = useRef(MOSTRAR_SIEMPRE || Storage.getItemSync(CLAVE_VISTO) !== "1").current;
  const [fase, setFase] = useState<"logo" | "guia">("logo");
  const [saltado, setSaltado] = useState(false);
  const salida = useRef(new Animated.Value(1)).current;
  const logoOpacidad = useRef(new Animated.Value(1)).current;

  const cerrar = () =>
    Animated.timing(salida, { toValue: 0, duration: 350, useNativeDriver: true }).start(() => alCerrar());

  const elegir = (destino: Destino) => {
    Storage.setItemAsync(CLAVE_VISTO, "1").catch(() => {});
    alNavegar(destino);
    cerrar();
  };

  const terminoLogo = () => {
    if (!primeraVez) {
      cerrar();
      return;
    }
    Animated.timing(logoOpacidad, { toValue: 0, duration: 300, useNativeDriver: true }).start(() =>
      setFase("guia"),
    );
  };

  return (
    <Animated.View style={[StyleSheet.absoluteFill, estilos.superposicion, { opacity: salida }]}>
      <LinearGradient colors={["#FFFFFF", "#F4F2FB", "#EAF2EE"]} style={StyleSheet.absoluteFill} />
      {fase === "logo" ? (
        <Animated.View style={{ flex: 1, opacity: logoOpacidad }}>
          <Pressable style={{ flex: 1 }} onPress={() => setSaltado(true)} accessibilityLabel="Saltar animación">
            <LogoAnimado detener={saltado} alTerminar={terminoLogo} />
          </Pressable>
        </Animated.View>
      ) : (
        <Guia alElegir={elegir} />
      )}
    </Animated.View>
  );
}

const estilos = StyleSheet.create({
  superposicion: { zIndex: 100, elevation: 100 },

  // logo
  centroLogo: { flex: 1, alignItems: "center", justifyContent: "center" },
  nombre: {
    marginTop: 30,
    paddingLeft: 10, // compensa el espaciado de la última letra para que quede centrado
    fontFamily: fuentes.titulo,
    fontSize: 34,
    letterSpacing: 10,
    color: colores.pizarra,
  },
  frase: { marginTop: 10, fontFamily: fuentes.textoMedio, fontSize: 15, color: colores.gris },

  // guía
  cabecera: { height: 36, alignItems: "flex-end", justifyContent: "center", paddingHorizontal: 24 },
  saltar: { fontFamily: fuentes.textoNegrita, fontSize: 14, color: colores.gris },
  pagina: { alignItems: "center", justifyContent: "center", paddingHorizontal: 32, gap: 14 },
  ilustracion: { width: 220, height: 220, alignItems: "center", justifyContent: "center", marginBottom: 20 },
  titulo: { fontFamily: fuentes.titulo, fontSize: 26, lineHeight: 33, color: colores.pizarra, textAlign: "center" },
  texto: { fontFamily: fuentes.texto, fontSize: 15, lineHeight: 23, color: colores.gris, textAlign: "center" },
  puntos: { flexDirection: "row", justifyContent: "center", gap: 8, marginVertical: 18 },
  punto: { width: 8, height: 8, borderRadius: 4, backgroundColor: colores.grisBorde},
  puntoActivo: { width: 24, backgroundColor: colores.indigo },
  botones: { paddingHorizontal: 24, gap: 6, minHeight: 112 },
});