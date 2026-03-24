# 📄 PROJECT_HANDOVER_CONTEXT (RezeptTok)

Dieses Dokument dient als vollständiger Kontext für eine KI, um nahtlos an diesem Projekt (RezeptTok) weiterzuarbeiten. Es enthält die Architektur, Tech-Stack, Coding-Rules und konkrete Implementierungs-Guides.

---

## 🏗️ 1. Projekt-Übersicht & Architektur

RezeptTok ist eine "TikTok for Recipes" App mit einem FastAPI-Backend und einem React Native (Expo) Frontend.

### Dateibaum (Grob)
```text
RezeptTok/
├── backend/                   # Python FastAPI Backend
│   ├── algorithms/            # KI-Logik (z.B. Feed-Ranking)
│   ├── infrastructure/        # Externe Dienste (S3, Mail)
│   ├── routers/               # API Endpunkte (Controller)
│   ├── services/              # Geschäftslogik
│   ├── main.py                # Haupteinstiegspunkt
│   ├── models.py              # SQLAlchemy DB-Modelle
│   ├── schemas.py             # Pydantic Schemas (Validation)
│   └── requirements.txt       # Abhängigkeiten
│
├── mobile/                    # React Native (Expo) Frontend
│   ├── app/                   # Root (index.js mit Custom Routing State)
│   ├── components/            # Wiederverwendbare UI (Pill-Shapes, Glassmorphism)
│   ├── constants/             # Config.js (Theming, Base URL)
│   ├── screens/               # Haupt-Ansichten (Feed, Profile, Search)
│   ├── services/              # API-Kommunikation (VideoUploadService)
│   └── package.json           # JS Abhängigkeiten
│
├── .ai_context/               # Detaillierte MD-Dokumentation (Source of Truth)
└── docker-compose.yml         # Lokale Infrastruktur (Postgres, Redis, MinIO)
```

---

## 🛠️ 2. Tech Stack

### Backend
- **Framework:** FastAPI
- **Sprache:** Python 3.x
- **ORM:** SQLAlchemy
- **Datenbank:** Supabase PostgreSQL (Produktion) / SQLite (Lokal)
- **Authentifizierung:** JWT (Bearer Tokens)
- **Email:** `fastapi-mail`
- **Rate Limiting:** `slowapi` (Globale Limits: 100/min, Auth: 5/min)

### Mobile (Frontend)
- **Framework:** React Native (`0.81.5`) mit Expo (`~54.0.31`)
- **Navigation:** **State-basiert** in `app/index.js` (State: `currentScreen`).
- **Media:** `expo-video` für Playback.
- **Storage:** `@react-native-async-storage/async-storage` für Session-Token.

---

## 📏 3. Coding Rules & Styleguide

### Namenskonventionen
- **Python:** `snake_case` für Funktionen/Variablen, `PascalCase` für Klassen.
- **JavaScript:** `camelCase` für Variablen/Funktionen, `PascalCase` für Komponenten/Dateien.

### Architektur-Regeln
- **Backend (4-Layer):** Router -> Service -> (optional Algorithm) -> Model. Router dürfen keine schwere Logik enthalten.
- **Mobile UI (Premium Aesthetic):** 
    - **Dark Mode:** Deep Charcoal/Black Hintergründe.
    - **Akzente:** `THEME_COLOR` (Orange/Coral) für primäre Aktionen.
    - **Shapes:** Überall Pill-Shapes (`borderRadius: 24` oder `50%`). Keine spitzen Ecken.
    - **Glassmorphism:** Sekundäre Flächen nutzen `rgba(255, 255, 255, 0.1)`.

### Kommunikation (Mobile ↔ Backend)
- **REST API:** Kommunikation ausschließlich über `fetch`. 
- **Auth-Header:** `Authorization: Bearer <token>`.
- **Base URL:** Muss aus `constants/Config.js` bezogen werden.

---

## 🚀 4. "How-To" Implementierungs-Guides

### Wie füge ich einen neuen Router/Endpoint hinzu?
1. **Modelle:** Definiere das SQLAlchemy-Modell in `backend/models.py`.
2. **Schemas:** Erstelle Pydantic Modells in `backend/schemas.py` für Request & Response.
3. **Router:** Erstelle eine neue Datei in `backend/routers/` (z.B. `new_feature_router.py`).
    - Nutze `router = APIRouter(prefix="/new", tags=["New"])`.
    - Implementiere Endpunkte mit Dependency Injection für DB (`get_db`).
4. **Registrierung:** Importiere und inkludiere den Router in `backend/main.py` via `app.include_router()`.

### Wie füge ich einen neuen Screen hinzu?
1. **Screen-Datei:** Erstelle `mobile/screens/NewScreen.js`.
2. **Navigation-Update:**
    - Füge den Key (z.B. `'new_feature'`) in `app/index.js` zur Screen-Logik hinzu.
    - Erweitere das `renderScreen()`-Switch-Statement.
    - Update die `navBar` oder Trigger-Logik, um `setCurrentScreen('new_feature')` zu setzen.

---

## 🤖 5. KI-Workflow (SOP)
- **Plan First:** Erst `implementation_plan.md` erstellen, dann umsetzen.
- **Verification:** Bevor eine Aufgabe als erledigt gilt, müssen Tests (Python-Skripte in `.tmp/`) oder manuelle UI-Checks (Screenshots/Logs) erfolgen.
- **No Push without Permission:** Vor `git push` den User fragen.

---
*Generated for seamless transition to any Agentic AI.*
