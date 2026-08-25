# MecaTrack | Bitácora de Taller + Recordatorios de Mantenimiento

## Descripción general
MecaTrack es una aplicación móvil pensada para mecánicos y talleres, que permite gestionar vehículos,
órdenes de trabajo y recordatorios de mantenimiento en un solo lugar. Reemplaza las libretas físicas y
planillas sueltas por un sistema digital simple, que además avisa de forma automática cuándo un vehículo
necesita su próximo service, según kilómetros o fecha.

## Objetivo del proyecto
Desarrollar una aplicación funcional en Expo Go que digitalice el flujo de trabajo de un taller mecánico:
registro de clientes y vehículos, historial de servicios, y alertas automáticas de mantenimiento preventivo.

## Pantallas de la aplicación
1. **Home / Dashboard** — Resumen general: autos en taller, próximos services vencidos y alertas.
2. **Lista de vehículos** — Buscador por patente o cliente, con indicador de estado (en espera, en reparación,
listo).
3. **Ficha de vehículo** — Datos del auto, historial de servicios en línea de tiempo, y botón para nueva orden.
4. **Nueva / Editar orden de trabajo** — Diagnóstico, repuestos, mano de obra, costo y cálculo del próximo
service.
5. **Nuevo vehículo / cliente** — Formulario de alta rápida.
6. **Notificaciones** — Listado de vehículos con mantenimiento próximo a vencer.
7. **Configuración** — Datos del taller y exportación de backup (opcional).

## Modelo de datos (SQLite local)
| Entidad  | Campos principales |
| :---  | :---  |
| Cliente  | id, nombre, teléfono  |
| Vehículo  | id, cliente_id, patente, marca, modelo, año, km_actual  |
| Orden de trabajo  | id, vehiculo_id, fecha, km_al_momento, diagnóstico, repuestos, costo, próximo_service_km, próximo_service_fecha |
| Repuesto (opcional)   | id, nombre, cantidad, precio |
 
## Stack técnico

| Necesidad  | Librería |
| :---  | :---  |
| Navegación  | @react-navigation/native + native-stack  |
| Base de datos local  | expo-sqlite  |
| Formularios  | react-hook-form |
| Notificaciones locales   | expo-notifications |
| Fechas   | dayjs |
| PDF de presupuesto (opcional)   | expo-print + expo-sharing |
| Íconos  | @expo/vector-icons |
| Estilos  | nativewind o StyleSheet |

> [!NOTE]
> Todo el stack funciona 100% en Expo Go, sin necesidad de generar un build nativo.

## Lógica clave del sistema
- **Cálculo automático de próximo service:** al cargar una orden de trabajo, la app calcula el próximo vencimiento (ej: km_actual + 10.000 km) y lo guarda junto al vehículo.
- **Chequeo de vencidos:** al abrir la app, se compara el km actual de cada vehículo contra su próximo service, mostrando alertas si está cerca o vencido.
- **Notificaciones push locales:** programadas automáticamente según la fecha estimada del próximo mantenimiento.

## Plan de desarrollo sugerido
1. Setup del proyecto y navegación entre pantallas (con datos de prueba).
2. Modelo de datos en SQLite y funciones CRUD.
3. Conexión de las pantallas con la base de datos real.
4. Lógica de cálculo de próximo service y alertas en el dashboard.
5. Implementación de notificaciones locales.
6. Pulido de interfaz (paleta oscura con acentos naranja/amarillo, estilo taller).
7. (Opcional) Exportación de orden de trabajo como PDF.
Proyecto académico — Desarrollo de aplicaciones móviles con React Native y Expo
