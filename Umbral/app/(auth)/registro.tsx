import { LinearGradient } from "expo-linear-gradient";
import { Link, router } from "expo-router";
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
import { C, Campo, EMAIL_VALIDO, estilos } from "../../src/componentes/formularioAuth";
import { registrar } from "../../src/servicios/auth";
import { ErrorApi } from "../../src/servicios/cliente";

interface Errores {
  nombre?: string;
  email?: string;
  contrasena?: string;
  repetir?: string;
}

export default function Registro() {
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [repetir, setRepetir] = useState("");
  const [errores, setErrores] = useState<Errores>({});
  const [errorApi, setErrorApi] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  function validar() {
    const e: Errores = {};
    if (nombre.trim().length < 2) e.nombre = "Escribí tu nombre.";
    if (!email.trim()) e.email = "Escribí tu email.";
    else if (!EMAIL_VALIDO.test(email.trim())) e.email = "Ese email no parece válido.";
    if (contrasena.length < 8) e.contrasena = "Tiene que tener al menos 8 caracteres.";
    if (repetir !== contrasena) e.repetir = "Las contraseñas no coinciden.";
    setErrores(e);
    return Object.keys(e).length === 0;
  }

  async function enviar() {
    setErrorApi(null);
    if (!validar()) return;
    setEnviando(true);
    try {
      await registrar(nombre, email, contrasena);
      router.replace("/yo");
    } catch (e) {
      setErrorApi(e instanceof ErrorApi ? e.message : "Algo salió mal. Probá de nuevo.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <LinearGradient colors={[C.durazno, C.niebla, C.celeste]} style={estilos.fondo}>
      <KeyboardAvoidingView
        style={estilos.fondo}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView contentContainerStyle={estilos.pantalla} keyboardShouldPersistTaps="handled">
          <Text style={estilos.titulo}>Creá tu cuenta</Text>
          <Text style={estilos.subtitulo}>Es gratis y tarda un minuto.</Text>

          <View style={estilos.tarjeta}>
            <Campo
              etiqueta="Nombre"
              valor={nombre}
              alCambiar={setNombre}
              error={errores.nombre}
              autoCapitalize="words"
              autoComplete="name"
            />
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
              placeholder="Mínimo 8 caracteres"
              secureTextEntry
              autoComplete="new-password"
            />
            <Campo
              etiqueta="Repetí la contraseña"
              valor={repetir}
              alCambiar={setRepetir}
              error={errores.repetir}
              secureTextEntry
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
                <Text style={estilos.textoBoton}>Crear cuenta</Text>
              )}
            </Pressable>
          </View>

          <Link href="/login" replace style={estilos.enlace}>
            ¿Ya tenés cuenta? <Text style={estilos.enlaceFuerte}>Ingresá</Text>
          </Link>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}
