// Completa app.json con lo que no se puede subir al repo.
//
// La clave de Google Maps para Android se lee de GOOGLE_MAPS_API_KEY:
//  - En la compu: ponerla en .env.local (ese archivo no se sube a git).
//  - En EAS Build: cargarla como variable de entorno del proyecto en expo.dev
//    o con `eas env:create --name GOOGLE_MAPS_API_KEY --visibility sensitive`.
// Sin clave, el mapa funciona en Expo Go pero en el APK se ve gris.
module.exports = ({ config }) => {
  const clave = process.env.GOOGLE_MAPS_API_KEY;
  if (!clave) {
    console.warn("[app.config] Falta GOOGLE_MAPS_API_KEY: el mapa del APK va a verse gris.");
  }

  return {
    ...config,
    plugins: [
      ...(config.plugins ?? []),
      ["react-native-maps", { androidGoogleMapsApiKey: clave }],
    ],
  };
};
