import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { obtenerUltimoEmail } from "../../src/almacenamiento/preferencias";
import { C } from "../../src/componentes/formularioAuth";
import { useSesion } from "../../src/hooks/useSesion";
import {
  actualizarYo,
  desbloquearConBiometria,
  hayBiometria,
  salir,
} from "../../src/servicios/auth";
import { ErrorApi } from "../../src/servicios/cliente";
import { listarRubros } from "../../src/servicios/comercios";
import { listarFavoritos, quitarFavorito } from "../../src/servicios/favoritos";
import { cambiarAvisos, revisarPromos } from "../../src/servicios/notificaciones";
import type { Comercio, Rubro, Usuario } from "../../src/tipos";

function mensajeDe(e: unknown) {
  if (e instanceof ErrorApi) return e.message;
  console.error("[Yo]", e);
  const detalle = __DEV__ && e instanceof Error ? `\n(${e.message})` : "";
  return `Algo salió mal. Probá de nuevo.${detalle}`;
}

export default function Yo() {
  const sesion = useSesion();

  return (
    <LinearGradient colors={[C.lila, C.niebla, C.niebla, C.salvia]} style={estilos.fondo}>
      {sesion.estado === "cargando" && (
        <View style={estilos.centro}>
          <ActivityIndicator color={C.pizarra} size="large" />
        </View>
      )}
      {sesion.estado === "sin-sesion" && <SinSesion />}
      {sesion.estado === "bloqueada" && <Bloqueada />}
      {sesion.estado === "activa" && <Perfil usuario={sesion.usuario} />}
    </LinearGradient>
  );
}

function SinSesion() {
  return (
    <View style={estilos.centro}>
      <Text style={estilos.tituloGrande}>Tu cuenta</Text>
      <Text style={estilos.texto}>
        Ingresá para guardar favoritos, elegir tus rubros y recibir avisos de promos.
      </Text>
      <Pressable style={estilos.botonOscuro} onPress={() => router.push("/login")}>
        <Text style={estilos.textoBotonOscuro}>Ingresar</Text>
      </Pressable>
      <Pressable style={estilos.botonClaro} onPress={() => router.push("/registro")}>
        <Text style={estilos.textoBotonClaro}>Crear cuenta</Text>
      </Pressable>
    </View>
  );
}

function Bloqueada() {
  const [biometria, setBiometria] = useState<boolean | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function desbloquear() {
    setError(null);
    setOcupado(true);
    try {
      const ok = await desbloquearConBiometria();
      if (!ok) setError("No pudimos reconocerte. Probá de nuevo o usá tu contraseña.");
    } catch (e) {
      setError(mensajeDe(e));
    } finally {
      setOcupado(false);
    }
  }

  useEffect(() => {
    hayBiometria().then((hay) => {
      setBiometria(hay);
      if (hay) desbloquear();
    });
  }, []);

  const conContrasena = () =>
    router.push({ pathname: "/login", params: { email: obtenerUltimoEmail() ?? "" } });

  return (
    <View style={estilos.centro}>
      <Text style={estilos.tituloGrande}>Hola de nuevo</Text>
      {biometria === false && (
        <Text style={estilos.texto}>
          Este teléfono no tiene huella ni rostro configurados. Ingresá con tu contraseña.
        </Text>
      )}
      {biometria && (
        <Text style={estilos.texto}>Confirmá que sos vos para ver tu cuenta.</Text>
      )}
      {error && <Text style={estilos.error}>{error}</Text>}

      {biometria && (
        <Pressable style={estilos.botonOscuro} onPress={desbloquear} disabled={ocupado}>
          {ocupado ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={estilos.textoBotonOscuro}>Usar huella o rostro</Text>
          )}
        </Pressable>
      )}
      <Pressable
        style={biometria === false ? estilos.botonOscuro : estilos.botonClaro}
        onPress={conContrasena}
      >
        <Text style={biometria === false ? estilos.textoBotonOscuro : estilos.textoBotonClaro}>
          Ingresar con contraseña
        </Text>
      </Pressable>
      <Pressable onPress={salir}>
        <Text style={estilos.enlace}>No soy yo, cerrar sesión</Text>
      </Pressable>
    </View>
  );
}

