import { LinearGradient } from "expo-linear-gradient";
import { Link, router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { obtenerUltimoEmail } from "../../src/almacenamiento/preferencias";
import { ingresar } from "../../src/servicios/auth";
import { ErrorApi } from "../../src/servicios/cliente";
import { C, Campo, EMAIL_VALIDO, estilos } from "../../src/componentes/formularioAuth";

export default function Login() {
  const params = useLocalSearchParams<{ email?: string }>();
  const [email, setEmail] = useState(params.email ?? obtenerUltimoEmail() ?? "");
  const [contrasena, setContrasena] = useState("");
  const [errores, setErrores] = useState<{ email?: string; contrasena?: string }>({});
  const [errorApi, setErrorApi] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

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
    <LinearGradient colors={[C.salvia, C.niebla, C.lila]} style={estilos.fondo}>
      <KeyboardAvoidingView
        style={estilos.fondo}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView contentContainerStyle={estilos.pantalla} keyboardShouldPersistTaps="handled">
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
            />
            <Campo
              etiqueta="Contraseña"
              valor={contrasena}
              alCambiar={setContrasena}
              error={errores.contrasena}
              secureTextEntry
              autoComplete="password"
            />

            {errorApi && <Text style={estilos.errorApi}>{errorApi}</Text>}

            <Pressable
              style={[estilos.boton, enviando && estilos.botonApagado]}
              onPress={enviar}
              disabled={enviando}
            >
              {enviando ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={estilos.textoBoton}>Ingresar</Text>
              )}
            </Pressable>
          </View>

          <Link href="/registro" replace style={estilos.enlace}>
            ¿No tenés cuenta? <Text style={estilos.enlaceFuerte}>Creá una</Text>
          </Link>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}