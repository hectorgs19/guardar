# GuardApp (prototipo)

App móvil (Expo / React Native) que aparece en el menú **Compartir** de iPhone y Android. Lo que compartes desde Instagram, TikTok, YouTube, el navegador o cualquier app se guarda en GuardApp, se completa con título e imagen y se clasifica por tipo.

## Qué hace esta versión

- Recibe enlaces y texto desde el menú Compartir (iOS: extensión "GuardApp Share"; Android: intent `text/*`).
- También permite pegar un enlace o una nota a mano.
- Saca título, descripción e imagen del enlace (etiquetas Open Graph) y usa lo que mande la app de origen si la web no da nada.
- Clasifica por tipo con reglas de palabras clave: recetas, manuales, artículos, vídeos, productos, sitios, ideas, otros. Mantén pulsado un elemento para cambiar la categoría o borrarlo.
- Detecta duplicados por enlace.
- Bloque "¿Te acuerdas de esto?" con cosas guardadas hace más de 3 días que no has abierto.
- Todo se guarda en el propio móvil (SQLite). No hay servidor ni cuentas todavía.

## Cómo probarla en tu móvil

La extensión de compartir es código nativo, así que **no funciona en Expo Go**: hace falta una build propia.

Requisitos: Node 20+ y una cuenta gratuita de Expo (https://expo.dev/signup).

```bash
npm install
npx eas-cli@latest login
npx eas-cli@latest build:configure   # solo la primera vez
```

### Android (gratis)

```bash
npx eas-cli@latest build -p android --profile preview
```

Al terminar, EAS da un enlace y un QR para descargar el APK. Instálalo y ya aparece "GuardApp" al pulsar Compartir.

### iPhone

Apple solo deja instalar apps propias de dos formas:

1. **Con cuenta de Apple Developer (99 €/año):** `npx eas-cli@latest device:create` para registrar tu iPhone y luego `npx eas-cli@latest build -p ios --profile preview`. EAS crea los certificados y el App Group (`group.com.guardapp.app`) que necesita la extensión.
2. **Con un Mac y tu Apple ID gratis:** `npx expo prebuild` y `npx expo run:ios --device`, eligiendo tu equipo en Xcode (destino y extensión `GuardAppShare`). La app caduca a los 7 días y hay que reinstalarla.

### Desarrollo

```bash
npx eas-cli@latest build --profile development -p android   # o ios
npx expo start --dev-client
```

## Estructura

| Archivo | Para qué sirve |
| --- | --- |
| `App.tsx` | Pantalla principal, recepción de lo compartido, filtros y recordatorio |
| `src/capture.ts` | Guarda lo compartido, evita duplicados y completa los datos |
| `src/metadata.ts` | Lee título, descripción e imagen de un enlace |
| `src/classify.ts` | Clasificación por reglas y detección de origen |
| `src/db.ts` | Base de datos local (SQLite) |

## Siguientes pasos

- Clasificación con IA en un backend (tipo, tema, resumen y datos útiles como ingredientes).
- Cuenta y sincronización entre dispositivos.
- Resumen semanal y "recuérdamelo en…" con notificaciones.
- Compartir imágenes y vídeos, no solo enlaces.
