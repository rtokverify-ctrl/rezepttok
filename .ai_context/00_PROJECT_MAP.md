# 🗺️ 00_PROJECT_MAP

## 🌳 Dateibaum / Struktur

```text
RezeptTok/
├── backend/                   # Python FastAPI Backend
│   ├── algorithms/            # KI & Sortier-Algorithmen
│   ├── infrastructure/        # Infrastruktur & externe Services (AWS, etc.)
│   ├── routers/               # API Endpunkte (Auth, Users, Recipes, etc.)
│   ├── services/              # Geschäftslogik & externe Integrationen
│   ├── static/                # Statische Dateien (z. B. Video-Uploads lokal)
│   ├── venv/                  # Virtuelle Python-Umgebung
│   ├── main.py                # Haupteinstiegspunkt des Backends
│   ├── database.py             # Datenbankverbindung & Session
│   ├── models.py              # SQLAlchemy Datenbankmodelle
│   ├── schemas.py             # Pydantic Schemas für Request/Response Validierung
│   └── requirements.txt       # Python Abhängigkeiten
│
├── mobile/                    # React Native (Expo) Frontend
│   ├── app/                   # Haupteinstiegspunkt (index.js mit Custom Routing State)
│   ├── assets/                # Bilder, Fonts, Icons
│   ├── components/            # Wiederverwendbare UI-Komponenten (Modals, Buttons)
│   ├── constants/             # Globale Konstanten (Config.js für Theme, URLs)
│   ├── hooks/                 # Custom React Hooks
│   ├── screens/               # Haupt-Ansichten (Feed, Profile, Upload, etc.)
│   ├── services/              # Frontend-Services (VideoUpload, VoiceControl)
│   ├── utils/                 # Hilfsfunktionen
│   ├── app.json               # Expo Konfiguration
│   └── package.json           # Node Abhängigkeiten & Scripts
│
├── .gitignore                 # Ignorierte Dateien für Git
├── docker-compose.yml         # Container-Setup für Infrastruktur (PostgreSQL, Redis, MinIO)
├── render.yaml                # Deployment Konfiguration für Render
└── start_backend.bat          # Skript zum lokalen Starten des Backends
```

## 📂 Hauptordner-Beschreibung

- **`backend/`**: Enthält die serverseitige Logik der Anwendung (REST API). Zuständig für Datenverwaltung, Authentifizierung und Bereitstellung der Videos/Rezepte.
- **`mobile/`**: Der clientseitige Code der App (iOS/Android/Web). Bietet die Benutzeroberfläche und interagiert mit der Backend-API.

## 🔗 Beziehung zwischen Mobile und Backend

Das **Mobile Frontend** (React Native) kommuniziert mit dem **Backend** (FastAPI) ausschließlich über **REST HTTP Requests** (wobei `fetch` verwendet wird). 
Der Austausch erfolgt im JSON-Format. Dateien (wie Videos) werden als Multipart-Form-Data an den Server gesendet. Die Authentifizierung wird durch JWT-Token ("Bearer Token") sichergestellt, welche das Frontend im `Authorization`-Header mitsendet.

## 📄 Wichtige Root-Dateien

- **`docker-compose.yml`**: Definiert die lokalen Services wie PostgreSQL Datenbank, Redis (für Caching) und MinIO (für S3-kompatiblen lokalen Storage).
- **`render.yaml`**: Spezifiziert die Deployment-Umgebungen und Pipelines für den Hosting-Anbieter Render.
- **`start_backend.bat`**: Ein Hilfsskript für Windows-Benutzer, um die virtuelle Umgebung zu aktivieren und den Uvicorn-Server bequem zu starten.
