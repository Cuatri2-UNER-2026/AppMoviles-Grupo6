import { useRouter } from "expo-router";
import { useState, useRef } from "react";
import { Alert, StyleSheet, Text, View, TextInput } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
    Aviso,
    Boton,
    BotonRedondo,
    Campo,
    Chip,
    EstadoCarga,
    EstadoError,
    FilaSwitch,
    FondoDegradado,
    SeccionTitulo,
    ScrollFormulario,
    CampoFecha,
} from "../../src/componentes";
import { EditorHorarios } from "../../src/componentes/panel/EditorHorarios";
import { EditorMedios } from "../../src/componentes/panel/EditorMedios";
import { useCarga } from "../../src/hooks/useCarga";
import { ErrorApi } from "../../src/servicios/cliente";
import {
    actualizarMiComercio,
    obtenerMiComercio,
    type CambiosComercio,
    type ComercioPropio,
} from "../../src/servicios/miComercio";
import { colores, fuentes } from "../../src/tema";
import { fechaParaInput, validarFecha } from "../../src/utils/fechas";
import {
    claveHorarios,
    horariosATramos,
    tramosAHorarios,
    validarTramos,
    type Tramos,
} from "../../src/utils/horarios";

const FONDO = [
    colores.salvia,
    colores.niebla,
    colores.niebla,
    colores.lila,
] as const;

const MEDIOS: { clave: string; etiqueta: string }[] = [
    { clave: "efectivo", etiqueta: "Efectivo" },
    { clave: "debito", etiqueta: "Débito" },
    { clave: "credito", etiqueta: "Crédito" },
    { clave: "transferencia", etiqueta: "Transferencia" },
    { clave: "billetera_virtual", etiqueta: "Billetera virtual" },
];

type Errores = Partial<
    Record<
        "descripcion" | "telefono" | "whatsapp" | "instagram" | "vacaciones",
        string
    >
>;

export default function EditarFichaScreen() {
    const insets = useSafeAreaInsets();
    const { datos, cargando, error, reintentar } = useCarga(
        () => obtenerMiComercio(),
        [],
    );

    // Botón de volver fijo arriba, para que también se vea mientras carga o si hay un error.
    const volver = (
        <View
            style={{
                paddingTop: insets.top + 12,
                paddingHorizontal: 20,
                alignItems: "flex-start",
            }}>
            <BotonRedondo />
        </View>
    );

    return (
        <FondoDegradado colores={FONDO}>
            {cargando ? (
                <>
                    {volver}
                    <EstadoCarga texto="Cargando tu ficha…" />
                </>
            ) : error || !datos ? (
                <>
                    {volver}
                    <EstadoError
                        titulo="No pudimos abrir tu ficha"
                        texto={error}
                        onReintentar={reintentar}
                    />
                </>
            ) : (
                <Formulario comercio={datos} alReabrir={reintentar} />
            )}
        </FondoDegradado>
    );
}

