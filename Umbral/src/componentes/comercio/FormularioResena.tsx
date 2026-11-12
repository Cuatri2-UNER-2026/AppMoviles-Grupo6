import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { colores, fuentes } from "../../tema";
import { Campo } from "../formularioAuth";
import { Aviso } from "../ui/Aviso";
import { Boton } from "../ui/Boton";
import { TarjetaVidrio } from "../ui/TarjetaVidrio";
import { SelectorEstrellas } from "./SelectorEstrellas";

export interface ValoresResena {
  estrellas: number;
  comentario: string;
}

interface Props {
  valoresIniciales?: ValoresResena;
  textoBoton: string;
  guardando?: boolean;
  /** Mensaje de la API (por ejemplo "Ya dejaste una reseña en este comercio"). */
  errorApi?: string | null;
  onGuardar: (datos: { estrellas: 1 | 2 | 3 | 4 | 5; comentario: string }) => void;
  onCancelar: () => void;
}

/** Formulario único para escribir y para editar una reseña. */
export function FormularioResena({
  valoresIniciales = { estrellas: 0, comentario: "" },
  textoBoton,
  guardando,
  errorApi,
  onGuardar,
  onCancelar,
}: Props) {
  const [estrellas, setEstrellas] = useState(valoresIniciales.estrellas);
  const [comentario, setComentario] = useState(valoresIniciales.comentario);
  const [errores, setErrores] = useState<{ estrellas?: string; comentario?: string }>({});

  function enviar() {
    const e: typeof errores = {};
    if (estrellas < 1) e.estrellas = "Elegí cuántas estrellas le das.";
    if (!comentario.trim()) e.comentario = "Escribí un comentario.";
    setErrores(e);
    if (Object.keys(e).length > 0) return;
    onGuardar({ estrellas: estrellas as 1 | 2 | 3 | 4 | 5, comentario: comentario.trim() });
  }

  return (
    <TarjetaVidrio style={estilos.tarjeta}>
      <View style={{ gap: 6 }}>
        <Text style={estilos.etiqueta}>Tu puntuación</Text>
        <SelectorEstrellas valor={estrellas} onChange={setEstrellas} />
        {errores.estrellas ? <Text style={estilos.error}>{errores.estrellas}</Text> : null}
      </View>

      <Campo
        etiqueta="Tu comentario"
        valor={comentario}
        alCambiar={setComentario}
        error={errores.comentario}
        placeholder="Contá cómo te atendieron…"
        autoCapitalize="sentences"
        multiline
        maxLength={1000}
      />

      {errorApi ? <Aviso icono="alert-circle-outline" texto={errorApi} /> : null}

      <View style={{ gap: 4 }}>
        <Boton texto={textoBoton} onPress={enviar} cargando={guardando} />
        <Boton texto="Cancelar" variante="texto" onPress={onCancelar} deshabilitado={guardando} />
      </View>
    </TarjetaVidrio>
  );
}

const estilos = StyleSheet.create({
  tarjeta: { gap: 14, padding: 18, borderRadius: 32 },
  etiqueta: { fontFamily: fuentes.textoNegrita, fontSize: 14, color: colores.pizarra, marginLeft: 6 },
  error: { fontFamily: fuentes.textoMedio, color: colores.error, fontSize: 13, marginLeft: 6 },
});