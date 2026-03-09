# ⚖️ 01_TECH_STACK_AND_RULES

## 💻 Tech Stack & Frameworks

### Backend
- **Sprache:** Python 3.x
- **Framework:** FastAPI
- **Server:** Uvicorn (lokal) / Gunicorn (Produktion)
- **Datenbank-ORM:** SQLAlchemy
- **Datenbank:** SQLite (Lokal/Fallback) / PostgreSQL (via psycopg2)
- **Authentifizierung:** JWT (python-jose, passlib)

### Mobile (Frontend)
- **Sprache:** JavaScript (mit ES6+ Features)
- **Framework:** React Native (`0.81.5`)
- **Plattform / Build-Tool:** Expo (`~54.0.31`)
- **Navigation:** Custom State-basierte Navigation in `app/index.js` (Wechsel der Screens über den State `currentScreen`).

### Hosting & Cloud Infrastruktur
- **Backend API:** [Render](https://render.com) (via `render.yaml`)
- **Datenbank & File Storage:** [Supabase](https://supabase.com) (PostgreSQL & S3-kompatibler Video-Speicher)
- **Frontend (Web):** [Vercel](https://vercel.com) (Frontend Deployment des Expo Web-Builds)

## 📚 Essenzielle Libraries

### Backend
- `python-multipart` & `httpx`: Für Datei-Uploads und externe Requests.
- `redis`: Für Caching oder Hintergrundprozesse.
- `boto3`: AWS S3 SDK (für Video-Storage in Produktion/MinIO).
- `fastapi-mail` (vermutlich verwendet, um Emails zu senden, wie bei Registrierungen).

### Mobile
- `expo-router`: Für das initiale Setup installiert, aber scheinbar wird stark mit einer State-basierten Single-Page-App Logik in `index.js` gearbeitet.
- `react-native-video` & `expo-video`: Für die Darstellung und Wiedergabe der Rezept-Videos.
- `react-native-compressor`: Lokale Komprimierung der Videos *vor* dem Upload.
- `@react-native-async-storage/async-storage`: Lokales Speichern des Session-Tokens (`userToken`).

## 📏 Coding Conventions

### Namenskonventionen
- **Python (Backend):** `snake_case` für Variablen, Funktionen und Dateinamen (`auth_router.py`, `get_db`). `PascalCase` für Klassen (`User`, `Recipe`).
- **JavaScript (Mobile):** `camelCase` für Variablen und Funktionen (`loadMyProfile`, `toggleLike`). `PascalCase` für React-Komponenten und Dateinamen (`FeedScreen.js`, `UserProfileModal.js`).

### Architektur-Regeln
- **Backend-Modularität:** Keine Gott-Klassen in `main.py`. Alle Endpunkte sind strikt nach Domäne in den `routers/` (z. B. `users_router.py`, `video_router.py`) unterteilt und über `APIRouter` eingebunden.
- **Mobile Komponenten:** Wiederverwendbare UI-Elemente wie Modals (z. B. `CommentsModal.js`) sind strikt von den Screens (`FeedScreen.js`) im Ordner `components/` getrennt, um `index.js` sauberer zu halten.
- **Global Config:** Frontend-URLs und Theme-Farben werden zentral in `constants/Config.js` gepflegt, damit Änderungen global greifen (`BASE_URL`).

## 📡 Kommunikation (Mobile ↔ Backend)

Die Applikation nutzt eine **REST API**.
- Die Kommunikation erfolgt über klassische `fetch`-Aufrufe innerhalb der React-Komponenten.
- **Sockets/GraphQL:** Aktuell nicht im Einsatz.
- **Auth:** Requests an geschützte Backend-Endpunkte erfordern einen HTTP-Header: `Authorization: Bearer <token>`.

## 🤖 KI & Workflow Regeln

- **Git & Commits:** Bevor Code-Änderungen über Git committet oder gepusht werden, **muss** zwingend der Nutzer gefragt werden: *„Sollen wir die Änderungen jetzt pushen?"*. Pushen darf niemals ohne ausdrückliche Freigabe passieren. **Nach jeder abgeschlossenen Änderung** (z. B. nach einem Feature, Bugfix oder Refactoring) soll der Nutzer aktiv gefragt werden, ob die Änderungen committet und gepusht werden sollen.
