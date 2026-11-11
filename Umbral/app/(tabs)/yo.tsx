import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import {
  AvatarInicial,
  Aviso,
  Boton,
  Chip,
  EstadoCarga,
  FilaSwitch,
  FondoDegradado,
  SeccionTitulo,
  TarjetaComercio,
  TarjetaVidrio,
} from "../../src/componentes";
import { obtenerUltimoEmail } from "../../src/almacenamiento/preferencias";
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
import { colores, fuentes } from "../../src/tema";
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
    <FondoDegradado colores={[colores.lila, colores.niebla, colores.niebla, colores.salvia]}>
      {sesion.estado === "cargando" && <EstadoCarga texto="" />}
      {sesion.estado === "sin-sesion" && <SinSesion />}
      {sesion.estado === "bloqueada" && <Bloqueada />}
      {sesion.estado === "activa" && <Perfil usuario={sesion.usuario} />}
    </FondoDegradado>
  );
}

function SinSesion() {
  return (
    <View style={estilos.centro}>
      <Text style={estilos.tituloGrande}>Tu cuenta</Text>
      <Text style={estilos.texto}>
        Ingresá para guardar favoritos, elegir tus rubros y recibir avisos de promos.
      </Text>
      <Boton texto="Ingresar" onPress={() => router.push("/login")} />
      <Boton texto="Crear cuenta" variante="claro" onPress={() => router.push("/registro")} />
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
      {biometria && <Text style={estilos.texto}>Confirmá que sos vos para ver tu cuenta.</Text>}
      {error && <Aviso icono="alert-circle-outline" texto={error} />}

      {biometria && <Boton texto="Usar huella o rostro" onPress={desbloquear} cargando={ocupado} />}
      <Boton
        texto="Ingresar con contraseña"
        variante={biometria === false ? "primario" : "claro"}
        onPress={conContrasena}
      />
      <Boton texto="No soy yo, cerrar sesión" variante="texto" onPress={salir} />
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
      {error && <Aviso icono="alert-circle-outline" texto={error} />}

      {esVecino ? (
        <>
          <Favoritos ids={usuario.favoritos} onError={setError} />
          <Rubros elegidos={usuario.rubrosDeInteres} onError={setError} />
          <Avisos activos={usuario.avisosActivos} onError={setError} />
        </>
      ) : (
        <Boton texto="Ir al panel de mi comercio" onPress={() => router.push("/panel")} />
      )}

      <Boton texto="Cerrar sesión" variante="peligro" onPress={confirmarSalida} style={{ marginBottom: 20 }} />
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
    <TarjetaVidrio style={estilos.tarjeta}>
      <View style={estilos.fila}>
        <AvatarInicial nombre={usuario.nombre} tamano={52} />
        <View style={{ flex: 1 }}>
          {editando ? (
            <TextInput
              value={nombre}
              onChangeText={setNombre}
              autoFocus
              autoCapitalize="words"
              style={estilos.input}
              accessibilityLabel="Nombre"
            />
          ) : (
            <Text style={estilos.nombre}>{usuario.nombre}</Text>
          )}
          <Text style={estilos.textoChico}>{usuario.email}</Text>
        </View>
      </View>

      <View style={estilos.fila}>
        <View style={estilos.chipRol}>
          <Text style={estilos.textoChipRol}>{usuario.rol === "vecino" ? "Vecino" : "Comercio"}</Text>
        </View>
        <View style={{ flex: 1 }} />
        {editando ? (
          <>
            <Boton
              texto="Cancelar"
              variante="texto"
              compacto
              onPress={() => {
                setNombre(usuario.nombre);
                setEditando(false);
              }}
            />
            <Boton texto="Guardar" compacto cargando={guardando} onPress={guardar} />
          </>
        ) : (
          <Boton texto="Editar nombre" variante="blanco" compacto onPress={() => setEditando(true)} />
        )}
      </View>
    </TarjetaVidrio>
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
      <SeccionTitulo texto="Mis favoritos" />
      {comercios === null && <EstadoCarga texto="" style={estilos.cargaInline} />}
      {comercios?.length === 0 && (
        <TarjetaVidrio style={estilos.tarjeta}>
          <Text style={estilos.textoChico}>
            Todavía no guardaste comercios. Tocá “Guardar” en la ficha de uno para tenerlo acá.
          </Text>
        </TarjetaVidrio>
      )}
      {comercios?.map((c) => (
        <TarjetaComercio
          key={c.id}
          comercio={c}
          derecha={
            <Pressable onPress={() => quitar(c.id)} hitSlop={10} accessibilityLabel={`Quitar ${c.nombre} de favoritos`}>
              <Text style={estilos.enlace}>Quitar</Text>
            </Pressable>
          }
        />
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
      <SeccionTitulo
        texto="Rubros que me interesan"
        ayuda="Te avisamos cuando haya promos nuevas de estos rubros."
      />
      {rubros === null && <EstadoCarga texto="" style={estilos.cargaInline} />}
      <View style={estilos.chips}>
        {rubros?.map((r) => (
          <Chip key={r.id} texto={r.nombre} activo={elegidos.includes(r.id)} onPress={() => alternar(r.id)} />
        ))}
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
      <SeccionTitulo texto="Avisos" />
      <FilaSwitch
        titulo="Recibir avisos"
        descripcion={
          valor
            ? "Promos nuevas de tus favoritos y rubros, y un recordatorio el día antes de que venzan."
            : "Todos los avisos están apagados."
        }
        value={valor}
        onValueChange={cambiar}
      />
      {valor && (
        <Boton
          texto="Buscar promos nuevas ahora"
          variante="texto"
          compacto
          cargando={revisando}
          onPress={revisarAhora}
        />
      )}
    </View>
  );
}

const estilos = StyleSheet.create({
  centro: { flex: 1, justifyContent: "center", padding: 24, gap: 12 },
  pantalla: { padding: 20, paddingTop: 70, paddingBottom: 120, gap: 14 },
  tituloGrande: { fontFamily: fuentes.titulo, fontSize: 44, color: colores.pizarra, letterSpacing: -1 },
  texto: { fontFamily: fuentes.texto, fontSize: 16, color: colores.gris, marginBottom: 8, lineHeight: 22 },
  tarjeta: { gap: 12, padding: 16 },
  fila: { flexDirection: "row", alignItems: "center", gap: 12 },
  nombre: { fontFamily: fuentes.titulo, fontSize: 22, color: colores.pizarra },
  textoChico: { fontFamily: fuentes.texto, fontSize: 14, color: colores.gris, lineHeight: 19 },
  input: {
    backgroundColor: colores.blanco,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontFamily: fuentes.textoNegrita,
    fontSize: 18,
    color: colores.pizarra,
  },
  chipRol: { backgroundColor: colores.salvia, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 5 },
  textoChipRol: { fontFamily: fuentes.textoNegrita, fontSize: 13, color: colores.pizarra },
  seccion: { gap: 10, marginTop: 6 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  enlace: { fontFamily: fuentes.textoNegrita, color: colores.indigo, fontSize: 15, padding: 6 },
  cargaInline: { flex: 0, paddingVertical: 16 }
});