function Formulario({
    comercio: c,
    alReabrir,
}: {
    comercio: ComercioPropio;
    alReabrir: () => void;
}) {
    const router = useRouter();
    const insets = useSafeAreaInsets();

    const [descripcion, setDescripcion] = useState(c.descripcion);
    const [telefono, setTelefono] = useState(c.telefono ?? "");
    const [whatsapp, setWhatsapp] = useState(c.whatsapp ?? "");
    const [instagram, setInstagram] = useState(c.instagram ?? "");
    const [medios, setMedios] = useState<string[]>(c.mediosDePago);
    const [tramos, setTramos] = useState<Tramos>(() =>
        horariosATramos(c.horarios),
    );
    const [imagenes, setImagenes] = useState<string[]>(c.imagenes);
    const [videoUrl, setVideoUrl] = useState<string | null>(c.videoUrl);
    // La API nunca devuelve `cerradoHasta`: no sabemos si hay vacaciones activas, solo que
    // mientras duran `horarios` viene vacío. Por eso el interruptor arranca apagado.
    const [vacaciones, setVacaciones] = useState(false);
    const [tocoVacaciones, setTocoVacaciones] = useState(false);
    const [hastaVacaciones, setHastaVacaciones] = useState("");
    const [reabriendo, setReabriendo] = useState(false);
    const sinHorariosVisibles = c.activo && c.horarios.length === 0;

    const [errores, setErrores] = useState<Errores>({});
    const [erroresHorario, setErroresHorario] = useState<
        Record<number, string>
    >({});
    const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
    const [subiendo, setSubiendo] = useState(false);
    const [guardando, setGuardando] = useState(false);

    const telefonoRef = useRef<TextInput>(null);
    const whatsappRef = useRef<TextInput>(null);
    const instagramRef = useRef<TextInput>(null);

    const alternarMedio = (clave: string) =>
        setMedios((p) =>
            p.includes(clave) ? p.filter((m) => m !== clave) : [...p, clave],
        );

    function reabrir() {
        Alert.alert(
            "Reabrir mi local",
            "Los vecinos van a volver a ver tus horarios y tu local deja de figurar como cerrado temporalmente.",
            [
                { text: "Cancelar", style: "cancel" },
                {
                    text: "Reabrir",
                    onPress: async () => {
                        setErrorGeneral(null);
                        setReabriendo(true);
                        try {
                            await actualizarMiComercio({ cerradoHasta: null });
                            alReabrir(); // vuelve a cargar la ficha, ahora con los horarios
                        } catch (err) {
                            setErrorGeneral(
                                err instanceof Error
                                    ? err.message
                                    : "Algo salió mal. Probá de nuevo.",
                            );
                            setReabriendo(false);
                        }
                    },
                },
            ],
        );
    }

    async function guardar() {
        setErrorGeneral(null);
        const e: Errores = {};

        const desc = descripcion.trim();
        if (!desc) e.descripcion = "Escribí una descripción de tu local.";

        const tel = telefono.trim();
        if (tel && tel.replace(/\D/g, "").length < 6)
            e.telefono = "Ese teléfono no parece válido.";

        const wsp = whatsapp.replace(/[\s+\-()]/g, "");
        if (wsp && !/^\d{10,15}$/.test(wsp)) {
            e.whatsapp =
                "Escribilo con código de país y sin símbolos. Ej: 5493442425566.";
        }

        const ig = instagram.trim().replace(/^@/, "");
        if (ig && !/^[A-Za-z0-9._]{1,30}$/.test(ig))
            e.instagram = "Ese usuario de Instagram no parece válido.";

        if (vacaciones) {
            const hoy = fechaParaInput(new Date().toISOString());
            if (!validarFecha(hastaVacaciones))
                e.vacaciones = "Usá el formato AAAA-MM-DD.";
            else if (hastaVacaciones < hoy)
                e.vacaciones = "La fecha tiene que ser de hoy en adelante.";
        }

        const eHorario = validarTramos(tramos);
        setErrores(e);
        setErroresHorario(eHorario);
        if (Object.keys(e).length > 0 || Object.keys(eHorario).length > 0) {
            setErrorGeneral("Revisá los campos marcados en rojo.");
            return;
        }

        // Mandamos solo lo que cambió.
        const cambios: CambiosComercio = {};
        if (desc !== c.descripcion) cambios.descripcion = desc;
        if ((tel || null) !== c.telefono) cambios.telefono = tel || null;
        if ((wsp || null) !== c.whatsapp) cambios.whatsapp = wsp || null;
        const igFinal = ig ? `@${ig}` : null;
        if (igFinal !== c.instagram) cambios.instagram = igFinal;

        const horarios = tramosAHorarios(tramos);
        if (claveHorarios(horarios) !== claveHorarios(c.horarios))
            cambios.horarios = horarios;

        if (JSON.stringify(imagenes) !== JSON.stringify(c.imagenes))
            cambios.imagenes = imagenes;
        if (videoUrl !== c.videoUrl) cambios.videoUrl = videoUrl;
        if ([...medios].sort().join() !== [...c.mediosDePago].sort().join())
            cambios.mediosDePago = medios;

        // Con vacaciones prendidas se manda la fecha. Si se tocó el interruptor o se cargaron
        // horarios con el interruptor apagado, se manda null para levantar un cierre anterior
        // (no podemos saber si había uno: mandar null cuando no lo hay no hace nada).
        if (vacaciones) cambios.cerradoHasta = hastaVacaciones;
        else if (tocoVacaciones || cambios.horarios !== undefined)
            cambios.cerradoHasta = null;

        if (Object.keys(cambios).length === 0) {
            Alert.alert(
                "Sin cambios",
                "No modificaste ningún dato de tu ficha.",
            );
            return;
        }

        try {
            setGuardando(true);
            await actualizarMiComercio(cambios);
            Alert.alert(
                "¡Ficha actualizada!",
                "Tus cambios ya los ven los vecinos.",
                [{ text: "Aceptar", onPress: () => router.back() }],
            );
        } catch (err) {
            // El mensaje de la API está pensado para mostrarse tal cual.
            setErrorGeneral(
                err instanceof ErrorApi || err instanceof Error
                    ? err.message
                    : "Algo salió mal. Probá de nuevo.",
            );
        } finally {
            setGuardando(false);
        }
    }

    return (
        <ScrollFormulario
            contentContainerStyle={[
                estilos.contenido,
                {
                    paddingTop: insets.top + 12,
                    paddingBottom: insets.bottom + 40,
                },
            ]}
            keyboardShouldPersistTaps="handled"
            automaticallyAdjustKeyboardInsets
            showsVerticalScrollIndicator={false}>
            <View style={{ alignSelf: "flex-start" }}>
                <BotonRedondo />
            </View>

            <View>
                <Text style={estilos.titulo}>Mi ficha</Text>
                <Text style={estilos.subtitulo}>{c.nombre}</Text>
            </View>

            <SeccionTitulo
                texto="Fotos y video"
                ayuda="Es lo primero que ve el vecino al abrir tu comercio."
            />
            <EditorMedios
                imagenes={imagenes}
                videoUrl={videoUrl}
                onImagenes={setImagenes}
                onVideo={setVideoUrl}
                onError={setErrorGeneral}
                onSubiendo={setSubiendo}
            />

            <SeccionTitulo texto="Sobre el local" />
            <Campo
                etiqueta="Descripción"
                valor={descripcion}
                alCambiar={setDescripcion}
                error={errores.descripcion}
                placeholder="Contá qué vendés y desde cuándo estás…"
                autoCapitalize="sentences"
                multiline
                maxLength={500}
            />

            <SeccionTitulo texto="Contacto" />
            <Campo
                etiqueta="Teléfono"
                valor={telefono}
                alCambiar={setTelefono}
                error={errores.telefono}
                placeholder="3442-425566"
                keyboardType="phone-pad"
                inputRef={telefonoRef}
                siguiente={whatsappRef}
            />
            <Campo
                etiqueta="WhatsApp"
                valor={whatsapp}
                alCambiar={setWhatsapp}
                error={errores.whatsapp}
                ayuda="Con código de país, sin + ni espacios. Ej: 5493442425566"
                placeholder="5493442425566"
                keyboardType="phone-pad"
                inputRef={whatsappRef}
                siguiente={instagramRef}
            />
            <Campo
                etiqueta="Instagram"
                valor={instagram}
                alCambiar={setInstagram}
                error={errores.instagram}
                placeholder="@minegocio"
                inputRef={instagramRef}
            />

            <SeccionTitulo
                texto="Medios de pago"
                ayuda="Tocá los que aceptás."
            />
            <View style={estilos.chips}>
                {MEDIOS.map((m) => (
                    <Chip
                        key={m.clave}
                        texto={m.etiqueta}
                        activo={medios.includes(m.clave)}
                        onPress={() => alternarMedio(m.clave)}
                    />
                ))}
            </View>

            <SeccionTitulo
                texto="Horarios"
                ayuda="Si cerrás al mediodía, agregá un segundo turno para la tarde."
            />
            <EditorHorarios
                valor={tramos}
                onChange={setTramos}
                errores={erroresHorario}
            />

            <SeccionTitulo texto="Vacaciones" />
            {sinHorariosVisibles && (
                <>
                    <Aviso
                        icono="sunny-outline"
                        texto="Tu local figura como cerrado temporalmente y no se ven horarios. Si ya no estás de vacaciones, reabrilo."
                    />
                    <Boton
                        texto="Reabrir mi local"
                        variante="indigo"
                        onPress={reabrir}
                        cargando={reabriendo}
                    />
                </>
            )}
            <FilaSwitch
                titulo="Cerrado por vacaciones"
                descripcion="Mientras esté prendido, los vecinos ven que tu local está cerrado temporalmente."
                value={vacaciones}
                onValueChange={(v) => {
                    setVacaciones(v);
                    setTocoVacaciones(true);
                }}
            />
            {vacaciones && (
                <CampoFecha
                    etiqueta="Volvemos a abrir el"
                    valor={hastaVacaciones}
                    alCambiar={setHastaVacaciones}
                    error={errores.vacaciones}
                    fechaMinima={new Date()}
                />
            )}

            {errorGeneral && (
                <Aviso icono="alert-circle-outline" texto={errorGeneral} />
            )}

            <View style={{ gap: 4 }}>
                <Boton
                    texto={
                        subiendo
                            ? "Esperá, se está subiendo un archivo…"
                            : "Guardar cambios"
                    }
                    onPress={guardar}
                    cargando={guardando}
                    deshabilitado={subiendo}
                />
                <Boton
                    texto="Cancelar"
                    variante="texto"
                    onPress={() => router.back()}
                    deshabilitado={guardando}
                />
            </View>
        </ScrollFormulario>
    );
}

const estilos = StyleSheet.create({
    contenido: { paddingHorizontal: 20, gap: 14 },
    titulo: {
        fontFamily: fuentes.titulo,
        fontSize: 34,
        color: colores.pizarra,
        letterSpacing: -0.5,
    },
    subtitulo: {
        fontFamily: fuentes.textoMedio,
        fontSize: 15,
        color: colores.gris,
        marginTop: 2,
    },
    chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
});
