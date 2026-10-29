// Puente a expo-notifications sin pasar por su index.
// En SDK 57 el index carga el módulo nativo de push por temas
// (ExpoTopicSubscriptionModule), que Expo Go no trae, y la app se cae al abrir.
// Importando cada función por separado sólo usamos lo de notificaciones locales.
export { AndroidImportance } from "expo-notifications/build/NotificationChannelManager.types";
export { SchedulableTriggerInputTypes } from "expo-notifications/build/Notifications.types";
export { setNotificationHandler } from "expo-notifications/build/NotificationsHandler";
export {
  getPermissionsAsync,
  requestPermissionsAsync,
} from "expo-notifications/build/NotificationPermissions";
export { addNotificationResponseReceivedListener } from "expo-notifications/build/NotificationsEmitter";
export { setNotificationChannelAsync } from "expo-notifications/build/setNotificationChannelAsync";
export { scheduleNotificationAsync } from "expo-notifications/build/scheduleNotificationAsync";
export { getAllScheduledNotificationsAsync } from "expo-notifications/build/getAllScheduledNotificationsAsync";
export { cancelScheduledNotificationAsync } from "expo-notifications/build/cancelScheduledNotificationAsync";
export { cancelAllScheduledNotificationsAsync } from "expo-notifications/build/cancelAllScheduledNotificationsAsync";
