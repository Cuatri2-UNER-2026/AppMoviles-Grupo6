import { useCallback, useEffect, useRef, useState } from "react";

export function useCarga<T>(funcion: () => Promise<T>, deps: unknown[] = []) {
    const [datos, setDatos] = useState<T | null>(null);
    const [cargando, setCargando] = useState(true);
    const [refrescando, setRefrescando] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const pedido = useRef(0);

    const cargar = useCallback(async (esRefresco: boolean) => {
        const mio = ++pedido.current;
        if (esRefresco) setRefrescando(true);
        else setCargando(true);
        setError(null);
        try {
            const resultado = await funcion();
            if (mio === pedido.current) setDatos(resultado);
        } catch (e) {
            if (mio === pedido.current) {
                setError(e instanceof Error ? e.message : "Algo salió mal.");
                setDatos(null);
            }
        } finally {
            if (mio === pedido.current) {
                setCargando(false);
                setRefrescando(false);
            }
        }
    }, deps);

    useEffect(() => {
        cargar(false);
    }, [cargar]);

    return {
        datos,
        setDatos,
        cargando,
        refrescando,
        error,
        reintentar: () => cargar(false),
        refrescar: () => cargar(true),
    };
}
