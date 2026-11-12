import { Link, router, useLocalSearchParams } from "expo-router";
import { useRef, useState } from "react";
import { Text, TextInput, View } from "react-native";
import { obtenerUltimoEmail } from "../../src/almacenamiento/preferencias";
import { Campo, EMAIL_VALIDO, estilos, PantallaAuth } from "../../src/componentes/formularioAuth";
import { Boton } from "../../src/componentes/ui/Boton";
import { ingresar } from "../../src/servicios/auth";
import { ErrorApi } from "../../src/servicios/cliente";
import { colores } from "../../src/tema";

export default function Login() {
    const params = useLocalSearchParams<{ email?: string }>();
    const [email, setEmail] = useState(params.email ?? obtenerUltimoEmail() ?? "");
    const [contrasena, setContrasena] = useState("");
    const [errores, setErrores] = useState<{ email?: string; contrasena?: string }>({});
    const [errorApi, setErrorApi] = useState<string | null>(null);
    const [enviando, setEnviando] = useState(false);
    const contrasenaRef = useRef<TextInput>(null);

    function validar() {
        const e: typeof errores = {};
        if (!email.trim()) e.email = "Escribí tu email.";
        else if (!EMAIL_VALIDO.test(email.trim())) e.email = "Ese email no parece válido.";
        if (!contrasena) e.contrasena = "Escribí tu contraseña.";
        setErrores(e);
        return Object.keys(e).length === 0;
    }

    async function enviar() {
        setErrorApi(null);
        if (!validar()) return;
        setEnviando(true);
        try {
            await ingresar(email, contrasena);
            router.replace("/yo");
        } catch (e) {
            setErrorApi(e instanceof ErrorApi ? e.message : "Algo salió mal. Probá de nuevo.");
        } finally {
            setEnviando(false);
        }
    }

    return (
        <PantallaAuth fondo={[colores.salvia, colores.niebla, colores.lila]}>
        <Text style={estilos.titulo}>Ingresá</Text>
        <Text style={estilos.subtitulo}>Para guardar favoritos, reseñar y usar promos.</Text>

        <View style={estilos.tarjeta}>
            <Campo
            etiqueta="Email"
            valor={email}
            alCambiar={setEmail}
            error={errores.email}
            keyboardType="email-address"
            autoComplete="email"
            siguiente={contrasenaRef}
            />

            <Campo
            inputRef={contrasenaRef}
            etiqueta="Contraseña"
            valor={contrasena}
            alCambiar={setContrasena}
            error={errores.contrasena}
            secureTextEntry
            autoComplete="password"
            returnKeyType="go"
            onSubmitEditing={enviar}
            />

            {errorApi && <Text style={estilos.errorApi}>{errorApi}</Text>}

            <Boton texto="Ingresar" onPress={enviar} cargando={enviando} />
        </View>

        <Link href="/registro" replace style={estilos.enlace}>
            ¿No tenés cuenta? <Text style={estilos.enlaceFuerte}>Creá una</Text>
        </Link>
        </PantallaAuth>
    );
}