function Perfil({ usuario }: { usuario: Usuario }) {
  const [error, setError] = useState<string | null>(null);
  const esVecino = usuario.rol === "vecino";

  function confirmarSalida() {
    Alert.alert("Cerrar sesión", "¿Querés salir de tu cuenta?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Salir", style: "destructive", onPress: () => salir() },
    ]);
  }

  return (
    <ScrollView contentContainerStyle={estilos.pantalla}>
      <Text style={estilos.tituloGrande}>Yo</Text>
      <DatosCuenta usuario={usuario} onError={setError} />
      {error && <Text style={estilos.error}>{error}</Text>}

      {esVecino ? (
        <>
          <Favoritos ids={usuario.favoritos} onError={setError} />
          <Rubros elegidos={usuario.rubrosDeInteres} onError={setError} />
          <Avisos activos={usuario.avisosActivos} onError={setError} />
        </>
      ) : (
        <Pressable style={estilos.botonOscuro} onPress={() => router.push("/panel")}>
          <Text style={estilos.textoBotonOscuro}>Ir al panel de mi comercio</Text>
        </Pressable>
      )}

      <Pressable style={estilos.botonClaro} onPress={confirmarSalida}>
        <Text style={[estilos.textoBotonClaro, { color: C.error }]}>Cerrar sesión</Text>
      </Pressable>
    </ScrollView>
  );
}

