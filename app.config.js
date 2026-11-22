// Con GUARDAPP_SIN_EXTENSION=1 se compila sin la extensión de Compartir de iOS
// (necesaria para instalar con una cuenta gratuita de Apple, que no permite App Groups).
// En ese caso se comparte con el Atajo de iOS (ver README).
module.exports = ({ config }) => {
  if (process.env.GUARDAPP_SIN_EXTENSION !== '1') return config;
  return {
    ...config,
    plugins: (config.plugins || []).map((p) =>
      Array.isArray(p) && p[0] === 'expo-share-intent' ? [p[0], { ...p[1], disableIOS: true }] : p,
    ),
  };
};
