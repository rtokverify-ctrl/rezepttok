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
- `expo-router`: Für das initiale Setup installed, aber scheinbar wird stark mit einer State-basierten Single-Page-App Logik in `index.js` gearbeitet.
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

## 🤖 KI & Workflow Regeln (STRICTLY ENFORCED)

### 1. 3-Layer Architecture (Directives, Orchestration, Execution)
- **Layer 1: Directive (What to do)**: Standard Operating Procedures (SOPs) in `tasks/directives/` (z.B. `create_backend_endpoint.md`). Beinhaltet Ziele, Inputs, Tools und Edge Cases. Vor jeder Aufgabe muss hier zuerst nach einer Direktive gesucht werden.
- **Layer 2: Orchestration (Decision making)**: Die KI (Agent) plant, liest Direktiven, steuert die Tools und verbessert die Direktiven bei neuen Erkenntnissen.
- **Layer 3: Execution (Doing the work)**: Fehleranfällige und komplexe Aufgaben sollen als deterministische Python/Shell Skripte unter `scripts/` (bzw. `backend/scripts/`) abgelegt und von der KI ausgeführt werden, anstatt sie "manuell" abzuarbeiten.

### 2. Temporäre Dateien (.tmp/)
- Sämtliche temporären Analysedateien, Log-Outputs, Scrape-Ergebnisse oder Zwischenstände müssen zwingend im Ordner `.tmp/` abgelegt werden, um den Workspace sauber zu halten.

### 3. Verification Before Done
- Never mark a task complete without proving it works.
- Run tests, check logs, and explicitly demonstrate correctness before finishing.

### 2. Autonomous Bug Fixing
- When given a bug report: just fix it. Do not ask for hand-holding.
- Point at logs, errors, failing tests - then resolve them. Zero context switching required from the user.

### 3. Demand Elegance (Balanced)
- For non-trivial changes: pause and ask "is there a more elegant way?"
- If a fix feels hacky: "Knowing everything I know now, implement the elegant solution".
- Skip this for simple, obvious fixes - don't over-engineer.

### 4. Self-Improvement Loop
- After ANY correction from the user: update `tasks/lessons.md`.
- Write rules for yourself that prevent the same mistake.
- Ruthlessly iterate on these lessons until mistake rate drops. Review `tasks/lessons.md` at session start.

### 5. Task Management (Plan First)
- Write plan to `tasks/todo.md` with checkable items before starting implementation for non-trivial tasks (3+ steps).
- Verify the plan with the user before starting.
- Track progress by marking items complete as you go. Explain changes with a high-level summary at each step.

### 6. Subagent Strategy
- Use subagents liberally to keep main context window clean.
- Offload research, exploration, and parallel analysis to subagents.

### 8. Self-Improvement & Directives (Self-Annealing)
- Wenn ein deterministisches Skript aus `scripts/` fehlschlägt oder ein Workflow optimiert werden kann: Optimiere das Skript, teste es und *aktualisiere zwingend auch die dazugehörige Direktive* in `tasks/directives/`. Das System lernt dadurch stetig dazu.

### 9. Git & Commits
- Bevor Code-Änderungen über Git committet oder gepusht werden, **muss** zwingend der Nutzer gefragt werden: *„Sollen wir die Änderungen jetzt pushen?"*. Pushen darf niemals ohne ausdrückliche Freigabe passieren. **Nach jeder abgeschlossenen Änderung** soll der Nutzer aktiv gefragt werden.
