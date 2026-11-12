# Umbral

Aplicación móvil del **Directorio de Comercios del Centro Comercial, Industrial y de Servicios de Concepción del Uruguay** (Entre Ríos). Permite al vecino encontrar comercios cercanos, saber cuáles están abiertos ahora, ver promociones vigentes, dejar reseñas y recibir avisos; y al comercio asociado administrar su ficha, sus promociones y validar los códigos de sus clientes.

> Trabajo Integrador — Desarrollo para Móviles (2.º cuatrimestre 2026)
> Tecnicatura Universitaria en Desarrollo Web — Universidad Nacional de Entre Ríos (UNER)

## Integrantes

| Nombre | GitHub Personal | Parte desarrollada |
|---|---|---|
| Elizabeth Laila Giribaldi Jatip | [@elijatip](https://github.com/elijatip) | [Pantallas / módulos] |
| Lamine Mechedou | [@Lamine-Mechedou](https://github.com/Lamine-Mechedou)  | [Pantallas / módulos] |
| Mairene Villasmil | [@Mairene-Villasmil](https://github.com/Mairene-Villasmil) | [Pantallas / módulos] |
| Rubí Nohemí García Alarcón | [@garciarubi](https://github.com/garciarubi) | [Pantallas / módulos] |
| Valentina Angeletti | [@ValeAngeletti](https://github.com/ValeAngeletti) | [Pantallas / módulos] |

## Qué hace la app

**Para el vecino** (no necesita cuenta para mirar; la cuenta se pide para reseñar, guardar favoritos y usar promos):

- Listado de comercios, con búsqueda por nombre o por lo que venden.
- Filtro por rubro y por **abierto ahora**, calculado en el teléfono con los horarios y la hora del dispositivo.
- Ficha del comercio: fotos, descripción, horarios, teléfono, WhatsApp, redes, medios de pago y video de presentación.
- Mapa con la ubicación de la persona, filtro por rubro, orden por distancia y botón para abrir la app de mapas.
- Promociones vigentes, próximas y por vencer; las vencidas no se muestran. Las promos exclusivas de la app muestran un código QR para validar en el mostrador.
- Reseñas de una a cinco estrellas: crear, editar, borrar y reportar.
- Favoritos, rubros de interés y avisos (notificaciones locales) por promos nuevas o por vencer, que se pueden apagar todos juntos.
- Funciona sin conexión con el último listado guardado y avisa cuándo lo que se muestra quedó viejo.

**Para el comercio** (cuenta de rol *comercio*):

- Editar datos, horarios, fotos y video.
- Cargar, editar y dar de baja promociones.
- Escanear el QR del cliente (previa huella o rostro) para registrar el uso de una promo.
- Ver cuántas veces se usó cada promo y responder reseñas.

## Tecnologías

| Qué | Con qué |
|---|---|
| Framework | React Native con Expo (SDK 57) |
| Lenguaje | TypeScript |
| Navegación | Expo Router |
| Estilos | `StyleSheet` |
| Entrega | Build de producción con EAS (APK, perfil `preview`) |

**Paquetes de Expo y del dispositivo**

| Capacidad | Paquete |
|---|---|
| Sesión segura (token) | `expo-secure-store` |
| Huella o rostro | `expo-local-authentication` |
| Cámara y lectura de QR | `expo-camera` |
| Galería | `expo-image-picker` |
| Archivos locales | `expo-file-system` (API nueva: `File`, `Directory`, `Paths`) |
| Ubicación y mapas | `expo-location`, `react-native-maps` |
| Notificaciones locales | `expo-notifications` |
| Datos sin conexión y preferencias | `expo-sqlite`, `expo-sqlite/kv-store` |
| Estado de la red | `expo-network` |
| Háptica y sensores | `expo-haptics`, `expo-sensors` |
| Video | `expo-video` |
| Diseño | `expo-blur`, `expo-linear-gradient`, `react-native-svg`, `expo-font` |
| Íconos | `@react-native-vector-icons/ionicons` |
| QR en pantalla | `react-native-qrcode-svg` |

## Diseño

Interfaz moderna y fluida: vidrio esmerilado, degradados suaves y formas orgánicas.

- **Paleta:** niebla `#F2F4F7`, salvia `#CFE3D8`, lila `#D9D4F0`, durazno `#F8D9C8`, celeste `#CFE2F3`, pizarra `#2B3441` e índigo apagado `#7C8CE0`.
- **Tipografías:** Sora (títulos) y Plus Jakarta Sans (texto).

## Estructura del proyecto

```
app/                  Pantallas (Expo Router)
├── (tabs)/           Buscar, Promos, Mapa, Yo
├── (auth)/           Ingreso y registro
├── comercio/[id]     Ficha del comercio
├── promo/[id]        Detalle de la promoción y código
└── panel/            Lado del comercio
src/
├── tipos/            Interfaces (Comercio, Rubro, Promocion, Resena, Usuario...)
├── servicios/        Capa de acceso a la API (cliente.ts, comercios.ts, auth.ts...)
├── db/               SQLite: datos para usar sin conexión
├── almacenamiento/   secure-store (token) y kv-store (preferencias)
├── hooks/            useRed, useUbicacion, useAbiertoAhora...
├── utils/            abiertoAhora, distancia
├── componentes/      Componentes de interfaz reutilizables
└── tema/             Colores y tipografías
assets/               Ícono, pantalla de presentación e imágenes
```

Decisiones de diseño del código:

- Las pantallas **nunca llaman a la API directamente**: todo pasa por `src/servicios/`.
- El token de sesión vive en `expo-secure-store`, nunca en `kv-store`.
- "Abierto ahora" **no es un dato de la API**: se calcula en el teléfono.
- Todas las respuestas de la API (`datos`, `meta`, `error`) se interpretan en un solo lugar (`src/servicios/cliente.ts`).

## Cómo ejecutarla

**Requisitos:** Node.js 24 (LTS), un teléfono con Expo Go o el APK, y estar en la misma red Wi-Fi si se usa una API local.

```bash
git clone [URL-DEL-REPO]
cd [carpeta-del-proyecto]
npm install
npx expo start
```

Escaneá el QR con Expo Go (Android) o con la cámara (iPhone). Si cambiás las variables de entorno, reiniciá con `npx expo start -c`.

## Variables de entorno

El archivo `.env` está incluido en el repositorio porque contiene solo valores públicos:

```
EXPO_PUBLIC_API_URL=[URL pública de la API, sin barra final]
```

Para apuntar a una API local sin tocar lo compartido, creá un `.env.local` (no se sube al repositorio):

```
EXPO_PUBLIC_API_URL=http://192.168.X.X:3000
```

Los secretos (contraseña de la base, `JWT_SECRETO`, claves de almacenamiento) **no** van en este repositorio.

## API

La app consume la API provista por la cátedra, publicada en Render con base de datos y archivos en Supabase.

- **API publicada:** [URL]
- **Documentación (Swagger):** `[URL]/docs`
- **Estado:** `[URL]/salud`
- **Repositorio de la API:** [URL del repo de la API]

> La API gratuita de Render se duerme tras 15 minutos sin uso y tarda cerca de un minuto en despertar. La primera pantalla puede demorar: la app muestra el estado de carga.

**Cuentas de demostración** (contraseña `demo1234`):

| Email | Rol |
|---|---|
| `marta@mail.com` | Vecino |
| `nuevo@demo.ar` | Vecino sin datos |
| `tornillo@demo.ar` | Comercio (Ferretería El Tornillo) |
| `otro.comercio@demo.ar` | Comercio |

## Generar el APK

```bash
npm install -g eas-cli
eas login
eas build --platform android --profile preview
```

El build usa el perfil `preview` de `eas.json` y genera un APK instalable sin Metro ni computadora. La clave de Google Maps para Android está configurada en `app.json` (`android.config.googleMaps.apiKey`) y restringida al paquete y a la huella del certificado.

**APK entregado:** [Link del build]

## Permisos que pide la app

| Permiso | Para qué |
|---|---|
| Ubicación | Mostrar comercios cercanos y ordenar por distancia. Si se niega, se puede buscar por nombre y por rubro. |
| Cámara | Escanear el QR del cliente (cuenta de comercio). |
| Galería | Subir fotos del local (cuenta de comercio). |
| Notificaciones | Avisos de promociones nuevas o por vencer. |
| Biometría | Reingreso con huella o rostro, con alternativa para dispositivos que no la tengan. |

## Requisitos mínimos de la consigna

- [ ] Pantallas y navegación con Expo Router
- [ ] Autenticación: registro, ingreso, sesión persistente, token en `expo-secure-store` y reingreso con `expo-local-authentication`
- [ ] Consumo de la API con capa de servicios y estados de carga, vacío y error
- [ ] Cámara (`expo-camera`) o galería (`expo-image-picker`) y archivos con `expo-file-system`
- [ ] Ubicación y mapas (`expo-location` + `react-native-maps`), usable si se niega el permiso
- [ ] Notificaciones locales disparadas por un hecho real de la app
- [ ] Persistencia con `expo-sqlite` y `kv-store`, y aviso del estado de la red con `expo-network`
- [ ] Háptica o sensores con un uso justificado
- [ ] Multimedia: video con controles visibles (`expo-video`)
- [ ] Ícono (1024×1024, sin transparencias), pantalla de presentación y nombre propios

## Problemas frecuentes

| Qué pasa | Qué hacer |
|---|---|
| La app no carga datos | Revisá `EXPO_PUBLIC_API_URL` y reiniciá con `npx expo start -c`. La URL va sin `/salud` y sin barra final. |
| La primera carga tarda | La API gratuita de Render se estaba despertando. Esperá un minuto. |
| El mapa se ve en blanco en el APK | Revisá la clave de Google Maps y que el paquete y el SHA-1 de la restricción coincidan con los del build. |
| El mapa no aparece en Expo Go | Esperable: la clave de `app.json` se aplica en el build, no en Expo Go. |

## Licencia y créditos

Proyecto académico. Datos y API provistos por la cátedra de Desarrollo para Móviles, UNER. Cliente del caso: Centro Comercial, Industrial y de Servicios de Concepción del Uruguay.
