# Create Backend Endpoint

Diese Direktive beschreibt den standardisierten Ablauf, um einen neuen Backend-Endpunkt in FastAPI hinzuzufügen. Diese SOP (Standard Operating Procedure) stellt sicher, dass Pydantic-Schemas, Datenbankoperationen und der eigentliche Router konsistent bleiben.

## 🎯 Ziel
Einen neuen API-Endpunkt im Backend anlegen, der validierte Ein-/Ausgaben hat und korrekte HTTP-Statustodes zurückgibt.

## 📥 Inputs (Was die KI wissen muss)
- `Endpoint-Methode`: [GET, POST, PUT, DELETE]
- `Route`: z.B. `/users/{user_id}/profile`
- `Request-Body/Params`: Welche Daten kommen rein? (JSON Schema, Query Params)
- `Response`: Was wird zurückgegeben?
- `Auth-Level`: Öffentlich, Eingeloggt (JWT), oder Admin?
- `Router-Datei`: Zu welchem Bereich gehört der Endpunkt (z.B. `routers/users_router.py`)?

## 🛠 Ausführungsschritte

### 1. Pydantic Schemas aktualisieren (`schemas.py`)
- Erstelle Request- (Create/Update) und Response-Modelle.
- Nutze `ConfigDict(from_attributes=True)` für ORM-Kompatibilität bei Response-Schemas.

### 2. Datenbankoperationen definieren (`models.py` / DB-Queries)
- Falls neue DB-Tabellen/Spalten benötigt werden, modelliere diese in `models.py`.
- Migration/Alembic-Skript anstoßen (falls im Setup genutzt, aktuell via `Base.metadata.create_all`).

### 3. Service Layer (Optional aber empfohlen)
- Kapsle Datenbank-Queries in wiederverwendbare Funktionen (z.B. in `services/user_service.py` oder direkt in den Router, wenn einfach).
- Nutze `depends(get_db)`.

### 4. Router anpassen (`routers/<dein_router>.py`)
- Füge den Endpunkt hinzu: `@router.post(...)`.
- Achte auf `response_model`, `status_code` ind die Dependencies (`Depends(get_current_user)` falls Auth nötig).
- Fehler handlen: `raise HTTPException(status_code=..., detail=...)`.

### 5. Deterministic Testing
- Rufe das Skript `run_tests.bat` oder ein explizites Testskript für diesen Endpunkt aus, bevor der Task beendet wird.

## 🚨 Edge Cases & Bekannte Fehler
- *Fehlende Auth-Header*: Wenn der Route-Guard greift, wird `401 Unauthorized` zurückgegeben. Prüfe, ob die Methode im Frontend den Header übergibt.
- *Dateiuploads*: Für `multipart/form-data` statt JSON, nutze `UploadFile = File(...)` und prüfe ob Python `python-multipart` installiert ist.
- *CORS*: Wenn das Frontend den API-Call blockiert, prüfe die CORS-Settings in `main.py`.

---
*Zuletzt aktualisiert nach 3-Layer Architecture Standards.*
