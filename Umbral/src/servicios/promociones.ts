import { obtenerToken } from '../almacenamiento/seguro';
import type { Promocion } from '../tipos';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://api-directorio-comercios.onrender.com';

export type { Promocion };

export const promocionesService = {
  async obtenerTodas(): Promise<Promocion[]> {
    const token = await obtenerToken();
    const res = await fetch(`${API_URL}/api/promociones`, {
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    if (!res.ok) throw new Error('Error al obtener las promociones');
    return await res.json();
  },

  async obtenerPorId(id: string): Promise<Promocion> {
    const token = await obtenerToken();
    const res = await fetch(`${API_URL}/api/promociones/${id}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    if (!res.ok) throw new Error('Error al obtener el detalle de la promoción');
    return await res.json();
  },

  async canjearPromocion(codigoQR: string): Promise<{ success: boolean; mensaje: string }> {
    const token = await obtenerToken();
    const res = await fetch(`${API_URL}/api/promociones/canjear`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ codigoQR }),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.message || 'Error al validar el código QR');
    }

    return await res.json();
  },

  async eliminarPromocion(id: string): Promise<void> {
    const token = await obtenerToken();
    await fetch(`${API_URL}/api/promociones/${id}`, {
      method: 'DELETE',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
  },

  // Alias para mantener compatibilidad con las pantallas
  async obtenerPromociones(): Promise<Promocion[]> {
    return this.obtenerTodas();
  },
  async obtenerPromocionPorId(id: string): Promise<Promocion> {
    return this.obtenerPorId(id);
  },
  async validarCodigoQR(codigoQR: string): Promise<{ success: boolean; mensaje: string }> {
    return this.canjearPromocion(codigoQR);
  },
};