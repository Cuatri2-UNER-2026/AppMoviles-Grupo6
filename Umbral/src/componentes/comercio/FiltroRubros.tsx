import {
    ScrollView,
    StyleSheet,
    type StyleProp,
    type ViewStyle,
} from "react-native";
import type { Rubro } from "../../tipos";
import { Chip } from "../ui/Chip";

interface Props {
    rubros: Rubro[];
    rubroId: string | null;
    onChange: (id: string | null) => void;
    /** Punto de color en cada chip (mapa). */
    conColor?: boolean;
    /** Chips blancos con sombra (mapa). */
    solido?: boolean;
    contentStyle?: StyleProp<ViewStyle>;
}

/** Fila horizontal "Todos + un chip por rubro". Tocar el rubro activo lo apaga. */
export function FiltroRubros({
    rubros,
    rubroId,
    onChange,
    conColor,
    solido,
    contentStyle,
}: Props) {
    return (
        <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={[estilos.fila, contentStyle]}>
            <Chip
                texto="Todos"
                activo={rubroId === null}
                onPress={() => onChange(null)}
                solido={solido}
            />
            {rubros.map((r) => (
                <Chip
                    key={r.id}
                    texto={r.nombre}
                    color={conColor ? r.color : undefined}
                    solido={solido}
                    activo={rubroId === r.id}
                    onPress={() => onChange(rubroId === r.id ? null : r.id)}
                />
            ))}
        </ScrollView>
    );
}

const estilos = StyleSheet.create({ fila: { gap: 8, paddingRight: 16 } });
