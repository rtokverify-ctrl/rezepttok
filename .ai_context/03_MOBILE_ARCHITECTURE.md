# 📱 03_MOBILE_ARCHITECTURE

## 🖼️ Screens (Unter `screens/`)

1. **`AuthScreen.js`**: Handle-Screen für Login und Registrierung der Benutzer.
2. **`SetupScreen.js`**: Onboarding-Bildschirm, hier können neue Nutzer nach der Registrierung ihr Profil vervollständigen (Anzeigename etc.).
3. **`FeedScreen.js`**: Das Herzstück der App. Ein vertikal scrollbarer Video-Feed (ähnlich TikTok), in dem User Rezepte anschauen, liken, kommentieren und teilen können.
4. **`SearchScreen.js`**: Suchfunktion für User und Rezepte.
5. **`UploadScreen.js`**: UI und Logik zum Hochladen eines neuen Rezepts. Videos werden hier ausgewählt, ggf. komprimiert, und an das Backend geschickt.
6. **`CookingScreen.js`**: Spezieller Modus ("Schritt-für-Schritt") zum Nachkochen der ausgewählten Rezepte, oft gekoppelt mit Voice-Control und Timer-Features.
7. **`NotificationScreen.js`**: Übersicht der Benachrichtigungen (Likes, Follows, neue Postings).
8. **`ProfileScreen.js`**: Zeigt das eigene Profil oder das Profil anderer "Chefs". Beinhaltet eigene Videos, gelikte Videos, gespeicherte Videos und Sammlungen (Collections).

## 🧭 Navigation

Obwohl `expo-router` im Projekt installiert ist, basiert die Hauptnavigation innerhalb der App derzeit stark auf **State-Management**.
Die Datei `app/index.js` agiert als Root-Container und kontrolliert den aktiven Bildschirm über die State-Variable `currentScreen` (z. B. `auth`, `feed`, `upload`, `profile`).
Unten wird eine statische `navBar` View gerendert, welche über `TouchableOpacity` Elemente schlicht den State `currentScreen` aktualisiert.
Für Modals (Comments, Recipe Info, User Profile) werden echte React Native `<Modal>` Komponenten an das Ende von `index.js` angelegt und über boolesche States (`modalVisible`, `commentsVisible`) getogglet.

## 💾 State Management

- **Local State:** Das gesamte App-State Management läuft nativ über React Hooks (`useState`, `useEffect`). Es gibt **kein** Redux oder Zustand.
- **Root State (Lifting State Up):** Da die Navigation über `index.js` läuft, werden kritische globale Daten (wie `videos`, `myProfileData`, `userToken`) im Root-Component geladen und via 'Props drilling' an die einzelnen Screens (z. B. `<FeedScreen videos={videos} />`) nach unten gereicht.
- **Persistenz:** Das Sitzungs-Token wird mit `@react-native-async-storage/async-storage` auf dem Gerät gespeichert, sodass die Session nach einem App-Neustart erhalten bleibt (`checkLogin`).

## 🛜 Services (Kommunikation)

Externe Server-Kommunikation und Hardware-Zugriffe sind abstrahiert:
- **Ausgelagerte Services:** Logiken für spezielle Features liegen im Ordner `services/`, z. B.:
  - `VideoUploadService.js`: Handhabt spezielle Upload-Streams oder Chunkings zum Backend.
  - `VoiceControlService.js`: Handhabt Sprachsteuerung (z. B. "Weiter", "Zurück") im Cooking-Mode.
- Die REST-Kommunikation wird dezentral mit `fetch()` durchgeführt. Die URL-Konstruktion baut dabei immer auf der globalen `BASE_URL` (aus `constants/Config.js`) auf, um reibungslos zwischen lokaler und Produktion-Umgebung wechseln zu können.