function DatosCuenta({ usuario, onError }: { usuario: Usuario; onError: (m: string | null) => void }) {
  const [editando, setEditando] = useState(false);
  const [nombre, setNombre] = useState(usuario.nombre);
  const [guardando, setGuardando] = useState(false);

  async function guardar() {
    if (nombre.trim().length < 2) {
      onError("El nombre tiene que tener al menos 2 letras.");
      return;
    }
    onError(null);
    setGuardando(true);
    try {
      await actualizarYo({ nombre: nombre.trim() });
      setEditando(false);
    } catch (e) {
      onError(mensajeDe(e));
    } finally {
      setGuardando(false);
    }
  }

  return (
    <View style={estilos.tarjeta}>
      <View style={estilos.fila}>
        <View style={estilos.avatar}>
          <Text style={estilos.letraAvatar}>{usuario.nombre.charAt(0).toUpperCase()}</Text>
        </View>
        <View style={{ flex: 1 }}>
          {editando ? (
            <TextInput
              value={nombre}
              onChangeText={setNombre}
              autoFocus
              autoCapitalize="words"
              style={estilos.input}
            />
          ) : (
            <Text style={estilos.nombre}>{usuario.nombre}</Text>
          )}
          <Text style={estilos.textoChico}>{usuario.email}</Text>
        </View>
      </View>
      <View style={estilos.fila}>
        <View style={[estilos.chip, { backgroundColor: C.salvia }]}>
          <Text style={estilos.textoChip}>{usuario.rol === "vecino" ? "Vecino" : "Comercio"}</Text>
        </View>
        <View style={{ flex: 1 }} />
        {editando ? (
          <>
            <Pressable
              onPress={() => {
                setNombre(usuario.nombre);
                setEditando(false);
              }}
            >
              <Text style={estilos.enlace}>Cancelar</Text>
            </Pressable>
            <Pressable style={estilos.botonChico} onPress={guardar} disabled={guardando}>
              <Text style={estilos.textoBotonOscuro}>{guardando ? "Guardando..." : "Guardar"}</Text>
            </Pressable>
          </>
        ) : (
          <Pressable style={estilos.botonChicoClaro} onPress={() => setEditando(true)}>
            <Text style={estilos.textoBotonClaro}>Editar nombre</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

function Favoritos({ ids, onError }: { ids: string[]; onError: (m: string | null) => void }) {
  const [comercios, setComercios] = useState<Comercio[] | null>(null);
  const clave = ids.join(",");

  useEffect(() => {
    listarFavoritos()
      .then(setComercios)
      .catch((e) => {
        setComercios([]);
        onError(mensajeDe(e));
      });
  }, [clave]);

  async function quitar(id: string) {
    try {
      await quitarFavorito(id);
    } catch (e) {
      onError(mensajeDe(e));
    }
  }

  return (
    <View style={estilos.seccion}>
      <Text style={estilos.tituloSeccion}>Mis favoritos</Text>
      {comercios === null && <ActivityIndicator color={C.pizarra} />}
      {comercios?.length === 0 && (
        <View style={estilos.tarjeta}>
          <Text style={estilos.textoChico}>
            Todavía no guardaste comercios. Tocá “Guardar” en la ficha de uno para tenerlo acá.
          </Text>
        </View>
      )}
      {comercios?.map((c) => (
        <Pressable
          key={c.id}
          style={[estilos.tarjeta, estilos.fila]}
          onPress={() => router.push({ pathname: "/comercio/[id]", params: { id: c.id } })}
        >
          <View style={[estilos.avatar, { backgroundColor: C.celeste }]}>
            <Text style={estilos.letraAvatar}>{c.nombre.charAt(0)}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={estilos.nombreChico}>{c.nombre}</Text>
            <Text style={estilos.textoChico}>{c.direccion}</Text>
          </View>
          <Pressable onPress={() => quitar(c.id)} hitSlop={10}>
            <Text style={estilos.enlace}>Quitar</Text>
          </Pressable>
        </Pressable>
      ))}
    </View>
  );
}

function Rubros({ elegidos, onError }: { elegidos: string[]; onError: (m: string | null) => void }) {
  const [rubros, setRubros] = useState<Rubro[] | null>(null);

  useEffect(() => {
    listarRubros()
      .then((r) => setRubros([...r].sort((a, b) => a.orden - b.orden)))
      .catch((e) => {
        setRubros([]);
        onError(mensajeDe(e));
      });
  }, []);

  async function alternar(id: string) {
    const nuevos = elegidos.includes(id) ? elegidos.filter((r) => r !== id) : [...elegidos, id];
    try {
      await actualizarYo({ rubrosDeInteres: nuevos });
      revisarPromos().catch(() => {});
    } catch (e) {
      onError(mensajeDe(e));
    }
  }

  return (
    <View style={estilos.seccion}>
      <Text style={estilos.tituloSeccion}>Rubros que me interesan</Text>
      <Text style={estilos.textoChico}>Te avisamos cuando haya promos nuevas de estos rubros.</Text>
      {rubros === null && <ActivityIndicator color={C.pizarra} />}
      <View style={estilos.chips}>
        {rubros?.map((r) => {
          const activo = elegidos.includes(r.id);
          return (
            <Pressable
              key={r.id}
              onPress={() => alternar(r.id)}
              style={[
                estilos.chipGrande,
                activo && { backgroundColor: C.pizarra, borderColor: C.pizarra },
              ]}
            >
              <Text style={[estilos.textoChipGrande, activo && { color: "#fff" }]}>{r.nombre}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function Avisos({ activos, onError }: { activos: boolean; onError: (m: string | null) => void }) {
  const [valor, setValor] = useState(activos);
  const [revisando, setRevisando] = useState(false);

  async function cambiar(nuevo: boolean) {
    setValor(nuevo);
    try {
      const ok = await cambiarAvisos(nuevo);
      if (!ok) {
        setValor(false);
        onError("Para recibir avisos, habilitá las notificaciones de Umbral en los ajustes del teléfono.");
      }
    } catch (e) {
      setValor(!nuevo);
      onError(mensajeDe(e));
    }
  }

  async function revisarAhora() {
    setRevisando(true);
    await revisarPromos().catch((e) => onError(mensajeDe(e)));
    setRevisando(false);
  }

  return (
    <View style={estilos.seccion}>
      <Text style={estilos.tituloSeccion}>Avisos</Text>
      <View style={[estilos.tarjeta, estilos.fila]}>
        <View style={{ flex: 1 }}>
          <Text style={estilos.nombreChico}>Recibir avisos</Text>
          <Text style={estilos.textoChico}>
            {valor
              ? "Promos nuevas de tus favoritos y rubros, y un recordatorio el día antes de que venzan."
              : "Todos los avisos están apagados."}
          </Text>
        </View>
        <Switch
          value={valor}
          onValueChange={cambiar}
          trackColor={{ true: C.indigo, false: "#D1D5DB" }}
          thumbColor="#fff"
        />
      </View>
      {valor && (
        <Pressable onPress={revisarAhora} disabled={revisando}>
          <Text style={estilos.enlace}>{revisando ? "Buscando..." : "Buscar promos nuevas ahora"}</Text>
        </Pressable>
      )}
    </View>
  );
}

const estilos = StyleSheet.create({
  fondo: { flex: 1 },
  centro: { flex: 1, justifyContent: "center", padding: 24, gap: 12 },
  pantalla: { padding: 20, paddingTop: 70, paddingBottom: 120, gap: 14 },
  tituloGrande: { fontSize: 44, fontWeight: "800", color: C.pizarra, letterSpacing: -1 },
  texto: { fontSize: 16, color: C.gris, marginBottom: 8, lineHeight: 22 },
  error: {
    color: C.error,
    backgroundColor: C.durazno,
    padding: 12,
    borderRadius: 16,
    fontWeight: "600",
  },
  tarjeta: {
    backgroundColor: "rgba(255,255,255,0.75)",
    borderRadius: 28,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.9)",
  },
  fila: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: C.lila,
    alignItems: "center",
    justifyContent: "center",
  },
  letraAvatar: { fontSize: 22, fontWeight: "800", color: C.pizarra },
  nombre: { fontSize: 22, fontWeight: "800", color: C.pizarra },
  nombreChico: { fontSize: 16, fontWeight: "700", color: C.pizarra },
  textoChico: { fontSize: 14, color: C.gris, lineHeight: 19 },
  input: {
    backgroundColor: "#fff",
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 18,
    fontWeight: "700",
    color: C.pizarra,
  },
  chip: { borderRadius: 999, paddingHorizontal: 12, paddingVertical: 5 },
  textoChip: { fontSize: 13, fontWeight: "700", color: C.pizarra },
  seccion: { gap: 10, marginTop: 6 },
  tituloSeccion: { fontSize: 20, fontWeight: "800", color: C.pizarra },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chipGrande: {
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "rgba(255,255,255,0.8)",
    borderWidth: 1,
    borderColor: "#fff",
  },
  textoChipGrande: { fontSize: 15, fontWeight: "600", color: C.pizarra },
  botonOscuro: {
    backgroundColor: C.pizarra,
    borderRadius: 999,
    paddingVertical: 16,
    alignItems: "center",
  },
  textoBotonOscuro: { color: "#fff", fontSize: 16, fontWeight: "700" },
  botonClaro: {
    backgroundColor: "rgba(255,255,255,0.85)",
    borderRadius: 999,
    paddingVertical: 16,
    alignItems: "center",
  },
  textoBotonClaro: { color: C.pizarra, fontSize: 16, fontWeight: "700" },
  botonChico: {
    backgroundColor: C.pizarra,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 9,
  },
  botonChicoClaro: {
    backgroundColor: "#fff",
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 9,
  },
  enlace: { color: C.indigo, fontWeight: "700", fontSize: 15, textAlign: "center", padding: 6 },
});