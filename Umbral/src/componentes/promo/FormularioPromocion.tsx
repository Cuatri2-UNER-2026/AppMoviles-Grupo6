import { useRef, useState } from "react";
import { StyleSheet, TextInput, View } from "react-native";
import { finDelDia, inicioDelDia, validarFecha } from "../../utils/fechas";
import { Campo } from "../formularioAuth";
import { Aviso } from "../ui/Aviso";
import { Boton } from "../ui/Boton";
import { CampoFecha } from "../ui/CampoFecha";
import { FilaSwitch } from "../ui/FilaSwitch";
import { TarjetaVidrio } from "../ui/TarjetaVidrio";

export type ModoFormulario = "crear" | "editar";

/** Lo que se ve en los inputs (todo texto). */
export interface ValoresPromocion {
    titulo: string;
    detalle: string;
    descuento: string;
    desde: string; // AAAA-MM-DD
    hasta: string; // AAAA-MM-DD
    soloApp: boolean;
}

/** Lo que recibe la API una vez validado. Coincide con CrearPromocionInput. */
export interface DatosPromocion {
    titulo: string;
    detalle: string;
    descuento: number | null;
    desde?: string;
    hasta: string;
    soloApp: boolean;
}

export const VALORES_VACIOS: ValoresPromocion = {
    titulo: "",
    detalle: "",
    descuento: "",
    desde: "",
    hasta: "",
    soloApp: false,
};

type Errores = Partial<
    Record<"titulo" | "detalle" | "descuento" | "desde" | "hasta", string>
>;

function validar(
    v: ValoresPromocion,
    modo: ModoFormulario,
): { errores: Errores; datos: DatosPromocion | null } {
    const e: Errores = {};
    if (!v.titulo.trim()) e.titulo = "Escribí un título.";
    if (!v.detalle.trim()) e.detalle = "Escribí el detalle y las condiciones.";

    let descuento: number | null = null;
    if (v.descuento.trim()) {
        const n = Number(v.descuento);
        if (!Number.isInteger(n) || n < 1 || n > 100)
            e.descuento = "Tiene que ser un número entero entre 1 y 100.";
        else descuento = n;
    }

    // Al crear, "desde" es opcional (si va vacío, empieza ya). Al editar, siempre existe.
    const hayDesde = v.desde.trim() !== "";
    if ((modo === "editar" || hayDesde) && !validarFecha(v.desde))
        e.desde = "Elegí una fecha de inicio.";
    if (!validarFecha(v.hasta)) e.hasta = "Elegí una fecha de vencimiento.";

    if (!e.desde && !e.hasta) {
        const fin = new Date(finDelDia(v.hasta));
        const inicio = hayDesde ? new Date(inicioDelDia(v.desde)) : null;
        if (fin <= new Date()) e.hasta = "El vencimiento tiene que ser futuro.";
        else if (inicio && fin <= inicio)
            e.hasta = "El vencimiento tiene que ser posterior al inicio.";
        if (modo === "crear" && inicio && inicio <= new Date()) {
            e.desde =
                "El inicio tiene que ser futuro. Si querés que empiece ya, dejalo vacío.";
        }
    }

    if (Object.keys(e).length > 0) return { errores: e, datos: null };

    return {
        errores: e,
        datos: {
            titulo: v.titulo.trim(),
            detalle: v.detalle.trim(),
            descuento,
            ...(hayDesde ? { desde: inicioDelDia(v.desde) } : {}),
            hasta: finDelDia(v.hasta),
            soloApp: v.soloApp,
        },
    };
}

interface Props {
    modo: ModoFormulario;
    valoresIniciales?: ValoresPromocion;
    textoBoton: string;
    guardando?: boolean;
    /** Para promos vencidas: apaga el botón y muestra `mensajeBloqueo`. */
    bloqueado?: boolean;
    mensajeBloqueo?: string;
    onGuardar: (datos: DatosPromocion) => void;
    onCancelar: () => void;
}

/** Formulario único para "Nueva promoción" y "Editar promoción". */
export function FormularioPromocion({
    modo,
    valoresIniciales = VALORES_VACIOS,
    textoBoton,
    guardando,
    bloqueado,
    mensajeBloqueo,
    onGuardar,
    onCancelar,
}: Props) {
    const [v, setV] = useState<ValoresPromocion>(valoresIniciales);
    const [errores, setErrores] = useState<Errores>({});
    const detalleRef = useRef<TextInput>(null);

    const hoy = new Date();
    const manana = new Date(
        hoy.getFullYear(),
        hoy.getMonth(),
        hoy.getDate() + 1,
    );

    const cambiar = <K extends keyof ValoresPromocion>(
        clave: K,
        valor: ValoresPromocion[K],
    ) => setV((p) => ({ ...p, [clave]: valor }));

    function enviar() {
        const r = validar(v, modo);
        setErrores(r.errores);
        if (r.datos) onGuardar(r.datos);
    }

    return (
        <TarjetaVidrio style={estilos.tarjeta}>
            <Campo
                etiqueta="Título *"
                valor={v.titulo}
                alCambiar={(t) => cambiar("titulo", t)}
                error={errores.titulo}
                placeholder="Ej: 20% en pinturas"
                autoCapitalize="sentences"
                maxLength={100}
                siguiente={detalleRef}
            />
            <Campo
                inputRef={detalleRef}
                etiqueta="Detalle y condiciones *"
                valor={v.detalle}
                alCambiar={(t) => cambiar("detalle", t)}
                error={errores.detalle}
                placeholder="Describí la promoción y sus condiciones..."
                autoCapitalize="sentences"
                multiline
                maxLength={500}
            />
            <Campo
                etiqueta="Descuento (%)"
                valor={v.descuento}
                alCambiar={(t) => cambiar("descuento", t)}
                error={errores.descuento}
                placeholder="Ej: 20 (opcional)"
                keyboardType="numeric"
            />
            <CampoFecha
                etiqueta={
                    modo === "crear" ? "Fecha de inicio" : "Fecha de inicio *"
                }
                valor={v.desde}
                alCambiar={(t) => cambiar("desde", t)}
                error={errores.desde}
                ayuda={
                    modo === "crear"
                        ? "Si no elegís fecha, empieza apenas la publicás."
                        : undefined
                }
                limpiable={modo === "crear"}
                fechaMinima={modo === "crear" ? manana : undefined}
            />
            <CampoFecha
                etiqueta="Fecha de vencimiento *"
                valor={v.hasta}
                alCambiar={(t) => cambiar("hasta", t)}
                error={errores.hasta}
                fechaMinima={hoy}
            />

            <FilaSwitch
                titulo="Solo para usuarios de la app"
                descripcion="La promoción será exclusiva para quienes usen Umbral y se canjea con código QR."
                value={v.soloApp}
                onValueChange={(x) => cambiar("soloApp", x)}
            />

            {bloqueado && mensajeBloqueo && <Aviso texto={mensajeBloqueo} />}

            <View style={{ gap: 4 }}>
                <Boton
                    texto={textoBoton}
                    onPress={enviar}
                    cargando={guardando}
                    deshabilitado={bloqueado}
                />
                <Boton
                    texto="Cancelar"
                    variante="texto"
                    onPress={onCancelar}
                    deshabilitado={guardando}
                />
            </View>
        </TarjetaVidrio>
    );
}

const estilos = StyleSheet.create({
    tarjeta: { gap: 14, padding: 18, borderRadius: 32 },
});
